import { sso } from "roboflex-thalamus-sso-lib";
import {
  api,
  enriquecerUsuarioComMe,
  getUsuarioContexto,
  registrarInterceptorTenant,
  syncTenantKey,
} from "roboflex-thalamus-request-handler";

let preparado = null;

async function preparar() {
  api.defaults.baseURL = process.env.VUE_APP_ROOT_API;
  registrarInterceptorTenant();
  await enriquecerUsuarioComMe();
  syncTenantKey();
}

const HOST_COM_SESSAO = "localhost.thalamus.ind.br";

/**
 * 127.0.0.1 e localhost não recebem o cookie thalamusSession.
 * O hosts desta máquina já aponta localhost.thalamus.ind.br para cá.
 */
function enderecoNoDominioDaSessao() {
  if (!["localhost", "127.0.0.1"].includes(window.location.hostname)) return "";
  const destino = new URL(window.location.href);
  destino.hostname = HOST_COM_SESSAO;
  return destino.href;
}

/** Mesmo fluxo dos outros frontends do Thalamus: sem sessão, vai para o login do portal. */
export async function exigirSessao() {
  const noDominio = enderecoNoDominioDaSessao();
  if (noDominio) {
    window.location.replace(noDominio);
    return false;
  }
  if (!sso.validarSessao()) {
    window.location.href = process.env.VUE_APP_ROOT_SSO_LOGIN;
    return false;
  }
  preparado ||= preparar().catch((erro) => {
    preparado = null;
    throw erro;
  });
  await preparado;
  return true;
}

export function usuarioLogado() {
  return getUsuarioContexto();
}
