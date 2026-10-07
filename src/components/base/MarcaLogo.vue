<template>
  <MuralImagem v-if="logo" :class="classe" :src="logo" :alt="rotulo" />
  <span v-else :class="classeTexto">{{ rotulo }}</span>
</template>

<script setup>
import { computed } from "vue";
import MuralImagem from "./MuralImagem.vue";
import { muralConfig } from "@/shared/config";

const props = defineProps({
  classe: { type: String, default: "brand-logo" },
  classeTexto: { type: String, default: "brand-text" },
  rotulo: { type: String, default: "ROBOFLEX" },
  src: { type: String, default: "" },
});

const logo = computed(() => props.src || muralConfig.marca?.logoRoboflex || "");
</script>
