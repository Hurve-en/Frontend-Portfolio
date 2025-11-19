#  Aesthetic Chat Simulator  
A calming, modern, front-end–only chat UI simulator featuring multiple aesthetic themes, smooth animations, and a fully responsive layout. Perfect for mockups, demos, or creative projects.

---

##  Features

###  Aesthetic, Modern UI  
- Soft rounding, smooth shadows, clean spacing  
- Pastel gradients, muted neons, and minimal white themes  
- Calming typography with readable hierarchy  

### Chat Experience  
- Contact list panel with search  
- Chat conversation with animated message bubbles  
- Rounded input bar with emoji + send buttons  
- Auto-scroll message area  
- Smooth open/close chat transitions  

###  Themes Included  
- **Light (default)**  
- **Dark**  
- **Pastel Pink**  
- **Blue Neon**  
- **Sunset Gradient**  
- **Minimal White**  

Each theme uses CSS variables for easy customization.

###  Settings Page  
- User profile section  
- Toggles for notifications & animations  
- Chat bubble style selector  
- Font size adjustments  
- Theme selection with live preview  

### Responsive Layout  
Works beautifully on:  
- Desktop  
- Tablet  
- Mobile  

---

## 📁 Project Structure

/project
│── index.html # Home screen + chat UI
│── theme.html # Theme selector UI
│── settings.html # Settings UI
│── styles.css # All aesthetic styles + themes
│── script.js # Chat simulation, animations, theme handling
│── assets/
│ ├── icons/ # UI icons
│ ├── avatars/ # Contact images
│ └── patterns/ # Backgrounds & gradients



---

## How to Use

### 1. Download / Clone  
Simply place the folder anywhere and open `index.html` in a browser.

### 2. Change Theme  
Go to **Theme Selector** → choose a theme → saved using `localStorage`.

### 3. Start Chatting  
Open any contact → type a message → press **Send**.  
Messages animate in and auto-scroll.

---

## 🛠️ Tech Stack  
- **HTML5**  
- **CSS3** (Flexbox, Grid, Variables)  
- **Vanilla JavaScript**  

No frameworks or dependencies required.

---

## 🧩 Customization

### Change Colors  
All themes use CSS variables. Edit inside `styles.css`:

```css
:root {
  --bg: #f7f7fb;
  --accent: #c7aaff;
  --bubble-user: #dcd1ff;
  --bubble-other: #ffffff;
}
