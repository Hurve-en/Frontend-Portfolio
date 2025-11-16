# Dynamic Event Scoreboard

A **modern, interactive, and responsive scoreboard** for events, competitions, or classroom activities. Built with **HTML, CSS, and JavaScript**, it features multiple groups, live score updates, and a presentation mode for audience-friendly display.

---

## Features

- **Add/Remove Groups:** Quickly add new teams or groups, and remove them when needed.
- **Increment/Decrement Scores:** Tap numbers or use buttons to adjust scores easily.
- **Reset Individual or All Scores:** Reset a specific group or all groups at once.
- **Live Leader Highlighting:** Automatically highlights the leading group(s).
- **Presentation Mode:** Clean, fullscreen display for projection or large screens. Toggle on/off easily.
- **Keyboard Shortcuts:**  
  - `+` → Increase focused group score by 10  
  - `-` → Decrease focused group score by 1  
  - `P` → Toggle presentation mode  
- **Responsive Design:** Works on desktop, tablet, and mobile screens.
- **Accessible:** Uses ARIA attributes and `aria-live` regions for screen readers.

---

## Installation

1. Clone or download the repository.
2. Open `index.html` (or your main HTML file) in a browser.
3. No server required; fully client-side.

```bash
git clone <repository_url>


Usage

Click "+ Add Group" to create a new group box.

Click "+10" or "-1" to adjust the score.

Click "Reset" to reset a specific group score.

Click "Reset All" to reset all scores at once.

Click "Enter Present Mode" to display scores in full-screen mode.

Use keyboard shortcuts for faster updates:

+ to increase focused score

- to decrease focused score

P to toggle presentation mode


/scoreboard-project
│
├─ index.html          # Main HTML structure
├─ scoreboard.css      # Styling for scoreboard (dark, minimal theme)
├─ scoreboard.js       # Core JavaScript logic
├─ iACAD_logo.png      # Optional logo for favicon
└─ README.md           # Project documentation
