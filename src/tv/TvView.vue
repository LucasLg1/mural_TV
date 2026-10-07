<template>
  <div ref="palco" class="mural-stage tv-stage" :style="{ '--fade-ms': `${tempos.fadeMs}ms` }">
    <div class="space-background" aria-hidden="true"></div>

    <main class="mural-screens" :class="{ 'is-fading': trocando }">
      <template v-for="(tela, indice) in telas" :key="tela.id">
        <div v-if="atual === tela.id" class="screen-slot" :data-screen="tela.id">
          <TelaLayout
            :tela="tela"
            :indice="indice"
            :total="telas.length"
            :foco-id="atual === tela.id ? focoId : null"
          />
        </div>
      </template>
      <div v-if="celebrando.length && atual === CELEBRACAO" class="screen-slot" :data-screen="CELEBRACAO">
        <CelebracaoTela :pessoas="celebrando" />
      </div>
    </main>

    <div class="page-dots" :class="{ 'is-visible': pontosVisiveis }" aria-hidden="true">
      <i v-for="id in sequencia" :key="id" :class="{ active: id === atual }"></i>
    </div>

    <div class="touch-hint" :class="{ 'is-visible': aviso.visivel }" role="status" aria-live="polite">
      {{ aviso.texto }}
    </div>

    <p v-if="!telas.length" class="tv-status">{{ erroLayout || "Carregando o mural…" }}</p>

    <div v-if="modoDebug" class="debug-panel">
      <strong>MODO DEBUG · ciclo pausado</strong><br>
      Telas: {{ telas.length ? "mural ativo" : "aguardando o mural ativo" }}
      <template v-if="erroLayout"> · {{ erroLayout }}</template><br>
      Celebração: {{ tempos.celebracaoMs / 1000 }}s · Carrossel: {{ tempos.carrosselMs / 1000 }}s · Fade: {{ tempos.fadeMs }}ms<br>
      <template v-if="aniversarioSimulado">Simulação: {{ aniversarioSimulado }}<br></template>
      API: {{ pessoas.status }}<template v-if="pessoas.mensagem"> · {{ pessoas.mensagem }}</template>
      <template v-if="pessoas.atualizadoEm"> · {{ pessoas.atualizadoEm.toLocaleTimeString("pt-BR") }}</template><br>
      Teclas: ← → = navegar · O = primeira tela · C = celebração<br>
      Sequência: {{ sequencia.map(nomeDaTela).join(" → ") }}
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import CelebracaoTela from "@/components/CelebracaoTela.vue";
import TelaLayout from "@/components/TelaLayout.vue";
import { aniversarioSimulado, modoDebug, modoDesempenho, muralConfig, muralDaTv, tempos } from "@/shared/config";
import { aniversariantesAtivos, carregarPessoas, pessoas } from "@/shared/pessoas";
import { instalarGestos } from "./gestos";
import { buscarLayoutRemoto } from "./layoutRemoto";
import { criarTemporizador } from "./temporizador";

const CELEBRACAO = "celebracao";
const interacao = { ativa: true, fecharComDuploToque: true, ...(muralConfig.interacao || {}) };
const html = document.documentElement;
const tituloOriginal = document.title;

const palco = ref(null);
const telas = ref([]);
const erroLayout = ref("");
const atual = ref("");
const trocando = ref(false);
const focoId = ref(null);
const pontosVisiveis = ref(false);
const aviso = reactive({ texto: "", visivel: false });

const celebrando = computed(() => aniversariantesAtivos());
const sequencia = computed(() => {
  const ids = telas.value.map((tela) => tela.id);
  if (celebrando.value.length) ids.splice(Math.min(1, ids.length), 0, CELEBRACAO);
  return ids;
});

const temporizador = criarTemporizador();
let esperaTroca = null;
let esperaAviso = null;
let esperaPontos = null;
let esperaFoco = null;
let esperaFechamento = null;
let esperaFechamentoJanela = null;
let fechando = false;
const intervalos = [];
let removerGestos = null;

function nomeDaTela(id) {
  if (id === CELEBRACAO) return "Parabéns";
  return telas.value.find((tela) => tela.id === id)?.nome || id;
}

function duracaoDe(id) {
  if (id === CELEBRACAO) return tempos.celebracaoMs;
  return Number(telas.value.find((tela) => tela.id === id)?.duracao_ms) || tempos.detalheMs;
}

function agendar() {
  temporizador.limpar();
  if (modoDebug || fechando || !atual.value) return;
  temporizador.iniciar(duracaoDe(atual.value), () => avancar(1));
}

function irPara(id) {
  if (!id || trocando.value) return;
  fecharFoco(false);
  temporizador.limpar();
  if (id === atual.value) {
    agendar();
    return;
  }
  trocando.value = true;
  clearTimeout(esperaTroca);
  esperaTroca = setTimeout(async () => {
    atual.value = id;
    await nextTick();
    atualizarVideos();
    requestAnimationFrame(() => requestAnimationFrame(() => { trocando.value = false; }));
    agendar();
  }, tempos.fadeMs);
}

function destino(passo) {
  const ids = sequencia.value;
  const posicao = Math.max(0, ids.indexOf(atual.value));
  return ids[(posicao + passo + ids.length) % ids.length];
}

function avancar(passo) {
  irPara(destino(passo));
}

function atualizarVideos() {
  palco.value?.querySelectorAll("video").forEach((video) => {
    const visivel = !document.hidden && video.closest(".screen-slot")?.dataset.screen === atual.value;
    if (!visivel) {
      video.pause();
      return;
    }
    video.play()?.catch(() => {});
  });
}

function mostrarAviso(texto, duracao = Number(interacao.duracaoAvisoMs) || 4000) {
  if (!texto) return;
  aviso.texto = texto;
  aviso.visivel = true;
  clearTimeout(esperaAviso);
  if (duracao > 0) esperaAviso = setTimeout(() => { aviso.visivel = false; }, duracao);
}

function mostrarPontos() {
  pontosVisiveis.value = true;
  clearTimeout(esperaPontos);
  esperaPontos = setTimeout(() => { pontosVisiveis.value = false; }, 2500);
}

function abrirFoco(id) {
  focoId.value = id;
  temporizador.pausar();
  mostrarAviso(interacao.mensagemAmpliar || "Toque de novo para voltar");
  clearTimeout(esperaFoco);
  esperaFoco = setTimeout(() => fecharFoco(), Number(interacao.duracaoAmpliacaoMs) || 20000);
}

function fecharFoco(retomar = true) {
  if (focoId.value === null) return;
  focoId.value = null;
  clearTimeout(esperaFoco);
  aviso.visivel = false;
  // Quem acabou de interagir ganha o tempo inteiro da tela para continuar olhando.
  if (retomar) agendar();
}

function aoTocar(x, y) {
  if (fechando) return;
  mostrarPontos();
  if (focoId.value !== null) {
    fecharFoco();
    return;
  }
  const bloco = document.elementFromPoint(x, y)?.closest(".layout-block");
  if (bloco && bloco.closest(".screen-slot")?.dataset.screen === atual.value) {
    abrirFoco(bloco.dataset.block);
  } else {
    mostrarAviso(interacao.mensagemAjuda);
  }
}

function aoArrastar(direcao) {
  if (fechando) return;
  if (focoId.value !== null) {
    fecharFoco();
    return;
  }
  const proxima = destino(direcao);
  mostrarPontos();
  mostrarAviso(`${direcao > 0 ? "▶" : "◀"} ${nomeDaTela(proxima)}`, 1800);
  irPara(proxima);
}

function fecharMural() {
  if (fechando || interacao.fecharComDuploToque === false) return;
  fechando = true;
  fecharFoco(false);
  temporizador.limpar();
  html.classList.add("is-closing");
  mostrarAviso(interacao.mensagemFechando || "Fechando o mural…", 0);

  // O kiosk/iniciar-mural.ps1 observa este título e fecha o Chrome. Fechar a janela
  // antes de ele ler o título faz o script achar que o Chrome caiu e reabrir.
  document.title = interacao.tituloFechamento || "FECHAR_MURAL";
  esperaFechamentoJanela = setTimeout(() => {
    try {
      window.close();
    } catch {
      // O Chrome bloqueia window.close() em janelas que não foram abertas por script.
    }
  }, 3000);

  esperaFechamento = setTimeout(() => {
    fechando = false;
    document.title = tituloOriginal;
    html.classList.remove("is-closing");
    mostrarAviso(interacao.mensagemFalhaFechar || "Não foi possível fechar o mural automaticamente.", 8000);
    agendar();
  }, Number(interacao.tempoLimiteFechamentoMs) || 6000);
}

function aoTeclar(evento) {
  if (evento.key === "ArrowRight") aoArrastar(1);
  if (evento.key === "ArrowLeft") aoArrastar(-1);
  if (!modoDebug) return;
  const tecla = evento.key.toLowerCase();
  if (tecla === "o") irPara(sequencia.value[0]);
  if (tecla === "c" && celebrando.value.length) irPara(CELEBRACAO);
}

function aoMudarVisibilidade() {
  html.classList.toggle("page-hidden", document.hidden);
  if (document.hidden) temporizador.pausar();
  else if (focoId.value === null) temporizador.retomar();
  atualizarVideos();
}

async function carregarLayout() {
  if (muralConfig.layoutRemoto?.ativa === false) {
    if (!telas.value.length) erroLayout.value = "O mural remoto está desligado.";
    return;
  }
  try {
    const novas = await buscarLayoutRemoto(muralDaTv());
    erroLayout.value = "";
    if (JSON.stringify(novas) !== JSON.stringify(telas.value)) telas.value = novas;
  } catch (erro) {
    const mensagem = erro.name === "AbortError" ? "tempo limite excedido" : erro.message;
    if (telas.value.length) {
      console.warn(`Mantendo o mural em exibição; não foi possível atualizar (${mensagem}).`);
      return;
    }
    erroLayout.value = mensagem;
  }
}

function idsDaCipa() {
  const doPainel = telas.value.flatMap((tela) =>
    tela.blocos.filter((bloco) => bloco.tipo === "cipa").flatMap((bloco) => bloco.config?.integrantes || [])
  );
  return [...doPainel, ...(muralConfig.cipa?.integrantesApi || [])].map((item) => item.id);
}

watch(sequencia, (ids) => {
  if (!ids.length) return;
  if (atual.value && !ids.includes(atual.value)) irPara(ids[0]);
  else if (!atual.value) {
    atual.value = ids[0];
    agendar();
  }
});

watch([telas, focoId, () => pessoas.atualizadoEm], () => nextTick(atualizarVideos));

onMounted(async () => {
  html.classList.toggle("tv-performance", modoDesempenho);
  html.classList.toggle("touch-enabled", interacao.ativa !== false);
  document.addEventListener("visibilitychange", aoMudarVisibilidade);
  window.addEventListener("keydown", aoTeclar);

  if (interacao.ativa !== false) {
    removerGestos = instalarGestos(palco.value, {
      distanciaMinima: Number(interacao.distanciaMinimaArrastePx) || 80,
      intervaloDuploMs: Number(interacao.intervaloDuploToqueMs) || 350,
      duploAtivo: interacao.fecharComDuploToque !== false,
      aoArrastar,
      aoTocar,
      aoTocarDuasVezes: fecharMural,
    });
  }

  await carregarLayout();
  const pessoasCarregadas = carregarPessoas(idsDaCipa());

  if (modoDebug && aniversarioSimulado) await pessoasCarregadas;
  atual.value = modoDebug && aniversarioSimulado && celebrando.value.length ? CELEBRACAO : sequencia.value[0];
  await nextTick();
  atualizarVideos();
  agendar();

  const atualizarPessoasMs = Number(muralConfig.integracaoApi?.atualizarACadaMs);
  if (muralConfig.integracaoApi?.ativa && atualizarPessoasMs >= 60000) {
    intervalos.push(setInterval(() => carregarPessoas(idsDaCipa()), atualizarPessoasMs));
  }
  const atualizarLayoutMs = Number(muralConfig.layoutRemoto?.atualizarACadaMs);
  if (muralConfig.layoutRemoto?.ativa !== false && atualizarLayoutMs >= 30000) {
    intervalos.push(setInterval(carregarLayout, atualizarLayoutMs));
  }
});

onBeforeUnmount(() => {
  removerGestos?.();
  temporizador.limpar();
  intervalos.forEach(clearInterval);
  [esperaTroca, esperaAviso, esperaPontos, esperaFoco, esperaFechamento, esperaFechamentoJanela].forEach(clearTimeout);
  document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  window.removeEventListener("keydown", aoTeclar);
  html.classList.remove("tv-performance", "touch-enabled", "page-hidden", "is-closing");
});
</script>
