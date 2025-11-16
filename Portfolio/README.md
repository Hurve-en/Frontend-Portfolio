Minimal Portfolio — Starter

Files:
- protfolio.html
- portfolio.css
- portfolio.js
- /assets/* (images, favicon, resume sample)

Features:
- Minimal responsive layout with hero, about, projects, experience, contact, footer.
- Primary CTA: ghost → filled hover with subtle lift.
- Secondary CTA: JS ripple on click.
- Icon buttons with micro-transforms.
- Project modal with focus trap + Esc to close.
- Lazy-loading of images (loading="lazy" on inline images; thumbnails preloaded).
- Theme toggle persisted to localStorage; supports light/dark tokens.
- Reduced-motion respected via prefers-reduced-motion.
- Accessible focus-visible styles, skip link, ARIA attributes on modal and live region for toasts.

Customization:
- Edit SITE_DATA and PROJECTS in scripts.js or switch to a `data/projects.json` and fetch in `renderProjects()`.
- Swap accent color in :root --accent.
- Replace assets with optimized WebP/SVG icons for better perf.

Deployment:
- Static — drop onto GitHub Pages, Netlify, or any static hosting.
- For contact form: replace the demo mailto with Netlify Forms or a serverless endpoint.

Notes on performance & accessibility:
- Use optimized images (webp) and small thumbnails.
- Keep in mind Lighthouse goals: remove large images, compress assets, and use caching for better score.

Enjoy — want a version with sample `projects.json` + 8 example projects and thumbnails next? I can generate that now.
