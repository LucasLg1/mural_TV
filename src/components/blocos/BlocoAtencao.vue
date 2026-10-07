<template>
  <section class="card attention-card">
    <header class="colored-header yellow">
      <span class="header-icon" aria-hidden="true">⚠️</span>
      <h2>{{ dados.titulo || "" }}</h2>
    </header>
    <div class="attention-body">
      <p>{{ dados.texto || "" }}</p>
      <div class="eyebrow">{{ dados.subtitulo || "" }}</div>
      <div class="attention-list">
        <div v-for="(item, indice) in dados.itens || []" :key="indice" class="attention-item">
          <span class="attention-icon" aria-hidden="true">{{ ICONES[item.icone] || "✓" }}</span>
          <strong>{{ item.texto }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { muralConfig } from "@/shared/config";

const ICONES = { luz: "💡", "ar-condicionado": "❄️", computador: "🖥️" };
const dados = muralConfig.atencaoSaida || {};
</script>
