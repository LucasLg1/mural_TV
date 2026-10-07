<template>
  <section class="card cipa-card">
    <header class="colored-header green">
      <span class="header-icon" aria-hidden="true">🦺</span>
      <h2>{{ titulo || dados.titulo || "" }}</h2>
    </header>
    <div class="cipa-body">
      <div class="eyebrow">INTEGRANTES</div>
      <div class="cipa-grid">
        <ListaPessoas :pessoas="membros" />
      </div>
    </div>
    <div class="cipa-callout">
      <strong>{{ dados.chamada?.titulo || "" }}</strong>
      <span>{{ dados.chamada?.texto || "" }}</span>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import ListaPessoas from "../base/ListaPessoas.vue";
import { muralConfig } from "@/shared/config";
import { pessoas } from "@/shared/pessoas";

const props = defineProps({
  titulo: { type: String, default: "" },
  // [{ id, mes }] — vazio usa os integrantes do config.js.
  integrantes: { type: Array, default: () => [] },
});

const dados = muralConfig.cipa || {};

const membros = computed(() => {
  const lista = props.integrantes.length ? props.integrantes : dados.integrantesApi || [];
  const daApi = lista.map((item) => pessoas.porId[Number(item.id)]).filter(Boolean);
  if (daApi.length || props.integrantes.length) return daApi;
  return dados.integrantes || [];
});
</script>
