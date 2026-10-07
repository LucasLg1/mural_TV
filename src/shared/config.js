import { enderecoVisivel } from "./rede";

const bruto = window.MURAL_CONFIG || {};

bruto.aniversariantes ||= { pessoas: [] };
bruto.tempoDeCasa ||= { pessoas: [] };
bruto.cipa ||= { integrantes: [] };

export const muralConfig = bruto;

export const modoDesempenho = bruto.performanceMode === true;

export const tempos = {
  telaPadraoMs: Number(bruto.timing?.overviewDurationMs) || 60000,
  detalheMs: Number(bruto.timing?.detailSlideDurationMs) || 60000,
  celebracaoMs: Number(bruto.timing?.celebracaoDurationMs) || 20000,
  carrosselMs: Number(bruto.timing?.carouselIntervalMs) || 5000,
  fadeMs: modoDesempenho
    ? Math.min(Number(bruto.timing?.fadeTransitionMs) || 800, 300)
    : Number(bruto.timing?.fadeTransitionMs) || 800,
};

const raizApi = String(process.env.VUE_APP_ROOT_API || "").replace(/\/+$/, "");
const raizStorage = String(process.env.VUE_APP_ROOT_STORAGE || "");
// O quadro de imagem/vídeo grava o arquivo na API que recebeu o envio.
const storageDaApi = `${raizApi.replace(/\/api$/i, "")}/storage`;

function nestaPagina(url) {
  return typeof window === "undefined" ? url : enderecoVisivel(url, window.location);
}

export const enderecos = {
  aniversariantes: nestaPagina(bruto.integracaoApi?.endpointAniversariantes || `${raizApi}/pessoas/aniversariantes`),
  storage: bruto.integracaoApi?.baseImagens || raizStorage,
  midia: nestaPagina(raizApi ? storageDaApi : raizStorage),
  layout: nestaPagina(bruto.layoutRemoto?.endpoint || `${raizApi}/mural/publico`),
};

const parametros = new URLSearchParams(window.location.search);
const hash = window.location.hash || "";
const parametrosHash = new URLSearchParams(hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "");

export function parametroUrl(nome) {
  return parametros.get(nome) ?? parametrosHash.get(nome);
}

export const modoDebug = parametroUrl("debug") === "1";
export const aniversarioSimulado = String(parametroUrl("debugAniversario") || "").trim();

/** Id opcional na URL (?mural=2) para uma TV fixar um mural. Sem isso, vale o ativo mais recente. */
export function muralDaTv() {
  const id = Number(parametroUrl("mural"));
  return Number.isInteger(id) && id > 0 ? id : null;
}
