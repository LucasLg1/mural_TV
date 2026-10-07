<template>
  <div
    v-for="(pessoa, indice) in pessoas"
    :key="pessoa.id ?? indice"
    class="person"
    :class="aniversario ? ['birthday-person', `status-${statusDaPessoa(pessoa)}`] : null"
    :style="aniversario ? { '--stagger': `${indice * 70}ms` } : null"
  >
    <div v-if="aniversario" class="avatar-wrap">
      <MuralImagem class="avatar" :src="pessoa.foto" :alt="pessoa.nome" />
      <span v-if="statusDaPessoa(pessoa) === 'hoje'" class="birthday-float" aria-label="Aniversário hoje">🎈</span>
      <span v-else-if="statusDaPessoa(pessoa) === 'proximo'" class="birthday-soon" aria-label="Aniversário próximo"></span>
    </div>
    <MuralImagem v-else class="avatar" :src="pessoa.foto" :alt="pessoa.nome" />
    <strong :title="pessoa.nome">{{ pessoa.nome }}</strong>
    <small>{{ secundario(pessoa) }}</small>
  </div>
</template>

<script setup>
import MuralImagem from "./MuralImagem.vue";
import { statusDaPessoa } from "@/shared/pessoas";

defineProps({
  pessoas: { type: Array, default: () => [] },
  aniversario: { type: Boolean, default: false },
  secundario: { type: Function, default: () => "" },
});
</script>
