<template>
  <header class="detail-header">
    <div><MarcaLogo classe="detail-brand" classe-texto="detail-brand-fallback" :src="logoTitulo" /></div>
    <div class="detail-header-copy">
      <h1>{{ titulo.toUpperCase() }}</h1>
      <p>{{ subtitulo }}</p>
    </div>
    <div class="detail-slide-index">{{ indice + 1 }} / {{ total }}</div>
  </header>
</template>

<script setup>
import MarcaLogo from "./base/MarcaLogo.vue";
import { muralConfig } from "@/shared/config";

const logoTitulo = muralConfig.marca?.logoTitulo || "assets/logo-roboflex-clara.png";

defineProps({
  titulo: { type: String, default: "" },
  subtitulo: { type: String, default: "" },
  indice: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
});
</script>
