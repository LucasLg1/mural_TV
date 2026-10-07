import { enderecos } from "@/shared/config";
import { enderecoVisivel } from "@/shared/rede";

/**
 * Busca as telas salvas no painel. Sem id, a API devolve o mural ativo
 * alterado por último. Lança erro quando a API recusa ou falha.
 */
export async function buscarLayoutRemoto(muralId, tempoLimiteMs = 10000) {
  if (!enderecos.layout) return null;

  const url = new URL(enderecos.layout, window.location.href);
  if (muralId) url.searchParams.set("mural", String(muralId));
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), tempoLimiteMs);

  try {
    const resposta = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controle.signal,
      cache: "no-store",
    });
    if (!resposta.ok) {
      const erro = new Error(resposta.status === 404 ? "Nenhum mural ativo. Ative um no painel." : `HTTP ${resposta.status}`);
      erro.status = resposta.status;
      throw erro;
    }
    const corpo = ajustarEnderecos(await resposta.json());
    if (!Array.isArray(corpo?.telas) || !corpo.telas.length) throw new Error("O mural ativo não tem telas.");
    const telas = corpo.telas
      .map((tela) => ({
        ...tela,
        id: `tela-${tela.id}`,
        // Notícia vencida ou mídia sem arquivo chega sem conteúdo: na TV o quadro some.
        blocos: (tela.blocos || []).filter((bloco) => {
          if (bloco.tipo === "noticia") return Boolean(bloco.conteudo);
          if (bloco.tipo === "midia") return Boolean(bloco.conteudo?.midia);
          return true;
        }),
      }))
      .filter((tela) => tela.blocos.length);
    if (!telas.length) throw new Error("O mural ativo não tem quadros para exibir.");
    return telas;
  } finally {
    clearTimeout(limite);
  }
}

function ajustarEnderecos(valor) {
  if (typeof valor === "string") return enderecoVisivel(valor, window.location);
  if (Array.isArray(valor)) return valor.map(ajustarEnderecos);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([chave, item]) => [chave, ajustarEnderecos(item)]));
  }
  return valor;
}
