<template>
  <section class="card values-card">
    <header class="colored-header">
      <span class="header-icon" aria-hidden="true">🤝</span>
      <h2>{{ dados.titulo || "" }}</h2>
    </header>
    <div class="values-body">
      <p v-for="(texto, indice) in dados.paragrafos || []" :key="indice">{{ texto }}</p>
      <div class="qr-row"><QrCodes :itens="dados.qrCodes || []" /></div>
      <div v-if="dados.pesquisa" class="values-survey">
        <p>{{ dados.pesquisa.texto || "" }}</p>
        <MuralImagem :src="dados.pesquisa.qrCodeImagem" alt="QR Code da pesquisa para colaboradores" />
        <strong>{{ dados.pesquisa.legenda || "" }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup>
import MuralImagem from "../base/MuralImagem.vue";
import QrCodes from "../base/QrCodes.vue";
import { muralConfig } from "@/shared/config";

const dados = muralConfig.valoresEmpresa || {};
</script>
