<template>
  <section class="card card-pad work-card" :class="{ 'large-card': grande }">
    <CardConfetti :quantidade="grande ? 18 : 10" />
    <div class="eyebrow">{{ pessoas.mesReferencia }}</div>
    <h2 class="card-title">Tempo <span>de Casa</span></h2>
    <div class="people-grid">
      <ListaPessoas :pessoas="pessoas.tempoCasa" :secundario="textoAnos" />
    </div>
  </section>
</template>

<script setup>
import CardConfetti from "../base/CardConfetti.vue";
import ListaPessoas from "../base/ListaPessoas.vue";
import { pessoas } from "@/shared/pessoas";
import { anosDeCasa } from "@/shared/utils";

defineProps({ grande: { type: Boolean, default: false } });

function textoAnos(pessoa) {
  const anos = anosDeCasa(pessoa);
  return `${anos} ${anos === 1 ? "ano" : "anos"}`;
}
</script>
