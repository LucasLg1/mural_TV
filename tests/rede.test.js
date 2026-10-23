import assert from "node:assert/strict";
import test from "node:test";
import { enderecoDeStorage, enderecoVisivel } from "../src/shared/rede.js";

const nestaMaquina = { hostname: "localhost", origin: "http://localhost:5174" };
const outroPc = { hostname: "192.168.2.114", origin: "http://192.168.2.114:5174" };

test("no próprio PC a API local continua em 127.0.0.1", () => {
  assert.equal(
    enderecoVisivel("http://127.0.0.1:8000/api/mural/publico", nestaMaquina),
    "http://127.0.0.1:8000/api/mural/publico"
  );
});

test("outro PC alcança a API pelo mesmo endereço da página", () => {
  assert.equal(
    enderecoVisivel("http://127.0.0.1:8000/api/mural/publico", outroPc),
    "http://192.168.2.114:5174/api/mural/publico"
  );
  assert.equal(
    enderecoVisivel("http://localhost/storage/mural/midias/foto.jpg", outroPc),
    "http://192.168.2.114:5174/storage/mural/midias/foto.jpg"
  );
});

test("foto de notícia gravada em localhost usa o storage da API", () => {
  assert.equal(
    enderecoDeStorage(
      "http://localhost/storage/anexos/noticia/8/midia/foto.png",
      nestaMaquina,
      "https://api.thalamus.ind.br/storage"
    ),
    "https://api.thalamus.ind.br/storage/anexos/noticia/8/midia/foto.png"
  );
  assert.equal(
    enderecoDeStorage(
      "http://localhost/storage/anexos/noticia/8/midia/foto.png",
      outroPc,
      "https://api.thalamus.ind.br/storage/"
    ),
    "https://api.thalamus.ind.br/storage/anexos/noticia/8/midia/foto.png"
  );
});

test("storage local no outro PC continua saindo pelo endereço da página", () => {
  assert.equal(
    enderecoDeStorage(
      "http://localhost/storage/mural/midias/foto.jpg",
      outroPc,
      "http://192.168.2.114:5174/storage"
    ),
    "http://192.168.2.114:5174/storage/mural/midias/foto.jpg"
  );
});

test("no próprio PC, localhost sem porta aponta para a porta da API local", () => {
  assert.equal(
    enderecoDeStorage(
      "http://localhost/storage/anexos/noticia/8/midia/foto.png",
      nestaMaquina,
      "http://127.0.0.1:8000/storage"
    ),
    "http://127.0.0.1:8000/storage/anexos/noticia/8/midia/foto.png"
  );
});

test("endereços de produção e caminhos relativos não mudam", () => {
  assert.equal(
    enderecoVisivel("https://api.thalamus.ind.br/storage/foto.jpg", outroPc),
    "https://api.thalamus.ind.br/storage/foto.jpg"
  );
  assert.equal(enderecoVisivel("assets/logo.png", outroPc), "assets/logo.png");
  assert.equal(enderecoVisivel("", outroPc), "");
});
