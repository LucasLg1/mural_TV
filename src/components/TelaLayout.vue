<template>
  <section
    class="screen layout-screen"
    :class="{ 'has-header': tela.cabecalho, 'has-focus': focoId !== null }"
  >
    <TelaCabecalho
      v-if="tela.cabecalho"
      :titulo="tela.nome"
      :subtitulo="tela.subtitulo || ''"
      :indice="indice"
      :total="total"
    />
    <div class="layout-area">
      <div
        v-for="(bloco, posicao) in tela.blocos"
        :key="chave(bloco, posicao)"
        class="layout-block"
        :class="{
          'is-focused': focoId === chave(bloco, posicao),
          'is-selected': editavel && selecionado === posicao,
        }"
        :data-block="chave(bloco, posicao)"
        :style="estilo(bloco)"
        @pointerdown="editavel && $emit('pegar', $event, posicao, 'mover')"
      >
        <MuralBloco :bloco="bloco" :foco="focoId === chave(bloco, posicao)" :indice="indiceNoticia(posicao)" />
        <template v-if="editavel">
          <span class="editor-rotulo">{{ rotulo(bloco) }}</span>
          <i
            class="editor-alca"
            title="Arraste para redimensionar"
            @pointerdown.stop="$emit('pegar', $event, posicao, 'redimensionar')"
          ></i>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import MuralBloco from "./MuralBloco.vue";
import TelaCabecalho from "./TelaCabecalho.vue";
import { CATALOGO_POR_TIPO } from "@/shared/catalogo";

const props = defineProps({
  tela: { type: Object, required: true },
  indice: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
  focoId: { type: String, default: null },
  editavel: { type: Boolean, default: false },
  selecionado: { type: Number, default: -1 },
});

defineEmits(["pegar"]);

function chave(bloco, posicao) {
  return String(bloco.id ?? bloco.uid ?? posicao);
}

function estilo(bloco) {
  return {
    left: `${bloco.x}%`,
    top: `${bloco.y}%`,
    width: `${bloco.w}%`,
    height: `${bloco.h}%`,
  };
}

function rotulo(bloco) {
  return CATALOGO_POR_TIPO[bloco.tipo]?.rotulo || bloco.tipo;
}

// Alterna as cores das notícias lado a lado (event-panel-1 / event-panel-2).
function indiceNoticia(posicao) {
  return props.tela.blocos.slice(0, posicao).filter((bloco) => bloco.tipo === "noticia").length;
}
</script>
