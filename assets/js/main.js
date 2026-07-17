import { StorageService } from "./storage.js";
import { initHeroCarousel } from "./carousel.js";
import { initAnimations } from "./animations.js";

const app = document.querySelector("#app");
let heroCarousel = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  showLoading();

  try {
    const data = await StorageService.loadSiteData();
    renderSite(data);
    StorageService.subscribeSiteData((updatedData) => renderSite(updatedData), (error) => {
      console.error("Não foi possível acompanhar as atualizações do Firebase.", error);
    });
  } catch (error) {
    showError(error);
  }
}

function renderSite(data) {
  applySeo(data);
  if (heroCarousel) heroCarousel.destroy(true, true);

  app.innerHTML = `
    ${renderLogoSprite()}
    ${renderHeader(data)}
    <main id="conteudo">
      ${renderHero(data)}
      ${renderAbout(data.sobre)}
      ${renderWorship(data.cultos)}
      ${renderAddress(data.endereco)}
      ${renderMinistries(data.ministerios)}
      ${renderCesHouse(data.ceshouse)}
      ${renderAgenda(data.agenda)}
      ${renderTestimonials(data.depoimentos)}
      ${renderFaq(data.faq)}
      ${renderContact(data)}
    </main>
    ${renderFooter(data)}
  `;

  bindNavigation();
  heroCarousel = initHeroCarousel();
  initAnimations();
}

function applySeo(data) {
  document.title = data?.seo?.title || data?.empresa?.nome || "Landing Page";
  setMeta("description", data?.seo?.description || "");
  setMeta("theme-color", data?.seo?.themeColor || "#0D74AA");
}

function setMeta(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function renderHeader(data) {
  const menus = (data.menus || []).filter((menu) => menu.ativo !== false);
  const company = data.empresa || {};

  return `
    <header class="site-header">
      <nav class="site-container site-nav" aria-label="Menu principal">
        <a class="brand-lockup" href="#top" aria-label="${attr(company.sigla || company.nome)} - início">
          ${renderLogo("#0F1823", "#0D74AA")}
          <span>
            <span class="brand-title">${text(company.nome)}</span>
            <span class="brand-subtitle">${text(company.subtitulo)}</span>
          </span>
        </a>

        <button class="nav-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu-principal">
          <i class="fa-solid fa-bars" aria-hidden="true"></i>
        </button>

        <div class="nav-panel" id="menu-principal">
          <ul class="nav-links">
            ${menus.map((menu) => `
              <li><a class="nav-link" href="${attr(menu.link)}">${text(menu.label)}</a></li>
            `).join("")}
            ${company.webmail ? `
              <li><a class="nav-link is-external" href="${attr(company.webmail)}" target="_blank" rel="noopener">
                <i class="fa-solid fa-envelope" aria-hidden="true"></i> E-mail
              </a></li>
            ` : ""}
          </ul>
        </div>
      </nav>
    </header>
  `;
}

function renderHero(data) {
  const slides = (data.hero?.slides || []).filter((slide) => slide.ativo !== false);
  const meta = [
    data.empresa?.telefone ? `<span class="hero-pill"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i>${text(data.empresa.telefone)}</span>` : "",
    data.empresa?.endereco ? `<span class="hero-pill"><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${text(data.empresa.endereco)}</span>` : ""
  ].join("");

  return `
    <section class="hero-section" id="top" aria-label="Destaques">
      <div class="swiper hero-swiper">
        <div class="swiper-wrapper">
          ${slides.map((slide, index) => {
            const loadingStrategy = index === 0 ? "eager" : "lazy";
            const imgAlt = attr(slide.alt || slide.titulo);
            
            // Se houver uma imagem mobile cadastrada, usamos <picture> para alternar dinamicamente
            const imageMarkup = slide.imagemMobile 
              ? `
                <picture>
                  <source media="(max-width: 768px)" srcset="${attr(slide.imagemMobile)}">
                  <img src="${attr(slide.imagem)}" alt="${imgAlt}" loading="${loadingStrategy}" decoding="async">
                </picture>
              `
              : `<img src="${attr(slide.imagem)}" alt="${imgAlt}" loading="${loadingStrategy}" decoding="async">`;

            return `
              <article class="swiper-slide hero-slide">
                ${imageMarkup}
                <div class="site-container">
                  <div class="hero-content">
                    <p class="hero-ribbon" data-aos="fade-up">${text(data.hero?.ribbon || "")}</p>
                    <h1 class="hero-title" data-aos="fade-up" data-aos-delay="90">${text(slide.titulo)}</h1>
                    ${slide.tagline ? `<p class="hero-tagline" data-aos="fade-up" data-aos-delay="150">${text(slide.tagline)}</p>` : ""}
                    <p class="hero-subtitle" data-aos="fade-up" data-aos-delay="210">${text(slide.subtitulo)}</p>
                    <div class="hero-actions" data-aos="fade-up" data-aos-delay="270">
                      ${slide.botao ? `<a class="btn-modern btn-light" href="${attr(slide.link)}">${text(slide.botao)} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>` : ""}
                      ${slide.botaoSecundario ? `<a class="btn-modern btn-ghost" href="${attr(slide.linkSecundario)}">${text(slide.botaoSecundario)}</a>` : ""}
                    </div>
                    <div class="hero-meta" data-aos="fade-up" data-aos-delay="330">${meta}</div>
                  </div>
                </div>
              </article>
            `;
          }).join("")}
        </div>
        <div class="swiper-button-prev" aria-label="Slide anterior"></div>
        <div class="swiper-button-next" aria-label="Próximo slide"></div>
        <div class="swiper-pagination"></div>
      </div>
    </section>
  `;
}

function renderAbout(section) {
  if (!section) return "";
  return `
    <section class="content-section" id="${attr(section.id || "sobre")}">
      <div class="site-container section-grid">
        <div data-aos="fade-up">
          ${sectionTitle(section)}
          <div class="section-copy">${paragraphs(section.texto)}</div>
        </div>
        <div data-aos="fade-up" data-aos-delay="120">
          <div class="mission-grid">
            ${[section.missao, section.visao].filter(Boolean).map((item) => `
              <article class="card-modern mission-card">
                <p class="mission-label">${text(item.label)}</p>
                <p class="mission-text">${text(item.texto)}</p>
              </article>
            `).join("")}
          </div>
          <p class="small-label mt-4">${text(section.valoresTitulo || "Valores")}</p>
          <div class="values-grid">
            ${(section.valores || []).map((item) => `
              <article class="card-modern value-card">
                <h3 class="value-name">${text(item.nome)}</h3>
                <p class="value-desc">${text(item.descricao)}</p>
              </article>
            `).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderWorship(section) {
  if (!section) return "";
  return `
    <section class="content-section is-soft" id="${attr(section.id || "cultos")}">
      <div class="site-container">
        <div data-aos="fade-up">
          ${sectionTitle(section)}
        </div>
        <div class="worship-grid mt-4">
          ${(section.itens || []).map((item, index) => `
            <article class="card-modern worship-card" data-aos="fade-up" data-aos-delay="${index * 80}">
              <span class="icon-badge"><i class="${attr(item.icone)}" aria-hidden="true"></i></span>
              <div>
                <h3 class="card-title">${text(item.dia)}</h3>
                <p class="worship-time">${text(item.horario)}</p>
                <p class="card-desc">${text(item.descricao)}</p>
              </div>
            </article>
          `).join("")}
        </div>
        ${section.nota ? `<p class="note"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>${text(section.nota)}</span></p>` : ""}
      </div>
    </section>
  `;
}

function renderAddress(section) {
  if (!section) return "";
  return `
    <section class="content-section" id="${attr(section.id || "endereco")}">
      <div class="site-container address-grid">
        <div data-aos="fade-up">
          ${sectionTitle(section)}
          <article class="card-modern mt-4">
            <p class="address-name">${text(section.nome)}</p>
            <p class="address-text">${text(section.logradouro)}<br>${text(section.bairroCidade)}</p>
            <p class="address-meta"><i class="fa-solid fa-location-dot me-2" aria-hidden="true"></i>${text(section.referencia)}</p>
            <p class="address-park"><i class="fa-solid fa-car me-2" aria-hidden="true"></i>${text(section.estacionamento)}</p>
          </article>
        </div>
        <div class="map-frame" data-aos="fade-up" data-aos-delay="120">
          <iframe src="${attr(section.mapaEmbed)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Localização da CES"></iframe>
          <a class="map-open-link" href="${attr(section.mapaLink)}" target="_blank" rel="noopener">
            <i class="fa-solid fa-arrow-up-right-from-square me-1" aria-hidden="true"></i>Abrir no Maps
          </a>
        </div>
      </div>
    </section>
  `;
}

function renderMinistries(section) {
  if (!section) return "";
  return `
    <section class="content-section is-soft" id="${attr(section.id || "ministerios")}">
      <div class="site-container">
        <div data-aos="fade-up">
          ${sectionTitle(section)}
          <p class="section-lead">${text(section.texto)}</p>
        </div>
        <div class="ministry-grid mt-4">
          ${(section.itens || []).map((item, index) => `
            <article class="card-modern ministry-card" data-aos="fade-up" data-aos-delay="${Math.min(index * 20, 180)}">
              <span class="icon-badge"><i class="${attr(item.icone)}" aria-hidden="true"></i></span>
              <div>
                <h3 class="card-title">${text(item.titulo)}</h3>
                <p class="card-desc">${text(item.descricao)}</p>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderCesHouse(section) {
  if (!section) return "";
  const themeDate = currentMonthLabel(section.tema?.data);
  const weekLabel = currentWeekLabel(section.download?.periodo);

  return `
    <section class="content-section is-dark" id="${attr(section.id || "ceshouse")}">
      <div class="site-container section-grid">
        <div data-aos="fade-up">
          ${sectionTitle(section)}
          <div class="section-copy">${paragraphs(section.texto)}</div>
        </div>
        <div class="ceshouse-panel" data-aos="fade-up" data-aos-delay="120">
          <article class="card-modern theme-card">
            <p class="small-label">${text(section.tema?.label)} · ${text(themeDate)}</p>
            <h3 class="theme-title">${text(section.tema?.titulo)}</h3>
            <p class="theme-subtitle">${text(section.tema?.subtitulo)}</p>
          </article>
          <article class="card-modern download-card">
            <span class="icon-badge"><i class="fa-solid fa-file-lines" aria-hidden="true"></i></span>
            <div class="download-info">
              <p class="small-label">${text(section.download?.label)} · ${text(weekLabel)}</p>
              <h3 class="card-title">${text(section.download?.titulo)}</h3>
              <p class="card-desc">${text(section.download?.descricao)}</p>
            </div>
            <a class="btn-modern" href="${attr(section.download?.arquivo || "#")}" download>
              <i class="fa-solid fa-download" aria-hidden="true"></i>${text(section.download?.botao || "Baixar")}
            </a>
          </article>
          <article class="card-modern house-card text-center">
            <h3 class="card-title"><i class="fa-solid fa-location-dot me-2 text-primary" aria-hidden="true"></i>${text(section.chamada?.titulo)}</h3>
            <p class="card-desc">${text(section.chamada?.descricao)}</p>
            <span class="badge text-bg-light text-primary mt-3">${text(section.chamada?.badge)}</span>
          </article>
        </div>
      </div>
    </section>
  `;
}

function renderAgenda(section) {
  if (!section) return "";
  return `
    <section class="content-section" id="${attr(section.id || "agenda")}">
      <div class="site-container section-grid">
        <div data-aos="fade-up">
          ${sectionTitle(section)}
          <p class="agenda-week">${text(section.semana)}</p>
        </div>
        <div class="event-list" data-aos="fade-up" data-aos-delay="120">
          ${(section.eventos || []).map((event) => `
            <article class="card-modern event-card">
              <time class="event-date">
                <span class="event-day">${text(event.dia)}</span>
                <span class="event-hour">${text(event.hora)}</span>
              </time>
              <div>
                <h3 class="card-title">${text(event.titulo)}</h3>
                <p class="card-desc">${text(event.descricao)}</p>
              </div>
            </article>
          `).join("")}
         
        </div>
      </div>
    </section>
  `;
}

function renderTestimonials(section) {
  if (!section?.ativo) return "";
  return `
    <section class="content-section is-soft" id="${attr(section.id || "depoimentos")}">
      <div class="site-container">
        <div data-aos="fade-up">${sectionTitle(section)}</div>
        <div class="mission-grid mt-4">
          ${(section.itens || []).map((item, index) => `
            <article class="card-modern" data-aos="fade-up" data-aos-delay="${index * 80}">
              <p class="card-desc">"${text(item.texto)}"</p>
              <h3 class="card-title mt-3">${text(item.nome)}</h3>
            </article>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderFaq(section) {
  if (!section?.ativo) return "";
  const accordionId = "faqAccordion";
  return `
    <section class="content-section" id="${attr(section.id || "faq")}">
      <div class="site-container section-grid">
        <div data-aos="fade-up">${sectionTitle(section)}</div>
        <div class="accordion" id="${accordionId}" data-aos="fade-up" data-aos-delay="120">
          ${(section.itens || []).map((item, index) => `
            <div class="accordion-item">
              <h3 class="accordion-header">
                <button class="accordion-button ${index ? "collapsed" : ""}" type="button" data-bs-toggle="collapse" data-bs-target="#faq-${index}" aria-expanded="${index ? "false" : "true"}" aria-controls="faq-${index}">
                  ${text(item.pergunta)}
                </button>
              </h3>
              <div id="faq-${index}" class="accordion-collapse collapse ${index ? "" : "show"}" data-bs-parent="#${accordionId}">
                <div class="accordion-body">${text(item.resposta)}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderContact(data) {
  const section = data.contato;
  if (!section) return "";

  const links = {
    whatsapp: `https://wa.me/${data.empresa?.whatsapp || ""}?text=${encodeURIComponent(section.mensagemWhatsapp || "")}`,
    email: `mailto:${data.empresa?.email || ""}`,
    instagram: data.redesSociais?.instagram || "#",
    youtube: data.redesSociais?.youtube || "#"
  };

  return `
    <section class="content-section is-soft" id="${attr(section.id || "contato")}">
      <div class="site-container">
        <div data-aos="fade-up">${sectionTitle(section)}</div>
        <div class="contact-grid mt-4">
          ${(section.cards || []).map((card, index) => `
            <a class="card-modern contact-card ${attr(card.tipo)}" href="${attr(links[card.tipo] || "#")}" target="${card.tipo === "email" ? "_self" : "_blank"}" rel="noopener" data-aos="fade-up" data-aos-delay="${index * 80}">
              <div>
                <p class="contact-label"><i class="${attr(card.icone)} me-2" aria-hidden="true"></i>${text(card.label)}</p>
                <p class="contact-value">${text(card.valor)}</p>
              </div>
              <span class="contact-cta">${text(card.cta)} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderFooter(data) {
  const company = data.empresa || {};
  const social = data.redesSociais || {};
  const socialLinks = [
    ["Instagram", social.instagram, "fa-brands fa-instagram"],
    ["YouTube", social.youtube, "fa-brands fa-youtube"],
    ["WhatsApp", social.whatsapp, "fa-brands fa-whatsapp"],
    ["E-mail", social.email, "fa-solid fa-envelope"]
  ].filter(([, href]) => href);

  return `
    <footer class="site-footer">
      <div class="site-container">
        <div class="footer-grid">
          <a class="brand-lockup" href="#top" aria-label="${attr(company.nome)} - início">
            ${renderLogo("#FFFFFF", "#FFFFFF")}
            <span>
              <span class="brand-title">${text(company.nome)}</span>
              <span class="brand-subtitle">CNPJ: ${text(company.cnpj)}</span>
            </span>
          </a>
          <div class="footer-social">
            ${socialLinks.map(([label, href, icon]) => `
              <a href="${attr(href)}" target="${href.startsWith("mailto:") ? "_self" : "_blank"}" rel="noopener" aria-label="${attr(label)}">
                <i class="${icon}" aria-hidden="true"></i>
              </a>
            `).join("")}
          </div>
        </div>
        <p class="footer-copy">${text(data.footer?.texto || "")}</p>
      </div>
    </footer>
  `;
}

function sectionTitle(section) {
  return `
    ${section.eyebrow ? `<p class="section-eyebrow">${text(section.eyebrow)}</p>` : ""}
    <h2 class="section-title">${text(section.titulo)}</h2>
  `;
}

function bindNavigation() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const panel = document.querySelector(".nav-panel");

  if (!header || !toggle || !panel) return;

  const closeMenu = () => {
    header.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
    toggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  };

  toggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
    toggle.innerHTML = `<i class="fa-solid ${isOpen ? "fa-xmark" : "fa-bars"}" aria-hidden="true"></i>`;
  });

  panel.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function renderLogo(primary, secondary) {
  return `
    <svg class="brand-mark" viewBox="0 0 180 157" aria-hidden="true" style="--mk1:${primary};--mk2:${secondary}">
      <use href="#cesmark"></use>
    </svg>
  `;
}

function renderLogoSprite() {
  return `
    <svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
      <defs>
        <g id="cesmark" transform="translate(0,157) scale(0.1,-0.1)">
          <path style="fill:var(--mk1,#0F1823)" d="M563 1496 c-567 -184 -714 -980 -233 -1253 324 -184 446 21 188 318 -290 334 -345 493 -222 638 90 105 326 119 405 25 47 -57 32 197 -16 270 -21 31 -30 32 -122 2z M997 1459 c-59 -31 -91 -120 -71 -196 6 -22 6 -22 47 0 136 71 298 14 368 -128 66 -135 11 -267 -216 -515 -250 -273 -180 -551 104 -409 261 130 384 537 257 851 -100 246 -366 462 -489 397z"/>
          <path style="fill:var(--mk2,#0D74AA)" d="M763 1489 c16 -34 20 -64 22 -182 5 -248 69 -366 231 -427 169 -63 338 36 244 143 -32 37 -51 46 -215 107 -225 83 -275 286 -90 365 42 18 -20 35 -131 35 -81 0 -81 0 -61 -41z M429 1214 c-81 -98 11 -399 192 -626 233 -293 142 -529 -171 -443 -79 21 -82 18 -16 -19 197 -114 505 -119 702 -13 29 16 29 16 -36 17 -123 1 -199 43 -220 122 -12 44 -10 63 26 188 47 165 27 297 -74 480 -107 193 -344 365 -403 294z"/>
        </g>
      </defs>
    </svg>
  `;
}

function currentMonthLabel(fallback) {
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const today = new Date();
  return `${months[today.getMonth()]} ${today.getFullYear()}` || fallback;
}

function currentWeekLabel(fallback) {
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? 1 : day === 6 ? 2 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  if (Number.isNaN(monday.getTime()) || Number.isNaN(friday.getTime())) return fallback;

  if (monday.getMonth() === friday.getMonth()) {
    return `${monday.getDate()} a ${friday.getDate()} de ${months[monday.getMonth()]}`;
  }

  return `${monday.getDate()} de ${months[monday.getMonth()]} a ${friday.getDate()} de ${months[friday.getMonth()]}`;
}

function paragraphs(value) {
  const items = Array.isArray(value) ? value : [value].filter(Boolean);
  return items.map((item) => `<p>${text(item)}</p>`).join("");
}

function text(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function attr(value = "") {
  return text(value).replaceAll("`", "&#096;");
}

function showLoading() {
  app.innerHTML = `
    <div class="loading-state">
      <div>
        <div class="spinner-border text-primary mb-3" role="status" aria-label="Carregando"></div>
        <p>Carregando conteúdo da CES...</p>
      </div>
    </div>
  `;
}

function showError(error) {
  app.innerHTML = `
    <div class="error-state">
      <div>
        <h1>Não foi possível carregar a landing page.</h1>
        <p>${text(error.message)}</p>
        <p>Abra o projeto por um servidor local para permitir a leitura de <strong>data/site.json</strong>.</p>
      </div>
    </div>
  `;
}
