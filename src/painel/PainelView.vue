<template>
  <div class="painel">
    <header class="painel-topo">
      <div class="painel-marca">
        <strong>Mural Digital</strong>
        <span>Painel de telas</span>
      </div>
      <span v-if="nomeUsuario" class="painel-usuario">{{ nomeUsuario }}</span>
    </header>

    <div class="painel-corpo">
      <aside class="painel-lateral">
        <section class="painel-secao">
          <h2>Murais</h2>
          <p v-if="carregandoMurais" class="painel-dica">Carregando…</p>
          <ul class="painel-lista">
            <li v-for="item in murais" :key="item.id">
              <button
                type="button"
                :class="{ ativo: item.id === mural?.id, inativo: !item.ativo }"
                @click="abrirMural(item.id)"
              >
                <strong>{{ item.nome }}</strong>
                <small>{{ item.ativo ? `${item.telas_count ?? 0} tela(s)` : "desativado" }}</small>
              </button>
            </li>
          </ul>
          <form class="painel-novo" @submit.prevent="novoMural">
            <input v-model.trim="nomeNovoMural" maxlength="255" placeholder="Nome do novo mural (ex.: TV Recepção)">
            <button class="painel-botao" type="submit" :disabled="!nomeNovoMural">Criar</button>
          </form>
        </section>

        <section v-if="mural" class="painel-secao">
          <h2>Na TV</h2>
          <p class="painel-dica">A TV aberta no mural, sem endereço especial, mostra o mural ativo salvo por último.</p>
          <div class="painel-endereco">
            <code>{{ urlDaTv(mural.id) }}</code>
            <button class="painel-botao primario" type="button" @click="copiar(urlDaTv(mural.id))">
              {{ copiado ? "Copiado!" : "Copiar endereço" }}
            </button>
            <small>Esse endereço fixa a TV neste mural.</small>
          </div>
          <div class="painel-acoes">
            <button class="painel-botao" :class="{ perigo: mural.ativo }" type="button" @click="alternarAtivo">
              {{ mural.ativo ? "Desativar" : "Ativar" }}
            </button>
          </div>
        </section>
      </aside>

      <main v-if="mural" class="painel-principal">
        <nav class="painel-abas">
          <button
            v-for="(tela, indice) in telas"
            :key="tela.uid"
            type="button"
            class="painel-aba"
            :class="{ ativa: indice === telaAtual }"
            @click="selecionarTela(indice)"
          >
            <span>{{ indice + 1 }}</span> {{ tela.nome || "Sem nome" }}
          </button>
          <button
            v-if="telas.length < LIMITE_TELAS"
            type="button"
            class="painel-aba nova"
            @click="adicionarTela"
          >+ Tela</button>
        </nav>

        <div v-if="!telas.length" class="painel-vazio">
          <p>Este mural ainda não tem telas.</p>
          <div class="painel-acoes">
            <button class="painel-botao primario" type="button" @click="adicionarTela">Criar a primeira tela</button>
          </div>
        </div>

        <template v-else-if="tela">
          <div class="painel-tela-config">
            <label class="painel-campo">
              <span>Nome da tela</span>
              <input v-model="tela.nome" maxlength="120">
            </label>
            <label class="painel-campo curto">
              <span>Segundos</span>
              <input v-model.number="tela.duracaoSeg" type="number" min="5" max="600">
            </label>
            <label class="painel-check">
              <input v-model="tela.cabecalho" type="checkbox">
              <span>Cabeçalho com título</span>
            </label>
            <label v-if="tela.cabecalho" class="painel-campo">
              <span>Subtítulo</span>
              <input v-model="tela.subtitulo" maxlength="160">
            </label>
            <div class="painel-acoes">
              <button class="painel-botao" type="button" title="Mover para a esquerda" :disabled="telaAtual === 0" @click="moverTela(-1)">◀</button>
              <button class="painel-botao" type="button" title="Mover para a direita" :disabled="telaAtual === telas.length - 1" @click="moverTela(1)">▶</button>
              <button class="painel-botao" type="button" :disabled="telas.length >= LIMITE_TELAS" @click="duplicarTela">Duplicar</button>
              <button class="painel-botao perigo" type="button" @click="removerTela">Excluir</button>
            </div>
          </div>

          <div class="painel-paleta">
            <span class="painel-rotulo">Adicionar quadro:</span>
            <button
              v-for="item in CATALOGO"
              :key="item.tipo"
              type="button"
              class="painel-peca"
              :title="item.origem"
              :disabled="tela.blocos.length >= LIMITE_BLOCOS"
              @click="adicionarBloco(item.tipo)"
            >
              <span>{{ item.icone }}</span>{{ item.rotulo }}
            </button>
          </div>

          <EditorPalco
            :tela="previa"
            :indice="telaAtual"
            :total="telas.length"
            :selecionado="selecionado"
            @selecionar="selecionado = $event"
            @alterar="alterarBloco"
          />
          <p class="painel-dica">
            Arraste um quadro para mover e o canto inferior direito para redimensionar (mouse ou toque).
            Os quadros grudam nas bordas dos vizinhos. Com um quadro selecionado: setas movem, Delete remove.
            Na TV, tocar num quadro amplia ele em tela cheia.
          </p>
        </template>
      </main>

      <main v-else class="painel-principal painel-vazio">
        <p>{{ carregandoMurais ? "Carregando murais…" : "Crie ou escolha um mural à esquerda." }}</p>
      </main>

      <aside class="painel-direita">
        <ConfigBloco
          v-if="blocoSelecionado"
          :key="blocoSelecionado.uid"
          :bloco="blocoSelecionado"
          :noticias="noticias"
          :midias="midias"
          :pessoas-do-ano="pessoasDoAno"
          :carregando-pessoas="carregandoPessoas"
          @remover="removerBloco(selecionado)"
          @duplicar="duplicarBloco"
          @frente="trazerParaFrente"
          @noticia-salva="aoSalvarNoticia"
          @midia-alterada="carregarMidia($event, true)"
          @midia-liberada="liberarMidia"
          @carregar-pessoas="carregarPessoasParaCipa"
        />
        <div v-else class="painel-dica painel-ajuda">
          <h3>Como funciona</h3>
          <p>Cada mural (uma TV) tem telas que passam em sequência. Em cada tela você posiciona quadros prontos.</p>
          <p>Toque num quadro da prévia para configurar. O quadro <strong>Notícia</strong> usa as notícias do Thalamus: título, texto e uma imagem ou vídeo à direita. O quadro <strong>Imagem ou vídeo</strong> mostra só o arquivo, ocupando o quadro inteiro.</p>
          <p>Aniversariantes, tempo de casa e CIPA se atualizam sozinhos pelo cadastro de pessoas.</p>
        </div>
      </aside>
    </div>

    <footer v-if="mural" class="painel-barra">
      <span class="painel-status" :class="mensagem.tipo">{{ mensagem.texto || (sujo ? "Alterações não salvas" : "Tudo salvo") }}</span>
      <button class="painel-botao" type="button" :disabled="!sujo || salvando" @click="descartar">Descartar</button>
      <button class="painel-botao primario" type="button" :disabled="!sujo || salvando" @click="salvar">
        {{ salvando ? "Salvando…" : "Salvar e publicar na TV" }}
      </button>
    </footer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import ConfigBloco from "./ConfigBloco.vue";
import EditorPalco from "./EditorPalco.vue";
import {
  LIMITE_BLOCOS,
  LIMITE_TELAS,
  novoBloco,
  novoUid,
  problemaDoLayout,
  telaParaEditor,
  telasParaApi,
  telaVazia,
} from "./modeloEditor";
import {
  atualizarMural,
  buscarMural,
  criarMural,
  listarMurais,
  listarNoticias,
  listarPessoas,
  mensagemDeErro,
  midiaDaNoticia,
  removerMidia,
  salvarLayout,
} from "./painelApi";
import { usuarioLogado } from "./sessao";
import { CATALOGO } from "@/shared/catalogo";
import { enderecos, muralConfig } from "@/shared/config";
import { carregarPessoas, registrarPorId } from "@/shared/pessoas";
import { urlStorage } from "@/shared/utils";

const nomeUsuario = usuarioLogado()?.nome || usuarioLogado()?.name || "";

const murais = ref([]);
const carregandoMurais = ref(true);
const mural = ref(null);
const telas = ref([]);
const telaAtual = ref(0);
const selecionado = ref(-1);
const salvo = ref("[]");
const salvando = ref(false);
const mensagem = reactive({ tipo: "", texto: "" });
const nomeNovoMural = ref("");
const copiado = ref(false);
const noticias = ref([]);
const midias = reactive({});
const pessoasDoAno = ref(null);
const carregandoPessoas = ref(false);

const tela = computed(() => telas.value[telaAtual.value] || null);
const blocoSelecionado = computed(() => tela.value?.blocos[selecionado.value] || null);
const sujo = computed(() => JSON.stringify(telasParaApi(telas.value)) !== salvo.value);

function avisar(texto, tipo = "ok") {
  mensagem.texto = texto;
  mensagem.tipo = tipo;
  if (tipo === "ok") setTimeout(() => { if (mensagem.texto === texto) mensagem.texto = ""; }, 4000);
}

function conteudoDaNoticia(id) {
  const noticia = noticias.value.find((item) => item.id === Number(id));
  if (!noticia) return null;
  const midia = midias[noticia.id];
  return { titulo: noticia.titulo, texto: noticia.descricao || "", midia: midia?.midia || "", midiaTipo: midia?.midiaTipo };
}

function conteudoDaMidia(config) {
  if (!config?.caminho) return null;
  return {
    midia: urlStorage(config.caminho, enderecos.midia),
    midiaTipo: config.tipo === "video" ? "video" : "imagem",
  };
}

const previa = computed(() => {
  const atual = tela.value;
  if (!atual) return { blocos: [] };
  return {
    id: atual.uid,
    nome: atual.nome,
    cabecalho: atual.cabecalho,
    subtitulo: atual.subtitulo,
    blocos: atual.blocos.map((bloco) => ({
      ...bloco,
      id: bloco.uid,
      ...(bloco.tipo === "noticia" ? { conteudo: conteudoDaNoticia(bloco.config.noticia_id) } : {}),
      ...(bloco.tipo === "midia" ? { conteudo: conteudoDaMidia(bloco.config) } : {}),
    })),
  };
});

/* ---------- Murais ---------- */

function aplicarMural(dados) {
  mural.value = dados;
  telas.value = (dados.telas || []).map(telaParaEditor);
  salvo.value = JSON.stringify(telasParaApi(telas.value));
  telaAtual.value = Math.min(telaAtual.value, Math.max(0, telas.value.length - 1));
  selecionado.value = -1;
  const resumo = murais.value.find((item) => item.id === dados.id);
  if (resumo) Object.assign(resumo, { nome: dados.nome, ativo: dados.ativo, telas_count: dados.telas?.length ?? resumo.telas_count });
}

function podeDescartar() {
  return !sujo.value || window.confirm("Há alterações não salvas neste mural. Descartar?");
}

async function abrirMural(id) {
  if (mural.value?.id === id || !podeDescartar()) return;
  try {
    telaAtual.value = 0;
    aplicarMural(await buscarMural(id));
  } catch (erro) {
    avisar(mensagemDeErro(erro, "Não foi possível abrir o mural."), "erro");
  }
}

async function novoMural() {
  if (!podeDescartar()) return;
  try {
    const criado = await criarMural(nomeNovoMural.value);
    nomeNovoMural.value = "";
    murais.value.push({ ...criado, telas_count: 0 });
    telaAtual.value = 0;
    aplicarMural({ ...criado, telas: [] });
    if (!criado.ativo) avisar("Mural criado. Ative-o quando a TV deva passar a exibi-lo.");
  } catch (erro) {
    avisar(mensagemDeErro(erro, "Não foi possível criar o mural."), "erro");
  }
}

async function alternarAtivo() {
  try {
    const dados = await atualizarMural(mural.value.id, { ativo: !mural.value.ativo });
    mural.value.ativo = dados.ativo;
    const resumo = murais.value.find((item) => item.id === dados.id);
    if (resumo) resumo.ativo = dados.ativo;
    avisar(dados.ativo ? "Mural ativado. A TV passa a exibir este." : "Mural desativado.");
    if (dados.ativo) {
      murais.value.forEach((item) => {
        if (item.id !== dados.id) item.ativo = false;
      });
    }
  } catch (erro) {
    avisar(mensagemDeErro(erro), "erro");
  }
}

function urlDaTv(id) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return id ? `${base}?mural=${id}#/` : `${base}#/`;
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    copiado.value = true;
    setTimeout(() => { copiado.value = false; }, 2500);
  } catch {
    window.prompt("Copie o endereço:", texto);
  }
}

/* ---------- Telas ---------- */

function selecionarTela(indice) {
  telaAtual.value = indice;
  selecionado.value = -1;
}

function adicionarTela() {
  telas.value.push(telaVazia(telas.value.length + 1));
  selecionarTela(telas.value.length - 1);
}

function duplicarTela() {
  const copia = JSON.parse(JSON.stringify(tela.value));
  copia.uid = novoUid();
  copia.nome = `${copia.nome} (cópia)`;
  copia.blocos.forEach((bloco) => { bloco.uid = novoUid(); });
  telas.value.splice(telaAtual.value + 1, 0, copia);
  selecionarTela(telaAtual.value + 1);
}

function removerTela() {
  if (!window.confirm(`Excluir a tela "${tela.value.nome}"?`)) return;
  const caminhos = tela.value.blocos.filter((bloco) => bloco.tipo === "midia").map((bloco) => bloco.config?.caminho);
  telas.value.splice(telaAtual.value, 1);
  selecionarTela(Math.max(0, telaAtual.value - 1));
  caminhos.forEach(liberarMidia);
}

function moverTela(direcao) {
  const destino = telaAtual.value + direcao;
  if (destino < 0 || destino >= telas.value.length) return;
  const [movida] = telas.value.splice(telaAtual.value, 1);
  telas.value.splice(destino, 0, movida);
  telaAtual.value = destino;
}

/* ---------- Quadros ---------- */

function adicionarBloco(tipo) {
  const bloco = novoBloco(tipo, tela.value.blocos);
  if (tipo === "seguranca" && !bloco.config.dataBase) {
    bloco.config.dataBase = muralConfig.diasSemAcidente?.dataBase || "";
  }
  tela.value.blocos.push(bloco);
  selecionado.value = tela.value.blocos.length - 1;
}

function alterarBloco(indice, posicao) {
  Object.assign(tela.value.blocos[indice], posicao);
}

function removerBloco(indice) {
  if (indice < 0) return;
  const caminho = tela.value.blocos[indice]?.tipo === "midia" ? tela.value.blocos[indice].config?.caminho : "";
  tela.value.blocos.splice(indice, 1);
  selecionado.value = -1;
  liberarMidia(caminho);
}

function duplicarBloco() {
  if (tela.value.blocos.length >= LIMITE_BLOCOS) return;
  const original = blocoSelecionado.value;
  const copia = JSON.parse(JSON.stringify(original));
  copia.uid = novoUid();
  copia.x = Math.min(copia.x + 2, 100 - copia.w);
  copia.y = Math.min(copia.y + 2, 100 - copia.h);
  tela.value.blocos.push(copia);
  selecionado.value = tela.value.blocos.length - 1;
}

function trazerParaFrente() {
  const [bloco] = tela.value.blocos.splice(selecionado.value, 1);
  tela.value.blocos.push(bloco);
  selecionado.value = tela.value.blocos.length - 1;
}

function aoTeclar(evento) {
  if (!blocoSelecionado.value || evento.target.closest("input, textarea, select")) return;
  const bloco = blocoSelecionado.value;
  const passo = evento.shiftKey ? 5 : 0.5;
  const mover = {
    ArrowLeft: () => { bloco.x = Math.max(0, bloco.x - passo); },
    ArrowRight: () => { bloco.x = Math.min(100 - bloco.w, bloco.x + passo); },
    ArrowUp: () => { bloco.y = Math.max(0, bloco.y - passo); },
    ArrowDown: () => { bloco.y = Math.min(100 - bloco.h, bloco.y + passo); },
  }[evento.key];
  if (mover) {
    evento.preventDefault();
    mover();
  } else if (evento.key === "Delete") {
    removerBloco(selecionado.value);
  } else if (evento.key === "Escape") {
    selecionado.value = -1;
  }
}

/* ---------- Notícias e pessoas ---------- */

async function carregarMidia(id, forcar = false) {
  if (!id || (!forcar && midias[id])) return;
  midias[id] = midias[id] || { midia: "", midiaTipo: "imagem", anexos: [] };
  try {
    midias[id] = await midiaDaNoticia(id);
  } catch {
    // Sem permissão ou sem anexos: a prévia mostra só o texto.
  }
}

watch(
  () => telas.value.flatMap((item) => item.blocos.filter((b) => b.tipo === "noticia").map((b) => b.config.noticia_id)),
  (ids) => ids.forEach((id) => carregarMidia(id)),
  { immediate: true }
);

function aoSalvarNoticia(noticia) {
  const indice = noticias.value.findIndex((item) => item.id === noticia.id);
  if (indice >= 0) noticias.value.splice(indice, 1, noticia);
  else noticias.value.unshift(noticia);
  avisar("Notícia salva.");
}

async function carregarPessoasParaCipa() {
  if (pessoasDoAno.value || carregandoPessoas.value) return;
  carregandoPessoas.value = true;
  try {
    pessoasDoAno.value = await listarPessoas();
    registrarPorId(pessoasDoAno.value);
  } catch (erro) {
    avisar(mensagemDeErro(erro, "Não foi possível carregar as pessoas."), "erro");
  } finally {
    carregandoPessoas.value = false;
  }
}

watch(
  () => telas.value.some((item) => item.blocos.some((bloco) => bloco.tipo === "cipa")),
  (temCipa) => { if (temCipa) carregarPessoasParaCipa(); }
);

/* ---------- Salvar ---------- */

async function salvar() {
  const problema = problemaDoLayout(telas.value);
  if (problema) {
    if (problema.tela !== undefined) telaAtual.value = problema.tela;
    selecionado.value = problema.bloco ?? -1;
    avisar(problema.mensagem, "erro");
    return;
  }
  salvando.value = true;
  const anteriores = caminhosSalvos();
  try {
    aplicarMural(await salvarLayout(mural.value.id, telasParaApi(telas.value)));
    anteriores.forEach(liberarMidia);
    avisar("Salvo! A TV recebe as novas telas em até 5 minutos.");
  } catch (erro) {
    avisar(mensagemDeErro(erro, "Não foi possível salvar o layout."), "erro");
  } finally {
    salvando.value = false;
  }
}

function descartar() {
  if (!window.confirm("Descartar as alterações e voltar ao que está salvo?")) return;
  const atuais = [...caminhosEmUso()];
  telas.value = JSON.parse(salvo.value).map(telaParaEditor);
  selecionarTela(Math.min(telaAtual.value, Math.max(0, telas.value.length - 1)));
  atuais.forEach(liberarMidia);
}

function caminhosEmUso() {
  const usados = new Set();
  telas.value.forEach((item) => {
    item.blocos.forEach((bloco) => {
      if (bloco.tipo === "midia" && bloco.config?.caminho) usados.add(bloco.config.caminho);
    });
  });
  return usados;
}

function caminhosSalvos() {
  const usados = new Set();
  JSON.parse(salvo.value).forEach((item) => {
    (item.blocos || []).forEach((bloco) => {
      if (bloco.tipo === "midia" && bloco.config?.caminho) usados.add(bloco.config.caminho);
    });
  });
  return usados;
}

/** Apaga o arquivo só quando nenhum quadro — nem o layout já salvo — ainda aponta para ele. */
function liberarMidia(caminho) {
  if (!caminho || caminhosEmUso().has(caminho) || caminhosSalvos().has(caminho)) return;
  removerMidia(caminho).catch(() => {});
}

function avisarAoSair(evento) {
  if (!sujo.value) return;
  evento.preventDefault();
  evento.returnValue = "";
}

onMounted(async () => {
  document.documentElement.classList.add("modo-painel");
  document.title = "Painel · Mural Digital";
  window.addEventListener("keydown", aoTeclar);
  window.addEventListener("beforeunload", avisarAoSair);

  carregarPessoas(muralConfig.cipa?.integrantesApi?.map((item) => item.id) || []);
  listarNoticias()
    .then((lista) => { noticias.value = Array.isArray(lista) ? lista : []; })
    .catch((erro) => avisar(mensagemDeErro(erro, "Não foi possível carregar as notícias."), "erro"));

  try {
    murais.value = await listarMurais();
    const primeiro = murais.value.find((item) => item.ativo) || murais.value[0];
    if (primeiro) await abrirMural(primeiro.id);
  } catch (erro) {
    avisar(mensagemDeErro(erro, "Não foi possível carregar os murais."), "erro");
  } finally {
    carregandoMurais.value = false;
  }
});

onBeforeUnmount(() => {
  document.documentElement.classList.remove("modo-painel");
  window.removeEventListener("keydown", aoTeclar);
  window.removeEventListener("beforeunload", avisarAoSair);
});
</script>

<style src="./painel.css"></style>
