(() => {
  "use strict";

  const config = window.MURAL_CONFIG;
  const app = document.getElementById("app");
  const debugPanel = document.getElementById("debug-panel");
  const queryParams = new URLSearchParams(window.location.search);
  const isDebug = queryParams.get("debug") === "1";
  const debugBirthday = queryParams.get("debugAniversario")?.trim() || "";
  const activeIntervals = new Set();
  const screenTimer = { id: null, callback: null, deadline: 0, remaining: 0 };
  const transitionTimer = { id: null, callback: null, deadline: 0, remaining: 0 };
  let detailIndex = 0;
  let apiRefreshInterval = null;
  const qrImageCache = new Map();
  const qrWarnings = new Set();
  const apiState = {
    status: "aguardando",
    lastUpdate: null,
    message: ""
  };

  if (!config) {
    app.innerHTML = '<div class="screen"><div class="detail-panel card-pad">Não foi possível carregar config.js.</div></div>';
    throw new Error("MURAL_CONFIG não encontrado. Verifique se config.js foi carregado.");
  }

  const performanceMode = config.performanceMode === true;
  document.documentElement.classList.toggle("tv-performance", performanceMode);
  const configuredStarCount = Number(config.performance?.starCount);
  const starCount = Number.isFinite(configuredStarCount)
    ? Math.min(70, Math.max(0, Math.round(configuredStarCount)))
    : 20;

  const timing = {
    overviewDurationMs: Number(config.timing?.overviewDurationMs) || 60000,
    detailSlideDurationMs: Number(config.timing?.detailSlideDurationMs) || 60000,
    celebracaoDurationMs: Number(config.timing?.celebracaoDurationMs) || 20000,
    carouselIntervalMs: Number(config.timing?.carouselIntervalMs) || 5000,
    fadeTransitionMs: performanceMode
      ? Math.min(Number(config.timing?.fadeTransitionMs) || 800, 300)
      : Number(config.timing?.fadeTransitionMs) || 800
  };

  document.documentElement.style.setProperty("--fade-ms", `${timing.fadeTransitionMs}ms`);

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeUrl(value) {
    const url = String(value ?? "").trim();
    return /^(https?:\/\/|assets\/|\.?\/)/i.test(url) ? escapeHtml(url) : "";
  }

  function buildStorageUrl(path) {
    let value = String(path || "").trim();

    if (!value) return "";

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    const base = String(
      config.integracaoApi?.baseImagens || ""
    ).replace(/\/+$/, "");

    value = value.replace(/^\/+/, "");

    // Evita duplicar "storage/"
    if (value.startsWith("storage/")) {
      value = value.substring(8);
    }

    const url = `${base}/${value}`;

    console.log("[MURAL FOTO]", url);

    return url;
  }

  function normalizeApiBirthday(person, month) {
    return {
      id: person.id,
      nome: String(person.nome || "").trim(),
      dia: Number(person.diaAniversario),
      mes: Number(month),
      foto: buildStorageUrl(person.foto),
      setor: person.setor_nome || "",
      cargo: person.cargo_nome || ""
    };
  }

  function normalizeApiWorkAnniversary(person) {
    return {
      id: person.id,
      nome: String(person.nome || "").trim(),
      admissao: person.dtAdmissao || "",
      anos: person.dtAdmissao ? undefined : Number(person.tempo),
      foto: buildStorageUrl(person.foto),
      setor: person.setor_nome || "",
      cargo: person.cargo_nome || ""
    };
  }

  function getApiMonth() {
    const apiConfig = config.integracaoApi || {};
    return apiConfig.mesAutomatico
      ? new Date().getMonth() + 1
      : Math.min(12, Math.max(1, Number(apiConfig.mes) || 1));
  }

  async function loadCipaFromBirthdayApi(apiConfig) {
    const members = config.cipa?.integrantesApi;
    if (!Array.isArray(members) || !members.length) return false;

    const months = [...new Set(members.map((item) => Number(item.mes)).filter((month) => month >= 1 && month <= 12))];
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Math.max(1000, Number(apiConfig.timeoutMs) || 8000)
    );

    try {
      const payloads = await Promise.all(months.map(async (month) => {
        const url = new URL(apiConfig.endpointAniversariantes);
        url.searchParams.set("mes", String(month));
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`CIPA: HTTP ${response.status}`);
        return response.json();
      }));

      const peopleById = new Map(
        payloads
          .flatMap((payload) => payload?.aniversariantes || [])
          .map((person) => [Number(person.id), person])
      );

      config.cipa.integrantes = members.map((member) => {
        const person = peopleById.get(Number(member.id));
        if (!person) return null;
        return {
          id: person.id,
          nome: String(person.nome || "").trim(),
          foto: buildStorageUrl(person.foto),
          setor: person.setor_nome || "",
          cargo: person.cargo_nome || ""
        };
      }).filter((person) => person?.nome);
      return true;
    } catch (error) {
      console.warn(`Não foi possível atualizar a CIPA pela API (${error.message}).`);
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function loadPeopleFromApi() {
    const apiConfig = config.integracaoApi || {};
    if (!apiConfig.ativa || !apiConfig.endpointAniversariantes) return false;

    const month = getApiMonth();
    const url = new URL(apiConfig.endpointAniversariantes);
    url.searchParams.set("mes", String(month));
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Math.max(1000, Number(apiConfig.timeoutMs) || 8000)
    );

    apiState.status = "carregando";
    apiState.message = `mês ${month}`;
    setupDebugPanel();

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json();
      if (!payload || !Array.isArray(payload.aniversariantes)) {
        throw new Error("Formato de resposta inválido");
      }

      const responseMonth = Number(payload.mes) || month;
      config.aniversariantes.pessoas = payload.aniversariantes
        .map((person) => normalizeApiBirthday(person, responseMonth))
        .filter((person) => person.nome && Number.isInteger(person.dia));

      if (Array.isArray(payload.tempoCasa)) {
        config.tempoDeCasa.pessoas = payload.tempoCasa
          .map(normalizeApiWorkAnniversary)
          .filter((person) => person.nome);
      }

      await loadCipaFromBirthdayApi(apiConfig);

      const referenceMonth = monthNames[responseMonth - 1];
      if (referenceMonth) config.aniversariantes.mesReferencia = referenceMonth.toUpperCase();

      apiState.status = "conectado";
      apiState.lastUpdate = new Date();
      apiState.message = `${config.aniversariantes.pessoas.length} aniversariantes`;
      refreshScreenAfterApiUpdate();
      return true;
    } catch (error) {
      apiState.status = "erro";
      apiState.message = error.name === "AbortError" ? "tempo limite excedido" : error.message;
      if (!apiState.lastUpdate) {
        config.aniversariantes.pessoas = [];
        config.tempoDeCasa.pessoas = [];
        config.cipa.integrantes = [];
        refreshScreenAfterApiUpdate();
      }
      console.warn(`Não foi possível atualizar os dados da API (${apiState.message}).`);
      return false;
    } finally {
      clearTimeout(timeout);
      setupDebugPanel();
    }
  }

  function refreshScreenAfterApiUpdate() {
    if (app.querySelector(".overview-screen")) {
      const replacements = [
        [".birthday-card", () => birthdayCard()],
        [".work-card", () => workCard()],
        [".cipa-card", cipaCard]
      ];
      replacements.forEach(([selector, render]) => {
        app.querySelectorAll(selector).forEach((card) => {
          card.outerHTML = render();
        });
      });
      return;
    }
    if (app.querySelector(".celebration-screen")) {
      const birthdaysToday = getActiveBirthdays();
      if (birthdaysToday.length) renderBirthdayCelebration(birthdaysToday);
    }
  }

  function initials(name) {
    return String(name || "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase();
  }

  function fallbackImage(name) {
    const label = escapeHtml(initials(name));
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#1689df"/><stop offset="1" stop-color="#07305d"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial" font-size="72" font-weight="700">${label}</text></svg>`
    )}`;
  }

  window.handleImageError = (image, label) => {
    image.onerror = null;
    image.src = fallbackImage(label);
  };

  function imageTag(src, alt, className = "") {
    const source = /^pessoa_img\//i.test(String(src || ""))
      ? buildStorageUrl(src)
      : src;
    return `<img class="${escapeHtml(className)}" src="${safeUrl(source) || fallbackImage(alt)}" alt="${escapeHtml(alt)}" decoding="async" onerror="handleImageError(this, '${escapeHtml(String(alt).replaceAll("'", ""))}')">`;
  }

  function videoTag(src, label, className = "") {
    const source = safeUrl(src);
    if (!source) return "";
    const extension = String(src).match(/\.([a-z0-9]+)(?:[?#].*)?$/i)?.[1]?.toLowerCase();
    const mimeTypes = { mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", ogg: "video/ogg", mov: "video/quicktime" };
    const type = mimeTypes[extension] || "video/mp4";
    return `<video class="${escapeHtml(className)}" autoplay muted loop playsinline webkit-playsinline preload="metadata" disablepictureinpicture aria-label="${escapeHtml(label)}"><source src="${source}" type="${type}"></video>`;
  }

  function getPrimaryMedia(news) {
    return news?.midiaPrincipal || news?.video || news?.fotos?.[0] || "";
  }

  function isVideoMedia(src) {
    return /\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i.test(String(src || ""));
  }

  function primaryMediaTag(news, className) {
    const media = getPrimaryMedia(news);
    return isVideoMedia(media)
      ? videoTag(media, news?.titulo, className)
      : imageTag(media, news?.titulo, className);
  }

  function getNewsPhotos(news) {
    const primary = getPrimaryMedia(news);
    const photos = [...(news?.fotos || [])];
    if (primary && !isVideoMedia(primary) && !photos.includes(primary)) photos.unshift(primary);
    return photos;
  }

  function logoMarkup(src, label, className = "brand-logo") {
    return src
      ? imageTag(src, label, className)
      : `<span class="brand-text">${escapeHtml(label)}</span>`;
  }

  function getSortedBirthdays() {
    return [...(config.aniversariantes?.pessoas || [])].sort((a, b) => Number(a.dia) - Number(b.dia));
  }

  /**
   * Função pura: classifica uma pessoa em relação à data informada.
   * Quando "mes" não existe, considera a lista como pertencente ao mês atual.
   */
  function getStatusAniversario(pessoa, hoje = new Date()) {
    const day = Number(pessoa?.dia);
    const explicitMonth = Number(pessoa?.mes);
    const hasExplicitMonth = Number.isInteger(explicitMonth) && explicitMonth >= 1 && explicitMonth <= 12;
    if (!Number.isInteger(day) || day < 1 || day > 31 || !(hoje instanceof Date) || Number.isNaN(hoje.getTime())) {
      return "normal";
    }

    const today = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const targetMonth = hasExplicitMonth ? explicitMonth - 1 : today.getMonth();
    let birthday = new Date(today.getFullYear(), targetMonth, day);

    if (birthday.getMonth() !== targetMonth) return "normal";
    if (birthday.getTime() === today.getTime()) return "hoje";

    // Permite detectar, por exemplo, 1º de janeiro nos últimos dias de dezembro.
    if (hasExplicitMonth && today.getMonth() === 11 && targetMonth === 0) {
      birthday = new Date(today.getFullYear() + 1, targetMonth, day);
    }

    const daysUntil = Math.round((birthday - today) / 86400000);
    if (daysUntil >= 1 && daysUntil <= 3) return "proximo";
    if (
      (!hasExplicitMonth && day < today.getDate()) ||
      (hasExplicitMonth && birthday.getFullYear() === today.getFullYear() && birthday < today)
    ) {
      return "passado";
    }
    return "normal";
  }

  function getAniversariantesDeHoje(muralConfig, hoje = new Date()) {
    return (muralConfig?.aniversariantes?.pessoas || [])
      .filter((pessoa) => getStatusAniversario(pessoa, hoje) === "hoje");
  }

  // Expostas para testes manuais/automatizados no console do navegador.
  window.getStatusAniversario = getStatusAniversario;
  window.getAniversariantesDeHoje = getAniversariantesDeHoje;

  function matchesDebugBirthday(person) {
    if (!debugBirthday) return false;
    const search = normalize(debugBirthday);
    return normalize(person.nome).includes(search) || String(person.dia) === search;
  }

  function getBirthdayStatus(person, today = new Date()) {
    if (matchesDebugBirthday(person)) return "hoje";
    return getStatusAniversario(person, today);
  }

  function getActiveBirthdays(today = new Date()) {
    const birthdaysToday = getAniversariantesDeHoje(config, today);
    if (!debugBirthday) return birthdaysToday;
    const simulated = (config.aniversariantes?.pessoas || []).filter(matchesDebugBirthday);
    return simulated.length ? simulated : birthdaysToday;
  }

  function yearsAtCompany(person) {
    if (Number.isFinite(Number(person.anos))) return Number(person.anos);
    if (!person.admissao) return 0;
    const admission = new Date(`${person.admissao}T12:00:00`);
    const today = new Date();
    if (Number.isNaN(admission.getTime())) return 0;
    // O ano completa no mês da admissão, em qualquer dia desse mês.
    let years = today.getFullYear() - admission.getFullYear();
    if (today.getMonth() < admission.getMonth()) years -= 1;
    return Math.max(0, years);
  }

  function accidentFreeDays() {
    const data = config.diasSemAcidente || {};
    if (!data.dataBase) return Math.max(0, Number(data.diasManual) || 0);
    const base = new Date(`${data.dataBase}T00:00:00`);
    if (Number.isNaN(base.getTime())) return Math.max(0, Number(data.diasManual) || 0);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(0, Math.floor((today - base) / 86400000));
  }

  function renderPeople(people, detail, valueFn, options = {}) {
    return people.map((person, index) => {
      const secondary = valueFn(person);
      const birthdayStatus = options.birthdays ? getBirthdayStatus(person) : "";
      const personClasses = options.birthdays
        ? `birthday-person status-${birthdayStatus}`
        : "";
      const animationStyle = options.birthdays ? `style="--stagger:${index * 70}ms"` : "";
      const avatar = imageTag(person.foto, person.nome, "avatar");
      return `
        <div class="person ${personClasses}" ${animationStyle}>
          ${options.birthdays ? `
            <div class="avatar-wrap">
              ${avatar}
              ${birthdayStatus === "hoje" ? '<span class="birthday-float" aria-label="Aniversário hoje">🎈</span>' : ""}
              ${birthdayStatus === "proximo" ? '<span class="birthday-soon" aria-label="Aniversário próximo"></span>' : ""}
            </div>` : avatar}
          <strong title="${escapeHtml(person.nome)}">${escapeHtml(person.nome)}</strong>
          <small>${escapeHtml(secondary)}</small>
        </div>`;
    }).join("");
  }

  function createCardConfettiMarkup(amount = 18) {
    const colors = ["#ffd447", "#ff6b6b", "#41c7a2", "#42a5f5", "#a86ae3", "#f28c28"];
    return Array.from({ length: amount }, (_, index) => {
      const left = (index * 37) % 101;
      const duration = 4.8 + ((index * 11) % 30) / 10;
      const delay = -((index * 23) % 70) / 10;
      const rotation = 240 + ((index * 43) % 480);
      const drift = ((index * 17) % 9) - 4;
      return `<i class="card-confetti-piece" style="--x:${left}%;--duration:${duration}s;--delay:${delay}s;--rotate:${rotation}deg;--drift:${drift}vw;--color:${colors[index % colors.length]}"></i>`;
    }).join("");
  }

  function birthdayCard(detail = false) {
    const data = config.aniversariantes || {};
    const birthdaysToday = getActiveBirthdays();
    return `
      <section class="card card-pad birthday-card ${detail ? "large-card" : ""} ${birthdaysToday.length ? "has-birthday-today" : ""}" data-birthdays-today="${birthdaysToday.length}">
        <div class="card-confetti" aria-hidden="true">${createCardConfettiMarkup(detail ? 18 : 10)}</div>
        <div class="eyebrow">${escapeHtml(data.mesReferencia || "")}</div>
        <h2 class="card-title">Aniversariantes <span>do Mês</span></h2>
        <div class="people-grid">
          ${renderPeople(getSortedBirthdays(), detail, (person) => `Dia ${person.dia}`, { birthdays: true })}
        </div>
      </section>`;
  }

  function workCard(detail = false) {
    const data = config.tempoDeCasa || {};
    const people = data.pessoas || [];
    return `
      <section class="card card-pad work-card ${detail ? "large-card" : ""}">
        <div class="card-confetti" aria-hidden="true">${createCardConfettiMarkup(detail ? 18 : 10)}</div>
        <h2 class="card-title">${escapeHtml(data.tituloDestaque || "TEMPO")} <span>DE CASA</span></h2>
        <p class="subtitle">${escapeHtml(data.subtitulo || "")}</p>
        <div class="people-grid">
          ${renderPeople(people, detail, (person) => {
            const years = yearsAtCompany(person);
            return `${years} ${years === 1 ? "ano" : "anos"}`;
          })}
        </div>
        <span class="month-watermark">${escapeHtml(config.aniversariantes?.mesReferencia || "")}</span>
        <span class="cake-mark" aria-hidden="true">🎂</span>
      </section>`;
  }

  function valuesCard() {
    const data = config.valoresEmpresa || {};
    return `
      <section class="card values-card">
        <header class="colored-header">
          <span class="header-icon" aria-hidden="true">🤝</span>
          <h2>${escapeHtml(data.titulo || "")}</h2>
        </header>
        <div class="values-body">
          ${(data.paragrafos || []).map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
          <div class="qr-row">${renderQrItems(data.qrCodes || [])}</div>
          ${data.pesquisa ? `
            <div class="values-survey">
              <p>${escapeHtml(data.pesquisa.texto || "")}</p>
              <img src="${safeUrl(data.pesquisa.qrCodeImagem)}" alt="QR Code da pesquisa para colaboradores">
              <strong>${escapeHtml(data.pesquisa.legenda || "")}</strong>
            </div>` : ""}
        </div>
      </section>`;
  }

  function renderQrItems(items) {
    return items.map((item) => {
      const url = safeUrl(item.url);
      const label = escapeHtml(item.legenda || "conteúdo");
      return `
        <div class="qr-item">
          <a class="qr-link" href="${url}" target="_blank" rel="noopener" aria-label="Abrir ${label}">
            <span class="qr-box" data-qr="${url}">
              <span class="qr-fallback">ABRIR</span>
            </span>
          </a>
          <span>${label}</span>
        </div>`;
    }).join("");
  }

  function cipaCard() {
    const data = config.cipa || {};
    return `
      <section class="card cipa-card">
        <header class="colored-header green">
          <span class="header-icon" aria-hidden="true">🦺</span>
          <h2>${escapeHtml(data.titulo || "")}</h2>
        </header>
        <div class="cipa-body">
          <div class="eyebrow">INTEGRANTES</div>
          <div class="cipa-grid">
            ${renderPeople(data.integrantes || [], false, () => "")}
          </div>
        </div>
        <div class="cipa-callout">
          <strong>${escapeHtml(data.chamada?.titulo || "")}</strong>
          <span>${escapeHtml(data.chamada?.texto || "")}</span>
        </div>
      </section>`;
  }

  function safetyCard() {
    const data = config.diasSemAcidente || {};
    const days = accidentFreeDays();
    return `
      <section class="card safety-card">
        <div class="safety-top">${escapeHtml(data.titulo || "")}</div>
        <div class="safety-number" data-safety-number="${days}">${days}</div>
        <div class="safety-label">${escapeHtml(data.destaque || "")}</div>
        <p>${escapeHtml(data.mensagem || "")}</p>
        <div class="safety-seals">
          <div class="safety-seal"><b>🛡️</b><span>SEGURANÇA<br>EM 1º LUGAR</span></div>
          <div class="safety-seal"><b>⛑️</b><span>${days}<br>DIAS</span></div>
        </div>
      </section>`;
  }

  const monthNames = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function getCurrentDateLabel() {
    return new Intl.DateTimeFormat("pt-BR").format(new Date());
  }

  function monthIndex(month) {
    return monthNames.findIndex((name) => normalize(name) === normalize(month));
  }

  function miniCalendar(month) {
    const data = config.calendario || {};
    const index = monthIndex(month);
    if (index < 0) return "";
    const year = Number(data.ano) || new Date().getFullYear();
    const firstWeekday = new Date(year, index, 1).getDay();
    const totalDays = new Date(year, index + 1, 0).getDate();
    const marks = (data.marcacoes || []).filter((item) => normalize(item.mes) === normalize(month));
    const markByDay = new Map(marks.map((item) => [Number(item.dia), item]));
    let cells = "<span></span>".repeat(firstWeekday);
    for (let day = 1; day <= totalDays; day += 1) {
      const mark = markByDay.get(day);
      cells += `<span class="${escapeHtml(mark?.tipo || "")}" title="${escapeHtml(mark?.legenda || "")}">${day}</span>`;
    }
    return `
      <div class="mini-calendar">
        <h3>${escapeHtml(month)}</h3>
        <div class="weekdays">${["D","S","T","Q","Q","S","S"].map((day) => `<span>${day}</span>`).join("")}</div>
        <div class="month-days">${cells}</div>
        <p class="month-note">${escapeHtml(marks.map((mark) => `${mark.dia}: ${mark.legenda}`).join(" · ") || "Sem marcações")}</p>
      </div>`;
  }

  function calendarCard() {
    const data = config.calendario || {};
    return `
      <section class="card calendar-card">
        <div class="brand-mini">
          ${logoMarkup(config.marca?.logoRoboflex, "ROBOFLEX")}
          <span class="calendar-year">${escapeHtml(data.ano)}</span>
        </div>
        <div class="calendar-grid">${(data.meses || []).map(miniCalendar).join("")}</div>
        <div class="calendar-footer">${escapeHtml(data.legendaRodape || "")}</div>
      </section>`;
  }

  const attentionIcons = {
    luz: "💡",
    "ar-condicionado": "❄️",
    computador: "🖥️"
  };

  function attentionCard() {
    const data = config.atencaoSaida || {};
    return `
      <section class="card attention-card">
        <header class="colored-header yellow">
          <span class="header-icon" aria-hidden="true">⚠️</span>
          <h2>${escapeHtml(data.titulo || "")}</h2>
        </header>
        <div class="attention-body">
          <p>${escapeHtml(data.texto || "")}</p>
          <div class="eyebrow">${escapeHtml(data.subtitulo || "")}</div>
          <div class="attention-list">
            ${(data.itens || []).map((item) => `
              <div class="attention-item">
                <span class="attention-icon" aria-hidden="true">${attentionIcons[item.icone] || "✓"}</span>
                <strong>${escapeHtml(item.texto)}</strong>
              </div>`).join("")}
          </div>
        </div>
      </section>`;
  }

  function healthCard() {
    const data = config.campanhaSaude || {};
    const cover = safeUrl(data.imagem);
    const coverAsBanner = cover && data.imagemComoBanner !== false;
    return `
      <section class="card health-card">
        <div class="health-hero ${coverAsBanner ? "health-hero-has-image" : ""}">
          ${coverAsBanner ? `<img class="health-hero-image" src="${cover}" alt="${escapeHtml(data.titulo || "Setembro Amarelo")}" onerror="this.parentElement.classList.remove('health-hero-has-image');this.remove()">` : ""}
          <div class="health-photo">
            ${cover ? `<img class="health-cover" src="${cover}" alt="" onerror="this.remove()">` : '<span class="health-photo-fallback" aria-hidden="true"></span>'}
          </div>
          <div class="health-hero-title">
            <span class="health-brand"><b aria-hidden="true">🎗</b>${escapeHtml(data.chamada || "")}</span>
            <h2>${escapeHtml(data.titulo || "")}</h2>
          </div>
        </div>
        <div class="health-body">
          <p class="health-intro">${escapeHtml(data.subtitulo || "")}</p>
          <div class="health-signs-wrap">
            <h3><span aria-hidden="true">✓</span>${escapeHtml(data.listaTitulo || "")}</h3>
            <ul class="health-signs">
              ${(data.sinais || []).map((signal) => `<li><i aria-hidden="true"></i><span>${escapeHtml(signal)}</span></li>`).join("")}
            </ul>
          </div>
          <div class="health-alert">
            <b aria-hidden="true">!</b>
            <p>${escapeHtml(data.alerta || "Falar sobre como você se sente é uma forma de cuidado. Buscar ajuda pode fazer a diferença.")}</p>
          </div>
          <aside class="health-actions">
            <div class="health-qr">${renderQrItems(data.qrCode ? [data.qrCode] : [])}</div>
            <div class="help-line">
              <span>${escapeHtml(data.telefoneLegenda || "")}</span>
              <div><i aria-hidden="true">☎</i><b>${escapeHtml(data.telefoneAjuda || "")}</b></div>
            </div>
          </aside>
        </div>
      </section>`;
  }

  function newsCard() {
    return `
      <section class="card news-card">
        ${(config.noticias || []).slice(0, 2).map((news) => `
          <article class="news-mini">
            <div>
              <span class="tag">${escapeHtml(news.tag || "")}</span>
              <h2>${escapeHtml(news.titulo || "")}</h2>
              <p>${escapeHtml(news.texto || "")}</p>
            </div>
            ${primaryMediaTag(news, `news-thumb ${isVideoMedia(getPrimaryMedia(news)) ? "news-video" : ""}`)}
          </article>`).join("")}
      </section>`;
  }

  function agendaCard() {
    const data = config.agenda || {};
    return `
      <section class="card agenda-card">
        <div class="agenda-head">
          <div class="agenda-title">
            <h2>${escapeHtml(data.titulo || "")}</h2>
            <strong>${escapeHtml(data.subtitulo || "")}</strong>
          </div>
          <div class="agenda-year">
            <b>${escapeHtml(data.ano || "")}</b>
            <span>${escapeHtml(data.periodo || "")}</span>
          </div>
        </div>
        <div class="agenda-list">
          ${(data.itens || []).map((item) => `
            <div class="agenda-item">
              <div class="date-badge">
                <span>${escapeHtml(item.dia)}</span>
                <i aria-hidden="true">▣</i>
                <b>${escapeHtml(item.data)}</b>
              </div>
              <div class="agenda-copy">
                <strong>${escapeHtml(item.titulo)}</strong>
                <span><b>Palestrante:</b> ${escapeHtml(item.palestrante)}</span>
                <span>${escapeHtml(item.local)}</span>
              </div>
            </div>`).join("")}
        </div>
        <footer class="agenda-footer">
          <span class="agenda-health" aria-hidden="true">✚</span>
          <p>${escapeHtml(data.chamadaRodape || "")}</p>
          <div class="agenda-footer-brand">${escapeHtml(config.marca?.nomeRoboflex || "")}</div>
        </footer>
      </section>`;
  }

  function renderOverview() {
    const cardRenderers = {
      aniversariantes: () => birthdayCard(),
      tempoDeCasa: () => workCard(),
      valores: valuesCard,
      cipa: cipaCard,
      seguranca: safetyCard,
      calendario: calendarCard,
      atencao: attentionCard,
      saude: healthCard,
      noticias: newsCard,
      agenda: agendaCard
    };
    const defaultCards = Object.keys(cardRenderers).map((tipo) => ({ tipo, ativo: true }));
    const configuredCards = Array.isArray(config.quadrados) ? config.quadrados : defaultCards;
    const cardsMarkup = configuredCards
      .filter((item) => item?.ativo !== false)
      .map((item) => cardRenderers[item?.tipo]?.() || "")
      .join("");

    app.innerHTML = `
      <section class="screen overview-screen">
        <div class="overview-grid">
          ${cardsMarkup}
        </div>
        <div class="updated-at">Atualizado dia ${escapeHtml(getCurrentDateLabel())}</div>
      </section>`;
    hydrateQrCodes();
    updatePlaybackForVisibility();
  }

  function createConfettiMarkup(amount = 32) {
    const colors = ["#ffd447", "#ff6b6b", "#41c7a2", "#42a5f5", "#a86ae3", "#ffffff"];
    return Array.from({ length: amount }, (_, index) => {
      const left = ((index * 37) % 101) + ((index % 3) * 0.17);
      const duration = 5.5 + ((index * 13) % 42) / 10;
      const delay = -((index * 29) % 90) / 10;
      const rotation = 240 + ((index * 47) % 520);
      const color = colors[index % colors.length];
      const shape = index % 4 === 0 ? "circle" : index % 5 === 0 ? "ribbon" : "square";
      return `<i class="confetti confetti-${shape}" style="--confetti-x:${left}vw;--confetti-duration:${duration}s;--confetti-delay:${delay}s;--confetti-rotate:${rotation}deg;--confetti-color:${color}"></i>`;
    }).join("");
  }

  function renderBirthdayCelebration(people = getActiveBirthdays()) {
    if (!people.length) {
      renderOverview();
      return;
    }
    const birthdayData = config.aniversariantes || {};
    const names = people.map((person) => person.nome).join(", ");
    const titlePrefix = people.length > 1
      ? birthdayData.tituloParabensPlural
      : birthdayData.tituloParabens;

    app.innerHTML = `
      <section class="screen celebration-screen">
        <div class="confetti-layer" aria-hidden="true">${createConfettiMarkup()}</div>
        <div class="celebration-glow" aria-hidden="true"></div>
        <div class="celebration-content">
          <div class="celebration-kicker">🎉</div>
          <h1>${escapeHtml(titlePrefix || "")}<br><span>${escapeHtml(names)}!</span></h1>
          <div class="celebration-people">
            ${people.map((person, index) => `
              <article class="celebration-person" style="--stagger:${index * 130}ms">
                <div class="celebration-avatar-wrap">
                  ${imageTag(person.foto, person.nome, "celebration-avatar")}
                  <span aria-hidden="true">👑</span>
                </div>
                <h2>${escapeHtml(person.nome)}</h2>
              </article>`).join("")}
          </div>
          <p>${escapeHtml(birthdayData.mensagemParabens || "")}</p>
        </div>
      </section>`;
  }

  function detailHeader(title, subtitle, index) {
    return `
      <header class="detail-header">
        <div>${logoMarkup(config.marca?.logoRoboflex, "ROBOFLEX", "detail-brand")}</div>
        <div class="detail-header-copy">
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <div class="detail-slide-index">${index + 1} / ${DETAIL_SLIDES.length}</div>
      </header>`;
  }

  function renderEventsDetail() {
    const newsItems = config.noticias || [];
    return `
      <div class="detail-columns two">
        ${newsItems.slice(0, 2).map((news, newsIndex) => `
          <article class="detail-panel event-panel event-panel-${newsIndex + 1}">
            <span class="event-tag">${escapeHtml(news.tag || "")}</span>
            <h2>${escapeHtml(news.titulo || "")}</h2>
            <div class="event-description">
              ${(news.paragrafos || [news.texto]).filter(Boolean).map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
            </div>
            <div class="carousel" data-carousel="${newsIndex}">
              ${isVideoMedia(getPrimaryMedia(news))
                ? videoTag(getPrimaryMedia(news), news.titulo, "event-video")
                : getNewsPhotos(news).map((photo, photoIndex) =>
                    imageTag(photo, `${news.titulo} ${photoIndex + 1}`, `carousel-image ${photoIndex === 0 ? "active" : ""}`)
                  ).join("")}
            </div>
            <div class="event-badges">${(news.badges || []).map((badge) => `<span class="event-badge">${escapeHtml(badge)}</span>`).join("")}</div>
          </article>`).join("")}
      </div>`;
  }

  function renderPeopleDetail() {
    return `<div class="detail-columns two"><div class="detail-panel">${birthdayCard(true)}</div><div class="detail-panel">${workCard(true)}</div></div>`;
  }

  function renderResourcesDetail() {
    return `<div class="detail-columns three"><div class="detail-panel">${cipaCard()}</div><div class="detail-panel">${healthCard()}</div><div class="detail-panel">${agendaCard()}</div></div>`;
  }

  // Para criar outro slide, adicione um item neste array com título, subtítulo e render().
  const DETAIL_SLIDES = [
    {
      id: "acontecimentos",
      title: "ACONTECIMENTOS",
      subtitle: "Conquistas, tecnologia e momentos que movimentam a Roboflex",
      render: renderEventsDetail
    },
    {
      id: "pessoas",
      title: "NOSSAS PESSOAS",
      subtitle: "Celebrando histórias, aniversários e trajetórias",
      render: renderPeopleDetail
    },
    {
      id: "recursos",
      title: "INFORMAÇÕES",
      subtitle: "Saúde, segurança e próximos encontros",
      render: renderResourcesDetail
    }
  ];

  function renderDetailSlide(slide, index) {
    app.innerHTML = `
      <section class="screen detail-screen" data-slide="${escapeHtml(slide.id)}">
        ${detailHeader(slide.title, slide.subtitle, index)}
        <div class="detail-body">${slide.render()}</div>
      </section>`;
    hydrateQrCodes();
    startVisibleCarousels();
    updatePlaybackForVisibility();
  }

  function hydrateQrCodes() {
    document.querySelectorAll(".qr-box[data-qr]").forEach((box) => {
      const url = box.dataset.qr;
      if (box.dataset.qrState || !url) return;

      const warnOnce = (key, message, error) => {
        if (qrWarnings.has(key)) return;
        qrWarnings.add(key);
        console.warn(`[MURAL QR] ${message}${error?.message ? ` (${error.message})` : ""}`);
      };

      const showCachedImage = (dataUrl) => {
        const image = document.createElement("img");
        image.className = "qr-generated";
        image.src = dataUrl;
        image.alt = "";
        image.setAttribute("aria-hidden", "true");
        while (box.firstChild) box.removeChild(box.firstChild);
        box.appendChild(image);
        box.dataset.qrState = "ready";
      };

      const cachedImage = qrImageCache.get(url);
      if (cachedImage) {
        showCachedImage(cachedImage);
        return;
      }

      if (typeof window.QRCode !== "function") {
        box.dataset.qrState = "fallback";
        warnOnce("library", "Biblioteca local indisponível; mantendo o link de fallback.");
        return;
      }

      try {
        const staging = document.createElement("span");
        new window.QRCode(staging, {
          text: url,
          width: 160,
          height: 160,
          colorDark: "#071b2c",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.M
        });

        const canvas = staging.querySelector("canvas");
        if (canvas && typeof canvas.toDataURL === "function") {
          const dataUrl = canvas.toDataURL("image/png");
          qrImageCache.set(url, dataUrl);
          showCachedImage(dataUrl);
          return;
        }

        if (!staging.firstChild) throw new Error("nenhum elemento foi gerado");
        while (box.firstChild) box.removeChild(box.firstChild);
        while (staging.firstChild) box.appendChild(staging.firstChild);
        box.dataset.qrState = "ready";
      } catch (error) {
        box.dataset.qrState = "fallback";
        warnOnce("generation", "Não foi possível gerar um QR code; mantendo o link de fallback.", error);
      }
    });
  }

  function clearManagedTimer(timer) {
    if (timer.id) clearTimeout(timer.id);
    timer.id = null;
    timer.callback = null;
    timer.deadline = 0;
    timer.remaining = 0;
  }

  function startManagedTimer(timer) {
    if (!timer.callback || timer.id || document.hidden) return;
    timer.deadline = Date.now() + timer.remaining;
    timer.id = setTimeout(() => {
      const callback = timer.callback;
      timer.id = null;
      timer.callback = null;
      timer.deadline = 0;
      timer.remaining = 0;
      callback();
    }, timer.remaining);
  }

  function scheduleManagedTimer(timer, callback, delay) {
    clearManagedTimer(timer);
    timer.callback = callback;
    timer.remaining = Math.max(0, Number(delay) || 0);
    startManagedTimer(timer);
  }

  function pauseManagedTimer(timer) {
    if (!timer.id) return;
    timer.remaining = Math.max(0, timer.deadline - Date.now());
    clearTimeout(timer.id);
    timer.id = null;
    timer.deadline = 0;
  }

  function clearCarouselTimers() {
    activeIntervals.forEach((interval) => clearInterval(interval));
    activeIntervals.clear();
    document.querySelectorAll("[data-carousel-running]").forEach((carousel) => {
      carousel.removeAttribute("data-carousel-running");
    });
  }

  function clearRuntimeTimers() {
    clearCarouselTimers();
    clearManagedTimer(screenTimer);
    clearManagedTimer(transitionTimer);
  }

  function startCarousel(container) {
    const images = [...container.querySelectorAll(".carousel-image")];
    if (document.hidden || images.length < 2 || container.dataset.carouselRunning === "true") return;
    let current = Math.max(0, images.findIndex((image) => image.classList.contains("active")));
    let changing = false;
    container.dataset.carouselRunning = "true";
    const interval = setInterval(async () => {
      if (changing) return;
      changing = true;
      const next = (current + 1) % images.length;
      try {
        if (typeof images[next].decode === "function") await images[next].decode();
      } catch {
        // A imagem ainda pode ser exibida normalmente pelo navegador.
      } finally {
        if (
          !document.hidden &&
          container.isConnected &&
          container.dataset.carouselRunning === "true"
        ) {
          images[current].classList.remove("active");
          current = next;
          images[current].classList.add("active");
        }
        changing = false;
      }
    }, timing.carouselIntervalMs);
    activeIntervals.add(interval);
  }

  function startVisibleCarousels() {
    if (document.hidden) return;
    document.querySelectorAll(".carousel").forEach(startCarousel);
  }

  function transitionTo(renderFn, afterTransition) {
    clearManagedTimer(screenTimer);
    clearManagedTimer(transitionTimer);
    app.classList.add("is-fading");
    scheduleManagedTimer(transitionTimer, () => {
      clearCarouselTimers();
      renderFn();
      requestAnimationFrame(() => requestAnimationFrame(() => app.classList.remove("is-fading")));
      afterTransition?.();
    }, timing.fadeTransitionMs);
  }

  function scheduleOverviewEnd() {
    scheduleManagedTimer(screenTimer, () => {
      detailIndex = 0;
      const birthdaysToday = getActiveBirthdays();
      if (birthdaysToday.length) {
        transitionTo(
          () => renderBirthdayCelebration(birthdaysToday),
          scheduleCelebrationEnd
        );
      } else {
        showFirstDetail();
      }
    }, timing.overviewDurationMs);
  }

  function showFirstDetail() {
    transitionTo(
      () => renderDetailSlide(DETAIL_SLIDES[detailIndex], detailIndex),
      scheduleDetailEnd
    );
  }

  function scheduleCelebrationEnd() {
    scheduleManagedTimer(screenTimer, showFirstDetail, timing.celebracaoDurationMs);
  }

  function scheduleDetailEnd() {
    scheduleManagedTimer(screenTimer, () => {
      detailIndex += 1;
      if (detailIndex < DETAIL_SLIDES.length) {
        transitionTo(
          () => renderDetailSlide(DETAIL_SLIDES[detailIndex], detailIndex),
          scheduleDetailEnd
        );
      } else {
        transitionTo(renderOverview, scheduleOverviewEnd);
      }
    }, timing.detailSlideDurationMs);
  }

  function startCycle() {
    const birthdaysToday = getActiveBirthdays();
    if (isDebug && debugBirthday && birthdaysToday.length) {
      renderBirthdayCelebration(birthdaysToday);
    } else {
      renderOverview();
    }
    if (!isDebug) scheduleOverviewEnd();
  }

  function createStars(amount = 20) {
    const stars = document.getElementById("stars");
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < amount; index += 1) {
      const star = document.createElement("i");
      star.className = "star";
      star.style.setProperty("--x", `${Math.random() * 100}%`);
      star.style.setProperty("--y", `${Math.random() * 100}%`);
      star.style.setProperty("--size", `${(Math.random() * 2.2 + .7).toFixed(1)}px`);
      star.style.setProperty("--duration", `${(Math.random() * 4 + 2.5).toFixed(1)}s`);
      star.style.setProperty("--delay", `${(Math.random() * -7).toFixed(1)}s`);
      fragment.appendChild(star);
    }
    stars.appendChild(fragment);
  }

  function setupDebugPanel() {
    if (!isDebug) return;
    debugPanel.hidden = false;
    debugPanel.innerHTML = `
      <strong>MODO DEBUG · ciclo pausado</strong><br>
      Overview: ${timing.overviewDurationMs / 1000}s ·
      Detalhe: ${timing.detailSlideDurationMs / 1000}s ·
      Celebração: ${timing.celebracaoDurationMs / 1000}s ·
      Carrossel: ${timing.carouselIntervalMs / 1000}s ·
      Fade: ${timing.fadeTransitionMs}ms<br>
      ${debugBirthday ? `Simulação: ${escapeHtml(debugBirthday)}<br>` : ""}
      API: ${escapeHtml(apiState.status)}${apiState.message ? ` · ${escapeHtml(apiState.message)}` : ""}${apiState.lastUpdate ? ` · ${apiState.lastUpdate.toLocaleTimeString("pt-BR")}` : ""}<br>
      Teclas: O = overview · C = celebração<br>
      Slides: ${DETAIL_SLIDES.map((slide) => escapeHtml(slide.title)).join(" → ")}`;
  }

  window.addEventListener("keydown", (event) => {
    if (!isDebug) return;
    if (event.key.toLowerCase() === "o") {
      transitionTo(renderOverview);
    }
    if (event.key.toLowerCase() === "c") {
      const birthdaysToday = getActiveBirthdays();
      if (birthdaysToday.length) transitionTo(() => renderBirthdayCelebration(birthdaysToday));
    }
  });

  window.addEventListener("beforeunload", () => {
    clearRuntimeTimers();
    if (apiRefreshInterval) clearInterval(apiRefreshInterval);
  });

  function updatePlaybackForVisibility() {
    document.documentElement.classList.toggle("page-hidden", document.hidden);
    if (document.hidden) {
      pauseManagedTimer(screenTimer);
      pauseManagedTimer(transitionTimer);
      clearCarouselTimers();
    } else {
      startManagedTimer(transitionTimer);
      startManagedTimer(screenTimer);
      startVisibleCarousels();
    }
    document.querySelectorAll("video").forEach((video) => {
      if (document.hidden) {
        video.pause();
      } else {
        const playback = video.play();
        if (playback && typeof playback.catch === "function") playback.catch(() => {});
      }
    });
  }

  document.addEventListener("visibilitychange", updatePlaybackForVisibility);
  createStars(starCount);
  setupDebugPanel();
  startCycle();
  loadPeopleFromApi();

  const apiRefreshMs = Number(config.integracaoApi?.atualizarACadaMs);
  if (config.integracaoApi?.ativa && apiRefreshMs >= 60000) {
    apiRefreshInterval = setInterval(loadPeopleFromApi, apiRefreshMs);
  }
})();
