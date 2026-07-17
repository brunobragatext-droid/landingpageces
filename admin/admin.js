import { StorageService, debounce } from "../assets/js/storage.js";

const app = document.querySelector("#adminApp");
const toastArea = document.querySelector("#toastArea");
let state = null;

document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  document.documentElement.dataset.theme = localStorage.getItem("ces-admin-theme") || "light";

  if (!StorageService.isFirebaseConfigured()) {
    renderSetupRequired();
    return;
  }

  if (!await StorageService.getAuthenticatedUser()) {
    renderLogin();
    return;
  }

  state = await StorageService.loadSiteData();
  renderAdmin();
}

function renderSetupRequired() {
  app.innerHTML = `<main class="login-page"><section class="login-card">
    <div class="login-brand"><div><h1 class="h4 fw-black mb-1">Configure o banco</h1><p class="text-white-50 mb-0">O painel está pronto para conectar.</p></div></div>
    <p>Preencha <code>assets/js/firebase-config.js</code> com as credenciais do aplicativo Web.</p>
    <p class="mb-0">Consulte <strong>FIREBASE_SETUP.md</strong> para criar os serviços, usuário e regras.</p>
  </section></main>`;
}

function renderLogin() {
  app.innerHTML = `
    <main class="login-page">
      <form class="login-card" id="loginForm">
        <div class="login-brand">
          <span class="login-icon"><i class="fa-solid fa-church" aria-hidden="true"></i></span>
          <div>
            <h1 class="h4 fw-black mb-1">Painel CES</h1>
            <p class="text-muted mb-0">Gestão da landing page</p>
          </div>
        </div>
        <div class="alert alert-info small">Entre com um usuário existente.</div>
        <div class="mb-3">
          <label class="form-label" for="loginEmail">E-mail</label>
          <input class="form-control form-control-lg" id="loginEmail" type="email" autocomplete="username" required>
        </div>
        <div class="mb-4">
          <label class="form-label" for="loginPassword">Senha</label>
          <input class="form-control form-control-lg" id="loginPassword" type="password" autocomplete="current-password" required>
        </div>
        <button class="btn btn-primary btn-lg w-100" type="submit">
          <i class="fa-solid fa-right-to-bracket me-2" aria-hidden="true"></i>Entrar
        </button>
      </form>
    </main>
  `;

  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.querySelector("#loginEmail").value;
    const password = document.querySelector("#loginPassword").value;

    try {
      await StorageService.login(email, password);
      state = await StorageService.loadSiteData();
      renderAdmin();
    } catch {
      showToast("E-mail ou senha inválidos.", "danger");
    }
  });
}

function renderAdmin(activePanel = "geral") {
  app.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="login-icon"><i class="fa-solid fa-church" aria-hidden="true"></i></span>
          <div>
            <strong>CES CMS</strong>
            <span>Landing page</span>
          </div>
        </div>
        <nav class="sidebar-nav" aria-label="Seções do painel">
          ${navButton("geral", "fa-solid fa-gear", "Geral", activePanel)}
          ${navButton("hero", "fa-solid fa-images", "Hero", activePanel)}
          ${navButton("conteudo", "fa-solid fa-layer-group", "Conteúdo", activePanel)}
          ${navButton("relacionamento", "fa-solid fa-comments", "FAQ e contato", activePanel)}
          ${navButton("json", "fa-solid fa-code", "JSON", activePanel)}
        </nav>
      </aside>

      <main class="main-panel">
        <div class="topbar">
          <div>
            <h1>Painel administrativo</h1>
            <p>Alterações são publicadas no Firebase e refletidas no site em tempo real.</p>
          </div>
          <div class="toolbar">
            <a class="btn btn-outline-primary" href="../" target="_blank" rel="noopener"><i class="fa-solid fa-eye me-2"></i>Ver site</a>
            <button class="btn btn-outline-secondary" data-action="theme"><i class="fa-solid fa-circle-half-stroke me-2"></i>Modo</button>
            <button class="btn btn-success" data-action="save"><i class="fa-solid fa-floppy-disk me-2"></i>Salvar</button>
            <button class="btn btn-outline-dark" data-action="export"><i class="fa-solid fa-download me-2"></i>Exportar</button>
            <button class="btn btn-outline-danger" data-action="logout"><i class="fa-solid fa-right-from-bracket me-2"></i>Sair</button>
          </div>
        </div>

        ${renderStats()}
        <section class="section-panel ${activePanel === "geral" ? "active" : ""}" data-panel="geral">${renderGeneralPanel()}</section>
        <section class="section-panel ${activePanel === "hero" ? "active" : ""}" data-panel="hero">${renderHeroPanel()}</section>
        <section class="section-panel ${activePanel === "conteudo" ? "active" : ""}" data-panel="conteudo">${renderContentPanel()}</section>
        <section class="section-panel ${activePanel === "relacionamento" ? "active" : ""}" data-panel="relacionamento">${renderRelationshipPanel()}</section>
        <section class="section-panel ${activePanel === "json" ? "active" : ""}" data-panel="json">${renderJsonPanel()}</section>
      </main>
    </div>
  `;

  bindAdmin(activePanel);
}

function navButton(id, icon, label, activePanel) {
  return `
    <button class="sidebar-link ${activePanel === id ? "active" : ""}" type="button" data-nav="${id}">
      <i class="${icon}" aria-hidden="true"></i>${label}
    </button>
  `;
}

function renderStats() {
  const stats = [
    ["Slides ativos", (state.hero?.slides || []).filter((slide) => slide.ativo !== false).length, "fa-solid fa-images"],
    ["Menus", (state.menus || []).filter((menu) => menu.ativo !== false).length, "fa-solid fa-bars"],
    ["Ministérios", state.ministerios?.itens?.length || 0, "fa-solid fa-people-group"],
    ["Eventos", state.agenda?.eventos?.length || 0, "fa-solid fa-calendar-days"]
  ];

  return `
    <div class="stats-grid">
      ${stats.map(([label, value, icon]) => `
        <article class="admin-card stat-card">
          <span class="stat-icon"><i class="${icon}" aria-hidden="true"></i></span>
          <div>
            <p class="stat-value">${value}</p>
            <p class="stat-label">${label}</p>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderGeneralPanel() {
  return `
    <div class="editor-grid">
      <article class="editor-card">
        ${cardTitle("SEO")}
        <div class="field-grid">
          ${field("Título da página", "seo.title", state.seo?.title)}
          ${field("Meta description", "seo.description", state.seo?.description, "textarea")}
          ${field("Cor do tema", "seo.themeColor", state.seo?.themeColor, "color")}
          ${field("Favicon", "seo.favicon", state.seo?.favicon)}
        </div>
      </article>
      <article class="editor-card">
        ${cardTitle("Empresa")}
        <div class="field-grid">
          ${field("Nome", "empresa.nome", state.empresa?.nome)}
          ${field("Sigla", "empresa.sigla", state.empresa?.sigla)}
          ${field("Subtítulo", "empresa.subtitulo", state.empresa?.subtitulo)}
          ${field("CNPJ", "empresa.cnpj", state.empresa?.cnpj)}
          ${field("Telefone", "empresa.telefone", state.empresa?.telefone)}
          ${field("WhatsApp", "empresa.whatsapp", state.empresa?.whatsapp)}
          ${field("E-mail", "empresa.email", state.empresa?.email)}
          ${field("Endereço", "empresa.endereco", state.empresa?.endereco)}
          ${field("Webmail", "empresa.webmail", state.empresa?.webmail)}
        </div>
      </article>
      <article class="editor-card">
        ${cardTitle("Redes sociais")}
        <div class="field-grid">
          ${field("Instagram", "redesSociais.instagram", state.redesSociais?.instagram)}
          ${field("YouTube", "redesSociais.youtube", state.redesSociais?.youtube)}
          ${field("WhatsApp", "redesSociais.whatsapp", state.redesSociais?.whatsapp)}
          ${field("E-mail", "redesSociais.email", state.redesSociais?.email)}
        </div>
      </article>
      <article class="editor-card">
        ${listTitle("Menus", "menus", "menu")}
        ${renderList("menus", state.menus || [], menuSchema)}
      </article>
    </div>
  `;
}

function renderHeroPanel() {
  return `
    <div class="editor-grid">
      <article class="editor-card full">
        ${cardTitle("Configuração do Hero")}
        <div class="field-grid mb-3">
          ${field("Ribbon", "hero.ribbon", state.hero?.ribbon)}
        </div>
        ${listTitle("Slides", "hero.slides", "slide")}
        ${renderList("hero.slides", state.hero?.slides || [], slideSchema)}
      </article>
    </div>
  `;
}

function renderContentPanel() {
  return `
    <div class="editor-grid">
      <article class="editor-card full">
        ${cardTitle("Sobre")}
        <div class="field-grid">
          ${field("Eyebrow", "sobre.eyebrow", state.sobre?.eyebrow)}
          ${field("Título", "sobre.titulo", state.sobre?.titulo)}
          ${field("Texto", "sobre.texto", (state.sobre?.texto || []).join("\n"), "textarea", "paragraphs")}
          ${field("Missão", "sobre.missao.texto", state.sobre?.missao?.texto, "textarea")}
          ${field("Visão", "sobre.visao.texto", state.sobre?.visao?.texto, "textarea")}
        </div>
        <div class="mt-3">${listTitle("Valores", "sobre.valores", "valor")}${renderList("sobre.valores", state.sobre?.valores || [], valueSchema)}</div>
      </article>

      <article class="editor-card full">
        ${cardTitle("Cultos")}
        <div class="field-grid">
          ${field("Eyebrow", "cultos.eyebrow", state.cultos?.eyebrow)}
          ${field("Título", "cultos.titulo", state.cultos?.titulo)}
          ${field("Nota", "cultos.nota", state.cultos?.nota, "textarea")}
        </div>
        <div class="mt-3">${listTitle("Horários", "cultos.itens", "culto")}${renderList("cultos.itens", state.cultos?.itens || [], worshipSchema)}</div>
      </article>

      <article class="editor-card full">
        ${cardTitle("Endereço")}
        <div class="field-grid">
          ${field("Título", "endereco.titulo", state.endereco?.titulo)}
          ${field("Nome", "endereco.nome", state.endereco?.nome)}
          ${field("Logradouro", "endereco.logradouro", state.endereco?.logradouro)}
          ${field("Bairro e cidade", "endereco.bairroCidade", state.endereco?.bairroCidade)}
          ${field("Referência", "endereco.referencia", state.endereco?.referencia)}
          ${field("Estacionamento", "endereco.estacionamento", state.endereco?.estacionamento)}
          ${field("Mapa embed", "endereco.mapaEmbed", state.endereco?.mapaEmbed)}
          ${field("Link Maps", "endereco.mapaLink", state.endereco?.mapaLink)}
        </div>
      </article>

      <article class="editor-card full">
        ${cardTitle("Ministérios")}
        <div class="field-grid mb-3">
          ${field("Título", "ministerios.titulo", state.ministerios?.titulo)}
          ${field("Texto", "ministerios.texto", state.ministerios?.texto, "textarea")}
        </div>
        ${listTitle("Cards", "ministerios.itens", "ministério")}
        ${renderList("ministerios.itens", state.ministerios?.itens || [], ministrySchema)}
      </article>

      <article class="editor-card full">
        ${cardTitle("CES House")}
        <div class="field-grid">
          ${field("Título", "ceshouse.titulo", state.ceshouse?.titulo)}
          ${field("Texto", "ceshouse.texto", (state.ceshouse?.texto || []).join("\n"), "textarea", "paragraphs")}
          ${field("Tema", "ceshouse.tema.titulo", state.ceshouse?.tema?.titulo)}
          ${field("Subtítulo do tema", "ceshouse.tema.subtitulo", state.ceshouse?.tema?.subtitulo)}
          ${field("Título do download", "ceshouse.download.titulo", state.ceshouse?.download?.titulo)}
          ${field("Arquivo PDF", "ceshouse.download.arquivo", state.ceshouse?.download?.arquivo)}
          ${field("Chamada", "ceshouse.chamada.titulo", state.ceshouse?.chamada?.titulo)}
          ${field("Descrição da chamada", "ceshouse.chamada.descricao", state.ceshouse?.chamada?.descricao, "textarea")}
        </div>
      </article>

      <article class="editor-card full">
        ${cardTitle("Agenda")}
        <div class="field-grid mb-3">
          ${field("Semana", "agenda.semana", state.agenda?.semana)}
          ${field("Rodapé", "agenda.rodape", state.agenda?.rodape)}
        </div>
        ${listTitle("Eventos", "agenda.eventos", "evento")}
        ${renderList("agenda.eventos", state.agenda?.eventos || [], eventSchema)}
      </article>
    </div>
  `;
}

function renderRelationshipPanel() {
  return `
    <div class="editor-grid">
      <article class="editor-card full">
        ${cardTitle("Depoimentos")}
        <div class="form-check form-switch mb-3">
          <input class="form-check-input" type="checkbox" role="switch" id="depoimentosAtivo" data-path="depoimentos.ativo" ${state.depoimentos?.ativo ? "checked" : ""}>
          <label class="form-check-label" for="depoimentosAtivo">Exibir seção</label>
        </div>
        <div class="field-grid mb-3">
          ${field("Título", "depoimentos.titulo", state.depoimentos?.titulo)}
          ${field("Eyebrow", "depoimentos.eyebrow", state.depoimentos?.eyebrow)}
        </div>
        ${listTitle("Depoimentos", "depoimentos.itens", "depoimento")}
        ${renderList("depoimentos.itens", state.depoimentos?.itens || [], testimonialSchema)}
      </article>
      <article class="editor-card full">
        ${cardTitle("FAQ")}
        <div class="form-check form-switch mb-3">
          <input class="form-check-input" type="checkbox" role="switch" id="faqAtivo" data-path="faq.ativo" ${state.faq?.ativo ? "checked" : ""}>
          <label class="form-check-label" for="faqAtivo">Exibir seção</label>
        </div>
        <div class="field-grid mb-3">
          ${field("Título", "faq.titulo", state.faq?.titulo)}
          ${field("Eyebrow", "faq.eyebrow", state.faq?.eyebrow)}
        </div>
        ${listTitle("Perguntas", "faq.itens", "pergunta")}
        ${renderList("faq.itens", state.faq?.itens || [], faqSchema)}
      </article>
      <article class="editor-card full">
        ${cardTitle("Contato")}
        <div class="field-grid mb-3">
          ${field("Título", "contato.titulo", state.contato?.titulo)}
          ${field("Mensagem do WhatsApp", "contato.mensagemWhatsapp", state.contato?.mensagemWhatsapp, "textarea")}
        </div>
        ${listTitle("Cards de contato", "contato.cards", "card")}
        ${renderList("contato.cards", state.contato?.cards || [], contactSchema)}
      </article>
    </div>
  `;
}

function renderJsonPanel() {
  return `
    <article class="editor-card">
      ${cardTitle("Editor avançado JSON")}
      <p class="text-secondary">Use para ajustes finos. Ao aplicar, o conteúdo substitui o estado atual salvo no navegador.</p>
      <textarea class="form-control json-preview" id="jsonEditor" spellcheck="false">${escapeHtml(JSON.stringify(state, null, 2))}</textarea>
      <div class="toolbar mt-3 justify-content-start">
        <button class="btn btn-primary" data-action="apply-json"><i class="fa-solid fa-check me-2"></i>Aplicar JSON</button>
        <button class="btn btn-outline-warning" data-action="reset"><i class="fa-solid fa-rotate-left me-2"></i>Restaurar original</button>
      </div>
    </article>
  `;
}

function cardTitle(title) {
  return `
    <div class="editor-title">
      <h2>${escapeHtml(title)}</h2>
    </div>
  `;
}

function listTitle(title, path, type) {
  return `
    <div class="editor-title">
      <h3>${escapeHtml(title)}</h3>
      <button class="btn btn-sm btn-primary" type="button" data-action="add" data-path="${path}" data-type="${type}">
        <i class="fa-solid fa-plus me-1"></i>Adicionar
      </button>
    </div>
  `;
}

function renderList(path, items, schema) {
  return `
    <div class="item-list">
      ${items.map((item, index) => `
        <div class="item-editor">
          <div class="item-editor-header">
            <strong>${escapeHtml(item.titulo || item.label || item.nome || item.pergunta || item.dia || `Item ${index + 1}`)}</strong>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary" type="button" data-action="up" data-path="${path}" data-index="${index}" aria-label="Subir"><i class="fa-solid fa-arrow-up"></i></button>
              <button class="btn btn-outline-secondary" type="button" data-action="down" data-path="${path}" data-index="${index}" aria-label="Descer"><i class="fa-solid fa-arrow-down"></i></button>
              <button class="btn btn-outline-danger" type="button" data-action="remove" data-path="${path}" data-index="${index}" aria-label="Remover"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
          <div class="field-grid">
            ${schema.map((itemSchema) => field(itemSchema.label, `${path}.${index}.${itemSchema.key}`, item[itemSchema.key], itemSchema.type, itemSchema.valueType)).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function field(label, path, value = "", type = "text", valueType = "string") {
  const id = path.replace(/[^a-z0-9]/gi, "-");
  const safeValue = escapeHtml(value ?? "");

  if (type === "textarea") {
    return `
      <div class="mb-2">
        <label class="form-label" for="${id}">${escapeHtml(label)}</label>
        <textarea class="form-control" id="${id}" rows="3" data-path="${path}" data-value-type="${valueType}">${safeValue}</textarea>
      </div>
    `;
  }

  if (type === "checkbox") {
    return `
      <div class="form-check form-switch align-self-end mb-2">
        <input class="form-check-input" type="checkbox" role="switch" id="${id}" data-path="${path}" ${value ? "checked" : ""}>
        <label class="form-check-label" for="${id}">${escapeHtml(label)}</label>
      </div>
    `;
  }

  if (type === "image") {
    return `<div class="mb-2 image-field">
      <label class="form-label" for="${id}">${escapeHtml(label)}</label>
      ${value ? `<img class="image-preview" src="${safeValue}" alt="Prévia da imagem">` : ""}
      <input class="form-control" id="${id}" type="url" value="${safeValue}" data-path="${path}" data-value-type="${valueType}">
      <button class="btn btn-outline-primary btn-sm mt-2" type="button" data-action="upload-image" data-path="${path}"><i class="fa-solid fa-image me-1"></i>Alterar imagem</button>
      <input class="visually-hidden" type="file" accept="image/*" data-upload-for="${path}">
    </div>`;
  }

  return `
    <div class="mb-2">
      <label class="form-label" for="${id}">${escapeHtml(label)}</label>
      <input class="form-control" id="${id}" type="${type}" value="${safeValue}" data-path="${path}" data-value-type="${valueType}">
    </div>
  `;
}

function bindAdmin(activePanel) {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => renderAdmin(button.dataset.nav));
  });

  document.querySelectorAll("[data-path]").forEach((input) => {
    input.addEventListener("input", handleInput);
    input.addEventListener("change", handleInput);
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button, activePanel));
  });
}

const autosave = debounce(async () => {
  try {
    await StorageService.saveSiteData(state);
    showToast("Alteração publicada no Firebase.", "success");
  } catch (error) {
    showToast(error.message || "Não foi possível salvar.", "danger");
  }
}, 350);

function handleInput(event) {
  const input = event.currentTarget;
  const value = input.type === "checkbox" ? input.checked : normalizeValue(input.value, input.dataset.valueType);
  setByPath(state, input.dataset.path, value);
  autosave();
}

async function handleAction(button, activePanel) {
  const action = button.dataset.action;
  const path = button.dataset.path;

  if (action === "theme") {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("ces-admin-theme", nextTheme);
    return;
  }

  if (action === "save") {
    await StorageService.saveSiteData(state);
    showToast("Conteúdo publicado no Firebase.", "success");
    return;
  }

  if (action === "export") {
    StorageService.exportData(state);
    showToast("Arquivo site.json exportado.", "success");
    return;
  }

  if (action === "logout") {
    await StorageService.logout();
    renderLogin();
    return;
  }

  if (action === "upload-image") {
    const input = document.querySelector(`[data-upload-for="${path}"]`);
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Enviando...';
      try {
        const url = await StorageService.uploadImage(file, path);
        setByPath(state, path, url);
        await StorageService.saveSiteData(state);
        showToast("Imagem enviada e publicada.", "success");
        renderAdmin(activePanel);
      } catch (error) {
        showToast(error.message || "Falha ao enviar a imagem.", "danger");
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-image me-1"></i>Alterar imagem';
      }
    };
    input.click();
    return;
  }

  if (action === "reset") {
    state = await StorageService.loadOriginalData();
    await StorageService.saveSiteData(state);
    showToast("Conteúdo original restaurado.", "warning");
    renderAdmin("json");
    return;
  }

  if (action === "apply-json") {
    try {
      state = JSON.parse(document.querySelector("#jsonEditor").value);
      await StorageService.saveSiteData(state);
      showToast("JSON aplicado com sucesso.", "success");
      renderAdmin("json");
    } catch (error) {
      showToast(`JSON inválido: ${error.message}`, "danger");
    }
    return;
  }

  if (action === "add") {
    const list = getByPath(state, path);
    list.push(createItem(button.dataset.type));
    await StorageService.saveSiteData(state);
    renderAdmin(activePanel);
    return;
  }

  if (["remove", "up", "down"].includes(action)) {
    const index = Number(button.dataset.index);
    const list = getByPath(state, path);

    if (action === "remove") list.splice(index, 1);
    if (action === "up" && index > 0) [list[index - 1], list[index]] = [list[index], list[index - 1]];
    if (action === "down" && index < list.length - 1) [list[index + 1], list[index]] = [list[index], list[index + 1]];

    await StorageService.saveSiteData(state);
    renderAdmin(activePanel);
  }
}

function normalizeValue(value, valueType) {
  if (valueType === "paragraphs") {
    return value.split("\n").map((line) => line.trim()).filter(Boolean);
  }
  return value;
}

function initAdminShortcut() {
  const logo = document.querySelector(".brand-lockup");
  if (!logo) return;

  let clicks = 0;
  let timer;

  logo.addEventListener("click", (event) => {
    // Permite o funcionamento normal do link (#top)
    clicks++;

    clearTimeout(timer);

    timer = setTimeout(() => {
      clicks = 0;
    }, 2000);

    if (clicks >= 5) {
      clicks = 0;

      // Ajuste para a rota do seu painel
      window.location.href = "./admin.html";
    }
  });
}

function createItem(type) {
  const map = {
    menu: { label: "Novo menu", link: "#contato", ativo: true },
    slide: {
      id: `hero-${Date.now()}`,
      ativo: true,
      titulo: "Novo slide",
      subtitulo: "Subtítulo do slide",
      tagline: "Um lugar de experiências",
      imagem: "assets/uploads/hero.jpg",
      imagemMobile: "",
      alt: "Imagem do slide",
      botao: "Saiba mais",
      link: "#contato",
      botaoSecundario: "",
      linkSecundario: "#sobre"
    },
    valor: { nome: "Novo valor", descricao: "Descrição do valor." },
    culto: { icone: "fa-solid fa-calendar-days", dia: "Novo culto", horario: "19h", descricao: "Descrição do culto." },
    ministério: { icone: "fa-solid fa-users", titulo: "Novo ministério", descricao: "Descrição do ministério." },
    evento: { dia: "DOM", hora: "9h", titulo: "Novo evento", descricao: "Descrição do evento." },
    depoimento: { nome: "Nome", texto: "Texto do depoimento." },
    pergunta: { pergunta: "Nova pergunta?", resposta: "Resposta da pergunta." },
    card: { tipo: "email", label: "Novo contato", valor: "valor", cta: "Abrir", icone: "fa-solid fa-link" }
  };

  return structuredClone(map[type] || { titulo: "Novo item", descricao: "" });
}

function getByPath(object, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], object);
}

function setByPath(object, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((acc, key) => {
    if (acc[key] === undefined) acc[key] = {};
    return acc[key];
  }, object);
  target[last] = value;
}

function showToast(message, type = "primary") {
  const id = `toast-${Date.now()}`;
  toastArea.insertAdjacentHTML("beforeend", `
    <div class="toast align-items-center text-bg-${type} border-0" role="status" aria-live="polite" aria-atomic="true" id="${id}">
      <div class="d-flex">
        <div class="toast-body">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
      </div>
    </div>
  `);

  const element = document.querySelector(`#${id}`);
  const toast = new bootstrap.Toast(element, { delay: 2600 });
  toast.show();
  element.addEventListener("hidden.bs.toast", () => element.remove());
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const menuSchema = [
  { key: "label", label: "Texto" },
  { key: "link", label: "Link" },
  { key: "ativo", label: "Ativo", type: "checkbox" }
];

const slideSchema = [
  { key: "ativo", label: "Ativo", type: "checkbox" },
  { key: "titulo", label: "Título" },
  { key: "subtitulo", label: "Subtítulo", type: "textarea" },
  { key: "tagline", label: "Tagline" },
  { key: "imagem", label: "Imagem (Desktop)", type: "image" },
  { key: "imagemMobile", label: "Imagem (Mobile)", type: "image" }, // <- Novo campo!
  { key: "alt", label: "Alt da imagem" },
  { key: "botao", label: "Botão" },
  { key: "link", label: "Link" },
  { key: "botaoSecundario", label: "Botão secundário" },
  { key: "linkSecundario", label: "Link secundário" }
];

const valueSchema = [
  { key: "nome", label: "Nome" },
  { key: "descricao", label: "Descrição" }
];

const worshipSchema = [
  { key: "icone", label: "Ícone Font Awesome" },
  { key: "dia", label: "Dia" },
  { key: "horario", label: "Horário" },
  { key: "descricao", label: "Descrição" }
];

const ministrySchema = [
  { key: "icone", label: "Ícone Font Awesome" },
  { key: "titulo", label: "Título" },
  { key: "descricao", label: "Descrição" }
];

const eventSchema = [
  { key: "dia", label: "Dia" },
  { key: "hora", label: "Hora" },
  { key: "titulo", label: "Título" },
  { key: "descricao", label: "Descrição" }
];

const testimonialSchema = [
  { key: "nome", label: "Nome" },
  { key: "texto", label: "Texto", type: "textarea" }
];

const faqSchema = [
  { key: "pergunta", label: "Pergunta" },
  { key: "resposta", label: "Resposta", type: "textarea" }
];

const contactSchema = [
  { key: "tipo", label: "Tipo" },
  { key: "label", label: "Label" },
  { key: "valor", label: "Valor" },
  { key: "cta", label: "CTA" },
  { key: "icone", label: "Ícone Font Awesome" }
];
