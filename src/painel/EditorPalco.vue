<template>
  <div ref="moldura" class="editor-moldura" :style="{ height: `${ALTURA * escala}px` }" @pointerdown="aoPressionarFundo">
    <div
      class="mural-stage editor-palco"
      :class="{ 'is-dragging': arrastando }"
      :style="{ width: `${LARGURA}px`, height: `${ALTURA}px`, transform: `scale(${escala})` }"
    >
      <div class="space-background" aria-hidden="true">
        <div class="aurora aurora-one"></div>
        <div class="aurora aurora-two"></div>
      </div>
      <div class="mural-screens">
        <div class="screen-slot">
          <TelaLayout
            :tela="tela"
            :indice="indice"
            :total="total"
            editavel
            :selecionado="selecionado"
            @pegar="pegar"
          />
        </div>
      </div>
      <div v-for="(guia, i) in guias" :key="i" class="editor-guia" :class="guia.eixo" :style="guia.estilo"></div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import TelaLayout from "@/components/TelaLayout.vue";
import { TAMANHO_MINIMO } from "@/shared/catalogo";
import { limitar } from "@/shared/utils";

const LARGURA = 1920;
const ALTURA = 1080;
const PASSO = 0.5;
const IMA = 1.2;
const LIMIAR_ARRASTE_PX = 4;

const props = defineProps({
  tela: { type: Object, required: true },
  indice: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
  selecionado: { type: Number, default: -1 },
});

const emit = defineEmits(["selecionar", "alterar"]);

const moldura = ref(null);
const escala = ref(0.5);
const arrastando = ref(false);
const guias = ref([]);
let observador = null;
let soltar = null;

const arredondar = (valor) => Math.round(valor / PASSO) * PASSO;

function aoPressionarFundo(evento) {
  if (!evento.target.closest(".layout-block")) emit("selecionar", -1);
}

/** Bordas dos outros blocos (e da tela) para onde o bloco "gruda" ao chegar perto. */
function bordas(posicao) {
  const verticais = [0, 50, 100];
  const horizontais = [0, 50, 100];
  props.tela.blocos.forEach((bloco, i) => {
    if (i === posicao) return;
    verticais.push(bloco.x, bloco.x + bloco.w);
    horizontais.push(bloco.y, bloco.y + bloco.h);
  });
  return { verticais, horizontais };
}

function grudar(valor, candidatos) {
  let melhor = null;
  candidatos.forEach((candidato) => {
    const distancia = Math.abs(candidato - valor);
    if (distancia <= IMA && (melhor === null || distancia < Math.abs(melhor - valor))) melhor = candidato;
  });
  return melhor;
}

function pegar(evento, posicao, modo) {
  if (evento.button > 0) return;
  evento.preventDefault();
  emit("selecionar", posicao);

  const area = evento.target.closest(".layout-area")?.getBoundingClientRect();
  const bloco = props.tela.blocos[posicao];
  if (!area || !bloco) return;

  const inicio = { x: bloco.x, y: bloco.y, w: bloco.w, h: bloco.h, px: evento.clientX, py: evento.clientY };
  const { verticais, horizontais } = bordas(posicao);
  let ativo = false;

  function mover(e) {
    const dxPx = e.clientX - inicio.px;
    const dyPx = e.clientY - inicio.py;
    if (!ativo && Math.hypot(dxPx, dyPx) < LIMIAR_ARRASTE_PX) return;
    ativo = true;
    arrastando.value = true;

    const dx = (dxPx / area.width) * 100;
    const dy = (dyPx / area.height) * 100;
    const novo = { x: inicio.x, y: inicio.y, w: inicio.w, h: inicio.h };
    const marcas = [];

    if (modo === "mover") {
      novo.x = arredondar(inicio.x + dx);
      novo.y = arredondar(inicio.y + dy);
      const esquerda = grudar(novo.x, verticais);
      const direita = grudar(novo.x + novo.w, verticais);
      if (esquerda !== null) { novo.x = esquerda; marcas.push({ eixo: "v", em: esquerda }); }
      else if (direita !== null) { novo.x = direita - novo.w; marcas.push({ eixo: "v", em: direita }); }
      const topo = grudar(novo.y, horizontais);
      const base = grudar(novo.y + novo.h, horizontais);
      if (topo !== null) { novo.y = topo; marcas.push({ eixo: "h", em: topo }); }
      else if (base !== null) { novo.y = base - novo.h; marcas.push({ eixo: "h", em: base }); }
      novo.x = limitar(novo.x, 0, 100 - novo.w);
      novo.y = limitar(novo.y, 0, 100 - novo.h);
    } else {
      let direita = arredondar(inicio.x + inicio.w + dx);
      let base = arredondar(inicio.y + inicio.h + dy);
      const imaDireita = grudar(direita, verticais);
      const imaBase = grudar(base, horizontais);
      if (imaDireita !== null) { direita = imaDireita; marcas.push({ eixo: "v", em: imaDireita }); }
      if (imaBase !== null) { base = imaBase; marcas.push({ eixo: "h", em: imaBase }); }
      novo.w = limitar(direita - inicio.x, TAMANHO_MINIMO, 100 - inicio.x);
      novo.h = limitar(base - inicio.y, TAMANHO_MINIMO, 100 - inicio.y);
    }

    guias.value = marcas.map(({ eixo, em }) => ({
      eixo,
      estilo: eixo === "v" ? { left: posicaoGuia(em, "x") } : { top: posicaoGuia(em, "y") },
    }));
    emit("alterar", posicao, novo);
  }

  function terminar() {
    window.removeEventListener("pointermove", mover);
    window.removeEventListener("pointerup", terminar);
    window.removeEventListener("pointercancel", terminar);
    arrastando.value = false;
    guias.value = [];
    soltar = null;
  }

  soltar?.();
  soltar = terminar;
  window.addEventListener("pointermove", mover);
  window.addEventListener("pointerup", terminar);
  window.addEventListener("pointercancel", terminar);
}

/** Converte % da área de blocos em px do palco, para desenhar a guia de alinhamento. */
function posicaoGuia(percentual, eixo) {
  const palco = moldura.value?.querySelector(".editor-palco")?.getBoundingClientRect();
  const area = moldura.value?.querySelector(".layout-area")?.getBoundingClientRect();
  if (!palco || !area) return "0px";
  const inicio = eixo === "x" ? area.left - palco.left : area.top - palco.top;
  const tamanho = eixo === "x" ? area.width : area.height;
  return `${(inicio + (tamanho * percentual) / 100) / escala.value}px`;
}

onMounted(() => {
  observador = new ResizeObserver(([entrada]) => {
    escala.value = entrada.contentRect.width / LARGURA;
  });
  observador.observe(moldura.value);
});

onBeforeUnmount(() => {
  observador?.disconnect();
  soltar?.();
});
</script>
