<template>
  <form class="painel-noticia" @submit.prevent="salvar">
    <label class="painel-campo">
      <span>Título</span>
      <input v-model.trim="formulario.titulo" maxlength="160" required placeholder="Ex.: Roboflex na Expo 2026">
    </label>
    <label class="painel-campo">
      <span>Texto</span>
      <textarea v-model="formulario.descricao" rows="6" placeholder="Uma linha em branco separa os parágrafos na tela ampliada."></textarea>
    </label>
    <label class="painel-campo">
      <span>Mostrar até <small>(opcional)</small></span>
      <input v-model="formulario.valido_ate" type="date">
    </label>
    <p v-if="vencida" class="painel-alerta">Esta notícia venceu e não aparece na TV. Ajuste a data para exibi-la.</p>

    <div class="painel-acoes">
      <button class="painel-botao primario" type="submit" :disabled="salvando || !formulario.titulo">
        {{ salvando ? "Salvando…" : noticia ? "Salvar notícia" : "Criar notícia" }}
      </button>
      <button v-if="!noticia" class="painel-botao" type="button" @click="$emit('cancelar')">Cancelar</button>
    </div>

    <div v-if="noticia" class="painel-midia">
      <span class="painel-rotulo">Imagem ou vídeo (lado direito)</span>
      <div class="painel-midia-previa" :class="{ vazia: !midia?.midia }">
        <video v-if="midia?.midia && midia.midiaTipo === 'video'" :src="midia.midia" muted loop autoplay playsinline></video>
        <img v-else-if="midia?.midia" :src="midia.midia" alt="">
        <span v-else>Sem mídia — o texto ocupa o quadro inteiro.</span>
      </div>
      <div v-if="progresso !== null" class="painel-progresso"><i :style="{ width: `${progresso}%` }"></i></div>
      <div class="painel-acoes">
        <label class="painel-botao">
          {{ midia?.midia ? "Trocar arquivo" : "Escolher arquivo" }}
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime" hidden @change="enviar">
        </label>
        <button v-if="midia?.midia" class="painel-botao perigo" type="button" :disabled="progresso !== null" @click="removerMidia">Remover</button>
      </div>
      <small class="painel-dica">JPG, PNG, WEBP, GIF, MP4 ou WEBM até 80 MB. Vídeos tocam sem som, em repetição.</small>
    </div>

    <p v-if="erro" class="painel-erro">{{ erro }}</p>
  </form>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import {
  atualizarNoticia,
  criarNoticia,
  mensagemDeErro,
  removerMidiaDaNoticia,
  trocarMidiaDaNoticia,
} from "./painelApi";

const props = defineProps({
  noticia: { type: Object, default: null },
  midia: { type: Object, default: null },
});

const emit = defineEmits(["salva", "midia-alterada", "cancelar"]);

const formulario = reactive({ titulo: "", descricao: "", valido_ate: "" });
const salvando = ref(false);
const progresso = ref(null);
const erro = ref("");

watch(
  () => props.noticia,
  (noticia) => {
    formulario.titulo = noticia?.titulo || "";
    formulario.descricao = noticia?.descricao || "";
    formulario.valido_ate = String(noticia?.valido_ate || "").slice(0, 10);
    erro.value = "";
  },
  { immediate: true }
);

const vencida = computed(() => {
  if (!formulario.valido_ate) return false;
  const hoje = new Date();
  const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  return formulario.valido_ate < iso;
});

async function salvar() {
  salvando.value = true;
  erro.value = "";
  const dados = {
    titulo: formulario.titulo,
    descricao: formulario.descricao || null,
    valido_ate: formulario.valido_ate || null,
  };
  try {
    const salva = props.noticia ? await atualizarNoticia(props.noticia.id, dados) : await criarNoticia(dados);
    emit("salva", salva);
  } catch (falha) {
    erro.value = mensagemDeErro(falha, "Não foi possível salvar a notícia.");
  } finally {
    salvando.value = false;
  }
}

async function enviar(evento) {
  const arquivo = evento.target.files?.[0];
  evento.target.value = "";
  if (!arquivo || !props.noticia) return;
  if (arquivo.size > 80 * 1024 * 1024) {
    erro.value = "O arquivo passa de 80 MB.";
    return;
  }
  erro.value = "";
  progresso.value = 0;
  try {
    await trocarMidiaDaNoticia(props.noticia.id, arquivo, props.midia?.anexos || [], (valor) => { progresso.value = valor; });
    emit("midia-alterada", props.noticia.id);
  } catch (falha) {
    erro.value = mensagemDeErro(falha, "Não foi possível enviar o arquivo.");
  } finally {
    progresso.value = null;
  }
}

async function removerMidia() {
  if (!props.noticia || !window.confirm("Remover a imagem/vídeo desta notícia?")) return;
  try {
    await removerMidiaDaNoticia(props.noticia.id, props.midia?.anexos || []);
    emit("midia-alterada", props.noticia.id);
  } catch (falha) {
    erro.value = mensagemDeErro(falha, "Não foi possível remover a mídia.");
  }
}
</script>
