export const initHeroCarousel = () => {
  const hero = document.querySelector(".hero-swiper");
  if (!hero || typeof Swiper === "undefined") return null;

  return new Swiper(hero, {
    effect: "fade",
    fadeEffect: { crossFade: true },
    loop: true,
    speed: 900,
    autoplay: {
      delay: 5600,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    },
    keyboard: {
      enabled: true
    },
    lazyPreloadPrevNext: 1,
    pagination: {
      el: ".swiper-pagination",
      clickable: true
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev"
    },
    a11y: {
      prevSlideMessage: "Slide anterior",
      nextSlideMessage: "Próximo slide",
      firstSlideMessage: "Este é o primeiro slide",
      lastSlideMessage: "Este é o último slide",
      paginationBulletMessage: "Ir para o slide {{index}}"
    }
  });
};
