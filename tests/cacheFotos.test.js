import assert from "node:assert/strict";
import test from "node:test";
import { deveCachearFoto, ehFotoPessoa, temRetentativa, urlDaFoto } from "../src/shared/cacheFotosSw.js";

const foto = "https://api.thalamus.ind.br/storage/pessoa_img/abc.png";

test("a retentativa usa a mesma chave do cache", () => {
  assert.equal(urlDaFoto(`${foto}?r=2`), foto);
  assert.equal(urlDaFoto(`${foto}?token=1&r=2`), `${foto}?token=1`);
  assert.equal(temRetentativa(`${foto}?r=1`), true);
  assert.equal(temRetentativa(foto), false);
});

test("só entra no cache imagem de verdade, não logo nem API", () => {
  assert.equal(deveCachearFoto({ method: "GET", destination: "image", url: foto }), true);
  assert.equal(deveCachearFoto({ method: "GET", destination: "", url: foto }), true);
  assert.equal(
    deveCachearFoto({ method: "GET", destination: "image", url: "https://mural.local/assets/logo.png" }),
    false
  );
  assert.equal(
    deveCachearFoto({
      method: "GET",
      destination: "",
      url: "https://api.thalamus.ind.br/api/pessoas/aniversariantes",
    }),
    false
  );
  assert.equal(deveCachearFoto({ method: "GET", destination: "video", url: `${foto.replace(".png", ".mp4")}` }), false);
});

test("reduz só o retrato do colaborador", () => {
  assert.equal(ehFotoPessoa(foto), true);
  assert.equal(ehFotoPessoa("https://api.thalamus.ind.br/storage/mural/midias/noticia.jpg"), false);
  assert.equal(ehFotoPessoa("arquivo"), false);
});
