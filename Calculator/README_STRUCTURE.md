# 🧮 Calculator Pro - Modular File Structure

A modern, modular calculator application with clean code organization for better maintainability and readability.

## 📁 Project Structure

```
Calculator/
├── index.html (or calculator.html)         # Main HTML file
├── README.md                               # Documentation
├── assets/
│   ├── css/                               # Stylesheets (modular)
│   │   ├── variables.css                  # Theme & CSS variables
│   │   ├── layout.css                     # Global layout & animations
│   │   ├── components.css                 # UI components styling
│   │   └── responsive.css                 # Mobile & responsive rules
│   └── js/                                # JavaScript modules
│       ├── calculator.js                  # Core calculation engine
│       ├── ui.js                          # UI rendering functions
│       ├── theme.js                       # Dark/light theme manager
│       ├── history.js                     # Calculation history
│       └── app.js                         # Main app controller
```

## 🎯 File Responsibilities

### CSS Files

| File | Purpose |
|------|---------|
| **variables.css** | CSS custom properties, theme colors, spacing, shadows, and animations |
| **layout.css** | Body/page structure, calculator container, global animations |
| **components.css** | Topbar, display, history panel, buttons, switches, toast notifications |
| **responsive.css** | Mobile breakpoints, reduced motion preferences |

### JavaScript Modules

| File | Purpose |
|------|---------|
| **calculator.js** | Core math engine - tokenizer, Shunting Yard algorithm, RPN evaluator |
| **ui.js** | Display updates - rendering primary/secondary text, toast messages |
| **theme.js** | Theme switching - dark/light mode with localStorage persistence |
| **history.js** | History management - save/load/render calculation history |
| **app.js** | Main controller - event handlers, user input, app initialization |

## ✨ Key Features

✅ **Modular Code** - Each module has a single responsibility  
✅ **Clean Separation** - CSS and JS are logically organized  
✅ **Easy to Maintain** - Find and update features quickly  
✅ **Scalable** - Add new features without cluttering existing files  
✅ **Dark/Light Theme** - Theme toggle with localStorage  
✅ **Calculation History** - Save and recall calculations  
✅ **Safe Evaluation** - Uses Shunting Yard algorithm instead of `eval()`  
✅ **Keyboard Support** - Full keyboard input handling  
✅ **Responsive Design** - Works on desktop, tablet, mobile  
✅ **Accessible** - ARIA labels, semantic HTML  

## 🚀 Features

### Calculator Functions
- Basic operations: `+`, `-`, `×`, `÷`
- Parentheses support: `(`, `)`
- Percentage calculations: `%`
- Decimal numbers: `.`
- Clear & Backspace controls

### UI/UX
- Real-time expression display
- Last result tracking
- Smooth animations & transitions
- Toast notifications
- Dark/Light theme toggle
- History panel with click-to-restore

### Input Methods
- **Mouse**: Click buttons
- **Keyboard**: 
  - Numbers: `0-9`
  - Operators: `+`, `-`, `*`, `/`
  - Parentheses: `(`, `)`
  - Percent: `%`
  - Calculate: `Enter` or `=`
  - Backspace: `Backspace`
  - Clear: `Escape`

## 🔧 Development Guide

### Add a New Feature

1. **CSS Feature?** → Add to appropriate file in `assets/css/`
2. **Calculation Logic?** → Add to `CalculatorEngine` in `assets/js/calculator.js`
3. **UI Update?** → Add to `UIManager` in `assets/js/ui.js`
4. **New Module?** → Create `assets/js/module.js` and import in `app.js`

### Example: Add Square Root Function

1. **Update HTML** (add button):
   ```html
   <button class="key func" data-action="sqrt">√</button>
   ```

2. **Update calculator.js** (add to isOperator):
   ```javascript
   // In evalRPN function:
   case "√": r = Math.sqrt(a); break;
   ```

3. **Update app.js** (handle action):
   ```javascript
   if (action === "sqrt") {
     appendChar("√");
   }
   ```

## 📦 How to Use

### Load the Files
Make sure to load JavaScript in the correct order in HTML:

```html
<link rel="stylesheet" href="assets/css/variables.css" />
<link rel="stylesheet" href="assets/css/layout.css" />
<link rel="stylesheet" href="assets/css/components.css" />
<link rel="stylesheet" href="assets/css/responsive.css" />

<script src="assets/js/calculator.js" defer></script>
<script src="assets/js/ui.js" defer></script>
<script src="assets/js/theme.js" defer></script>
<script src="assets/js/history.js" defer></script>
<script src="assets/js/app.js" defer></script>
```

## 🎨 Customization

### Change Colors
Edit `assets/css/variables.css`:
```css
:root {
  --accent: #6b8cff;  /* Change primary color */
  --danger: #e11d48;  /* Change error color */
  /* ... */
}
```

### Change Spacing
Edit `assets/css/variables.css`:
```css
:root {
  --radius: 16px;     /* Border radius */
  --key-gap: 10px;    /* Space between buttons */
  /* ... */
}
```

### Add Dark Mode Colors
Edit `assets/css/variables.css`:
```css
[data-theme="dark"] {
  --text: #f0f0f0;    /* Light text for dark bg */
  --accent: #7c9aff; /* Lighter accent */
  /* ... */
}
```

## 🔍 Module Interactions

```
app.js (Main Controller)
├── CalculatorEngine (Math)
├── UIManager (Display)
├── HistoryManager (Storage)
└── ThemeManager (Preferences)
```

**Data Flow:**
1. User interacts with UI
2. `app.js` captures event
3. Calls appropriate module (calculator, ui, etc.)
4. Module updates state/DOM
5. UI reflects changes

## 💾 Storage

- **Theme**: Saved in `localStorage['calc_theme']`
- **History**: Saved in `localStorage['calc_history']` (max 15 entries)
- **Data Format**: JSON serialization for portability

## 🐛 Debugging

Access calculator engine in console:
```javascript
window.calc.evaluateExpression("2 + 2 * 3")  // Returns 8
```

## 📊 Statistics

- **CSS**: ~600 lines split into 4 files
- **JS**: ~800 lines split into 5 modules
- **HTML**: ~100 lines (unchanged)
- **Total**: Highly modular and maintainable

## 🤝 Contributing

To extend the calculator:

1. **Add button in HTML** with appropriate `data-action` or `data-value`
2. **Create/update module** in `assets/js/`
3. **Add styling** to appropriate CSS file in `assets/css/`
4. **Handle in app.js** event listeners
5. **Test** with keyboard and mouse input

## 📝 Notes

- All modules use IIFE (Immediately Invoked Function Expression) for encapsulation
- Custom events used for module communication (`history-select`)
- Safe math evaluation - no `eval()` used
- Responsive design with mobile-first approach
- Full keyboard accessibility

---

**Last Updated**: May 2026  
**Status**: Production Ready ✅
