<template>
  <div v-if="midia" class="media-frame">
    <MuralVideo v-if="tipo === 'video'" :src="midia" rotulo="Vídeo do mural" />
    <MuralImagem v-else :src="midia" alt="" />
  </div>
  <section v-else class="card block-placeholder">Envie uma imagem ou um vídeo para este quadro.</section>
</template>

<script setup>
import MuralImagem from "../base/MuralImagem.vue";
import MuralVideo from "../base/MuralVideo.vue";

defineProps({
  midia: { type: String, default: "" },
  tipo: { type: String, default: "imagem" },
});
</script>
