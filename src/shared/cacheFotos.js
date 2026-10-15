let registro = null;

export function registrarCacheDeFotos() {
  if (!registro) registro = ativarCache();
  return registro;
}

function ativarCache() {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return Promise.resolve(false);

  const ativacao = navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw-fotos.js`)
    .then(() => navigator.serviceWorker.ready)
    .then(() => esperarControle())
    .then(() => true)
    .catch((erro) => {
      console.warn("Cache de fotos indisponível.", erro);
      return false;
    });

  const limite = new Promise((resolve) => setTimeout(() => resolve(false), 4000));
  return Promise.race([ativacao, limite]);
}

function esperarControle() {
  if (navigator.serviceWorker.controller) return Promise.resolve();
  return new Promise((resolve) => {
    navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
    setTimeout(resolve, 1500);
  });
}

// Baixa em segundo plano, com poucas ao mesmo tempo, para o cache encher
// antes de a tela daquela pessoa aparecer. Não segura o bitmap na memória.
function jaNaTela(url) {
  if (typeof document === "undefined") return false;
  try {
    const absoluta = new URL(url, window.location.href).href;
    return [...document.images].some((imagem) => imagem.src === absoluta);
  } catch {
    return false;
  }
}

export function aquecerFotos(urls) {
  if (typeof fetch !== "function") return;
  const fila = [...new Set(urls.filter((url) => /^https?:\/\//i.test(String(url || "").trim()) && !jaNaTela(url)))];
  let ativos = 0;

  const puxar = () => {
    while (ativos < 3 && fila.length) {
      const url = fila.shift();
      ativos += 1;
      fetch(url, { mode: "no-cors", credentials: "omit", priority: "low" })
        .then((resposta) => resposta.body?.cancel())
        .catch(() => {})
        .finally(() => {
          ativos -= 1;
          puxar();
        });
    }
  };

  puxar();
}
