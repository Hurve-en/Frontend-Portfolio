// Cache common DOM references used across interactions.
const navbar = document.querySelector(".navbar");
const navLinks = Array.from(
  document.querySelectorAll('.nav-menu a[href^="#"]'),
);
const revealNodes = Array.from(document.querySelectorAll("[data-reveal]"));
const sectionNodes = Array.from(document.querySelectorAll("main section[id]"));
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const getOffset = () => navbar?.offsetHeight || 86;

// ── Navbar scroll state ──
const setNavbarState = () => {
  if (!navbar) return;
  navbar.classList.toggle("scrolled", window.scrollY > 18);
};

// ── Scroll progress bar ──
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

// ── Smooth anchor navigation ──
const smoothAnchorNavigation = () => {
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || !targetId.startsWith("#")) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      const top =
        target.getBoundingClientRect().top + window.scrollY - getOffset() + 1;
      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      setTimeout(() => updateActiveFromScroll(), 400);
    });
  });
};

// ── Reveal observer ──
const setupRevealObserver = () => {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const heroRevealElements = document.querySelectorAll("#home [data-reveal]");
  heroRevealElements.forEach((el) => el.classList.add("is-visible"));

  revealNodes.forEach((node) => {
    const delay = Number(node.dataset.delay || 0);
    node.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  const hideTimers = new WeakMap();

  // FIX: 8 add and remove will-change around reveals for better perf
  const applyWillChange = (el) => {
    if (el.dataset.willChangeApplied) return;
    el.style.willChange = "opacity, transform";
    el.dataset.willChangeApplied = "true";
    const handleTransitionEnd = () => {
      el.style.willChange = "";
      delete el.dataset.willChangeApplied;
    };
    el.addEventListener("transitionend", handleTransitionEnd, { once: true });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pending = hideTimers.get(entry.target);
          if (pending) {
            clearTimeout(pending);
            hideTimers.delete(entry.target);
          }
          applyWillChange(entry.target);
          entry.target.classList.add("is-visible");
        } else {
          if (hideTimers.has(entry.target)) return;
          const timer = setTimeout(() => {
            entry.target.classList.remove("is-visible");
            hideTimers.delete(entry.target);
          }, 60);
          hideTimers.set(entry.target, timer);
        }
      });
    },
    { threshold: [0, 0.08, 0.2, 0.45, 0.7], rootMargin: "-4% 0px -15% 0px" },
  );

  revealNodes.forEach((node) => observer.observe(node));
};

// ── Active nav highlight ──
let lastActiveId = null;
let pendingUpdate = null;

const updateActiveLink = (targetId) => {
  if (targetId === lastActiveId) return;
  navLinks.forEach((link) => link.classList.remove("active"));
  if (targetId) {
    const link = document.querySelector(`.nav-menu a[href="#${targetId}"]`);
    if (link) link.classList.add("active");
  }
  lastActiveId = targetId;
};

const updateActiveFromScroll = () => {
  if (pendingUpdate) clearTimeout(pendingUpdate);
  pendingUpdate = setTimeout(() => {
    const visibleSections = Array.from(sectionNodes)
      .map((section) => {
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        const intersectionRatio = Math.min(
          1,
          Math.max(
            0,
            (Math.min(rect.bottom, vh) - Math.max(rect.top, 0)) /
              (rect.bottom - rect.top),
          ),
        );
        return { section, rect, intersectionRatio };
      })
      .filter((item) => item.intersectionRatio > 0.08)
      .sort((a, b) => {
        if (b.intersectionRatio !== a.intersectionRatio)
          return b.intersectionRatio - a.intersectionRatio;
        return a.rect.top - b.rect.top;
      });

    updateActiveLink(
      visibleSections.length > 0 ? visibleSections[0].section.id : null,
    );
    pendingUpdate = null;
  }, 60);
};

const setupSectionHighlight = () => {
  if (!("IntersectionObserver" in window)) {
    window.addEventListener("scroll", updateActiveFromScroll, {
      passive: true,
    });
    return;
  }
  const observer = new IntersectionObserver(() => updateActiveFromScroll(), {
    threshold: [0.08, 0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88],
    rootMargin: `-${getOffset() + 100}px 0px -40% 0px`,
  });
  sectionNodes.forEach((section) => observer.observe(section));
  window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
};

// FIX: 11 mobile hamburger menu toggle
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
    link.addEventListener("click", () => {
      if (window.innerWidth <= 720) closeMenu();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
};

// ── Letter-by-letter interactive headers ──
const setupInteractiveHeaders = () => {
  const headers = Array.from(document.querySelectorAll(".interactive-header"));
  if (headers.length === 0) return;

  const isHoverSupported = window.matchMedia("(hover: hover)").matches;
  if (!isHoverSupported || prefersReducedMotion) return;

  // FIX: 3 share one mousemove listener + AbortController cleanup
  const controller = new AbortController();
  const { signal } = controller;
  const headerData = headers.map((header) => {
    const text = header.innerHTML;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;

    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        words.forEach((chunk) => {
          if (/^\s+$/.test(chunk)) {
            frag.appendChild(document.createTextNode(" "));
          } else {
            const wordSpan = document.createElement("span");
            wordSpan.className = "word";
            wordSpan.style.cssText = "display:inline-block;white-space:nowrap;";
            chunk.split("").forEach((letter) => {
              const span = document.createElement("span");
              span.className = "letter";
              span.style.cssText = "display:inline-block;position:relative;";
              span.textContent = letter;
              wordSpan.appendChild(span);
            });
            frag.appendChild(wordSpan);
          }
        });
        return frag;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(false);
        node.childNodes.forEach((child) => clone.appendChild(processNode(child)));
        return clone;
      }
      return node.cloneNode(true);
    };

    header.innerHTML = "";
    tempDiv.childNodes.forEach((child) => header.appendChild(processNode(child)));

    const letterElements = Array.from(header.querySelectorAll(".letter"));
    const resetLetters = () => {
      letterElements.forEach((letter) => {
        letter.style.transform = "translate(0, 0)";
      });
    };

    header.addEventListener("mouseleave", resetLetters, { signal });
    return { letterElements };
  });

  let animationFrameId = null;
  const onMouseMove = (event) => {
    const { clientX: mouseX, clientY: mouseY } = event;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(() => {
      headerData.forEach(({ letterElements }) => {
        letterElements.forEach((letter) => {
          const rect = letter.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = mouseX - cx;
          const dy = mouseY - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / 200);
          const mx = dist > 0 ? (dx / dist) * influence * 12 : 0;
          const my = dist > 0 ? (dy / dist) * influence * 12 : 0;
          letter.style.transform = `translate(${mx}px, ${my}px)`;
          letter.style.transition =
            "transform 120ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        });
      });
    });
  };

  document.addEventListener("mousemove", onMouseMove, {
    passive: true,
    signal,
  });

  window.addEventListener(
    "pagehide",
    () => {
      controller.abort();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    },
    { once: true },
  );
};

// ── 3D Carousel ──
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
  let index = 0;
  let autoTimer = null;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartTime = 0;
  let isTransitioning = false;

  const isHoverSupported = window.matchMedia("(hover: hover)").matches;

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
    indicators.forEach((ind, i) => ind.classList.toggle("active", i === index));
  };

  const nextCard = () => {
    if (isTransitioning) return;
    isTransitioning = true;
    index = (index + 1) % cards.length;
    applyStates();
    setTimeout(() => {
      isTransitioning = false;
    }, 700);
  };

  const prevCard = () => {
    if (isTransitioning) return;
    isTransitioning = true;
    index = (index - 1 + cards.length) % cards.length;
    applyStates();
    setTimeout(() => {
      isTransitioning = false;
    }, 700);
  };

  const goToCard = (newIndex) => {
    if (isTransitioning || newIndex === index) return;
    isTransitioning = true;
    index = newIndex;
    applyStates();
    setTimeout(() => {
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
    autoTimer = setInterval(nextCard, 6000);
  };

  prevBtn?.addEventListener("click", () => {
    prevCard();
    stopAuto();
    startAuto();
  });
  nextBtn?.addEventListener("click", () => {
    nextCard();
    stopAuto();
    startAuto();
  });
  indicators.forEach((indicator, i) => {
    indicator.addEventListener("click", () => {
      goToCard(i);
      stopAuto();
      startAuto();
    });
  });

  viewport.addEventListener("mouseenter", stopAuto);
  viewport.addEventListener("mouseleave", startAuto);

  // FIX: 4 removed no-op pointermove listener
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
    const duration = Date.now() - dragStartTime;
    const velocity = Math.abs(delta) / duration;
    isDragging = false;
    viewport.classList.remove("is-dragging");
    if (Math.abs(delta) > 30 || velocity > 0.5) {
      if (delta < 0) nextCard();
      else prevCard();
    }
    startAuto();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      prevCard();
      stopAuto();
      startAuto();
    }
    if (event.key === "ArrowRight") {
      nextCard();
      stopAuto();
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

  applyStates();
  startAuto();

  window.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });
};

// ── Init ──
window.addEventListener("scroll", setNavbarState, { passive: true });
window.addEventListener("resize", setNavbarState);
setNavbarState();
setupScrollProgress();
smoothAnchorNavigation();
// FIX: 11 initialize mobile nav toggle
setupMobileNav();
setupRevealObserver();
setupSectionHighlight();
setupInteractiveHeaders();
setupAwwwardsCarousel();

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

window.addEventListener("load", () => {
  if (location.hash)
    history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  setTimeout(updateActiveFromScroll, 300);
});
