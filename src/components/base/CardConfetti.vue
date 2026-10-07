<template>
  <div class="card-confetti" aria-hidden="true">
    <i v-for="(estilo, indice) in pecas" :key="indice" class="card-confetti-piece" :style="estilo"></i>
  </div>
</template>

<script setup>
import { computed } from "vue";

const CORES = ["#ffd447", "#ff6b6b", "#41c7a2", "#42a5f5", "#a86ae3", "#f28c28"];

const props = defineProps({
  quantidade: { type: Number, default: 10 },
});

const pecas = computed(() => Array.from({ length: props.quantidade }, (_, indice) => ({
  "--x": `${(indice * 37) % 101}%`,
  "--duration": `${4.8 + ((indice * 11) % 30) / 10}s`,
  "--delay": `${-((indice * 23) % 70) / 10}s`,
  "--rotate": `${240 + ((indice * 43) % 480)}deg`,
  "--drift": `${((indice * 17) % 9) - 4}cqw`,
  "--color": CORES[indice % CORES.length],
})));
</script>
