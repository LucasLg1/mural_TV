<template>
  <section class="screen celebration-screen">
    <div class="confetti-layer" aria-hidden="true">
      <i v-for="(item, indice) in confetes" :key="indice" class="confetti" :class="`confetti-${item.forma}`" :style="item.estilo"></i>
    </div>
    <div class="celebration-glow" aria-hidden="true"></div>
    <div class="celebration-content">
      <div class="celebration-kicker">🎉</div>
      <h1>{{ prefixo }}<br><span>{{ nomes }}!</span></h1>
      <div class="celebration-people">
        <article
          v-for="(pessoa, indice) in pessoas"
          :key="pessoa.id ?? indice"
          class="celebration-person"
          :style="{ '--stagger': `${indice * 130}ms` }"
        >
          <div class="celebration-avatar-wrap">
            <MuralImagem class="celebration-avatar" :src="pessoa.foto" :alt="pessoa.nome" />
            <span aria-hidden="true">👑</span>
          </div>
          <h2>{{ pessoa.nome }}</h2>
        </article>
      </div>
      <p>{{ dados.mensagemParabens || "" }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import MuralImagem from "./base/MuralImagem.vue";
import { muralConfig } from "@/shared/config";

const CORES = ["#ffd447", "#ff6b6b", "#41c7a2", "#42a5f5", "#a86ae3", "#ffffff"];

const props = defineProps({
  pessoas: { type: Array, default: () => [] },
});

const dados = muralConfig.aniversariantes || {};
const nomes = computed(() => props.pessoas.map((pessoa) => pessoa.nome).join(", "));
const prefixo = computed(() => (props.pessoas.length > 1 ? dados.tituloParabensPlural : dados.tituloParabens) || "");

const confetes = Array.from({ length: 32 }, (_, indice) => ({
  forma: indice % 4 === 0 ? "circle" : indice % 5 === 0 ? "ribbon" : "square",
  estilo: {
    "--confetti-x": `${((indice * 37) % 101) + ((indice % 3) * 0.17)}cqw`,
    "--confetti-duration": `${5.5 + ((indice * 13) % 42) / 10}s`,
    "--confetti-delay": `${-((indice * 29) % 90) / 10}s`,
    "--confetti-rotate": `${240 + ((indice * 47) % 520)}deg`,
    "--confetti-color": CORES[indice % CORES.length],
  },
}));
</script>
