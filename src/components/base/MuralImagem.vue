<template>
  <img :src="fonte" :alt="alt" decoding="async" loading="eager" draggable="false" @error="aoFalhar">
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { imagemReserva, urlSegura } from "@/shared/utils";

const props = defineProps({
  src: { type: String, default: "" },
  alt: { type: String, default: "" },
});

const falhou = ref(false);
const tentativas = ref(0);
watch(() => props.src, () => {
  falhou.value = false;
  tentativas.value = 0;
});

const fonte = computed(() => {
  const url = urlSegura(props.src);
  if (!url || falhou.value) return imagemReserva(props.alt);
  if (!tentativas.value) return url;
  return `${url}${url.includes("?") ? "&" : "?"}r=${tentativas.value}`;
});

function aoFalhar() {
  if (urlSegura(props.src) && tentativas.value < 2) {
    tentativas.value += 1;
    return;
  }
  falhou.value = true;
}
</script>
