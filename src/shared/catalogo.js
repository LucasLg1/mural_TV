/**
 * Elementos que o painel oferece. "w"/"h" são o tamanho inicial (em % da tela)
 * ao adicionar; "origem" explica de onde vem o conteúdo.
 * Os tipos precisam existir em App\Support\Mural\MuralLayout::TIPOS no backend.
 */
export const CATALOGO = [
  { tipo: "noticia", rotulo: "Notícia", icone: "📰", w: 40, h: 50, origem: "Notícias do Thalamus: título, texto e imagem ou vídeo à direita." },
  { tipo: "midia", rotulo: "Imagem ou vídeo", icone: "🖼️", w: 40, h: 50, origem: "Só a imagem ou o vídeo, ocupando o quadro inteiro." },
  { tipo: "aniversariantes", rotulo: "Aniversariantes do mês", icone: "🎂", w: 20, h: 50, origem: "Automático, pelo cadastro de pessoas do Thalamus." },
  { tipo: "tempoDeCasa", rotulo: "Tempo de casa", icone: "🏅", w: 20, h: 50, origem: "Automático, pela data de admissão no Thalamus." },
  { tipo: "cipa", rotulo: "CIPA", icone: "🦺", w: 20, h: 50, origem: "Integrantes escolhidos aqui no painel." },
  { tipo: "seguranca", rotulo: "Dias sem acidentes", icone: "🛡️", w: 20, h: 50, origem: "Contagem a partir da data do último acidente, definida neste quadro." },
  { tipo: "valores", rotulo: "Valores e ética", icone: "🤝", w: 20, h: 50, origem: "Textos e QR codes do config.js." },
  { tipo: "calendario", rotulo: "Calendário", icone: "📅", w: 20, h: 50, origem: "Meses e marcações do config.js." },
  { tipo: "atencao", rotulo: "Atenção ao sair", icone: "⚠️", w: 20, h: 50, origem: "Lista de lembretes do config.js." },
  { tipo: "saude", rotulo: "Campanha de saúde", icone: "🎗️", w: 20, h: 50, origem: "Campanha do mês definida no config.js." },
  { tipo: "agenda", rotulo: "Agenda", icone: "🗓️", w: 20, h: 50, origem: "Próximos encontros do config.js." },
];

export const CATALOGO_POR_TIPO = Object.fromEntries(CATALOGO.map((item) => [item.tipo, item]));

export const TAMANHO_MINIMO = 8;
