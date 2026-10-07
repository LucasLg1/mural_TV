<template>
  <article
    v-if="grande"
    class="detail-panel event-panel"
    :class="[`event-panel-${variante}`, { 'no-media': !temMidia }]"
  >
    <span v-if="noticia.tag" class="event-tag">{{ noticia.tag }}</span>
    <h2>{{ noticia.titulo }}</h2>
    <div class="event-description">
      <p v-for="(texto, indice) in noticia.paragrafos" :key="indice">{{ texto }}</p>
    </div>
    <div v-if="temMidia" class="carousel">
      <MuralVideo v-if="noticia.video" class="event-video" :src="noticia.midia" :rotulo="noticia.titulo" />
      <template v-else>
        <MuralImagem
          v-for="(foto, indice) in noticia.fotos"
          :key="foto"
          class="carousel-image"
          :class="{ active: indice === fotoAtual }"
          :src="foto"
          :alt="`${noticia.titulo} ${indice + 1}`"
        />
      </template>
    </div>
    <div v-if="noticia.badges.length" class="event-badges">
      <span v-for="(selo, indice) in noticia.badges" :key="indice" class="event-badge">{{ selo }}</span>
    </div>
  </article>

  <section v-else class="card news-block" :class="{ 'no-media': !temMidia }">
    <div class="news-block-copy">
      <span v-if="noticia.tag" class="tag">{{ noticia.tag }}</span>
      <h2>{{ noticia.titulo }}</h2>
      <p>{{ noticia.texto || noticia.paragrafos.join(" ") }}</p>
    </div>
    <div v-if="temMidia" class="news-block-media">
      <MuralVideo v-if="noticia.video" :src="noticia.midia" :rotulo="noticia.titulo" />
      <MuralImagem v-else :src="noticia.fotos[0]" :alt="noticia.titulo" />
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import MuralImagem from "../base/MuralImagem.vue";
import MuralVideo from "../base/MuralVideo.vue";
import { tempos } from "@/shared/config";

const props = defineProps({
  noticia: { type: Object, required: true },
  grande: { type: Boolean, default: false },
  variante: { type: Number, default: 1 },
});

const temMidia = computed(() => Boolean(props.noticia.midia));
const fotoAtual = ref(0);
let intervalo = null;

function pararCarrossel() {
  clearInterval(intervalo);
  intervalo = null;
}

watch(
  () => [props.grande, props.noticia.fotos.length],
  ([grande, total]) => {
    pararCarrossel();
    fotoAtual.value = 0;
    if (!grande || total < 2) return;
    intervalo = setInterval(() => {
      if (!document.hidden) fotoAtual.value = (fotoAtual.value + 1) % total;
    }, tempos.carrosselMs);
  },
  { immediate: true }
);

onBeforeUnmount(pararCarrossel);
</script>
