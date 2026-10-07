<template>
  <BlocoMidia v-if="bloco.tipo === 'midia'" :midia="midia.midia" :tipo="midia.tipo" />

  <template v-else-if="bloco.tipo === 'noticia'">
    <BlocoNoticia v-if="noticia" :noticia="noticia" :grande="grande" :variante="variante" />
    <section v-else class="card block-placeholder">Escolha uma notícia válida para este quadro.</section>
  </template>

  <div v-else-if="componente && envolver" class="detail-panel">
    <component :is="componente" v-bind="propriedades" />
  </div>
  <component :is="componente" v-else-if="componente" v-bind="propriedades" />

  <section v-else class="card block-placeholder">Elemento desconhecido: {{ bloco.tipo }}</section>
</template>

<script setup>
import { computed } from "vue";
import BlocoAgenda from "./blocos/BlocoAgenda.vue";
import BlocoAniversariantes from "./blocos/BlocoAniversariantes.vue";
import BlocoAtencao from "./blocos/BlocoAtencao.vue";
import BlocoCalendario from "./blocos/BlocoCalendario.vue";
import BlocoCipa from "./blocos/BlocoCipa.vue";
import BlocoMidia from "./blocos/BlocoMidia.vue";
import BlocoNoticia from "./blocos/BlocoNoticia.vue";
import BlocoSaude from "./blocos/BlocoSaude.vue";
import BlocoSeguranca from "./blocos/BlocoSeguranca.vue";
import BlocoTempoDeCasa from "./blocos/BlocoTempoDeCasa.vue";
import BlocoValores from "./blocos/BlocoValores.vue";
import { blocoEhGrande } from "@/shared/layoutPadrao";
import { normalizarNoticia } from "@/shared/noticia";

const COMPONENTES = {
  aniversariantes: BlocoAniversariantes,
  tempoDeCasa: BlocoTempoDeCasa,
  valores: BlocoValores,
  cipa: BlocoCipa,
  seguranca: BlocoSeguranca,
  calendario: BlocoCalendario,
  atencao: BlocoAtencao,
  saude: BlocoSaude,
  agenda: BlocoAgenda,
};

// Na versão grande, estes cartões ganham a moldura das telas ampliadas.
const ENVOLVER_QUANDO_GRANDE = ["aniversariantes", "tempoDeCasa", "cipa", "saude", "agenda"];

const props = defineProps({
  bloco: { type: Object, required: true },
  foco: { type: Boolean, default: false },
  indice: { type: Number, default: 0 },
});

const grande = computed(() => props.foco || blocoEhGrande(props.bloco));
const componente = computed(() => COMPONENTES[props.bloco.tipo] || null);
const envolver = computed(() => grande.value && ENVOLVER_QUANDO_GRANDE.includes(props.bloco.tipo));
const variante = computed(() => (props.indice % 2) + 1);

const propriedades = computed(() => {
  const config = props.bloco.config || {};
  if (props.bloco.tipo === "aniversariantes" || props.bloco.tipo === "tempoDeCasa") return { grande: grande.value };
  if (props.bloco.tipo === "cipa") return { titulo: config.titulo || "", integrantes: config.integrantes || [] };
  if (props.bloco.tipo === "seguranca") return { dataBase: config.dataBase || "" };
  return {};
});

const midia = computed(() => {
  const conteudo = props.bloco.conteudo;
  if (!conteudo?.midia) return { midia: "", tipo: "imagem" };
  return { midia: conteudo.midia, tipo: conteudo.midiaTipo === "video" ? "video" : "imagem" };
});

const noticia = computed(() => normalizarNoticia(props.bloco.conteudo, props.bloco.config?.tag));
</script>
