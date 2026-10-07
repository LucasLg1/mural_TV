<template>
  <img :src="fonte" :alt="alt" decoding="async" draggable="false" @error="falhou = true">
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { imagemReserva, urlSegura } from "@/shared/utils";

const props = defineProps({
  src: { type: String, default: "" },
  alt: { type: String, default: "" },
});

const falhou = ref(false);
watch(() => props.src, () => { falhou.value = false; });

const fonte = computed(() => {
  const url = urlSegura(props.src);
  return falhou.value || !url ? imagemReserva(props.alt) : url;
});
</script>
