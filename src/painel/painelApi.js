import { api } from "roboflex-thalamus-request-handler";
import { urlStorage } from "@/shared/utils";

const storage = process.env.VUE_APP_ROOT_STORAGE || "";

export function mensagemDeErro(erro, padrao = "Não foi possível concluir a operação.") {
  const dados = erro?.response?.data;
  const primeiroCampo = dados?.errors && Object.values(dados.errors)[0];
  return (Array.isArray(primeiroCampo) ? primeiroCampo[0] : null) || dados?.message || dados?.error || padrao;
}

// Murais (displays)
const mural = (resposta) => resposta.data.display;

export const listarMurais = () => api.get("/mural/displays").then((r) => r.data.displays || []);
export const buscarMural = (id) => api.get(`/mural/displays/${id}`).then(mural);
export const criarMural = (nome) => api.post("/mural/displays", { nome }).then(mural);
export const atualizarMural = (id, dados) => api.patch(`/mural/displays/${id}`, dados).then(mural);
export const salvarLayout = (id, telas) => api.put(`/mural/displays/${id}/layout`, { telas }).then(mural);

export async function enviarMidia(arquivo, aoProgredir) {
  const formulario = new FormData();
  formulario.append("arquivo", arquivo);
  const resposta = await api.post("/mural/midias", formulario, {
    onUploadProgress: (evento) => aoProgredir?.(evento.total ? Math.round((evento.loaded / evento.total) * 100) : 0),
  });
  return resposta.data;
}

export const removerMidia = (caminho) => api.delete("/mural/midias", { data: { caminho } });

// Pessoas ativas (seletor da CIPA), numa chamada só
export const listarPessoas = () =>
  api.get("/filtrar/pessoa-basico").then((r) =>
    (Array.isArray(r.data) ? r.data : [])
      .map((pessoa) => ({
        id: pessoa.id,
        nome: String(pessoa.nomeCompleto || "").trim(),
        foto: urlStorage(pessoa.path_image, storage),
        setor: pessoa.nome || "",
      }))
      .filter((pessoa) => pessoa.nome)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  );

// Notícias (app de notícias do Thalamus)
export const listarNoticias = () => api.get("/noticias", { params: { todas: 1 } }).then((r) => r.data);
export const criarNoticia = (dados) => api.post("/noticias", dados).then((r) => r.data);
export const atualizarNoticia = (id, dados) => api.put(`/noticias/${id}`, dados).then((r) => r.data);

export async function midiaDaNoticia(id) {
  const anexos = await api.get(`/anexos/noticia/${id}`).then((r) => r.data);
  const midias = (Array.isArray(anexos) ? anexos : [])
    .filter((anexo) => /^(image|video)\//.test(anexo.tipo || ""))
    .sort((a, b) => b.id - a.id);
  const ultima = midias[0];
  return {
    anexos: midias,
    midia: ultima ? urlStorage(ultima.caminho, storage) : "",
    midiaTipo: ultima?.tipo?.startsWith("video/") ? "video" : "imagem",
  };
}

/** Envia a nova mídia e só então apaga as anteriores (a notícia mostra uma mídia por vez). */
export async function trocarMidiaDaNoticia(id, arquivo, anteriores = [], aoProgredir) {
  const formulario = new FormData();
  formulario.append("arquivo", arquivo);
  formulario.append("categoria", "midia");
  await api.post(`/anexar/noticia/${id}`, formulario, {
    onUploadProgress: (evento) => aoProgredir?.(evento.total ? Math.round((evento.loaded / evento.total) * 100) : 0),
  });
  await Promise.all(anteriores.map((anexo) => api.delete(`/anexos/noticia/${id}/${anexo.id}`).catch(() => null)));
}

export async function removerMidiaDaNoticia(id, anexos = []) {
  await Promise.all(anexos.map((anexo) => api.delete(`/anexos/noticia/${id}/${anexo.id}`)));
}
