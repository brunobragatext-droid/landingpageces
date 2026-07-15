import { debounce } from "./storage.js";

export const initAnimations = () => {
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 720,
      easing: "ease-out-cubic",
      once: true,
      offset: 80
    });
  }

  observeHeader();
  observeSections();
};

const observeHeader = () => {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  };

  update();
  window.addEventListener("scroll", debounce(update, 50), { passive: true });
};

const observeSections = () => {
  const links = [...document.querySelectorAll(".nav-link[href^='#']")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-42% 0px -50% 0px", threshold: 0.01 }
  );

  sections.forEach((section) => observer.observe(section));
};
