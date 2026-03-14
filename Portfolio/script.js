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

// Use navbar height as scroll offset for anchored navigation.
const getOffset = () => navbar?.offsetHeight || 86;

// Toggle compact/scrolled navbar styles based on scroll position.
const setNavbarState = () => {
  if (!navbar) return;
  navbar.classList.toggle("scrolled", window.scrollY > 18);
};

// Intercept in-page links and apply smooth scrolling with offset.
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
      // Force re-check after click scroll settles
      setTimeout(() => updateActiveFromScroll(), 400);
    });
  });
};

// Reveal observer
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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pending = hideTimers.get(entry.target);
          if (pending) {
            clearTimeout(pending);
            hideTimers.delete(entry.target);
          }
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
    {
      threshold: [0, 0.08, 0.2, 0.45, 0.7],
      rootMargin: "-4% 0px -15% 0px",
    },
  );

  revealNodes.forEach((node) => observer.observe(node));
};

// ──────────────────────────────────────────────
// STABLE ACTIVE NAV HIGHLIGHT
// ──────────────────────────────────────────────
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
        // Primary: more visible first
        if (b.intersectionRatio !== a.intersectionRatio) {
          return b.intersectionRatio - a.intersectionRatio;
        }
        // Tie-breaker: closer to top of viewport
        return a.rect.top - b.rect.top;
      });

    let bestId = null;
    if (visibleSections.length > 0) {
      bestId = visibleSections[0].section.id;
    }

    updateActiveLink(bestId);
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

  const observer = new IntersectionObserver(
    () => {
      updateActiveFromScroll();
    },
    {
      threshold: [0.08, 0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88],
      rootMargin: `-${getOffset() + 100}px 0px -40% 0px`,
    },
  );

  sectionNodes.forEach((section) => observer.observe(section));

  window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
};

// ──────────────────────────────────────────────
// AWWWARDS-STYLE 3D CAROUSEL WITH SIDE ARROWS
// ──────────────────────────────────────────────
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

  // State management
  const states = ["active", "prev1", "next1", "prev2", "next2"];
  let index = 0;
  let autoTimer = null;
  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  let isTransitioning = false;

  // Detect if device supports hover
  const isHoverSupported = window.matchMedia("(hover: hover)").matches;

  // Apply 3D transforms and state classes to cards
  const applyStates = () => {
    const total = cards.length;
    cards.forEach((card) => {
      card.classList.remove(...states);
      card.classList.remove("is-revealed");
    });

    const prev2 = (index - 2 + total) % total;
    const prev1 = (index - 1 + total) % total;
    const next1 = (index + 1) % total;
    const next2 = (index + 2) % total;

    cards[index].classList.add("active");
    cards[prev1].classList.add("prev1");
    cards[next1].classList.add("next1");
    cards[prev2].classList.add("prev2");
    cards[next2].classList.add("next2");

    // Update indicators
    indicators.forEach((ind, i) => {
      ind.classList.toggle("active", i === index);
    });
  };

  // Navigate to next card
  const nextCard = () => {
    if (isTransitioning) return;
    isTransitioning = true;
    index = (index + 1) % cards.length;
    applyStates();
    setTimeout(() => {
      isTransitioning = false;
    }, 700); // Match CSS transition duration
  };

  // Navigate to previous card
  const prevCard = () => {
    if (isTransitioning) return;
    isTransitioning = true;
    index = (index - 1 + cards.length) % cards.length;
    applyStates();
    setTimeout(() => {
      isTransitioning = false;
    }, 700); // Match CSS transition duration
  };

  // Navigate to specific card
  const goToCard = (newIndex) => {
    if (isTransitioning || newIndex === index) return;
    isTransitioning = true;
    index = newIndex;
    applyStates();
    setTimeout(() => {
      isTransitioning = false;
    }, 700);
  };

  // Auto-play management
  const stopAuto = () => {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  };

  const startAuto = () => {
    if (prefersReducedMotion) return;
    stopAuto();
    autoTimer = setInterval(nextCard, 6000); // Auto-advance every 6 seconds
  };

  // Button click handlers
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

  // Indicator click handlers
  indicators.forEach((indicator, i) => {
    indicator.addEventListener("click", () => {
      goToCard(i);
      stopAuto();
      startAuto();
    });
  });

  // Pause auto-play on hover
  viewport.addEventListener("mouseenter", stopAuto);
  viewport.addEventListener("mouseleave", startAuto);

  // ────────────────────────────────────────────
  // DRAG & SWIPE INTERACTIONS
  // ────────────────────────────────────────────

  let dragStartX = 0;
  let dragStartTime = 0;

  viewport.addEventListener("pointerdown", (event) => {
    isDragging = true;
    dragStartX = event.clientX;
    dragStartTime = Date.now();
    startX = event.clientX;
    currentX = 0;
    viewport.classList.add("is-dragging");
    stopAuto();
  });

  window.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    currentX = event.clientX - dragStartX;
  });

  window.addEventListener("pointerup", (event) => {
    if (!isDragging) return;

    const delta = event.clientX - dragStartX;
    const duration = Date.now() - dragStartTime;
    const velocity = Math.abs(delta) / duration;

    isDragging = false;
    viewport.classList.remove("is-dragging");

    // Swipe threshold: 30px or velocity > 0.5px/ms
    if (Math.abs(delta) > 30 || velocity > 0.5) {
      if (delta < 0)
        nextCard(); // Drag left → next
      else prevCard(); // Drag right → previous
    }

    startAuto();
  });

  // Keyboard navigation
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

  // ────────────────────────────────────────────
  // HOVER REVEAL (Desktop) & TAP-TO-REVEAL (Mobile)
  // ────────────────────────────────────────────

  cards.forEach((card) => {
    if (!isHoverSupported) {
      card.addEventListener("click", (event) => {
        // Only toggle if clicking on the active card
        if (!card.classList.contains("active")) return;

        event.stopPropagation();
        card.classList.toggle("is-revealed");
      });
    }
  });

  // Close reveal on outside click (mobile)
  document.addEventListener("click", (event) => {
    if (!isHoverSupported && !event.target.closest(".carousel-card")) {
      cards.forEach((card) => card.classList.remove("is-revealed"));
    }
  });

  // Initialize carousel
  applyStates();
  startAuto();

  // Pause when page is hidden, resume when visible
  window.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });
};

// Global listeners and one-time initialization.
window.addEventListener("scroll", setNavbarState, { passive: true });
window.addEventListener("resize", setNavbarState);
setNavbarState();
smoothAnchorNavigation();
setupRevealObserver();
setupSectionHighlight();
setupAwwwardsCarousel();

// Ensure page always loads at the top (hero) on refresh.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
  if (location.hash) {
    history.replaceState(null, "", location.pathname + location.search);
  }
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  // Initial highlight
  setTimeout(updateActiveFromScroll, 300);
});
