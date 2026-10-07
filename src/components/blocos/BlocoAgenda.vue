<template>
  <section class="card agenda-card">
    <div class="agenda-head">
      <div class="agenda-title">
        <h2>{{ dados.titulo || "" }}</h2>
        <strong>{{ dados.subtitulo || "" }}</strong>
      </div>
      <div class="agenda-year">
        <b>{{ dados.ano || "" }}</b>
        <span>{{ dados.periodo || "" }}</span>
      </div>
    </div>
    <div class="agenda-list">
      <div v-for="(item, indice) in dados.itens || []" :key="indice" class="agenda-item">
        <div class="date-badge">
          <span>{{ item.dia }}</span>
          <i aria-hidden="true">▣</i>
          <b>{{ item.data }}</b>
        </div>
        <div class="agenda-copy">
          <strong>{{ item.titulo }}</strong>
          <span><b>Palestrante:</b> {{ item.palestrante }}</span>
          <span>{{ item.local }}</span>
        </div>
      </div>
    </div>
    <footer class="agenda-footer">
      <span class="agenda-health" aria-hidden="true">✚</span>
      <p>{{ dados.chamadaRodape || "" }}</p>
      <div class="agenda-footer-brand">{{ muralConfig.marca?.nomeRoboflex || "" }}</div>
    </footer>
  </section>
</template>

<script setup>
import { muralConfig } from "@/shared/config";

const dados = muralConfig.agenda || {};
</script>
