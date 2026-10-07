import { ehVideo } from "./utils";

/**
 * Formato único de notícia para os blocos, venha ela do config.js
 * ({tag, titulo, texto, paragrafos, midiaPrincipal, video, fotos, badges})
 * ou da API do mural ({titulo, texto, midia, midiaTipo}).
 */
export function normalizarNoticia(bruta, tag = "") {
  if (!bruta) return null;

  const texto = String(bruta.texto ?? bruta.descricao ?? "").trim();
  const paragrafos = Array.isArray(bruta.paragrafos) && bruta.paragrafos.length
    ? bruta.paragrafos.filter(Boolean)
    : texto.split(/\n+/).map((linha) => linha.trim()).filter(Boolean);

  const midia = bruta.midia || bruta.midiaPrincipal || bruta.video || bruta.fotos?.[0] || "";
  const video = bruta.midiaTipo ? bruta.midiaTipo === "video" : ehVideo(midia);
  const fotos = video ? [] : [...new Set([midia, ...(bruta.fotos || [])].filter(Boolean))];

  return {
    tag: String(tag || bruta.tag || "").trim(),
    titulo: String(bruta.titulo || "").trim(),
    texto,
    paragrafos,
    midia,
    video,
    fotos,
    badges: Array.isArray(bruta.badges) ? bruta.badges.filter(Boolean) : [],
  };
}
