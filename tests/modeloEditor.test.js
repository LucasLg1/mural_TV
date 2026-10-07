import assert from "node:assert/strict";
import test from "node:test";
import { statusAniversario } from "../src/shared/aniversario.js";
import {
  novoBloco,
  problemaDoLayout,
  telaVazia,
  telasParaApi,
} from "../src/painel/modeloEditor.js";

test("notícia sem notícia escolhida impede salvar e aponta o quadro", () => {
  const tela = telaVazia(1);
  tela.blocos.push(novoBloco("noticia", []));
  const problema = problemaDoLayout([tela]);
  assert.equal(problema.tela, 0);
  assert.equal(problema.bloco, 0);
});

test("o layout enviado à API usa milissegundos e limita a duração", () => {
  const tela = telaVazia(1);
  tela.nome = " Recepção ";
  tela.duracaoSeg = 9999;
  tela.cabecalho = true;
  tela.blocos.push(novoBloco("agenda", []));
  const [enviada] = telasParaApi([tela]);
  assert.equal(enviada.nome, "Recepção");
  assert.equal(enviada.duracao_ms, 600000);
  assert.equal(enviada.blocos[0].tipo, "agenda");
  assert.deepEqual(enviada.blocos[0].config, {});
});

test("quadro de mídia sem arquivo impede salvar e o arquivo vai na config", () => {
  const tela = telaVazia(1);
  tela.blocos.push(novoBloco("midia", []));
  const problema = problemaDoLayout([tela]);
  assert.equal(problema.tela, 0);
  assert.equal(problema.bloco, 0);

  tela.blocos[0].config = { caminho: "mural/midias/abcdefghijklmnopqrstuvwx.mp4", tipo: "video" };
  assert.equal(problemaDoLayout([tela]), null);
  const [enviada] = telasParaApi([tela]);
  assert.deepEqual(enviada.blocos[0].config, {
    caminho: "mural/midias/abcdefghijklmnopqrstuvwx.mp4",
    tipo: "video",
  });
});

test("a data do último acidente vai na config do quadro", () => {
  const tela = telaVazia(1);
  const bloco = novoBloco("seguranca", []);
  bloco.config.dataBase = "2026-06-10";
  tela.blocos.push(bloco);
  const [enviada] = telasParaApi([tela]);
  assert.deepEqual(enviada.blocos[0].config, { dataBase: "2026-06-10" });
});

test("um quadro novo procura um espaço livre", () => {
  const ocupado = { x: 0, y: 0, w: 100, h: 50 };
  const bloco = novoBloco("cipa", [ocupado]);
  assert.equal(bloco.y >= 50, true);
  assert.deepEqual(bloco.config, { titulo: "", integrantes: [] });
});

test("status de aniversário distingue hoje, próximo e passado", () => {
  const hoje = new Date(2026, 9, 7);
  assert.equal(statusAniversario({ dia: 7 }, hoje), "hoje");
  assert.equal(statusAniversario({ dia: 9 }, hoje), "proximo");
  assert.equal(statusAniversario({ dia: 2 }, hoje), "passado");
  assert.equal(statusAniversario({ dia: 1, mes: 1 }, new Date(2026, 11, 30)), "proximo");
});
