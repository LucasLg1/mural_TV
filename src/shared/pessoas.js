import { reactive } from "vue";
import { enderecos, muralConfig, aniversarioSimulado } from "./config";
import { aniversariantesDeHoje, statusAniversario } from "./aniversario";
import { MESES, normalizar, urlStorage } from "./utils";

const api = muralConfig.integracaoApi || {};

export const pessoas = reactive({
  status: "aguardando",
  mensagem: "",
  atualizadoEm: null,
  mesReferencia: muralConfig.aniversariantes?.mesReferencia || "",
  aniversariantes: muralConfig.aniversariantes?.pessoas || [],
  tempoCasa: muralConfig.tempoDeCasa?.pessoas || [],
  // Pessoas conhecidas por id (usado pela CIPA e pelo seletor do painel).
  porId: {},
});

function foto(caminho) {
  return urlStorage(caminho, enderecos.storage);
}

function pessoaDoAniversario(pessoa, mes) {
  return {
    id: pessoa.id,
    nome: String(pessoa.nome || "").trim(),
    dia: Number(pessoa.diaAniversario),
    mes: Number(mes),
    foto: foto(pessoa.foto),
    setor: pessoa.setor_nome || "",
    cargo: pessoa.cargo_nome || "",
  };
}

function pessoaDoTempoDeCasa(pessoa) {
  return {
    id: pessoa.id,
    nome: String(pessoa.nome || "").trim(),
    admissao: pessoa.dtAdmissao || "",
    anos: pessoa.dtAdmissao ? undefined : Number(pessoa.tempo),
    foto: foto(pessoa.foto),
    setor: pessoa.setor_nome || "",
    cargo: pessoa.cargo_nome || "",
  };
}

function mesDaApi() {
  return api.mesAutomatico !== false
    ? new Date().getMonth() + 1
    : Math.min(12, Math.max(1, Number(api.mes) || 1));
}

async function buscarMes(mes, ids, signal) {
  const url = new URL(enderecos.aniversariantes, window.location.href);
  url.searchParams.set("mes", String(mes));
  if (ids.length) url.searchParams.set("ids", ids.join(","));
  const resposta = await fetch(url, { headers: { Accept: "application/json" }, signal, cache: "no-store" });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  const corpo = await resposta.json();
  if (!corpo || !Array.isArray(corpo.aniversariantes)) throw new Error("Formato de resposta inválido");
  return corpo;
}

function comTempoLimite(executar) {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), Math.max(1000, Number(api.timeoutMs) || 8000));
  return executar(controle.signal).finally(() => clearTimeout(limite));
}

export function registrarPorId(lista) {
  lista.forEach((pessoa) => {
    if (pessoa?.id !== undefined && pessoa?.nome) pessoas.porId[Number(pessoa.id)] = pessoa;
  });
}

function pessoaPorId(pessoa) {
  return {
    id: pessoa.id,
    nome: String(pessoa.nome || "").trim(),
    foto: foto(pessoa.foto),
    setor: pessoa.setor_nome || "",
    cargo: pessoa.cargo_nome || "",
  };
}

/**
 * Uma única chamada: aniversariantes e tempo de casa do mês, mais as pessoas
 * pedidas por id (integrantes da CIPA).
 */
export async function carregarPessoas(idsExtras = []) {
  if (!api.ativa || !enderecos.aniversariantes) return false;

  const mes = mesDaApi();
  pessoas.status = "carregando";
  pessoas.mensagem = `mês ${mes}`;

  try {
    await comTempoLimite(async (signal) => {
      const ids = [...new Set(idsExtras.map(Number))].filter((id) => Number.isInteger(id) && id > 0).slice(0, 50);
      const corpo = await buscarMes(mes, ids, signal);
      const mesResposta = Number(corpo.mes) || mes;

      pessoas.aniversariantes = corpo.aniversariantes
        .map((pessoa) => pessoaDoAniversario(pessoa, mesResposta))
        .filter((pessoa) => pessoa.nome && Number.isInteger(pessoa.dia));
      if (Array.isArray(corpo.tempoCasa)) {
        pessoas.tempoCasa = corpo.tempoCasa.map(pessoaDoTempoDeCasa).filter((pessoa) => pessoa.nome);
      }
      registrarPorId(pessoas.aniversariantes);

      if (Array.isArray(corpo.pessoas)) registrarPorId(corpo.pessoas.map(pessoaPorId));

      const nomeMes = MESES[mesResposta - 1];
      if (nomeMes) pessoas.mesReferencia = nomeMes.toUpperCase();
    });

    pessoas.status = "conectado";
    pessoas.atualizadoEm = new Date();
    pessoas.mensagem = `${pessoas.aniversariantes.length} aniversariantes`;
    return true;
  } catch (erro) {
    pessoas.status = "erro";
    pessoas.mensagem = erro.name === "AbortError" ? "tempo limite excedido" : erro.message;
    if (!pessoas.atualizadoEm) {
      pessoas.aniversariantes = [];
      pessoas.tempoCasa = [];
    }
    console.warn(`Não foi possível atualizar os dados da API (${pessoas.mensagem}).`);
    return false;
  }
}

function correspondeSimulacao(pessoa) {
  if (!aniversarioSimulado) return false;
  const busca = normalizar(aniversarioSimulado);
  return normalizar(pessoa.nome).includes(busca) || String(pessoa.dia) === busca;
}

export function statusDaPessoa(pessoa) {
  return correspondeSimulacao(pessoa) ? "hoje" : statusAniversario(pessoa);
}

export function aniversariantesAtivos() {
  const hoje = aniversariantesDeHoje(pessoas.aniversariantes);
  if (!aniversarioSimulado) return hoje;
  const simulados = pessoas.aniversariantes.filter(correspondeSimulacao);
  return simulados.length ? simulados : hoje;
}
