const navbar = document.querySelector(".navbar");
const navLinks = Array.from(document.querySelectorAll(".nav-menu a"));
const revealNodes = Array.from(document.querySelectorAll("[data-reveal]"));
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const currentPage = document.body.dataset.page || "";

const setNavbarState = () => {
  if (!navbar) return;
  navbar.classList.toggle("scrolled", window.scrollY > 18);
};

const setupScrollProgress = () => {
  const bar = document.getElementById("scrollProgressBar");
  if (!bar || prefersReducedMotion) return;

  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${Math.min(pct, 100)}%`;
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
};

const setActiveNav = () => {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.nav === currentPage);
  });
};

const smoothAnchorNavigation = () => {
  const hashLinks = navLinks.filter((link) => {
    const href = link.getAttribute("href") || "";
    return href.startsWith("#");
  });

  hashLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      const offset = navbar?.offsetHeight || 86;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  });
};

const setupRevealObserver = () => {
  if (revealNodes.length === 0) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  revealNodes.forEach((node) => {
    const delay = Number(node.dataset.delay || 0);
    node.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    { threshold: 0.12, rootMargin: "-4% 0px -10% 0px" },
  );

  revealNodes.forEach((node) => observer.observe(node));
};

const setupMobileNav = () => {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("primaryMenu");
  if (!toggle || !menu || !navbar) return;

  const closeMenu = () => {
    navbar.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
  };

  const openMenu = () => {
    navbar.classList.add("is-open");
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    menu.classList.add("is-open");
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    if (expanded) closeMenu();
    else openMenu();
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
};

const setupInteractiveHeaders = () => {
  const headers = Array.from(document.querySelectorAll(".interactive-header"));
  if (headers.length === 0) return;

  const isHoverSupported = window.matchMedia("(hover: hover)").matches;
  if (!isHoverSupported || prefersReducedMotion) return;

  const controller = new AbortController();
  const { signal } = controller;

  const headerData = headers.map((header) => {
    const temp = document.createElement("div");
    temp.innerHTML = header.innerHTML;

    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.split(/(\s+)/);
        const fragment = document.createDocumentFragment();

        words.forEach((chunk) => {
          if (/^\s+$/.test(chunk)) {
            fragment.appendChild(document.createTextNode(" "));
            return;
          }

          const wordSpan = document.createElement("span");
          wordSpan.className = "word";
          wordSpan.style.cssText = "display:inline-block;white-space:nowrap;";

          chunk.split("").forEach((letter) => {
            const letterSpan = document.createElement("span");
            letterSpan.className = "letter";
            letterSpan.style.cssText = "display:inline-block;position:relative;";
            letterSpan.textContent = letter;
            wordSpan.appendChild(letterSpan);
          });

          fragment.appendChild(wordSpan);
        });

        return fragment;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(false);
        node.childNodes.forEach((child) => clone.appendChild(processNode(child)));
        return clone;
      }

      return node.cloneNode(true);
    };

    header.innerHTML = "";
    temp.childNodes.forEach((child) => header.appendChild(processNode(child)));

    const letterElements = Array.from(header.querySelectorAll(".letter"));
    header.addEventListener(
      "mouseleave",
      () => {
        letterElements.forEach((letter) => {
          letter.style.transform = "translate(0, 0)";
        });
      },
      { signal },
    );

    return { letterElements };
  });

  let animationFrameId = null;

  document.addEventListener(
    "mousemove",
    (event) => {
      const { clientX, clientY } = event;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      animationFrameId = requestAnimationFrame(() => {
        headerData.forEach(({ letterElements }) => {
          letterElements.forEach((letter) => {
            const rect = letter.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const influence = Math.max(0, 1 - distance / 200);
            const moveX =
              distance > 0 ? (deltaX / distance) * influence * 12 : 0;
            const moveY =
              distance > 0 ? (deltaY / distance) * influence * 12 : 0;

            letter.style.transform = `translate(${moveX}px, ${moveY}px)`;
            letter.style.transition =
              "transform 120ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          });
        });
      });
    },
    { passive: true, signal },
  );

  window.addEventListener(
    "pagehide",
    () => {
      controller.abort();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    },
    { once: true },
  );
};

const setupAwwwardsCarousel = () => {
  const carousel = document.querySelector(".awwwards-carousel");
  if (!carousel) return;

  const viewport = carousel.querySelector(".carousel-viewport");
  const cards = Array.from(carousel.querySelectorAll(".carousel-card"));
  const container = document.querySelector(".carousel-container");
  const prevBtn = container?.querySelector(".carousel-arrow.prev");
  const nextBtn = container?.querySelector(".carousel-arrow.next");
  const indicators = Array.from(
    document.querySelectorAll(".carousel-indicators .indicator"),
  );

  if (!viewport || cards.length === 0) return;

  const states = ["active", "prev1", "next1", "prev2", "next2"];
  const isHoverSupported = window.matchMedia("(hover: hover)").matches;
  let index = 0;
  let autoTimer = null;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartTime = 0;
  let isTransitioning = false;

  const applyStates = () => {
    const total = cards.length;

    cards.forEach((card) => {
      card.classList.remove(...states, "is-revealed");
    });

    cards[index].classList.add("active");
    cards[(index - 1 + total) % total].classList.add("prev1");
    cards[(index + 1) % total].classList.add("next1");
    cards[(index - 2 + total) % total].classList.add("prev2");
    cards[(index + 2) % total].classList.add("next2");
    indicators.forEach((indicator, indicatorIndex) => {
      indicator.classList.toggle("active", indicatorIndex === index);
    });
  };

  const moveTo = (newIndex) => {
    if (isTransitioning) return;
    isTransitioning = true;
    index = (newIndex + cards.length) % cards.length;
    applyStates();

    window.setTimeout(() => {
      isTransitioning = false;
    }, 700);
  };

  const stopAuto = () => {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  };

  const startAuto = () => {
    if (prefersReducedMotion) return;
    stopAuto();
    autoTimer = setInterval(() => moveTo(index + 1), 6000);
  };

  prevBtn?.addEventListener("click", () => {
    moveTo(index - 1);
    startAuto();
  });

  nextBtn?.addEventListener("click", () => {
    moveTo(index + 1);
    startAuto();
  });

  indicators.forEach((indicator, indicatorIndex) => {
    indicator.addEventListener("click", () => {
      moveTo(indicatorIndex);
      startAuto();
    });
  });

  viewport.addEventListener("mouseenter", stopAuto);
  viewport.addEventListener("mouseleave", startAuto);

  viewport.addEventListener("pointerdown", (event) => {
    isDragging = true;
    dragStartX = event.clientX;
    dragStartTime = Date.now();
    viewport.classList.add("is-dragging");
    stopAuto();
  });

  window.addEventListener("pointerup", (event) => {
    if (!isDragging) return;

    const delta = event.clientX - dragStartX;
    const duration = Math.max(Date.now() - dragStartTime, 1);
    const velocity = Math.abs(delta) / duration;

    isDragging = false;
    viewport.classList.remove("is-dragging");

    if (Math.abs(delta) > 30 || velocity > 0.5) {
      moveTo(delta < 0 ? index + 1 : index - 1);
    }

    startAuto();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      moveTo(index - 1);
      startAuto();
    }

    if (event.key === "ArrowRight") {
      moveTo(index + 1);
      startAuto();
    }
  });

  cards.forEach((card) => {
    if (!isHoverSupported) {
      card.addEventListener("click", (event) => {
        if (!card.classList.contains("active")) return;
        event.stopPropagation();
        card.classList.toggle("is-revealed");
      });
    }
  });

  document.addEventListener("click", (event) => {
    if (!isHoverSupported && !event.target.closest(".carousel-card")) {
      cards.forEach((card) => card.classList.remove("is-revealed"));
    }
  });

  window.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  applyStates();
  startAuto();
};

window.addEventListener("scroll", setNavbarState, { passive: true });
window.addEventListener("resize", setNavbarState);
setNavbarState();
setActiveNav();
setupScrollProgress();
smoothAnchorNavigation();
setupMobileNav();
setupRevealObserver();
setupInteractiveHeaders();
setupAwwwardsCarousel();
