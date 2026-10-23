const LOOPBACK = /^(https?:\/\/)(127\.0\.0\.1|localhost)(:\d+)?(?=\/|$)/i;
const STORAGE_LOCAL = /^(https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?)\/storage\/(.*)$/i;
const BASE_STORAGE_LOCAL = /^(https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?)\/storage$/i;

/**
 * A API local está gravada como 127.0.0.1. Quem abre o mural por outro
 * computador precisa falar com esta máquina, pelo mesmo endereço da página.
 * No próprio PC (localhost) o endereço original continua valendo.
 */
export function enderecoVisivel(url, pagina) {
  if (url == null || url === "") return url;
  const host = pagina?.hostname;
  if (!host || host === "127.0.0.1" || host === "localhost" || !pagina.origin) return url;
  return String(url).replace(LOOPBACK, pagina.origin);
}

/**
 * A foto da notícia pode vir como http://localhost/storage/... porque o APP_URL
 * da API está em localhost. Nesse caso o arquivo está no storage da API.
 */
export function enderecoDeStorage(url, pagina, baseStorage) {
  const texto = String(url ?? "");
  const arquivo = texto.match(STORAGE_LOCAL);
  const base = String(baseStorage || "").replace(/\/+$/, "");
  if (arquivo && base) {
    const baseLocal = base.match(BASE_STORAGE_LOCAL);
    if (!baseLocal) return `${base}/${arquivo[2]}`;
    if (arquivo[1].toLowerCase() !== baseLocal[1].toLowerCase()) return `${base}/${arquivo[2]}`;
  }
  return enderecoVisivel(url, pagina);
}
