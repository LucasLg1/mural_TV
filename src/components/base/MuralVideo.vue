<template>
  <video
    v-if="fonte"
    :key="fonte"
    autoplay
    muted
    loop
    playsinline
    webkit-playsinline
    preload="auto"
    disablepictureinpicture
    :aria-label="rotulo"
  >
    <source :src="fonte" :type="tipo">
  </video>
</template>

<script setup>
import { computed } from "vue";
import { urlSegura } from "@/shared/utils";

const TIPOS = { mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", ogg: "video/ogg", mov: "video/quicktime" };

const props = defineProps({
  src: { type: String, default: "" },
  rotulo: { type: String, default: "" },
});

const fonte = computed(() => urlSegura(props.src));
const tipo = computed(() => {
  const extensao = String(props.src).match(/\.([a-z0-9]+)(?:[?#].*)?$/i)?.[1]?.toLowerCase();
  return TIPOS[extensao] || "video/mp4";
});
</script>
