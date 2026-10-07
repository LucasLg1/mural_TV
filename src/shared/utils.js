export const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function normalizar(valor) {
  return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function iniciais(nome) {
  return String(nome || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0] || "")
    .join("")
    .toUpperCase();
}

export function imagemReserva(nome) {
  const rotulo = iniciais(nome).replace(/[<>&"']/g, "");
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#1689df"/><stop offset="1" stop-color="#07305d"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial" font-size="72" font-weight="700">${rotulo}</text></svg>`
  )}`;
}

export function urlSegura(valor) {
  const url = String(valor ?? "").trim();
  return /^(https?:\/\/|assets\/|\.?\/|data:image\/|blob:)/i.test(url) ? url : "";
}

export function ehVideo(src) {
  return /\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i.test(String(src || ""));
}

export function urlStorage(caminho, base) {
  let valor = String(caminho || "").trim();
  if (!valor) return "";
  if (/^https?:\/\//i.test(valor)) return valor;
  valor = valor.replace(/^\/+/, "");
  if (valor.startsWith("storage/")) valor = valor.substring(8);
  return `${String(base || "").replace(/\/+$/, "")}/${valor}`;
}

export function anosDeCasa(pessoa, hoje = new Date()) {
  if (Number.isFinite(Number(pessoa?.anos)) && pessoa?.anos !== undefined && pessoa?.anos !== null) {
    return Number(pessoa.anos);
  }
  if (!pessoa?.admissao) return 0;
  const admissao = new Date(`${pessoa.admissao}T12:00:00`);
  if (Number.isNaN(admissao.getTime())) return 0;
  // O ano completa no mês da admissão, em qualquer dia desse mês.
  let anos = hoje.getFullYear() - admissao.getFullYear();
  if (hoje.getMonth() < admissao.getMonth()) anos -= 1;
  return Math.max(0, anos);
}

export function diasSemAcidente(dados = {}, agora = new Date()) {
  if (!dados.dataBase) return Math.max(0, Number(dados.diasManual) || 0);
  const base = new Date(`${dados.dataBase}T00:00:00`);
  if (Number.isNaN(base.getTime())) return Math.max(0, Number(dados.diasManual) || 0);
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.max(0, Math.floor((hoje - base) / 86400000));
}

export function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor));
}
