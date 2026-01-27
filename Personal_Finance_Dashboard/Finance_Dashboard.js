// ==================== NAVIGATION ====================
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    // Remove active class from all links
    document
      .querySelectorAll(".nav-link")
      .forEach((l) => l.classList.remove("active"));

    // Add active class to clicked link
    link.classList.add("active");

    // Smooth scroll to section
    const section = link.getAttribute("href");
    document.querySelector(section)?.scrollIntoView({ behavior: "smooth" });
  });
});

// ==================== SCROLL EFFECTS ====================
let lastScroll = 0;
const sidebar = document.querySelector(".sidebar");

window.addEventListener("scroll", () => {
  lastScroll = window.scrollY;

  // Update active nav based on scroll position
  const sections = document.querySelectorAll("section");
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top >= 0 && rect.top < 300) {
      const sectionId = section.id;
      document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === "#" + sectionId) {
          link.classList.add("active");
        }
      });
    }
  });
});

// ==================== SMOOTH ANIMATIONS ====================
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  },
  { threshold: 0.1 },
);

// Observe all cards for fade-in effect
document
  .querySelectorAll(".account-card, .insight-card, .metric")
  .forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "all 600ms ease";
    observer.observe(el);
  });

// ==================== KEYBOARD NAVIGATION ====================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // Close any open modals
  }
});

console.log("✓ Fintech Dashboard Ready");
