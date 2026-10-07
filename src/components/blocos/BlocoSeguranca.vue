<template>
  <section class="card safety-card">
    <div class="safety-top">{{ dados.titulo || "" }}</div>
    <div class="safety-number" :data-safety-number="dias">{{ dias }}</div>
    <div class="safety-label">{{ dados.destaque || "" }}</div>
    <p>{{ dados.mensagem || "" }}</p>
    <div class="safety-seals">
      <div class="safety-seal"><b>🛡️</b><span>SEGURANÇA<br>EM 1º LUGAR</span></div>
      <div class="safety-seal"><b>⛑️</b><span>{{ dias }}<br>DIAS</span></div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { muralConfig } from "@/shared/config";
import { diasSemAcidente } from "@/shared/utils";

const props = defineProps({
  dataBase: { type: String, default: "" },
});

const dados = muralConfig.diasSemAcidente || {};
const dias = computed(() => diasSemAcidente({
  ...dados,
  ...(props.dataBase ? { dataBase: props.dataBase } : {}),
}));
</script>
