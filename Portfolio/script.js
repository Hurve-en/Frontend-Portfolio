// Cache common DOM references used across interactions.
const navbar = document.querySelector(".navbar");
const navLinks = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
const revealNodes = Array.from(document.querySelectorAll("[data-reveal]"));
const sectionNodes = Array.from(document.querySelectorAll("main section[id]"));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const animatedHeading = null;

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
      const top = target.getBoundingClientRect().top + window.scrollY - getOffset() + 1;
      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  });
};

// Reveal elements once when they enter the viewport.
const setupRevealObserver = () => {
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
    const isMostlyVisible = entry.intersectionRatio > 0.14;
    if (isMostlyVisible) {
      entry.target.classList.add("is-visible");
    } else {
      entry.target.classList.remove("is-visible");
        }
      });
    },
    {
      threshold: [0, 0.15, 0.35],
      rootMargin: "-10% 0px -10% 0px",
    },
  );

  revealNodes.forEach((node) => observer.observe(node));
};

// Keep the current section nav link highlighted while scrolling.
const setupSectionHighlight = () => {
  if (!("IntersectionObserver" in window)) return;

  const map = new Map(
    navLinks.map((link) => [link.getAttribute("href")?.slice(1), link]),
  );

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const id = visible.target.id;

      navLinks.forEach((link) => link.classList.remove("active"));
      map.get(id)?.classList.add("active");
    },
    {
      threshold: [0.2, 0.55, 0.9],
      rootMargin: `-${getOffset() + 12}px 0px -45% 0px`,
    },
  );

  sectionNodes.forEach((section) => observer.observe(section));
};

// Global listeners and one-time initialization.
window.addEventListener("scroll", setNavbarState, { passive: true });
window.addEventListener("resize", setNavbarState);

setNavbarState();
smoothAnchorNavigation();
setupRevealObserver();
setupSectionHighlight();

// Ensure page always loads at the top (hero) on refresh.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
  // Clear any hash to avoid loading mid-page.
  if (location.hash) {
    history.replaceState(null, "", location.pathname + location.search);
  }
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
});

// (Interactive heading animation removed by request)
