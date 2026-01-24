// ============================================
// SMOOTH NAVIGATION & SCROLL BEHAVIOR
// ============================================

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href !== "#" && document.querySelector(href)) {
      e.preventDefault();
      const target = document.querySelector(href);
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// ============================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ============================================

const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe project and about items
document.querySelectorAll(".project-item, .about-item").forEach((item) => {
  item.style.opacity = "0";
  item.style.transform = "translateY(20px)";
  item.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  observer.observe(item);
});

// ============================================
// ACTIVE NAVIGATION HIGHLIGHT
// ============================================

window.addEventListener("scroll", () => {
  let current = "";
  const sections = document.querySelectorAll("section");

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    if (window.pageYOffset >= sectionTop - 200) {
      current = section.getAttribute("id");
    }
  });

  document.querySelectorAll(".nav-menu a").forEach((link) => {
    link.style.color = "";
    if (link.getAttribute("href") === `#${current}`) {
      link.style.color = "var(--accent-gold)";
    }
  });

  // Parallax effect on hero
  const hero = document.querySelector(".hero");
  if (window.pageYOffset < window.innerHeight) {
    hero.style.transform = `translateY(${window.pageYOffset * 0.3}px)`;
  }
});

// ============================================
// SMOOTH NAVBAR BACKGROUND ON SCROLL
// ============================================

window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.pageYOffset > 50) {
    navbar.style.background = "rgba(10, 10, 10, 0.95)";
    navbar.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.3)";
  } else {
    navbar.style.background = "rgba(10, 10, 10, 0.85)";
    navbar.style.boxShadow = "none";
  }
});

// ============================================
// PROJECT CARD HOVER EFFECTS
// ============================================

document.querySelectorAll(".project-item").forEach((item) => {
  item.addEventListener("mouseenter", function () {
    const img = this.querySelector(".project-image img");
    if (img) {
      img.style.transform = "scale(1.08)";
    }
  });

  item.addEventListener("mouseleave", function () {
    const img = this.querySelector(".project-image img");
    if (img) {
      img.style.transform = "scale(1)";
    }
  });
});

// ============================================
// PREFERS REDUCED MOTION CHECK
// ============================================

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (!prefersReducedMotion) {
  // Add subtle animations only if user hasn't disabled motion preferences
  document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll("h1, h2, .section-header p");
    elements.forEach((el, index) => {
      el.style.animation = `fadeInUp 0.8s ease-out backwards`;
      el.style.animationDelay = `${index * 0.1}s`;
    });
  });
}

// ============================================
// PAGE LOAD ANIMATION
// ============================================

window.addEventListener("load", () => {
  document.body.style.opacity = "1";
});

// ============================================
// KEYBOARD NAVIGATION ENHANCEMENT
// ============================================

document.querySelectorAll("a").forEach((link) => {
  link.addEventListener("focus", function () {
    this.style.outline = "2px solid #d4af37";
    this.style.outlineOffset = "2px";
  });

  link.addEventListener("blur", function () {
    this.style.outline = "none";
  });
});

console.log("Portfolio loaded - Ready to create magic ✨");
