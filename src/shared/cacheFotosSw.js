export const CACHE_FOTOS = "mural-fotos-v1";
export const MAX_FOTOS = 160;
const LADO_MAX = 640;

export function urlDaFoto(valor) {
  const url = new URL(valor);
  url.searchParams.delete("r");
  url.hash = "";
  return url.href;
}

export function temRetentativa(valor) {
  return new URL(valor).searchParams.has("r");
}

export function ehFotoPessoa(valor) {
  try {
    return decodeURIComponent(new URL(valor).pathname).toLowerCase().includes("/pessoa_img/");
  } catch {
    return false;
  }
}

function caminhoInterno(valor) {
  try {
    const caminho = new URL(valor).pathname;
    return caminho.startsWith("/assets/") || caminho.startsWith("/app/");
  } catch {
    return false;
  }
}

export function deveCachearFoto(pedido) {
  if (!pedido || pedido.method !== "GET") return false;
  const url = String(pedido.url || "");
  if (!/^https?:/i.test(url) || caminhoInterno(url)) return false;
  if (pedido.destination === "image") return true;
  // O pré-carregamento usa fetch(), que não marca destination = image.
  return !pedido.destination && ehFotoPessoa(url);
}

export function instalarCacheDeFotos(escopo) {
  escopo.addEventListener("install", () => {
    escopo.skipWaiting();
  });

  escopo.addEventListener("activate", (evento) => {
    evento.waitUntil(ativar(escopo));
  });

  escopo.addEventListener("fetch", (evento) => {
    if (!deveCachearFoto(evento.request)) return;
    evento.respondWith(responderFoto(evento.request));
  });
}

async function ativar(escopo) {
  const nomes = await caches.keys();
  await Promise.all(
    nomes
      .filter((nome) => nome.startsWith("mural-fotos-") && nome !== CACHE_FOTOS)
      .map((nome) => caches.delete(nome))
  );
  await escopo.clients.claim();
}

async function responderFoto(pedido) {
  try {
    const cache = await caches.open(CACHE_FOTOS);
    const chave = urlDaFoto(pedido.url);
    if (!temRetentativa(pedido.url)) {
      const salvo = await cache.match(chave);
      if (salvo) return salvo;
    }
    const nova = await renovar(cache, pedido, chave);
    if (nova) return nova;
  } catch {
    // Sem cache a imagem segue pela rede, como antes.
  }
  return fetch(pedido);
}

async function renovar(cache, pedido, chave) {
  const resposta = await obter(pedido);
  if (!resposta || !(resposta.ok || resposta.type === "opaque")) return resposta;
  const armazenada = await prepararParaCache(pedido, resposta);
  return guardar(cache, chave, armazenada);
}

async function obter(pedido) {
  if (ehFotoPessoa(pedido.url)) {
    try {
      const direta = await fetch(pedido.url, { mode: "cors", credentials: "omit" });
      if (direta.ok) return direta;
    } catch {
      // Sem CORS a resposta opaca ainda pode ser guardada.
    }
  }
  return fetch(pedido);
}

async function prepararParaCache(pedido, resposta) {
  if (resposta.type === "opaque" || !resposta.ok) return resposta;
  try {
    if (ehFotoPessoa(pedido.url)) return await reduzirFotoPessoa(resposta);
  } catch {
    // Guarda o arquivo original se não der para reduzir.
  }
  return copiaArmazenavel(resposta);
}

async function reduzirFotoPessoa(resposta) {
  const bitmap = await createImageBitmap(await resposta.clone().blob(), { imageOrientation: "from-image" });
  try {
    if (!bitmap.width || !bitmap.height) return copiaArmazenavel(resposta);
    const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
    const largura = Math.max(1, Math.round(bitmap.width * escala));
    const altura = Math.max(1, Math.round(bitmap.height * escala));
    const tela = new OffscreenCanvas(largura, altura);
    const contexto = tela.getContext("2d");
    if (!contexto) return copiaArmazenavel(resposta);
    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, largura, altura);
    contexto.imageSmoothingQuality = "high";
    contexto.drawImage(bitmap, 0, 0, largura, altura);
    const saida = await tela.convertToBlob({ type: "image/jpeg", quality: 0.82 });
    if (!saida || saida.size < 32) return copiaArmazenavel(resposta);
    return new Response(saida, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } finally {
    bitmap.close?.();
  }
}

async function copiaArmazenavel(resposta) {
  if (resposta.type === "opaque") return resposta;
  const cabecalhos = new Headers();
  const tipo = resposta.headers.get("content-type");
  if (tipo) cabecalhos.set("Content-Type", tipo);
  cabecalhos.set("Cache-Control", "public, max-age=31536000");
  return new Response(await resposta.blob(), { status: 200, headers: cabecalhos });
}

async function guardar(cache, chave, resposta) {
  const paraPagina = resposta.clone();
  try {
    await cache.put(chave, resposta);
    await aparar(cache, MAX_FOTOS);
  } catch {
    try {
      await aparar(cache, Math.floor(MAX_FOTOS / 2));
      await cache.put(chave, paraPagina.clone());
    } catch {
      // Sem espaço o retrato aparece mesmo assim; só não fica para a próxima abertura.
    }
  }
  return paraPagina;
}

async function aparar(cache, limite) {
  const pedidos = await cache.keys();
  const excesso = pedidos.length - limite;
  for (let i = 0; i < excesso; i += 1) await cache.delete(pedidos[i]);
}
