# Form Validator

Files:
- `index.html` — main form structure
- `styles.css` — layout, colors, transitions, and theme styles
- `app.js` — real-time validation logic and event handling

---

## How to Run
1. Download all three files (`index.html`, `styles.css`, `app.js`) into the same folder.  
2. Open `index.html` in any modern browser (double-click it or open via **File → Open**).  
3. No installation or build tools needed — runs fully offline.

---

##  Features

### Real-Time Validation
- Checks each input field as you type or move focus.
- Displays clear inline messages (no bright red/green colors).
- Prevents submission until all required fields are valid.

### Smart Validation Rules
| Field | Rules |
|-------|--------|
| **Full Name** | Required; must have at least 2 words; letters only. |
| **Email** | Required; must match a valid email format. |
| **Password** | Required; minimum 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character. |
| **Confirm Password** | Must match the first password exactly. |
| **Age** | Optional; if entered, must be between 13 and 120. |
| **Website** | Optional; if entered, must start with `http://` or `https://`. |
| **Terms Checkbox** | Required to submit. |

---

## Functional Overview
- **Instant feedback:** Each field shows a short, human-readable message when invalid.  
- **Submission blocking:** Prevents submission until all validations pass.  
- **Auto-scroll:** Moves smoothly to the first invalid field if errors exist.  
- **Summary box:** Displays entered details (excluding passwords) on successful submission.  
- **Reset button:** Clears all inputs, messages, and summary box.  
- **Dark / Light mode toggle:** One-click theme switcher with smooth transition.  
- **Password visibility toggle:** 👁️ / 🙈 button to show or hide password input.

---

## UI & UX
- Centered, single-column responsive layout.  
- Simple minimalist look with subtle shadows and transitions.  
- High contrast text for readability.  
- Clean sans-serif font (system default or Poppins).  
- Smooth fade animations for messages.  
- Fully usable via keyboard navigation (Tab/Shift+Tab).  

---

## Key JavaScript Functions
| Function | Purpose |
|-----------|----------|
| `validateName()` | Checks full name rules. |
| `validateEmail()` | Validates email format. |
| `validatePassword()` | Enforces strong password requirements. |
| `validateConfirm()` | Ensures confirmation matches password. |
| `validateAge()` | Validates optional age range. |
| `validateWebsite()` | Checks URL prefix validity. |
| `validateTerms()` | Ensures checkbox is checked. |
| `checkFormValidity()` | Aggregates all validation results. |

---

## Accessibility
- Uses semantic `<label>` elements linked via `for` attributes.  
- Error messages use `aria-describedby` references.  
- Full keyboard accessibility (Tab, Enter, Space).  
- Meets WCAG AA color contrast standards.  

---

## Manual Test Cases

| Test | Input | Expected Result |
|------|--------|-----------------|
| Empty Name | `""` | Error: “Full name is required.” |
| Invalid Name | `John123` | Error: “Please enter at least two words (letters only).” |
| Valid Name | `John Smith` | ✅ Passes |
| Invalid Email | `john@` | Error: “Please enter a valid email address.” |
| Weak Password | `abc` | Error: “At least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.” |
| Mismatched Passwords | `Password1!` / `Password2!` | Error: “Passwords do not match.” |
| Invalid Age | `5` | Error: “Age must be between 13 and 120.” |
| Invalid Website | `www.google.com` | Error: “Website must start with http:// or https://.” |
| Terms unchecked | unchecked | Error: “You must agree to the terms.” |
| All valid | — | Summary box shown with submitted details. |

---

## 🧰 Developer Notes
- The JavaScript file (`app.js`) is modular, readable, and well-commented.  
- All validation uses regular expressions and simple condition checks.  
- To add new fields, duplicate a pattern (input + message span) and add a validation function.  
- Dark mode toggled via a single `.dark` class on `<body>` for easy theme styling.  

---

## 🖼️ Preview

**Light Mode**
