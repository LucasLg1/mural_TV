<template>
  <div class="painel-config">
    <header class="painel-config-topo">
      <span class="painel-config-icone">{{ item?.icone }}</span>
      <div>
        <strong>{{ item?.rotulo || bloco.tipo }}</strong>
        <small>{{ item?.origem }}</small>
      </div>
    </header>

    <fieldset class="painel-grade-numeros">
      <legend>Posição e tamanho (% da tela)</legend>
      <label v-for="campo in CAMPOS" :key="campo.chave">
        <span>{{ campo.rotulo }}</span>
        <input
          type="number"
          step="0.5"
          :min="campo.minimo"
          max="100"
          :value="bloco[campo.chave]"
          @change="ajustar(campo.chave, $event.target.value)"
        >
      </label>
    </fieldset>

    <template v-if="bloco.tipo === 'noticia'">
      <label class="painel-campo">
        <span>Notícia exibida</span>
        <select :value="bloco.config.noticia_id || ''" @change="escolherNoticia($event.target.value)">
          <option value="">— escolha uma notícia —</option>
          <option v-for="noticia in noticias" :key="noticia.id" :value="noticia.id">
            {{ noticia.titulo }}{{ estaVencida(noticia) ? " (vencida)" : "" }}
          </option>
        </select>
      </label>
      <button v-if="!criando" class="painel-botao" type="button" @click="criando = true">+ Nova notícia</button>

      <label class="painel-campo">
        <span>Selo <small>(etiqueta acima do título, opcional)</small></span>
        <input v-model.trim="bloco.config.tag" maxlength="40" placeholder="Ex.: EVENTO, CONQUISTA">
      </label>

      <EditorNoticia
        v-if="criando || noticiaAtual"
        :noticia="criando ? null : noticiaAtual"
        :midia="criando ? null : midias[noticiaAtual?.id]"
        @salva="aoSalvarNoticia"
        @midia-alterada="$emit('midia-alterada', $event)"
        @cancelar="criando = false"
      />
    </template>

    <template v-else-if="bloco.tipo === 'midia'">
      <div class="painel-midia">
        <span class="painel-rotulo">Arquivo do quadro</span>
        <div class="painel-midia-previa" :class="{ vazia: !urlDaMidia }">
          <video v-if="urlDaMidia && bloco.config.tipo === 'video'" :src="urlDaMidia" muted loop autoplay playsinline></video>
          <img v-else-if="urlDaMidia" :src="urlDaMidia" alt="">
          <span v-else>Nenhum arquivo. O quadro fica vazio na TV até você enviar.</span>
        </div>
        <div v-if="progresso !== null" class="painel-progresso"><i :style="{ width: `${progresso}%` }"></i></div>
        <div class="painel-acoes">
          <label class="painel-botao">
            {{ urlDaMidia ? "Trocar arquivo" : "Escolher arquivo" }}
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime" hidden @change="enviarMidia">
          </label>
          <button v-if="urlDaMidia" class="painel-botao perigo" type="button" :disabled="progresso !== null" @click="limparMidia">Remover</button>
        </div>
        <small class="painel-dica">JPG, PNG, WEBP, GIF, MP4 ou WEBM até 80 MB. O arquivo ocupa o quadro inteiro e o vídeo toca sem som, em repetição.</small>
        <p v-if="erroMidia" class="painel-erro">{{ erroMidia }}</p>
      </div>
    </template>

    <template v-else-if="bloco.tipo === 'cipa'">
      <label class="painel-campo">
        <span>Título</span>
        <input v-model.trim="bloco.config.titulo" maxlength="120" :placeholder="tituloPadraoCipa">
      </label>
      <div class="painel-campo">
        <span>Integrantes ({{ integrantes.length }})</span>
        <div class="painel-chips">
          <span v-for="(membro, indice) in integrantes" :key="membro.id" class="painel-chip">
            {{ nomeDe(membro.id) }}
            <button type="button" :aria-label="`Remover ${nomeDe(membro.id)}`" @click="integrantes.splice(indice, 1)">×</button>
          </span>
          <em v-if="!integrantes.length">Sem integrantes: usa a lista do config.js.</em>
        </div>
      </div>
      <label class="painel-campo">
        <span>Adicionar pessoa</span>
        <input v-model="busca" type="search" placeholder="Digite um nome…" @focus="$emit('carregar-pessoas')">
      </label>
      <p v-if="carregandoPessoas" class="painel-dica">Carregando pessoas…</p>
      <ul v-else-if="resultados.length" class="painel-resultados">
        <li v-for="pessoa in resultados" :key="pessoa.id">
          <button type="button" @click="adicionarIntegrante(pessoa)">
            <strong>{{ pessoa.nome }}</strong>
            <small>{{ pessoa.setor || pessoa.cargo }}</small>
          </button>
        </li>
      </ul>
    </template>

    <template v-else-if="bloco.tipo === 'seguranca'">
      <label class="painel-campo">
        <span>Data do último acidente</span>
        <input v-model="bloco.config.dataBase" type="date" :max="hojeIso">
      </label>
      <p class="painel-dica">
        A TV mostra <strong>{{ diasSemAcidenteNoQuadro }}</strong> dias desde essa data.
        <template v-if="!bloco.config.dataBase && dataBasePadrao">Em branco, usa {{ dataBasePadrao }} do config.js.</template>
      </p>
    </template>

    <p v-else class="painel-dica">
      O conteúdo deste quadro vem do <code>public/config.js</code> do mural. Aqui você define onde ele aparece e o tamanho.
    </p>

    <div class="painel-acoes painel-config-rodape">
      <button class="painel-botao" type="button" title="Desenhar por cima dos outros" @click="$emit('frente')">Trazer para frente</button>
      <button class="painel-botao" type="button" @click="$emit('duplicar')">Duplicar</button>
      <button class="painel-botao perigo" type="button" @click="$emit('remover')">Remover quadro</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import EditorNoticia from "./EditorNoticia.vue";
import { enviarMidia as subirMidia, mensagemDeErro } from "./painelApi";
import { CATALOGO_POR_TIPO, TAMANHO_MINIMO } from "@/shared/catalogo";
import { enderecos, muralConfig } from "@/shared/config";
import { pessoas } from "@/shared/pessoas";
import { diasSemAcidente, limitar, normalizar, urlStorage } from "@/shared/utils";

const CAMPOS = [
  { chave: "x", rotulo: "Esquerda", minimo: 0 },
  { chave: "y", rotulo: "Topo", minimo: 0 },
  { chave: "w", rotulo: "Largura", minimo: TAMANHO_MINIMO },
  { chave: "h", rotulo: "Altura", minimo: TAMANHO_MINIMO },
];

const props = defineProps({
  bloco: { type: Object, required: true },
  noticias: { type: Array, default: () => [] },
  midias: { type: Object, default: () => ({}) },
  pessoasDoAno: { type: Array, default: null },
  carregandoPessoas: { type: Boolean, default: false },
});

const emit = defineEmits(["remover", "duplicar", "frente", "noticia-salva", "midia-alterada", "midia-liberada", "carregar-pessoas"]);

const criando = ref(false);
const busca = ref("");
const progresso = ref(null);
const erroMidia = ref("");
const item = computed(() => CATALOGO_POR_TIPO[props.bloco.tipo]);
const tituloPadraoCipa = muralConfig.cipa?.titulo || "CIPA";
const dataBasePadrao = muralConfig.diasSemAcidente?.dataBase || "";
const agora = new Date();
const hojeIso = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
const diasSemAcidenteNoQuadro = computed(() => diasSemAcidente({
  dataBase: props.bloco.config?.dataBase || dataBasePadrao,
  diasManual: muralConfig.diasSemAcidente?.diasManual,
}));

watch(() => props.bloco, () => {
  criando.value = false;
  busca.value = "";
  progresso.value = null;
  erroMidia.value = "";
});

const urlDaMidia = computed(() => urlStorage(props.bloco.config?.caminho, enderecos.midia));

async function enviarMidia(evento) {
  const arquivo = evento.target.files?.[0];
  evento.target.value = "";
  if (!arquivo) return;
  if (arquivo.size > 80 * 1024 * 1024) {
    erroMidia.value = "O arquivo passa de 80 MB.";
    return;
  }
  const anterior = props.bloco.config.caminho;
  erroMidia.value = "";
  progresso.value = 0;
  try {
    const salva = await subirMidia(arquivo, (valor) => { progresso.value = valor; });
    props.bloco.config.caminho = salva.caminho;
    props.bloco.config.tipo = salva.tipo;
    if (anterior && anterior !== salva.caminho) emit("midia-liberada", anterior);
  } catch (falha) {
    erroMidia.value = mensagemDeErro(falha, "Não foi possível enviar o arquivo.");
  } finally {
    progresso.value = null;
  }
}

function limparMidia() {
  const anterior = props.bloco.config.caminho;
  props.bloco.config.caminho = "";
  props.bloco.config.tipo = "";
  if (anterior) emit("midia-liberada", anterior);
}

// "bloco" é o próprio objeto do estado do painel: editar aqui atualiza a prévia na hora.
const noticiaAtual = computed(() => props.noticias.find((n) => n.id === Number(props.bloco.config.noticia_id)) || null);

function ajustar(chave, valorTexto) {
  const valor = Number(valorTexto);
  if (!Number.isFinite(valor)) return;
  const bloco = props.bloco;
  if (chave === "x") bloco.x = limitar(valor, 0, 100 - bloco.w);
  if (chave === "y") bloco.y = limitar(valor, 0, 100 - bloco.h);
  if (chave === "w") bloco.w = limitar(valor, TAMANHO_MINIMO, 100 - bloco.x);
  if (chave === "h") bloco.h = limitar(valor, TAMANHO_MINIMO, 100 - bloco.y);
}

function escolherNoticia(id) {
  props.bloco.config.noticia_id = id ? Number(id) : null;
  criando.value = false;
}

function aoSalvarNoticia(noticia) {
  emit("noticia-salva", noticia);
  props.bloco.config.noticia_id = noticia.id;
  criando.value = false;
}

function estaVencida(noticia) {
  if (!noticia.valido_ate) return false;
  return new Date(`${String(noticia.valido_ate).slice(0, 10)}T23:59:59`) < new Date();
}

const integrantes = computed(() => props.bloco.config.integrantes);

function nomeDe(id) {
  return pessoas.porId[Number(id)]?.nome || `Pessoa #${id}`;
}

const resultados = computed(() => {
  const termo = normalizar(busca.value.trim());
  if (!termo || !props.pessoasDoAno) return [];
  const escolhidos = new Set(integrantes.value.map((membro) => Number(membro.id)));
  return props.pessoasDoAno
    .filter((pessoa) => !escolhidos.has(Number(pessoa.id)) && normalizar(pessoa.nome).includes(termo))
    .slice(0, 8);
});

function adicionarIntegrante(pessoa) {
  integrantes.value.push({ id: Number(pessoa.id) });
  busca.value = "";
}
</script>
