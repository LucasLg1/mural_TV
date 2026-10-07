/**
 * Gestos de toque do kiosk: arrastar na horizontal, toque simples e toque duplo.
 * Com toque duplo ativo, o toque simples espera "intervaloDuploMs" para ter
 * certeza de que não virá um segundo toque.
 */
export function instalarGestos(alvo, {
  distanciaMinima = 80,
  intervaloDuploMs = 350,
  duploAtivo = true,
  aoArrastar,
  aoTocar,
  aoTocarDuasVezes,
}) {
  const TOLERANCIA_TOQUE_PX = 24;
  const TOLERANCIA_DUPLO_PX = 60;
  let inicio = null;
  let ultimoToque = null;
  let esperaToque = null;

  function aoPressionar(evento) {
    if (evento.isPrimary === false) return;
    inicio = { x: evento.clientX, y: evento.clientY };
  }

  function aoSoltar(evento) {
    if (!inicio || evento.isPrimary === false) return;
    const dx = evento.clientX - inicio.x;
    const dy = evento.clientY - inicio.y;
    inicio = null;

    if (Math.abs(dx) >= distanciaMinima && Math.abs(dx) > Math.abs(dy) * 1.2) {
      cancelarEspera();
      aoArrastar?.(dx < 0 ? 1 : -1);
      return;
    }
    if (Math.hypot(dx, dy) <= TOLERANCIA_TOQUE_PX) toque(evento.clientX, evento.clientY);
  }

  function cancelarEspera() {
    clearTimeout(esperaToque);
    esperaToque = null;
    ultimoToque = null;
  }

  function toque(x, y) {
    if (!duploAtivo) {
      aoTocar?.(x, y);
      return;
    }
    const agora = Date.now();
    if (
      ultimoToque &&
      agora - ultimoToque.momento <= intervaloDuploMs &&
      Math.hypot(x - ultimoToque.x, y - ultimoToque.y) <= TOLERANCIA_DUPLO_PX
    ) {
      cancelarEspera();
      aoTocarDuasVezes?.(x, y);
      return;
    }
    cancelarEspera();
    ultimoToque = { momento: agora, x, y };
    esperaToque = setTimeout(() => {
      esperaToque = null;
      ultimoToque = null;
      aoTocar?.(x, y);
    }, intervaloDuploMs);
  }

  const cancelar = () => { inicio = null; };
  const semMenu = (evento) => evento.preventDefault();

  alvo.addEventListener("pointerdown", aoPressionar);
  alvo.addEventListener("pointerup", aoSoltar);
  alvo.addEventListener("pointercancel", cancelar);
  alvo.addEventListener("contextmenu", semMenu);
  alvo.addEventListener("dragstart", semMenu);

  return () => {
    cancelarEspera();
    alvo.removeEventListener("pointerdown", aoPressionar);
    alvo.removeEventListener("pointerup", aoSoltar);
    alvo.removeEventListener("pointercancel", cancelar);
    alvo.removeEventListener("contextmenu", semMenu);
    alvo.removeEventListener("dragstart", semMenu);
  };
}
