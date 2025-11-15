// scripts.js
// Module pattern: content + rendering + interactions
// Keep content editable in SITE_DATA and PROJECTS arrays.
// - Theme persisted in localStorage
// - Render projects, skills, timeline
// - Modal with focus trap
// - Ripple effect for .js-ripple elements
// - Lazy-load image placeholders
// - Respect prefers-reduced-motion

const SITE_DATA = {
  name: "Hurve-en Veloso",
  title: "Full stack developer & product designer",
  email: "velosohurveenrayford@gmail.com",
  resume: "assets/Hurveen-Resume.pdf",
  skills: ["HTML", "CSS", "JavaScript", "React", "Next.js", "Java","Figma", "Git", "GitHub"],
  experience: [
    { company: "Acme Co", role: "Senior Product Designer", dates: "2022 — Present", blurb: "Designing accessible product experiences." },
    { company: "Pixel Labs", role: "Frontend Engineer", dates: "2019 — 2022", blurb: "Built components and design systems." },
  ]
};

// Sample projects — replace with data/projects.json or fetch for tiny CMS
const PROJECTS = [
  {
    id: "p-1",
    title: "Portfolio Revamp",
    desc: "A minimal portfolio with motion and accessible patterns.",
    tech: ["HTML", "CSS", "JS"],
    thumb: "assets/thumb-portfolio.jpg",
    images: ["assets/screen-1.jpg","assets/screen-2.jpg"],
    live: "#",
    repo: "#"
  },
  {
    id: "p-2",
    title: "Dashboard Kit",
    desc: "A small component library for dashboards.",
    tech: ["React","TypeScript"],
    thumb: "assets/thumb-dashboard.jpg",
    images: ["assets/screen-3.jpg"],
    live: "#",
    repo: "#"
  }
];

// Utility: prefers-reduced-motion
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Theme ---------- */
const themeKey = "site:theme";
function initTheme(){
  const saved = localStorage.getItem(themeKey);
  const root = document.documentElement;
  const body = document.body;
  if(saved){
    root.setAttribute("data-theme", saved);
    body.setAttribute("data-theme", saved);
  } else {
    // default to dark; if user prefers light, choose light
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    const theme = prefersLight ? "light" : "dark";
    root.setAttribute("data-theme", theme);
    body.setAttribute("data-theme", theme);
  }

  const btn = document.getElementById("theme-toggle");
  btn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.body.setAttribute("data-theme", next);
    localStorage.setItem(themeKey, next);
    // small visual feedback
    btn.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: 350, easing: "ease-out" });
  });
}

/* ---------- Render content ---------- */
function renderSkills(){
  const ul = document.getElementById("skills-list");
  ul.innerHTML = "";
  SITE_DATA.skills.forEach(s => {
    const li = document.createElement("li");
    li.className = "badge";
    li.textContent = s;
    ul.appendChild(li);
  });
}

function renderExperience(){
  const el = document.getElementById("timeline");
  el.innerHTML = "";
  SITE_DATA.experience.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${item.role}</strong> — <span class="text-muted">${item.company}</span><div class="text-muted">${item.dates}</div><p class="text-muted">${item.blurb}</p>`;
    el.appendChild(li);
  });
}

/* ---------- Projects ---------- */
function renderProjects(){
  const grid = document.getElementById("projects-grid");
  grid.innerHTML = "";
  PROJECTS.forEach(p => {
    const card = document.createElement("article");
    card.className = "card project-card";
    card.setAttribute("tabindex","0");
    card.innerHTML = `
      <div class="project-thumb" role="img" aria-label="${p.title}" data-src="${p.thumb}"></div>
      <div class="project-meta">
        <div>
          <h3 style="margin:0">${p.title}</h3>
          <p class="text-muted" style="margin:4px 0 8px">${p.desc}</p>
          <div>${p.tech.map(t => `<span class="badge" title="${t}">${t}</span>`).join(" ")}</div>
        </div>
        <div class="project-links">
          <a class="icon-btn" href="${p.live}" aria-label="Open live demo" target="_blank" rel="noopener">⤴</a>
          <button class="icon-btn open-project" data-id="${p.id}" aria-haspopup="dialog" aria-expanded="false">Details</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // lazy load thumbs
  const thumbs = document.querySelectorAll(".project-thumb");
  thumbs.forEach(t => observeThumb(t));

  // attach detail button handlers
  document.querySelectorAll(".open-project").forEach(btn => {
    btn.addEventListener("click", (e) => openProjectModal(e.currentTarget.dataset.id, e.currentTarget));
  });
}

/* Lazy load thumbnails with fade-in */
function observeThumb(el){
  const src = el.getAttribute("data-src");
  if(!src) return;
  const img = new Image();
  img.loading = "lazy";
  img.src = src;
  img.onload = () => {
    el.style.backgroundImage = `url('${src}')`;
    el.classList.add("loaded");
  };
  // For better perf, could use IntersectionObserver — but preloading is fine for this starter.
}

/* ---------- Modal (focus trap + Esc to close) ---------- */
const modal = document.getElementById("project-modal");
const modalPanel = modal.querySelector(".modal-panel");
let lastFocused = null;

function openProjectModal(id, openerEl){
  const project = PROJECTS.find(p => p.id === id);
  if(!project) return;
  lastFocused = openerEl || document.activeElement;

  const content = modal.querySelector("#modal-content");
  content.innerHTML = `
    <h2 id="modal-title">${project.title}</h2>
    <p class="text-muted">${project.desc}</p>
    <div class="modal-images">${(project.images || []).map(src => `<img src="${src}" loading="lazy" alt="${project.title} screenshot" style="max-width:100%;border-radius:8px;margin-bottom:8px">`).join("")}</div>
    <p>${project.tech.map(t => `<span class="badge">${t}</span>`).join(" ")}</p>
    <p><a class="btn btn-primary" href="${project.live}" target="_blank" rel="noopener">View live</a> <a class="btn btn-ghost" href="${project.repo}" target="_blank" rel="noopener">Repository</a></p>
  `;

  modal.setAttribute("aria-hidden","false");
  modal.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeModal));
  trapFocus(modal);
  // mark the opener's aria-expanded
  if(openerEl) openerEl.setAttribute("aria-expanded","true");

  // Esc to close
  window.addEventListener("keydown", onKeyDownModal);
}

function closeModal(){
  modal.setAttribute("aria-hidden","true");
  releaseFocusTrap();
  if(lastFocused && lastFocused.focus) lastFocused.focus();
  // remove aria-expanded from any opener
  document.querySelectorAll(".open-project[aria-expanded]").forEach(el => el.setAttribute("aria-expanded","false"));
  window.removeEventListener("keydown", onKeyDownModal);
}

function onKeyDownModal(e){
  if(e.key === "Escape") closeModal();
}

/* Focus trap (simple) */
let focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
let firstTabbable, lastTabbable;
function trapFocus(container){
  const focusables = Array.from(container.querySelectorAll(focusableElementsString)).filter(el => el.offsetParent !== null);
  if(focusables.length === 0) return;
  firstTabbable = focusables[0];
  lastTabbable = focusables[focusables.length - 1];
  // focus modal
  firstTabbable.focus();
  container.addEventListener('keydown', handleTrap);
}
function handleTrap(e){
  if(e.key !== 'Tab') return;
  if(e.shiftKey){
    if(document.activeElement === firstTabbable){ e.preventDefault(); lastTabbable.focus(); }
  } else {
    if(document.activeElement === lastTabbable){ e.preventDefault(); firstTabbable.focus(); }
  }
}
function releaseFocusTrap(){
  modal.removeEventListener('keydown', handleTrap);
}

/* ---------- Ripple effect for secondary button ---------- */
function initRipples(){
  document.querySelectorAll('[data-ripple]').forEach(btn => {
    btn.addEventListener('click', function(e){
      if(prefersReduced) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size/2;
      const y = e.clientY - rect.top - size/2;
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}

/* ---------- Contact form: simple toast (aria-live) ---------- */
function initContact(){
  const form = document.getElementById("contact-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Simple client-side validation
    const name = form.querySelector("[name='name']").value.trim();
    const email = form.querySelector("[name='email']").value.trim();
    const msg = form.querySelector("[name='message']").value.trim();
    if(!name || !email || !msg){
      announce("Please complete all fields.");
      return;
    }
    // For static sites: mailto fallback or integrate with Netlify/Forms, etc.
    announce("Message ready to send. This demo uses a mailto fallback.");
    window.location.href = `mailto:${SITE_DATA.email}?subject=${encodeURIComponent("Portfolio contact from " + name)}&body=${encodeURIComponent(msg)}`;
    form.reset();
  });
}

/* small aria-live announcer */
function announce(text){
  let el = document.getElementById("aria-announcer");
  if(!el){
    el = document.createElement("div");
    el.id = "aria-announcer";
    el.setAttribute("aria-live","polite");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
  }
  el.textContent = text;
}

/* ---------- Small UX helpers ---------- */
function initYear(){
  const y = new Date().getFullYear();
  document.getElementById("year").textContent = y;
}

/* Smooth scroll (native if available) */
function initSmoothScroll(){
  try {
    document.documentElement.style.scrollBehavior = "smooth";
  } catch(e){}
}

/* Setup keyboard / accessibility for project cards (Enter to open) */
function initCardKeyboard(){
  document.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && (document.activeElement && document.activeElement.classList.contains("project-card"))){
      const btn = document.activeElement.querySelector(".open-project");
      if(btn) btn.click();
    }
  });
}

/* ---------- Initialize everything ---------- */
function init(){
  initTheme();
  renderSkills();
  renderExperience();
  renderProjects();
  initRipples();
  initContact();
  initYear();
  initSmoothScroll();
  initCardKeyboard();

  // hook close when clicking backdrop
  modal.addEventListener("click", (ev) => {
    if(ev.target.matches(".modal-backdrop")) closeModal();
  });

  // Optional: replace this with fetch('data/projects.json') to load projects externally.
}

document.addEventListener("DOMContentLoaded", init);
