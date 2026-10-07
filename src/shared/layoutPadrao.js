/** Bloco grande o bastante para usar a versão ampliada do conteúdo. */
export function blocoEhGrande(bloco) {
  return Number(bloco?.w) >= 30 && Number(bloco?.h) >= 60;
}
