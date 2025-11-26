# Daily Journal — Mindful Journaling App

A calm, accessible, front-end **Daily Journal** web app for mindful writing.  
Soft, minimalist UI, mood tagging, search & filters, auto-save drafts, JSON backup/restore, and PDF export. Built with plain HTML, CSS and vanilla JavaScript — no build tools required.

---

## 🚀 Highlights

- Create, edit, delete journal entries
- Mood tagging (emoji) with a default palette and easy extension
- Search (title + body) and multi-mode filters (date range, quick filters, mood chips)
- Auto-save drafts while typing (localStorage)
- Export a single entry or filtered set to **PDF** (uses `jsPDF`)
- Backup / Restore full journal via JSON
- Light / Dark theme toggle (persisted)
- Keyboard shortcuts:  
  - `N` — new entry  
  - `/` — focus search
- Responsive layout (mobile-first) and accessibility-friendly (ARIA hints, visible focus, prefers-reduced-motion)

---

## 📁 Files (what you should have)

/daily-journal
├─ index.html # Main UI (list + editor + detail)
├─ styles.css # Visual design, tokens, responsive rules
└─ app.js # App behavior: CRUD, filters, auto-save, export


> `jsPDF` is loaded from CDN in `index.html` for PDF export. No other dependencies.

---

## 🛠️ Quick start (local)

1. Put `Journal.html`, `Journal.css`, and `Journal.js` in the same folder.
2. Open `Journal.html` in a modern browser (Chrome / Firefox / Edge / Safari).
3. (Optional) Serve with a tiny static server for better file handling:
```bash
python -m http.server 8000
# visit http://localhost:8000

✍️ How to use

Click New Entry (or press N) to open the editor.
Fill Title, pick a Mood, add Tags (comma-separated), and write the Body.
Click Save to persist the entry (saved to localStorage).
Click an entry in the left list to view details or edit it.
Use the search box (/ to focus) and filters to narrow results.
Use Export → PDF to export currently filtered entries, or export a single entry from the detail view.
Use Backup to download all entries as JSON; use Import to restore a JSON backup.

🔐 Data & persistence

All data is stored locally in your browser under the key: daily-journal-v1.
Draft auto-saves are stored under daily-journal-draft.
No server is used; data never leaves your device unless you export or share it.

⚙️ Configuration & customization
Change moods

Edit the moods array inside app.js to add/remove moods:

const moods = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  // add your own...
];

Adjust UI tokens

Open styles.css and change the CSS variables at the top:

:root {
  --accent: #ffd6a5;
  --radius-lg: 14px;
  --shadow: 0 8px 30px rgba(8,12,24,0.06);
}

📦 Export / Backup formats

PDF export: Uses jsPDF to generate plain-text PDFs containing title, date, mood, body and tags.
JSON backup: Full dataset exported as journal-backup.json (useful for manual restore or migration).

♿ Accessibility

Semantic HTML (buttons, inputs, lists) and ARIA hints where helpful.
Keyboard support (N, /).
Visible focus styles for interactive controls.
Respects prefers-reduced-motion — animations are reduced/disabled when the user prefers.
aria-live region used for toasts and transient messages.

🧪 Tests & known limitations

Tested on: latest Chrome and Firefox.
Known limitations:

PDF export is plain text layout (for richer styling use html2pdf or server-side rendering).
Date handling is simplified; advanced timezone or i18n handling can be added with dayjs.
No user accounts — data is device-local only.

✅ Suggested next improvements

Add calendar heatmap and weekly/monthly analytics (Chart.js / lightweight SVG).
Improve PDF styling with html2pdf for WYSIWYG export.
Add optional encryption / passphrase for stored entries.
Add Markdown support with preview (e.g., marked.js).
Implement optional cloud sync (requires backend + auth).

🧾 Developer notes (quick API)

localStorage keys:
Entries: daily-journal-v1
Draft: daily-journal-draft
Theme: journal-theme
Useful functions exposed on window.JournalApp (for debugging in browser console):
JournalApp.createEntry(data)
JournalApp.updateEntry(id, updates)
JournalApp.deleteEntry(id)
JournalApp.exportEntriesToPDF(list)

💬 Troubleshooting

Buttons not responding — ensure app.js is included and that scripts load after DOM (use defer).
PDF export fails — check console for jsPDF errors; confirm CDN loaded before attempting export.
Data missing after reinstall — backups must be re-imported; localStorage is browser & device specific.