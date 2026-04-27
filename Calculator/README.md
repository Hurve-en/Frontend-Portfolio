<!-- Modern Calculator Pro - Polished Version -->

# 🧮 Calculator Pro

A modern, fast, and responsive calculator built with vanilla HTML, CSS, and JavaScript. Features glass-morphism design, dark mode support, calculation history, and elegant UI.

## ✨ Key Features

### 🎨 Modern Design

- **Glass-morphism UI**: Beautiful frosted glass effects with backdrop blur
- **Responsive Layout**: Perfect on mobile, tablet, and desktop
- **Smooth Animations**: Elegant transitions and micro-interactions
- **Professional Gradients**: Carefully crafted color schemes

### 🧮 Functionality

- **Full Math Operations**: `+` `-` `×` `÷` and `%`
- **Parentheses Support**: Complex nested expressions
- **Safe Evaluation**: Tokenization + RPN (Reverse Polish Notation) for security
- **Error Handling**: Clear error messages

### 🌓 Themes

- **Light Mode**: Clean, bright interface
- **Dark Mode**: Eye-friendly dark theme
- **Auto-Save**: Theme preference saved to local storage
- **System Detection**: Auto-detects system preference

### 💾 History

- **Auto-Save**: All calculations saved automatically (up to 15 items)
- **Quick Access**: Click 📋 to view recent calculations
- **One-Click Restore**: Click any history item to restore
- **Clear All**: Remove history with one action

### ⌨️ Accessibility

- **Full Keyboard Support**: All operations available via keyboard
- **ARIA Labels**: Screen reader friendly
- **Focus Indicators**: Clear keyboard navigation
- **Semantic HTML**: Proper semantic structure

## ⌨️ Keyboard Shortcuts

| Key           | Action      |
| ------------- | ----------- |
| `0-9`         | Numbers     |
| `.`           | Decimal     |
| `+ - * /`     | Operators   |
| `( )`         | Parentheses |
| `Enter` / `=` | Calculate   |
| `Backspace`   | Delete      |
| `Esc`         | Clear       |
| `%`           | Percent     |

## 🎯 Examples

- `5 + 3` → `8`
- `10 - 2 * 3` → `4` (respects operator precedence)
- `12 + 3 * (5 - 2)` → `21` (handles parentheses)
- `50 * 20%` → `10` (percentage)
- `0.1 + 0.2` → `0.3` (rounded for precision)

## 🚀 Performance

- **No Dependencies**: Pure vanilla JavaScript
- **Fast**: GPU-accelerated animations
- **Efficient**: Limited history to maintain performance
- **Responsive**: Touch-optimized

## 📱 Responsive Breakpoints

- **Mobile** (≤420px): Optimized buttons and spacing
- **Tablet** (768px): Enhanced layout
- **Desktop** (≥1024px): Full experience

## 💾 Local Storage

Saves to browser local storage:

- Theme preference (light/dark)
- Last 15 calculations

No data sent to any server.

## 🔒 Security

- **No `eval()`**: Dangerous JS evaluation avoided
- **Safe Parsing**: Tokenization + RPN conversion
- **Input Validation**: Prevents malicious expressions
- **No External Dependencies**: No third-party risks

## 🛠️ Technical Details

- **HTML5**: Semantic markup
- **CSS3**: Advanced features (gradients, animations, backdrop-filter)
- **JavaScript**: Vanilla (no frameworks)
- **Architecture**: Modular functions, safe evaluation

### Math Evaluation Method

The calculator uses the **Shunting-yard algorithm** with **RPN evaluation**:

1. **Tokenize**: Break expression into tokens (numbers, operators, parentheses)
2. **Shunting-yard**: Convert infix notation to Reverse Polish Notation (RPN)
3. **Evaluate**: Use stack-based evaluation for safe computation

This approach ensures:

- ✅ Correct operator precedence
- ✅ Proper parentheses handling
- ✅ No arbitrary code execution

## 📄 Files

- `calculator.html` — Structure and layout
- `calculator.css` — Styles (themes, animations, responsive)
- `calculator.js` — Logic and evaluation

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## 📝 Design Notes

### Color Palette

- **Primary**: Blue (#6b8cff)
- **Secondary**: Yellow (#ffcf40)
- **Success**: Green (#10b981)
- **Error**: Red (#e11d48)

### Typography

- **Font Stack**: System fonts for optimal performance
- **Weights**: 500 (normal) - 800 (bold)
- **Responsive**: Sizes adapt to screen width

## 🎓 Learning Resources

This calculator demonstrates:

- Safe math expression parsing
- RPN (Reverse Polish Notation) evaluation
- Theme switching with localStorage
- Responsive design patterns
- Accessibility best practices
- Modern CSS (gradients, animations, backdrop-filter)

---

**Calculator Pro v2.0** - Built with ❤️ using vanilla web technologies 7. `200 * 10%` → `20` 8. `2 + 3 =` then pressing `=` again → remains stable (no crash) 9. `3.141592653589793 + 1` → shows reasonable rounding 10. Rapidly press `=` repeatedly — state remains stable

## Notes for developers

- The evaluator follows these steps: tokenize → shunting-yard → evaluate RPN. This approach is robust and limits accepted input to safe tokens only.
- The evaluator throws descriptive errors which the UI surfaces in the primary display.
- If you want more features (memory store, trig functions, or percent-as-relative), those can be added as new operators with explicit parsing logic.

Enjoy — if you want I can:

- add a "history" panel,
- add parenthesis/auto-completion help,
- or add more math functions (power, sqrt, trig).
