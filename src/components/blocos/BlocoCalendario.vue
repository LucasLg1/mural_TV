<template>
  <section class="card calendar-card">
    <div class="brand-mini">
      <MarcaLogo />
      <span class="calendar-year">{{ dados.ano }}</span>
    </div>
    <div class="calendar-grid">
      <div v-for="mes in meses" :key="mes.nome" class="mini-calendar">
        <h3>{{ mes.nome }}</h3>
        <div class="weekdays"><span v-for="(dia, indice) in SEMANA" :key="indice">{{ dia }}</span></div>
        <div class="month-days">
          <span v-for="vazio in mes.inicio" :key="`v${vazio}`"></span>
          <span v-for="dia in mes.dias" :key="dia.numero" :class="dia.tipo" :title="dia.legenda">{{ dia.numero }}</span>
        </div>
        <p class="month-note">{{ mes.nota }}</p>
      </div>
    </div>
    <div class="calendar-footer">{{ dados.legendaRodape || "" }}</div>
  </section>
</template>

<script setup>
import MarcaLogo from "../base/MarcaLogo.vue";
import { muralConfig } from "@/shared/config";
import { MESES, normalizar } from "@/shared/utils";

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const dados = muralConfig.calendario || {};

const meses = (dados.meses || []).map((nome) => {
  const indice = MESES.findIndex((mes) => normalizar(mes) === normalizar(nome));
  if (indice < 0) return null;
  const ano = Number(dados.ano) || new Date().getFullYear();
  const marcas = (dados.marcacoes || []).filter((item) => normalizar(item.mes) === normalizar(nome));
  const porDia = new Map(marcas.map((item) => [Number(item.dia), item]));
  const total = new Date(ano, indice + 1, 0).getDate();
  return {
    nome,
    inicio: new Date(ano, indice, 1).getDay(),
    dias: Array.from({ length: total }, (_, i) => {
      const marca = porDia.get(i + 1);
      return { numero: i + 1, tipo: marca?.tipo || "", legenda: marca?.legenda || "" };
    }),
    nota: marcas.map((marca) => `${marca.dia}: ${marca.legenda}`).join(" · ") || "Sem marcações",
  };
}).filter(Boolean);
</script>
