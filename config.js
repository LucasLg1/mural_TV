/*
 * ARQUIVO DE CONTEÚDO DO MURAL
 * Edite apenas os valores abaixo. Para fotos locais, coloque os arquivos
 * dentro de assets/ e informe o caminho, por exemplo: "assets/minha-foto.jpg".
 */
window.MURAL_CONFIG = {
  atualizadoEm: "25/09/2026",

  integracaoApi: {
    ativa: true,
    endpointAniversariantes: "https://api.thalamus.ind.br/api/pessoas/aniversariantes",
    baseImagens: "https://api.thalamus.ind.br/storage/",
    mesAutomatico: true,       // true = usa o mês atual da TV
    mes: 9,                    // usado apenas quando mesAutomatico for false
    atualizarACadaMs: 3600000, // consulta novamente a cada 1 hora
    timeoutMs: 8000,
    usarDadosLocaisComoFallback: true
  },

  timing: {
    overviewDurationMs: 45000,
    detailSlideDurationMs: 45000,
    celebracaoDurationMs: 16000,
    carouselIntervalMs: 5000,
    fadeTransitionMs: 800
  },

  /*
   * QUADRADOS DA TELA PRINCIPAL
   * - A ordem abaixo é a ordem exibida no mural.
   * - Use ativo: false para ocultar um quadrado.
   * - Para trocar um quadrado, altere apenas o seu "tipo".
   *
   * Tipos disponíveis:
   * aniversariantes, tempoDeCasa, valores, cipa, seguranca,
   * calendario, atencao, saude, noticias e agenda.
   */
  quadrados: [
    { tipo: "aniversariantes", ativo: true },
    { tipo: "tempoDeCasa", ativo: true },
    { tipo: "valores", ativo: true },
    { tipo: "cipa", ativo: true },
    { tipo: "seguranca", ativo: true },
    { tipo: "calendario", ativo: true },
    { tipo: "atencao", ativo: true },
    { tipo: "saude", ativo: true },
    { tipo: "noticias", ativo: true },
    { tipo: "agenda", ativo: true }
  ],

  aniversariantes: {
    mesReferencia: "SETEMBRO",
    tituloParabens: "Hoje é aniversário de",
    tituloParabensPlural: "Hoje celebramos os aniversários de",
    mensagemParabens: "Toda a equipe Roboflex deseja um feliz aniversário! 🎂",
    pessoas: [
      { id: 19, nome: "Fábio Henrique Resende Vieira", dia: 5, foto: "pessoa_img/fabioHenrique.jpg" },
      { id: 159, nome: "Anna Carolina Gomes Silva Antônio", dia: 6, foto: "pessoa_img/68a30edbd5541.png" },
      { id: 188, nome: "João Victor Proença de Souza", dia: 6, foto: "pessoa_img/6985f49dd3e6e.png" },
      { id: 139, nome: "Ingrid Rodrigues dos Santos Alves", dia: 7, foto: "pessoa_img/67d03f2daeed2.png" },
      { id: 18, nome: "Fabiano Gomes Chaves", dia: 13, foto: "pessoa_img/fabianoGomes.jpg" },
      { id: 48, nome: "Natalie da Costa Vieira", dia: 13, foto: "pessoa_img/natalieDias.jpg" },
      { id: 204, nome: "Peterson Gabriel da Cruz Costa das Dores", dia: 13, foto: "pessoa_img/69c2bec038472.png" },
      { id: 224, nome: "Guilherme Henrique Durães Ferreira", dia: 17, foto: "pessoa_img/6a5a101a826d0.png" },
      { id: 222, nome: "Ariane Fernandes Pereira", dia: 21, foto: "pessoa_img/6a3198f6a5e5b.png" },
      { id: 216, nome: "Vander Luiz de Araújo Carneiro", dia: 22, foto: "pessoa_img/69fdd38a56778.png" },
      { id: 21, nome: "Fernanda Mozzer Arantes", dia: 28, foto: "pessoa_img/fernandaMozzer.jpg" },
      { id: 74, nome: "Cristiane Mozzer Arantes", dia: 29, foto: "pessoa_img/cristianeMozzer.jpg" }
    ]
  },

  tempoDeCasa: {
    tituloDestaque: "TEMPO",
    subtitulo: "Histórias que crescem junto com a Roboflex.",
    pessoas: [
      { id: 70, nome: "Emerson Mozzer", admissao: "2022-09-01", foto: "pessoa_img/emersonMozzer.jpg" },
      { id: 56, nome: "Raiane de Cassia Baldez Mendes", admissao: "2022-09-01", foto: "pessoa_img/raianeBaldez.jpg" },
      { id: 177, nome: "Reinaldo Antônio de Oliveira", admissao: "2025-09-08", foto: "pessoa_img/6985f773125c1.png" },
      { id: 67, nome: "Alessandro José Ribeiro da Silveira", admissao: "2023-09-15", foto: "pessoa_img/alessandroJose.jpg" },
      { id: 25, nome: "Gabrielle Inez de Freitas", admissao: "2021-09-16", foto: "pessoa_img/gabrielleFreitas.jpg" },
      { id: 47, nome: "Milena Moura dos Reis", admissao: "2021-09-16", foto: "pessoa_img/milenaMoura.jpg" },
      { id: 48, nome: "Natalie da Costa Vieira", admissao: "2022-09-20", foto: "pessoa_img/natalieDias.jpg" }
    ]
  },

  valoresEmpresa: {
    titulo: "RESPEITO E VALORIZAÇÃO ÀS PESSOAS",
    paragrafos: [
      "A Roboflex tem o compromisso de promover um ambiente de trabalho justo, saudável e transparente.",
      "Um de nossos valores fundamentais é o Respeito e valorização às pessoas. Para sustentar esse compromisso, dispomos de uma Política de Conduta Ética, que estabelece diretrizes claras para a convivência e conduta profissional de todos.",
      "Fique atento aos seus direitos e deveres dentro das normas de conduta. Nos ajude a manter um ambiente justo e saudável para todos."
    ],
    qrCodes: [
      { legenda: "Política de Conduta Ética", url: "https://exemplo.com/politica-etica" },
      { legenda: "Canal de Ética", url: "https://exemplo.com/canal-etica" }
    ]
  },

  cipa: {
    titulo: "CIPA 2026/2027",
    // IDs e meses usados para localizar cada integrante na API de aniversariantes.
    integrantesApi: [
      { id: 113, mes: 3 },
      { id: 212, mes: 2 },
      { id: 130, mes: 4 },
      { id: 121, mes: 12 }
    ],
    integrantes: [
      { id: 113, nome: "Nádia Moreira de Albuquerque", foto: "pessoa_img/67d0407eb3563.png" },
      { id: 212, nome: "Felipe Ramon Ferreira Palhares", foto: "pessoa_img/69fdd1f7ef8fc.png" },
      { id: 130, nome: "João Victor Alves Almeida Portela", foto: "pessoa_img/67d03f62c4b4b.png" },
      { id: 121, nome: "Gabriel Felipe da Silva", foto: "pessoa_img/67d03f15636ad.png" }
    ],
    chamada: {
      titulo: "PRECISOU DA CIPA?",
      texto: "FALE COM ELES E PASSE SUAS SUGESTÕES"
    }
  },

  diasSemAcidente: {
    dataBase: "2026-06-10",
    diasManual: null,
    titulo: "Estamos a",
    destaque: "Dias Sem Acidentes",
    mensagem: "Nosso maior compromisso é com a segurança de todos. Vamos continuar assim!"
  },

  calendario: {
    ano: 2026,
    meses: ["Setembro", "Outubro", "Novembro", "Dezembro"],
    marcacoes: [
      { mes: "Setembro", dia: 4, tipo: "pagamento", legenda: "Pagamento de salário" },
      { mes: "Setembro", dia: 7, tipo: "feriado", legenda: "Independência do Brasil" },
      { mes: "Setembro", dia: 18, tipo: "pagamento", legenda: "Adiantamento salarial" },
      { mes: "Outubro", dia: 12, tipo: "feriado", legenda: "Nossa Senhora Aparecida" },
      { mes: "Outubro", dia: 20, tipo: "pagamento", legenda: "Adiantamento salarial" },
      { mes: "Novembro", dia: 2, tipo: "feriado", legenda: "Finados" },
      { mes: "Novembro", dia: 15, tipo: "feriado", legenda: "Proclamação da República" },
      { mes: "Dezembro", dia: 25, tipo: "ferias", legenda: "Natal / Férias coletivas" }
    ],
    legendaRodape: "Confira os pagamentos, feriados e períodos especiais de cada mês."
  },

  atencaoSaida: {
    titulo: "ATENÇÃO",
    texto: "DEPOIS DO EXPEDIENTE, DEIXE O AMBIENTE DA MESMA FORMA COMO ENCONTROU.",
    subtitulo: "SE ATENTE A:",
    itens: [
      { icone: "luz", texto: "DESLIGAR AS LUZES AO SAIR" },
      { icone: "ar-condicionado", texto: "DESLIGAR O AR-CONDICIONADO" },
      { icone: "computador", texto: "DESLIGAR COMPUTADORES E APARELHOS" }
    ]
  },

  campanhaSaude: {
    titulo: "Setembro Amarelo",
    chamada: "CUIDAR DA MENTE É CUIDAR DA VIDA",
    subtitulo: "A importância de acolher, cuidar da saúde mental e valorizar a vida.",
    imagem: "assets/setembro-amarelo.png",
    imagemComoBanner: false,
    listaTitulo: "ESTEJA ATENTO AOS SINAIS",
    sinais: [
      "Tristeza persistente e perda de interesse.",
      "Dores e sintomas físicos difusos.",
      "Falta de energia ou cansaço excessivo.",
      "Alterações no sono ou no apetite.",
      "Isolamento social e dificuldade de conversar.",
      "Sentimento de desesperança ou culpa."
    ],
    alerta: "Falar sobre como você se sente é uma forma de cuidado. Buscar ajuda pode fazer a diferença.",
    telefoneAjuda: "188",
    telefoneLegenda: "CVV · APOIO EMOCIONAL 24 HORAS",
    qrCode: { legenda: "Leia mais no Viver Bem", url: "https://exemplo.com/viver-bem" }
  },

  noticias: [
    {
      tag: "EXPOHOSPITALAR 2026",
      titulo: "Zontec na ExpoHospitalar",
      texto: "Em agosto, participamos da ExpoHospitalar, realizada no Expominas, onde a Zontec, empresa afiliada à Roboflex, apresentou seu trabalho e três soluções voltadas à rastreabilidade por tecnologia RFID.",
      paragrafos: [
        "Em agosto, participamos da ExpoHospitalar, realizada no Expominas, onde a Zontec, empresa afiliada à Roboflex, apresentou seu trabalho e três soluções voltadas à rastreabilidade por tecnologia RFID.",
        "A Roboflex esteve presente dando todo o suporte necessário para a exposição, reforçando a parceria entre as empresas e nossa atuação conjunta no desenvolvimento de soluções para diferentes desafios da operação."
      ],
      // Aceita vídeo (.mp4/.webm/.ogg) ou imagem (.jpg/.png/.webp).
      // Para trocar a mídia exibida, altere somente o caminho abaixo.
      midiaPrincipal: "assets/feira-hospitalar-zontec.mp4",
      fotos: ["assets/expo1.jpg", "assets/expo2.jpg", "assets/expo3.jpg"],
      badges: ["3 soluções apresentadas", "Rastreabilidade por RFID", "Com todo o apoio da Roboflex"]
    },
    {
      tag: "REUNIÃO GERAL",
      titulo: "Roboflex e a Inteligência Artificial",
      texto: "Também tivemos nossa Reunião Geral, na qual demos início a uma nova etapa para a Roboflex: a implementação de agentes de Inteligência Artificial em nossa rotina.",
      paragrafos: [
        "Também tivemos nossa Reunião Geral, na qual demos início a uma nova etapa para a Roboflex: a implementação de agentes de Inteligência Artificial em nossa rotina.",
        "A iniciativa busca incentivar o desenvolvimento de plataformas e ferramentas capazes de agilizar processos internos, otimizar tarefas e tornar nosso dia a dia mais eficiente, utilizando a tecnologia como uma aliada para transformar a forma como trabalhamos."
      ],
      fotos: ["assets/roboflex-ia.png"],
      badges: ["Mais tecnologia, mais eficiência, juntos."]
    }
  ],

  agenda: {
    titulo: "AGENDA",
    ano: 2026,
    subtitulo: "SIPAT",
    periodo: "SEMANA 28/09 A 02/10",
    chamadaRodape: "Fique atento às datas e horários dos temas. A presença será mediante liberação do líder do seu setor.",
    itens: [
      {
        dia: "SEG",
        data: 28,
        titulo: "Abertura da SIPAT e segurança no trabalho",
        palestrante: "Equipe de Segurança",
        local: "Refeitório · 15:30 às 16:00"
      },
      {
        dia: "TER",
        data: 29,
        titulo: "Conscientização sobre os cânceres de mama, colo do útero e próstata",
        palestrante: "Juliana Horta (Enfermeira da Unimed)",
        local: "Refeitório · 15:30 às 16:00"
      },
      {
        dia: "QUA",
        data: 30,
        titulo: "Saúde mental e equilíbrio no trabalho",
        palestrante: "Convidado especial",
        local: "Refeitório · 15:30 às 16:00"
      }
    ]
  },

  marca: {
    nomeRoboflex: "roboflex",
    logoRoboflex: "assets/logo-roboflex.png",
    logoZontec: "assets/logo-zontec.svg"
  }
};
