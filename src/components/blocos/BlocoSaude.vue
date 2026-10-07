<template>
  <section class="card health-card">
    <div class="health-hero" :class="{ 'health-hero-has-image': banner }">
      <img
        v-if="banner"
        class="health-hero-image"
        :src="capa"
        :alt="dados.titulo || 'Campanha de saúde'"
        draggable="false"
        @error="bannerFalhou = true"
      >
      <div class="health-photo">
        <img v-if="capa && !capaFalhou" class="health-cover" :src="capa" alt="" draggable="false" @error="capaFalhou = true">
        <span v-else-if="!capa" class="health-photo-fallback" aria-hidden="true"></span>
      </div>
      <div class="health-hero-title">
        <span class="health-brand"><b aria-hidden="true">🎗</b>{{ dados.chamada || "" }}</span>
        <h2>{{ dados.titulo || "" }}</h2>
      </div>
    </div>
    <div class="health-body">
      <p class="health-intro">{{ dados.subtitulo || "" }}</p>
      <div class="health-signs-wrap">
        <h3><span aria-hidden="true">✓</span>{{ dados.listaTitulo || "" }}</h3>
        <ul class="health-signs">
          <li v-for="(sinal, indice) in dados.sinais || []" :key="indice"><i aria-hidden="true"></i><span>{{ sinal }}</span></li>
        </ul>
      </div>
      <div class="health-alert">
        <b aria-hidden="true">!</b>
        <p>{{ dados.alerta || "Falar sobre como você se sente é uma forma de cuidado. Buscar ajuda pode fazer a diferença." }}</p>
      </div>
      <aside class="health-actions">
        <div class="health-qr"><QrCodes :itens="dados.qrCode ? [dados.qrCode] : []" /></div>
        <div class="help-line">
          <span>{{ dados.telefoneLegenda || "" }}</span>
          <div><i aria-hidden="true">☎</i><b>{{ dados.telefoneAjuda || "" }}</b></div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import QrCodes from "../base/QrCodes.vue";
import { muralConfig } from "@/shared/config";
import { urlSegura } from "@/shared/utils";

const dados = muralConfig.campanhaSaude || {};
const capa = urlSegura(dados.imagem);
const bannerFalhou = ref(false);
const capaFalhou = ref(false);
const banner = computed(() => Boolean(capa) && dados.imagemComoBanner !== false && !bannerFalhou.value);
</script>
