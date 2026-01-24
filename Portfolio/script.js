// ============================================
// SMOOTH NAVIGATION
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
// ADVANCED NAVBAR SCROLL EFFECT
// ============================================

let lastScrollTop = 0;
const navbar = document.querySelector(".navbar");
let lastNavbarState = false;

window.addEventListener(
  "scroll",
  () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 100 && !lastNavbarState) {
      navbar.classList.add("scrolled");
      lastNavbarState = true;
    } else if (scrollTop <= 100 && lastNavbarState) {
      navbar.classList.remove("scrolled");
      lastNavbarState = false;
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  },
  { passive: true },
);

// ============================================
// SOPHISTICATED INTERSECTION OBSERVER
// ============================================

const observerOptions = {
  threshold: 0.15,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all elements
document
  .querySelectorAll(
    ".project-item, .about-item, .section-header, .about-text p",
  )
  .forEach((item) => {
    observer.observe(item);
  });

// ============================================
// ADVANCED PARALLAX SCROLL EFFECT
// ============================================

window.addEventListener(
  "scroll",
  () => {
    const scrollY = window.pageYOffset;

    // Hero parallax with parallax layers
    const hero = document.querySelector(".hero");
    if (hero && scrollY < window.innerHeight * 1.5) {
      hero.style.transform = `translateY(${scrollY * 0.5}px)`;
    }

    // Project cards subtle parallax
    const projects = document.querySelectorAll(".project-item");
    projects.forEach((project, index) => {
      const rect = project.getBoundingClientRect();
      const distanceFromCenter = rect.top - window.innerHeight / 2;
      const parallaxAmount = distanceFromCenter * 0.1;

      project.style.transform = `translateY(${parallaxAmount * -1}px)`;
    });

    // About items parallax
    const aboutItems = document.querySelectorAll(".about-item");
    aboutItems.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const distanceFromCenter = rect.top - window.innerHeight / 2;
      const parallaxAmount = distanceFromCenter * 0.08;

      item.style.transform = `translateY(${parallaxAmount * -1}px)`;
    });
  },
  { passive: true },
);

// ============================================
// ADVANCED PROJECT CARD HOVER EFFECTS
// ============================================

document.querySelectorAll(".project-item").forEach((item) => {
  const visualElement = item.querySelector(".project-visual");
  const imageElement = item.querySelector(".project-image img");

  item.addEventListener("mouseenter", function () {
    // Image zoom with rotation
    if (imageElement) {
      imageElement.style.transform = "scale(1.1) rotate(0.5deg)";
    }

    // Enhanced border and shadow
    visualElement.style.borderColor = "rgba(45, 106, 79, 0.35)";
    visualElement.style.boxShadow = "0 30px 60px rgba(45, 106, 79, 0.15)";

    // Stagger tag animations
    const tags = this.querySelectorAll(".tag");
    tags.forEach((tag, index) => {
      setTimeout(() => {
        tag.style.transform = "translateY(-4px) scale(1.08)";
      }, index * 40);
    });
  });

  item.addEventListener("mouseleave", function () {
    if (imageElement) {
      imageElement.style.transform = "scale(1)";
    }

    visualElement.style.borderColor = "rgba(45, 106, 79, 0.2)";
    visualElement.style.boxShadow = "none";

    // Reset tags
    const tags = this.querySelectorAll(".tag");
    tags.forEach((tag) => {
      tag.style.transform = "translateY(0)";
    });
  });
});

// ============================================
// ADVANCED TAG INTERACTIONS
// ============================================

document.querySelectorAll(".tag").forEach((tag) => {
  tag.addEventListener("mouseenter", function () {
    this.style.transform = "translateY(-4px) scale(1.1)";
    this.style.background = "#2d6a4f";
    this.style.color = "#f0f9ff";
    this.style.borderColor = "#2d6a4f";
    this.style.boxShadow = "0 8px 20px rgba(45, 106, 79, 0.2)";
  });

  tag.addEventListener("mouseleave", function () {
    this.style.transform = "translateY(0) scale(1)";
    this.style.background = "rgba(45, 106, 79, 0.1)";
    this.style.color = "";
    this.style.borderColor = "rgba(45, 106, 79, 0.25)";
    this.style.boxShadow = "none";
  });
});

// ============================================
// ACTIVE NAV HIGHLIGHTING WITH SCROLL PROGRESS
// ============================================

window.addEventListener(
  "scroll",
  () => {
    let current = "";
    const sections = document.querySelectorAll("section");

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      if (window.pageYOffset >= sectionTop - 300) {
        current = section.getAttribute("id");
      }
    });

    document.querySelectorAll(".nav-menu a").forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
        link.style.color = "#2d6a4f";
      } else {
        link.style.color = "";
      }
    });
  },
  { passive: true },
);

// ============================================
// SCROLL PROGRESS INDICATOR
// ============================================

const updateScrollProgress = () => {
  const windowHeight =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  const scrolled = (window.scrollY / windowHeight) * 100;
  document.documentElement.style.setProperty(
    "--scroll-progress",
    scrolled + "%",
  );
};

window.addEventListener("scroll", updateScrollProgress, { passive: true });

// ============================================
// ADVANCED REVEAL ANIMATIONS ON SCROLL
// ============================================

const revealElements = () => {
  const elements = document.querySelectorAll(
    ".scroll-fade-up, .project-item, .about-item, .section-header",
  );

  elements.forEach((element) => {
    const elementTop = element.getBoundingClientRect().top;
    const elementVisible = 150;

    if (
      elementTop < window.innerHeight - elementVisible &&
      !element.classList.contains("in-view")
    ) {
      element.classList.add("in-view");

      // Trigger additional animations for child elements
      const children = element.querySelectorAll("*");
      children.forEach((child, index) => {
        if (child.textContent) {
          child.style.animation = `fadeInUp 0.8s ease-out ${0.1 + index * 0.05}s forwards`;
        }
      });
    }
  });
};

// Initial check
revealElements();

// Check on scroll with throttle
let scrollThrottle = false;
window.addEventListener(
  "scroll",
  () => {
    if (!scrollThrottle) {
      revealElements();
      scrollThrottle = true;
      setTimeout(() => (scrollThrottle = false), 100);
    }
  },
  { passive: true },
);

// ============================================
// SMOOTH COUNTER ANIMATIONS
// ============================================

const animateCounter = (element, target, duration = 2000) => {
  let start = 0;
  const increment = target / (duration / 16);

  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
};

// ============================================
// ADVANCED HOVER TEXT EFFECT
// ============================================

document
  .querySelectorAll(".project-title, .contact-email")
  .forEach((element) => {
    element.addEventListener("mouseenter", function () {
      this.style.letterSpacing = "1px";
    });

    element.addEventListener("mouseleave", function () {
      this.style.letterSpacing = "-0.5px";
    });
  });

// ============================================
// BLUR UP EFFECT FOR IMAGES
// ============================================

const images = document.querySelectorAll(".project-image img");
images.forEach((img) => {
  img.addEventListener("load", function () {
    this.style.filter = "blur(0)";
    this.style.transition = "filter 0.6s ease-out";
  });

  if (img.complete) {
    img.style.filter = "blur(0)";
  }
});

// ============================================
// MOUSE MOVE PARALLAX EFFECT
// ============================================

let mouseX = 0;
let mouseY = 0;

document.addEventListener("mousemove", (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = (e.clientY / window.innerHeight) * 2 - 1;

  // Apply subtle parallax to hero
  const hero = document.querySelector(".hero-content");
  if (hero) {
    hero.style.transform = `translate(${mouseX * 10}px, ${mouseY * 10}px)`;
  }
});

// ============================================
// KEYBOARD ACCESSIBILITY & FOCUS STATES
// ============================================

document.querySelectorAll("a, button").forEach((element) => {
  element.addEventListener("focus", function () {
    this.style.outline = "2px solid #2d6a4f";
    this.style.outlineOffset = "4px";
  });

  element.addEventListener("blur", function () {
    this.style.outline = "none";
  });
});

// ============================================
// PREFERS REDUCED MOTION
// ============================================

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
if (prefersReducedMotion) {
  document.documentElement.style.scrollBehavior = "auto";
  document.querySelectorAll("*").forEach((el) => {
    el.style.animation = "none !important";
    el.style.transition = "none !important";
  });
}

// ============================================
// PERFORMANCE OPTIMIZATION - REQUEST ANIMATION FRAME
// ============================================

let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        revealElements();
        ticking = false;
      });
      ticking = true;
    }
  },
  { passive: true },
);

// ============================================
// PAGE LOAD COMPLETE
// ============================================

window.addEventListener("load", () => {
  document.body.style.opacity = "1";
  console.log("🚀 Advanced portfolio loaded - All animations ready!");
});

console.log("✨ Advanced animations and interactions loaded successfully!");
