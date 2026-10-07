<template>
  <section
    class="card card-pad birthday-card"
    :class="{ 'large-card': grande, 'has-birthday-today': hoje.length }"
    :data-birthdays-today="hoje.length"
  >
    <CardConfetti :quantidade="grande ? 18 : 10" />
    <div class="eyebrow">{{ pessoas.mesReferencia }}</div>
    <h2 class="card-title">Aniversariantes <span>do Mês</span></h2>
    <div class="people-grid">
      <ListaPessoas :pessoas="ordenados" aniversario :secundario="(pessoa) => `Dia ${pessoa.dia}`" />
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import CardConfetti from "../base/CardConfetti.vue";
import ListaPessoas from "../base/ListaPessoas.vue";
import { aniversariantesAtivos, pessoas } from "@/shared/pessoas";

defineProps({ grande: { type: Boolean, default: false } });

const ordenados = computed(() => [...pessoas.aniversariantes].sort((a, b) => Number(a.dia) - Number(b.dia)));
const hoje = computed(() => aniversariantesAtivos());
</script>
