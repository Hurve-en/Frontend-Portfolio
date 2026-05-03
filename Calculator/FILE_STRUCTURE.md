# Calculator App - Modular File Structure

## Project Overview

This calculator has been refactored into a **clean, modular architecture** to improve maintainability and code navigation. Each file handles a specific responsibility.

---

## File Structure

```
Calculator/
├── calculator.html          # Main HTML (loads modular JS in correct order)
├── calculator.css           # Main CSS file
├── README.md               # Project documentation
├── assets/
│   ├── css/
│   │   ├── variables.css   # CSS custom properties (colors, spacing, etc.)
│   │   ├── layout.css      # Core layout and structure
│   │   ├── components.css  # Reusable UI component styles
│   │   └── responsive.css  # Mobile/tablet responsive styles
│   └── js/
│       ├── utils.js            # Shared utility functions (LOAD FIRST)
│       ├── calculator.js       # Core math engine (Shunting Yard algorithm)
│       ├── ui.js              # UI rendering and display management
│       ├── input-validator.js  # Input validation logic (NEW)
│       ├── theme.js            # Dark/Light theme management
│       ├── history.js          # Calculation history tracking
│       └── app.js              # Main application controller (LOAD LAST)
```

---

## JavaScript Module Details

### 1. **utils.js** ⚙️ (Shared Utilities)

**Loads First** - Provides common functions used by all modules.

**Exports:**

- `Utils.escapeHtml(text)` - XSS protection for HTML content
- `Utils.formatNumber(n)` - Format numbers with proper precision
- `Utils.isOperator(ch)` - Check if character is an operator
- `Utils.getLastNumberSegment(s)` - Extract last number from expression
- `Utils.getFromStorage(key)` - Safe localStorage retrieval
- `Utils.setToStorage(key, value)` - Safe localStorage storage
- `Utils.removeFromStorage(key)` - Safe localStorage deletion
- `Utils.prefersDarkMode()` - Check system dark mode preference

---

### 2. **calculator.js** 🧮 (Math Engine)

Core calculation engine using the **Shunting Yard algorithm** for safe expression evaluation.

**Key Functions:**

- `tokenize(expression)` - Parse expression into tokens
- `toRPN(tokens)` - Convert to Reverse Polish Notation
- `evalRPN(rpn)` - Evaluate RPN safely

**Exports:**

- `CalculatorEngine.evaluate(expr)` - Evaluate mathematical expression
- `CalculatorEngine.formatNumber(n)` - Format result
- `CalculatorEngine.isOperator(ch)` - Check operators
- `CalculatorEngine.getLastNumberSegment(s)` - Get last number

**Supports:** `+ - * / % ( )` and parentheses for order of operations

---

### 3. **ui.js** 🎨 (UI Management)

Handles all DOM manipulation and display updates.

**Exports:**

- `UIManager.renderPrimary(text, isError)` - Update main display
- `UIManager.renderSecondary(value)` - Update secondary display
- `UIManager.showToast(message, duration)` - Show toast notifications
- `UIManager.updateState(state)` - Centralized state update helper (NEW)

**Dependencies:** None (uses direct DOM access)

---

### 4. **input-validator.js** ⌨️ (Input Validation) — NEW

Validates and processes user input (keyboard & button clicks).

**Exports:**

- `InputValidator.validateAppendChar(ch, expr)` - Validate character append
- `InputValidator.validateApplyPercent(expr)` - Validate percent operation
- `InputValidator.validateKeyboardInput(key)` - Parse keyboard keys to actions

**Features:**

- Prevents duplicate decimals
- Handles operator replacement logic
- Maps keyboard keys to calculator actions
- Validates expression state before mutations

**Dependencies:** `CalculatorEngine` (for operator validation)

---

### 5. **theme.js** 🌓 (Theme Management)

Manages dark/light theme switching with localStorage persistence.

**Exports:**

- `ThemeManager.init()` - Initialize theme on app startup
- `ThemeManager.apply(theme)` - Apply theme to DOM

**Features:**

- Respects system dark mode preference
- Persists user choice to localStorage
- Listens to theme toggle checkbox

**Dependencies:** `Utils`

---

### 6. **history.js** 📋 (History Management)

Manages calculation history with localStorage persistence.

**Exports:**

- `HistoryManager.init()` - Initialize history panel and listeners
- `HistoryManager.addEntry(expr, result)` - Add entry to history
- `HistoryManager.render()` - Render history list

**Features:**

- Stores up to 15 calculations
- Click history to reload expression
- Clear all history option
- Auto-closes panel on click outside
- **Uses event delegation** for efficient memory usage

**Dependencies:** `Utils`, `UIManager`

---

### 7. **app.js** 🚀 (Application Controller)

Main application orchestrator - coordinates all modules.

**Key Functions:**

- `appendChar(ch)` - Handle character input (delegates to InputValidator)
- `deleteLast()` - Handle backspace
- `clearAll()` - Handle clear
- `applyPercent()` - Handle percentage (delegates to InputValidator)
- `evaluateNow()` - Trigger calculation

**Event Handlers:**

- `handleKeyClick(ev)` - Button click events
- `handleKeyboardInput(e)` - Keyboard events (delegates to InputValidator)
- `handleHistorySelect(e)` - History selection

**Dependencies:** `CalculatorEngine`, `UIManager`, `InputValidator`, `ThemeManager`, `HistoryManager`

---

## Module Loading Order (Important!)

Scripts load in this specific order in `calculator.html`:

1. ✅ `utils.js` - Must load first (other modules depend on it)
2. ✅ `calculator.js` - Math engine (no dependencies)
3. ✅ `ui.js` - UI manager (no module dependencies)
4. ✅ `input-validator.js` - Input validation (depends on CalculatorEngine)
5. ✅ `theme.js` - Theme manager (depends on Utils)
6. ✅ `history.js` - History manager (depends on Utils, UIManager)
7. ✅ `app.js` - Main app (depends on all other modules)

_All scripts use `defer` attribute for proper loading_

---

## Data Flow

```
User Input
    ↓
[app.js] - Handles events
    ↓
[calculator.js] - Evaluates expression
    ↓
[ui.js] - Updates display
    ↓
[history.js] - Saves calculation
    ↓
[theme.js] - Manages UI theme
```

---

## Adding New Features

### To add a new calculation feature:

1. Add logic to `calculator.js` (tokenize/evaluate)
2. Add button/handler in `app.js`
3. Update UI display in `ui.js` if needed
4. Add utility functions to `utils.js` if needed

### To add a new UI element:

1. Add HTML in `calculator.html`
2. Add styling in appropriate CSS file
3. Add DOM reference and handler in relevant module

### To add new storage features:

1. Use `Utils.getFromStorage()` / `Utils.setToStorage()` instead of raw localStorage
2. This centralizes storage logic and error handling

---

## Benefits of Modular Architecture

✅ **Separation of Concerns** - Each module has single responsibility  
✅ **Easy Navigation** - Know exactly where each feature lives  
✅ **Easy Testing** - Each module can be tested independently  
✅ **Maintainability** - Changes isolated to relevant module  
✅ **Scalability** - Easy to add new features without massive files  
✅ **Reusability** - Utils can be used by multiple modules  
✅ **Debugging** - Errors are easier to trace to specific module

---

## Notes

- All modules use **Module Pattern** (IIFE) for scope isolation
- No global pollution - only 7 global objects: `Utils`, `CalculatorEngine`, `UIManager`, `ThemeManager`, `HistoryManager`, `CalculatorApp`, `window.calc`
- Safe storage operations with error handling
- XSS-protected with HTML escaping
- Keyboard support for all operations
