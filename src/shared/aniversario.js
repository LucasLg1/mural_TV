/**
 * Classifica uma pessoa em relação à data informada: "hoje", "proximo" (1 a 3 dias),
 * "passado" ou "normal". Sem "mes", considera a lista como sendo do mês atual.
 */
export function statusAniversario(pessoa, hoje = new Date()) {
  const dia = Number(pessoa?.dia);
  const mesExplicito = Number(pessoa?.mes);
  const temMes = Number.isInteger(mesExplicito) && mesExplicito >= 1 && mesExplicito <= 12;
  if (!Number.isInteger(dia) || dia < 1 || dia > 31 || !(hoje instanceof Date) || Number.isNaN(hoje.getTime())) {
    return "normal";
  }

  const dataHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const mesAlvo = temMes ? mesExplicito - 1 : dataHoje.getMonth();
  let aniversario = new Date(dataHoje.getFullYear(), mesAlvo, dia);

  if (aniversario.getMonth() !== mesAlvo) return "normal";
  if (aniversario.getTime() === dataHoje.getTime()) return "hoje";

  // Permite detectar, por exemplo, 1º de janeiro nos últimos dias de dezembro.
  if (temMes && dataHoje.getMonth() === 11 && mesAlvo === 0) {
    aniversario = new Date(dataHoje.getFullYear() + 1, mesAlvo, dia);
  }

  const diasAte = Math.round((aniversario - dataHoje) / 86400000);
  if (diasAte >= 1 && diasAte <= 3) return "proximo";
  if (
    (!temMes && dia < dataHoje.getDate()) ||
    (temMes && aniversario.getFullYear() === dataHoje.getFullYear() && aniversario < dataHoje)
  ) {
    return "passado";
  }
  return "normal";
}

export function aniversariantesDeHoje(pessoas = [], hoje = new Date()) {
  return pessoas.filter((pessoa) => statusAniversario(pessoa, hoje) === "hoje");
}
