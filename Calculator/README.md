# Simple Modern Calculator

Files:
- `index.html` — UI/structure
- `styles.css` — styles (responsive, light/dark themes)
- `app.js` — behavior (safe expression parser & evaluator)

## How to run
Open `index.html` in a browser (double-click or `File → Open` in browser). No server required.

## Features
- Basic arithmetic: `+ - × * ÷ /`
- Parentheses `( )`
- Decimal numbers
- Percent `%` (postfix: `50%` → `0.5`, `200 + 10%` computes as `200 + 0.1` if typed as literal `200+10%`)
- Multi-step expressions with correct operator precedence (`*` and `/` before `+` and `-`)
- Clear (`C`), backspace (`⌫`), Evaluate (`=`)
- Primary display (expression) and secondary display (last result)
- Keyboard support: numbers, `+ - * / . ( )`, `Enter`/`=` to evaluate, `Backspace` to delete, `Esc` to clear
- Light and Dark themes (toggle)
- Graceful error messages for divide-by-zero and mismatched parentheses
- No `eval()` — expression parsing uses tokenization, Shunting-yard and RPN evaluation

## Design decisions & known limitations
- **No `eval()`**: Using `eval()` is dangerous and allows arbitrary code execution. Instead the app tokenizes and evaluates only recognized math tokens (numbers, operators, parentheses, percent).
- **Percent behavior**: Percent is implemented as a **postfix unary operator** (e.g., `50%` → `0.5`). Note: `200 + 10%` is **not** automatically interpreted as "10% of 200" — it is parsed as `200 + (10%)` which equals `200.1`. To express percent-of, compute `200 * (10/100)`.
- **Floating point precision**: Results are rounded to 12 decimal places to avoid display noise (e.g., `0.1 + 0.2` displays `0.3` instead of `0.30000000000000004`). This is a UI convenience; underlying JS floats still have precision limits.
- **Unary minus/plus**: Supported when immediately followed by a number, e.g. `-5 + 3`. Complex unary operator usage (like `- (3 + 4)`) is supported because the tokenizer handles `-` before parentheses as operator and parser handles it correctly by treating `-` and parentheses as separate tokens.
- **Large numbers**: The UI will show large numbers, but extreme values may exceed JS numeric limits.
- **Security**: Because we parse and evaluate only specific tokens, this is safe against code injection.

## Keyboard shortcuts
- `0-9` — digits
- `.` — decimal point
- `+ - * /` — operators
- `( )` — parentheses
- `Enter` or `=` — evaluate
- `Backspace` — delete last character
- `Esc` — clear all
- `%` — percent

## Manual test cases (enter these and compare expected)
1. `0.1 + 0.2` → displays `0.3` (rounded to reasonable precision)
2. `12 + 3 * (5 - 2)` → `21`
3. `5 / 0` → error: `Cannot divide by zero`
4. `((2+3)*4` → error: `Mismatched parentheses`
5. `00012` → `12`
6. `50%` → `0.5`
7. `200 * 10%` → `20`
8. `2 + 3 =` then pressing `=` again → remains stable (no crash)
9. `3.141592653589793 + 1` → shows reasonable rounding
10. Rapidly press `=` repeatedly — state remains stable

## Notes for developers
- The evaluator follows these steps: tokenize → shunting-yard → evaluate RPN. This approach is robust and limits accepted input to safe tokens only.
- The evaluator throws descriptive errors which the UI surfaces in the primary display.
- If you want more features (memory store, trig functions, or percent-as-relative), those can be added as new operators with explicit parsing logic.

Enjoy — if you want I can:
- add a "history" panel,
- add parenthesis/auto-completion help,
- or add more math functions (power, sqrt, trig).
