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
// NAVBAR SCROLL EFFECT
// ============================================

let lastScrollTop = 0;
const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
  let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (scrollTop > 100) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }

  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// ============================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ============================================

const observerOptions = {
  threshold: 0.15,
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

// Observe elements for animation
document.querySelectorAll(".project-item, .about-item").forEach((item) => {
  item.style.opacity = "0";
  item.style.transform = "translateY(40px)";
  item.style.transition =
    "opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)";
  observer.observe(item);
});

// ============================================
// DYNAMIC BACKGROUND EFFECT
// ============================================

document.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;

  document.body.style.setProperty("--mouse-x", x + "%");
  document.body.style.setProperty("--mouse-y", y + "%");
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
      link.style.color = "#00d9ff";
      link.style.textShadow = "0 0 20px rgba(0, 217, 255, 0.5)";
    } else {
      link.style.textShadow = "none";
    }
  });

  // Parallax effect on hero
  const hero = document.querySelector(".hero");
  if (hero && window.pageYOffset < window.innerHeight) {
    hero.style.transform = `translateY(${window.pageYOffset * 0.4}px)`;
  }
});

// ============================================
// ENHANCED PROJECT CARD HOVER
// ============================================

document.querySelectorAll(".project-item").forEach((item, index) => {
  const visualElement = item.querySelector(".project-visual");

  item.addEventListener("mouseenter", function () {
    // Scale effect
    const img = this.querySelector(".project-image img");
    if (img) {
      img.style.transform = "scale(1.15) rotate(1.5deg)";
    }

    // Add glow effect
    visualElement.style.boxShadow =
      "0 0 40px rgba(255, 20, 147, 0.5), 0 0 80px rgba(0, 217, 255, 0.3)";
    visualElement.style.borderColor = "rgba(0, 217, 255, 0.6)";
  });

  item.addEventListener("mouseleave", function () {
    const img = this.querySelector(".project-image img");
    if (img) {
      img.style.transform = "scale(1) rotate(0deg)";
    }

    visualElement.style.boxShadow = "none";
    visualElement.style.borderColor = "rgba(255, 20, 147, 0.2)";
  });
});

// ============================================
// TAG RIPPLE EFFECT
// ============================================

document.querySelectorAll(".tag").forEach((tag) => {
  tag.addEventListener("click", function (e) {
    const rect = this.getBoundingClientRect();
    const ripple = document.createElement("span");

    ripple.style.position = "absolute";
    ripple.style.left = e.clientX - rect.left + "px";
    ripple.style.top = e.clientY - rect.top + "px";
    ripple.style.width = "0";
    ripple.style.height = "0";
    ripple.style.borderRadius = "50%";
    ripple.style.background = "rgba(0, 217, 255, 0.5)";
    ripple.style.transform = "scale(0)";
    ripple.style.animation = "rippleAnimation 0.6s ease-out";
    ripple.style.pointerEvents = "none";

    this.style.position = "relative";
    this.style.overflow = "hidden";
    this.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
});

// ============================================
// PREFERS REDUCED MOTION
// ============================================

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (!prefersReducedMotion) {
  // Add animations only if user hasn't disabled motion preferences
  const style = document.createElement("style");
  style.textContent = `
        @keyframes rippleAnimation {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            100% {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
  document.head.appendChild(style);
}

// ============================================
// PERFORMANCE - THROTTLE SCROLL EVENTS
// ============================================

let ticking = false;
function handleScroll() {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      // Scroll logic already handled above
      ticking = false;
    });
    ticking = true;
  }
}

window.addEventListener("scroll", handleScroll);

// ============================================
// PAGE LOAD COMPLETE
// ============================================

window.addEventListener("load", () => {
  document.body.style.opacity = "1";
  console.log("🚀 Portfolio loaded - Ready to create magic!");
});

// ============================================
// KEYBOARD NAVIGATION
// ============================================

document.querySelectorAll("a, button").forEach((element) => {
  element.addEventListener("focus", function () {
    this.style.outline = "2px solid #00d9ff";
    this.style.outlineOffset = "4px";
  });

  element.addEventListener("blur", function () {
    this.style.outline = "none";
  });
});

// ============================================
// LAZY LOAD IMAGES
// ============================================

if ("IntersectionObserver" in window) {
  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          img.classList.add("loaded");
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: "50px",
    },
  );

  document.querySelectorAll("img").forEach((img) => {
    imageObserver.observe(img);
  });
}

// ============================================
// CUSTOM CURSOR (Optional Enhancement)
// ============================================

const createCursor = () => {
  const cursorDot = document.createElement("div");
  cursorDot.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        background: #00d9ff;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        mix-blend-mode: screen;
        opacity: 0.7;
    `;

  document.body.appendChild(cursorDot);

  document.addEventListener("mousemove", (e) => {
    cursorDot.style.left = e.clientX - 4 + "px";
    cursorDot.style.top = e.clientY - 4 + "px";
  });
};

// Uncomment to enable custom cursor
// createCursor();

console.log("✨ All interactions loaded and ready!");
