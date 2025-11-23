# Daily Journal App — Project Plan & Starter Guide

A calm, aesthetic **Daily Journal App**: editable entries, mood tagging, search & filter by date, soft typography & page transitions, and export-to-PDF. This document gives a clear spec, file structure, UI/UX guidance, and starter code snippets you can copy/paste to begin implementation.

---

## Project Summary

Build a front-end only journal web app where users can add daily entries, tag each entry with a mood emoji, edit entries, search/filter by date or text, and export selected entries (or an entry) as a PDF. Use `localStorage` for persistence. Focus on a soft, minimalist aesthetic and accessible interactions.

---

## Core Features

- Create / Edit / Delete journal entries
- Mood tagging (emoji) per entry
- Search by text and filter by date range or mood
- Sort entries (newest / oldest)
- Entry detail view with edit mode
- Export entry or filtered set to PDF (via `jsPDF` or `html2pdf`)
- Soft transitions and micro-interactions
- Responsive layout and accessible controls
- Persistence using `localStorage`

---

## Design & UX Notes

- **Style**: soft pastels or muted gradient background, rounded cards (12–18px), subtle shadows.
- **Typography**: Inter or Poppins for body; larger, readable heading scale.
- **Spacing**: consistent spacing tokens (`--space-sm`, `--space-md`, `--space-lg`).
- **Micro-interactions**: button hover scale, card elevation on hover, smooth fades for modal and list updates.
- **Reduced motion**: respect `prefers-reduced-motion`.
- **Accessibility**: visible focus styles, labels for inputs, keyboard operability, `aria-live` for transient messages.

---

## Data Model (client-side)

Store an array of entries in localStorage under key `journal:entries:v1`.

Each entry:
```json
{
  "id": "2025-11-23T13:45:21-uuid",
  "date": "2025-11-23",         // YYYY-MM-DD for filtering/calendar
  "createdAt": 1660000000000,   // epoch ms
  "updatedAt": 1660001000000,   // epoch ms
  "mood": "😊",                 // emoji or mood id
  "title": "Short title",
  "content": "Long text markdown / plain text",
  "tags": ["work", "reflection"]
}

/daily-journal
├─ index.html         # Main UI + modal markup
├─ styles.css         # All styles, CSS variables, responsive
├─ app.js             # App logic: CRUD, search, filter, export
├─ libs/
│   └─ jspdf.umd.min.js   # jsPDF (or html2pdf) for PDF export
└─ assets/
   └─ icons, images

