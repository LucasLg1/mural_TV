const LOOPBACK = /^(https?:\/\/)(127\.0\.0\.1|localhost)(:\d+)?(?=\/|$)/i;

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
