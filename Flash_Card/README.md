<!-- Simple comment: This file contains project notes. -->

# Minimal Flashcard Study App

Files:
- `flashcard.html` — main HTML structure  
- `flashcard.css` — styling (light/dark themes, layout)  
- `flashcard.js` — behavior (card creation, study mode, local storage)

---

## How to run
Open `flashcard.html` in any modern browser (double-click file or use `File → Open`).  
No build tools or servers required.

---

## Features
- Create, edit, and delete flashcards with **Question** and **Answer** fields.  
- Stored persistently in **localStorage** (data remains after reload).  
- **Study Mode**: view each card sequentially, reveal the answer, and mark as correct or wrong.  
- Progress tracking during study sessions.  
- **Light / Dark theme toggle** with smooth transition and persistence.  
- Responsive layout — works seamlessly on desktop and mobile.  
- Centered study interface for distraction-free focus.  

---

## Keyboard shortcuts
| Key | Action |
|-----|--------|
| **Enter** | Save new flashcard |
| **S** | Start/Stop study mode |
| **Space** | Show answer / Next card |
| **← / →** | Navigate between cards |
| **Esc** | Exit study mode |

---

## Design decisions & limitations
- **Single deck** model (all flashcards in one set).  
- Uses `localStorage` to persist all data (no backend).  
- Study session is linear; once finished, restarts from the beginning.  
- Theme toggle and user data both stored locally for simplicity.  
- No import/export or spaced repetition yet (planned future feature).  
- All interactions are keyboard- and mobile-friendly.  
- Focus on **minimalist UI** — large readable text, centered buttons, and high contrast.  

---

## Manual test cases
1. **Default load**: app opens with empty deck and default theme.  
2. **Add card**: type question and answer → click **Save** → card appears in list.  
3. **Edit card**: click **Edit**, modify text, click **Save** → card updates.  
4. **Delete card**: click **Delete**, confirm → card removed from list.  
5. **Study mode**: click **Start Study** → question appears, then **Show Answer** displays the answer.  
6. **Marking**: click ✅ or ❌ → moves to next card, progress updates.  
7. **Theme toggle**: click 🌙 / ☀️ → theme changes smoothly.  
8. **Reload page**: cards and theme persist after refresh.  
9. **Keyboard**: use Enter to save, Space to reveal, and Esc to exit.  

---

## Notes for developers
**Core functions in `app.js`:**
- `loadCards()` — loads saved cards from localStorage  
- `saveCards()` — saves the flashcard list  
- `addCard()` — adds a new flashcard  
- `editCard()` — edits a selected flashcard  
- `deleteCard()` — deletes a flashcard  
- `startStudy()` — enters study mode  
- `showAnswer()` — reveals the card answer  
- `markAnswer()` — records response and moves to next  
- `toggleTheme()` — switches between light and dark themes  

**Code structure:**
- Organized inside an IIFE to avoid global namespace pollution.  
- Study mode dynamically switches UI views — controlled via class toggling.  

**Future extensibility:**
- Add multiple decks  
- Implement Leitner-based spaced repetition (SRS)  
- Add progress tracking and review scheduling  
- Include import/export (JSON or CSV)

---

## Known limitations
- No separate decks or categories.  
- No spaced repetition scheduling yet.  
- LocalStorage can be cleared by browser manually.  
- Study mode currently cycles linearly through all cards.

---

## Future improvements
- Implement **Leitner System (SRS)** with spaced review intervals.  
- Add **deck management** (create, rename, delete decks).  
- Include **import/export** functionality for large card sets.  
- Add **progress statistics** and study streaks.  

---

## Accessibility & UX
- All interactive elements are keyboard-accessible.  
- Visible focus outlines for accessibility.  
- `aria-live` regions can be added for announcing study progress.  
- Layout adapts fluidly for mobile and desktop screens.  
- Smooth transitions between modes for clear context.

---

## Leitner System Preview (Upcoming Feature)
The **Leitner System** is a spaced repetition technique that improves memory retention by reviewing flashcards at increasing intervals based on performance.

### How it will work
1. Each flashcard belongs to a **box** (1–5).  
   - **Box 1** → new or incorrect cards (review daily).  
   - **Box 2–5** → increasingly spaced intervals (e.g., every 2, 4, 7, 14 days).  
2. When you mark a card as **correct**, it moves up one box.  
3. When you mark it **wrong**, it moves back to Box 1.  
4. During a study session, only **due cards** (based on their box and last review date) will appear.  
5. All Leitner metadata (box, last reviewed, next due) will be stored in `localStorage`.

### UI Preview (Planned)
- **"Leitner Progress"** bar showing how many cards are in each box.  
- **"Study Due Only"** toggle to focus on today’s cards.  
- Settings to adjust **interval days** for each box.

---

## Example of Spaced Review Schedule
| Box | Review Interval | Description |
|------|-----------------|-------------|
| 1 | Every Day | New or incorrect cards |
| 2 | Every 2 Days | Recently learned cards |
| 3 | Every 4 Days | Medium-term memory |
| 4 | Every 7 Days | Strongly remembered |
| 5 | Every 14 Days | Mastered cards |



## Credits
Developed as a minimalist, dark-themed flashcard app for **active recall and self-study**.  
Built with plain **HTML, CSS, and JavaScript**, without any frameworks.

