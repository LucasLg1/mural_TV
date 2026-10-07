import { CATALOGO_POR_TIPO, TAMANHO_MINIMO } from "../shared/catalogo.js";

export const LIMITE_TELAS = 12;
export const LIMITE_BLOCOS = 16;

let sequencia = 0;
export const novoUid = () => `b${Date.now().toString(36)}${(sequencia++).toString(36)}`;

const arredondar = (valor) => Math.round(Number(valor) * 100) / 100;

export function configInicial(tipo, config = {}) {
  if (tipo === "noticia") return { noticia_id: config.noticia_id ? Number(config.noticia_id) : null, tag: config.tag || "" };
  if (tipo === "midia") return { caminho: config.caminho || "", tipo: config.tipo === "video" ? "video" : config.caminho ? "imagem" : "" };
  if (tipo === "seguranca") return { dataBase: String(config.dataBase || "").slice(0, 10) };
  if (tipo === "cipa") {
    return {
      titulo: config.titulo || "",
      integrantes: (config.integrantes || []).map((membro) => ({ id: Number(membro.id) })),
    };
  }
  return {};
}

export function blocoParaEditor(bloco) {
  return {
    uid: novoUid(),
    tipo: bloco.tipo,
    x: Number(bloco.x) || 0,
    y: Number(bloco.y) || 0,
    w: Number(bloco.w) || 20,
    h: Number(bloco.h) || 50,
    config: configInicial(bloco.tipo, bloco.config || {}),
  };
}

export function telaParaEditor(tela) {
  return {
    uid: novoUid(),
    nome: tela.nome || "Tela",
    cabecalho: Boolean(tela.cabecalho),
    subtitulo: tela.subtitulo || "",
    duracaoSeg: Math.round((Number(tela.duracao_ms) || 45000) / 1000),
    blocos: (tela.blocos || []).map(blocoParaEditor),
  };
}

export function telaVazia(numero) {
  return { uid: novoUid(), nome: `Tela ${numero}`, cabecalho: false, subtitulo: "", duracaoSeg: 45, blocos: [] };
}

function configParaApi(bloco) {
  if (bloco.tipo === "noticia") {
    return { noticia_id: bloco.config.noticia_id || null, ...(bloco.config.tag ? { tag: bloco.config.tag } : {}) };
  }
  if (bloco.tipo === "midia") {
    return bloco.config.caminho ? { caminho: bloco.config.caminho, tipo: bloco.config.tipo === "video" ? "video" : "imagem" } : {};
  }
  if (bloco.tipo === "seguranca") {
    return bloco.config.dataBase ? { dataBase: String(bloco.config.dataBase).slice(0, 10) } : {};
  }
  if (bloco.tipo === "cipa") {
    return {
      ...(bloco.config.titulo ? { titulo: bloco.config.titulo } : {}),
      integrantes: bloco.config.integrantes || [],
    };
  }
  return {};
}

export function telasParaApi(telas) {
  return telas.map((tela) => ({
    nome: String(tela.nome || "").trim() || "Tela",
    cabecalho: Boolean(tela.cabecalho),
    subtitulo: String(tela.subtitulo || "").trim() || null,
    duracao_ms: Math.round(Math.min(600, Math.max(5, Number(tela.duracaoSeg) || 45)) * 1000),
    blocos: tela.blocos.map((bloco) => ({
      tipo: bloco.tipo,
      x: arredondar(bloco.x),
      y: arredondar(bloco.y),
      w: arredondar(bloco.w),
      h: arredondar(bloco.h),
      config: configParaApi(bloco),
    })),
  }));
}

/** Primeiro problema que impediria salvar, com a posição para destacar no editor. */
export function problemaDoLayout(telas) {
  if (!telas.length) return { mensagem: "Crie pelo menos uma tela." };
  if (telas.length > LIMITE_TELAS) return { mensagem: `Use no máximo ${LIMITE_TELAS} telas.` };
  for (let t = 0; t < telas.length; t += 1) {
    const tela = telas[t];
    if (tela.blocos.length > LIMITE_BLOCOS) {
      return { tela: t, mensagem: `A tela "${tela.nome}" tem mais de ${LIMITE_BLOCOS} quadros.` };
    }
    const semNoticia = tela.blocos.findIndex((item) => item.tipo === "noticia" && !item.config.noticia_id);
    if (semNoticia >= 0) return { tela: t, bloco: semNoticia, mensagem: `Escolha a notícia do quadro destacado na tela "${tela.nome}".` };
    const semMidia = tela.blocos.findIndex((item) => item.tipo === "midia" && !item.config.caminho);
    if (semMidia >= 0) return { tela: t, bloco: semMidia, mensagem: `Envie a imagem ou o vídeo do quadro destacado na tela "${tela.nome}".` };
  }
  return null;
}

function sobrepoe(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Procura um espaço livre para o novo quadro; se não houver, ele entra no canto superior esquerdo. */
export function novoBloco(tipo, existentes = []) {
  const item = CATALOGO_POR_TIPO[tipo] || { w: 20, h: 50 };
  const w = Math.max(TAMANHO_MINIMO, item.w);
  const h = Math.max(TAMANHO_MINIMO, item.h);
  for (let y = 0; y + h <= 100; y += 5) {
    for (let x = 0; x + w <= 100; x += 5) {
      const candidato = { x, y, w, h };
      if (!existentes.some((bloco) => sobrepoe(candidato, bloco))) {
        return { uid: novoUid(), tipo, ...candidato, config: configInicial(tipo) };
      }
    }
  }
  return { uid: novoUid(), tipo, x: 0, y: 0, w, h, config: configInicial(tipo) };
}
