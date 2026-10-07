/** setTimeout que pode ser pausado e retomado do ponto onde parou. */
export function criarTemporizador() {
  let id = null;
  let acao = null;
  let prazo = 0;
  let restante = 0;

  function limpar() {
    clearTimeout(id);
    id = null;
    acao = null;
    restante = 0;
  }

  function rodar() {
    if (!acao || id) return;
    prazo = Date.now() + restante;
    id = setTimeout(() => {
      const executar = acao;
      id = null;
      acao = null;
      executar();
    }, restante);
  }

  return {
    iniciar(atraso, callback) {
      limpar();
      acao = callback;
      restante = Math.max(0, Number(atraso) || 0);
      if (!document.hidden) rodar();
    },
    pausar() {
      if (!id) return;
      restante = Math.max(0, prazo - Date.now());
      clearTimeout(id);
      id = null;
    },
    retomar: rodar,
    limpar,
  };
}
