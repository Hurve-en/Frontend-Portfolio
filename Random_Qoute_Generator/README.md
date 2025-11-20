# Random Quote Generator

This project is a simple, responsive random quote generator built with **HTML, CSS, and JavaScript**.  
It displays inspirational quotes and allows users to copy or tweet them instantly.

---

##  Project Files
- `quote.html` — Main structure of the app  
- `quote.css` — Styling, layout, gradients, fonts  
- *(Inline JS in HTML)* — Logic for generating, copying, and tweeting quotes  

---

##  How to Run
1. Put all files in the same folder.  
2. Open **quote.html** in any browser.  
3. Done — no installation required.

---

##  Features
- Displays a random quote + author  
- “New Quote” button generates a new random quote  
- “Copy” button copies the quote to clipboard  
- “Tweet” button opens Twitter with pre-filled text  
- Keyboard shortcuts for fast interaction  
- Glass-card design with gradients  
- Fully responsive for phone & desktop  
- Accessible with ARIA labels and keyboard navigation  

---

##  How It Works
Quotes are stored in a JavaScript array:

```js
const quotes = [
  { text: "Life is like riding a bicycle...", author: "Albert Einstein" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" }
];
