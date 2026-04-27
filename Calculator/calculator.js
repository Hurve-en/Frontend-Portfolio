// Modern Calculator Pro - Enhanced JavaScript

/* Calculator app with safe math evaluation, theme toggle, and history tracking */

(function () {
  // ---------- DOM refs ----------
  const primaryEl = document.getElementById("primary");
  const secondaryEl = document.getElementById("secondary");
  const keysEl = document.querySelector(".keys");
  const themeToggle = document.getElementById("themeToggle");
  const historyBtn = document.getElementById("historyBtn");
  const historyPanel = document.getElementById("historyPanel");
  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const toastEl = document.getElementById("toast");

  // ---------- History Management ----------
  const HISTORY_KEY = "calc_history";
  const MAX_HISTORY = 15;

  function getHistory() {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(0, MAX_HISTORY)),
      );
    } catch (e) {
      // ignore storage errors
    }
  }

  function addToHistory(expr, result) {
    const history = getHistory();
    history.unshift({ expr, result, timestamp: new Date().getTime() });
    saveHistory(history);
    renderHistory();
  }

  function renderHistory() {
    const history = getHistory();
    historyList.innerHTML = "";
    if (history.length === 0) {
      historyList.innerHTML =
        '<div style="padding: 16px; text-align: center; color: var(--muted); font-size: 13px;">No history yet</div>';
      return;
    }
    history.forEach((item) => {
      const div = document.createElement("div");
      div.className = "history-item";
      div.innerHTML = `
        <span class="history-item-expr">${escapeHtml(item.expr)}</span>
        <span class="history-item-result">${escapeHtml(item.result)}</span>
      `;
      div.addEventListener("click", () => {
        expr = item.expr;
        renderPrimary(expr);
        historyPanel.setAttribute("hidden", "");
      });
      historyList.appendChild(div);
    });
  }

  function escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  function clearHistory() {
    if (confirm("Clear all history?")) {
      localStorage.removeItem(HISTORY_KEY);
      renderHistory();
      showToast("History cleared");
    }
  }

  // ---------- Toast Notification ----------
  function showToast(message, duration = 2000) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    setTimeout(() => {
      toastEl.classList.remove("show");
    }, duration);
  }

  // ---------- Theme init & handling ----------
  const THEME_KEY = "calc_theme";
  function applyTheme(theme) {
    if (theme === "dark")
      document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
  }
  // sync toggle with saved value (toggle exists)
  try {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved || (prefersDark ? "dark" : "light");
    applyTheme(initial);
    if (themeToggle) {
      themeToggle.checked = initial === "dark";
      themeToggle.addEventListener("change", (e) => {
        const newTheme = e.target.checked ? "dark" : "light";
        applyTheme(newTheme);
        try {
          localStorage.setItem(THEME_KEY, newTheme);
        } catch (e) {}
      });
    }
  } catch (e) {
    // ignore storage/permission errors
  }

  // ---------- History Panel Toggle ----------
  if (historyBtn) {
    historyBtn.addEventListener("click", () => {
      if (historyPanel.hasAttribute("hidden")) {
        historyPanel.removeAttribute("hidden");
        renderHistory();
      } else {
        historyPanel.setAttribute("hidden", "");
      }
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", clearHistory);
  }

  // Close history panel when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !historyPanel.hasAttribute("hidden") &&
      !historyPanel.contains(e.target) &&
      !historyBtn.contains(e.target)
    ) {
      historyPanel.setAttribute("hidden", "");
    }
  });

  // ---------- Calculator state ----------
  let expr = ""; // expression shown
  let lastResult = null;
  let evaluating = false;

  // ---------- UI helpers ----------
  function renderPrimary(text, isError = false) {
    primaryEl.textContent = text === "" ? "0" : text;
    primaryEl.classList.toggle("error", !!isError);
  }
  function renderSecondary() {
    secondaryEl.textContent = lastResult === null ? "—" : String(lastResult);
  }

  // ---------- Input helpers ----------
  function appendChar(ch) {
    if (ch === ".") {
      const lastNum = getLastNumberSegment(expr);
      if (lastNum.includes(".")) return;
      if (lastNum === "") expr += "0";
    }
    const last = expr.slice(-1);
    if (isOperator(last) && isOperator(ch) && ch !== "(" && ch !== ")") {
      // replace previous operator with new one (except allow unary minus after '(')
      if (!(ch === "-" && (last === "(" || last === "")))
        expr = expr.slice(0, -1);
    }
    expr += ch;
    renderPrimary(expr);
  }
  function deleteLast() {
    expr = expr.slice(0, -1);
    renderPrimary(expr);
  }
  function clearAll() {
    expr = "";
    renderPrimary("0");
  }

  function applyPercent() {
    if (expr === "") return;
    const last = expr.slice(-1);
    if (last === "%" || last === "(" || isOperator(last)) return;
    expr += "%";
    renderPrimary(expr);
  }

  // ---------- Evaluate (safe evaluator) ----------
  function evaluateNow() {
    if (evaluating) return;
    evaluating = true;
    try {
      const value = evaluateExpression(expr);
      lastResult = formatNumber(value);
      renderSecondary();
      renderPrimary(String(lastResult));
      addToHistory(expr, lastResult);
      expr = String(lastResult);
      showToast("✓ Calculated");
    } catch (err) {
      renderPrimary(err.message || "Error", true);
      showToast("✗ Invalid expression");
    } finally {
      evaluating = false;
    }
  }

  // Format number: round to 12 decimals and trim
  function formatNumber(n) {
    if (!isFinite(n)) throw new Error("Non-finite result");
    const rounded = Math.round((n + Number.EPSILON) * 1e12) / 1e12;
    if (Math.abs(rounded - Math.round(rounded)) < 1e-12)
      return Math.round(rounded);
    return String(rounded).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
  }

  // ---------- Convert expression to tokens for evaluation ----------
  function tokenize(s) {
    const tokens = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      if (/[0-9.]/.test(ch)) {
        let num = ch;
        i++;
        while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
        if ((num.match(/\./g) || []).length > 1)
          throw new Error("Invalid number");
        tokens.push({ type: "num", value: parseFloat(num) });
        continue;
      }
      // unary +/- directly before a number
      if (
        (ch === "+" || ch === "-") &&
        (i === 0 || s[i - 1] === "(" || isOperator(s[i - 1]))
      ) {
        const next = s[i + 1];
        if (next && /[0-9.]/.test(next)) {
          let num = ch;
          i++;
          while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
          if ((num.match(/\./g) || []).length > 1)
            throw new Error("Invalid number");
          tokens.push({ type: "num", value: parseFloat(num) });
          continue;
        }
      }
      if (ch === "%") {
        tokens.push({ type: "pct" });
        i++;
        continue;
      }
      if (ch === "(" || ch === ")") {
        tokens.push({ type: "par", value: ch });
        i++;
        continue;
      }
      if (
        ch === "+" ||
        ch === "-" ||
        ch === "*" ||
        ch === "/" ||
        ch === "×" ||
        ch === "÷"
      ) {
        const op = ch === "×" ? "*" : ch === "÷" ? "/" : ch;
        tokens.push({ type: "op", value: op });
        i++;
        continue;
      }
      throw new Error("Invalid character: " + ch);
    }
    return tokens;
  }

  function toRPN(tokens) {
    const out = [],
      ops = [];
    const prec = { "+": 2, "-": 2, "*": 3, "/": 3, "%": 4 };
    const left = { "+": true, "-": true, "*": true, "/": true };
    tokens.forEach((tok) => {
      if (tok.type === "num") out.push(tok);
      else if (tok.type === "pct")
        out.push({ type: "op", value: "%" }); // postfix unary
      else if (tok.type === "op") {
        const o1 = tok.value;
        while (ops.length) {
          const top = ops[ops.length - 1];
          if (top.type === "op") {
            const o2 = top.value;
            const p1 = prec[o1] || 0,
              p2 = prec[o2] || 0;
            if ((left[o1] && p1 <= p2) || (!left[o1] && p1 < p2)) {
              out.push(ops.pop());
              continue;
            }
          }
          break;
        }
        ops.push(tok);
      } else if (tok.type === "par") {
        if (tok.value === "(") ops.push(tok);
        else {
          let found = false;
          while (ops.length) {
            const t = ops.pop();
            if (t.type === "par" && t.value === "(") {
              found = true;
              break;
            }
            out.push(t);
          }
          if (!found) throw new Error("Mismatched parentheses");
        }
      }
    });
    while (ops.length) {
      const t = ops.pop();
      if (t.type === "par") throw new Error("Mismatched parentheses");
      out.push(t);
    }
    return out;
  }

  function evalRPN(rpn) {
    const st = [];
    for (const tok of rpn) {
      if (tok.type === "num") st.push(tok.value);
      else if (tok.type === "op") {
        if (tok.value === "%") {
          if (st.length < 1) throw new Error("Syntax error");
          st.push(st.pop() / 100);
          continue;
        }
        if (st.length < 2) throw new Error("Syntax error");
        const b = st.pop(),
          a = st.pop();
        let r;
        switch (tok.value) {
          case "+":
            r = a + b;
            break;
          case "-":
            r = a - b;
            break;
          case "*":
            r = a * b;
            break;
          case "/":
            if (Math.abs(b) < 1e-15) throw new Error("Cannot divide by zero");
            r = a / b;
            break;
          default:
            throw new Error("Unknown operator");
        }
        st.push(r);
      } else throw new Error("Invalid token");
    }
    if (st.length !== 1) throw new Error("Syntax error");
    return st[0];
  }

  function evaluateExpression(s) {
    const tks = tokenize(s);
    const rpn = toRPN(tks);
    return evalRPN(rpn);
  }

  // ---------- Utilities ----------
  function isOperator(ch) {
    return ["+", "-", "*", "/"].includes(ch);
  }
  function getLastNumberSegment(s) {
    let i = s.length - 1,
      seg = "";
    while (i >= 0) {
      const ch = s[i];
      if (/[0-9.]/.test(ch)) {
        seg = ch + seg;
        i--;
      } else break;
    }
    return seg;
  }

  // ---------- Event handling ----------
  keysEl.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;
    const action = btn.dataset.action;
    const value = btn.dataset.value;
    if (action === "clear") {
      clearAll();
      lastResult = null;
      renderSecondary();
      showToast("Cleared");
      return;
    }
    if (action === "back") {
      deleteLast();
      showToast("⌫");
      return;
    }
    if (action === "percent") {
      applyPercent();
      return;
    }
    if (action === "equals") {
      evaluateNow();
      return;
    }
    if (value) {
      appendChar(value);
    }
  });

  // keyboard
  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (/^[0-9]$/.test(k)) {
      appendChar(k);
      e.preventDefault();
      return;
    }
    if (k === ".") {
      appendChar(".");
      e.preventDefault();
      return;
    }
    if (k === "+" || k === "-" || k === "*" || k === "/") {
      appendChar(k);
      e.preventDefault();
      return;
    }
    if (k === "(" || k === ")") {
      appendChar(k);
      e.preventDefault();
      return;
    }
    if (k === "Enter" || k === "=") {
      evaluateNow();
      e.preventDefault();
      return;
    }
    if (k === "Backspace") {
      deleteLast();
      e.preventDefault();
      return;
    }
    if (k === "Escape") {
      clearAll();
      e.preventDefault();
      return;
    }
    if (k === "%") {
      applyPercent();
      e.preventDefault();
      return;
    }
  });

  // ---------- Init UI ----------
  function init() {
    renderPrimary("0");
    renderSecondary();
    renderHistory();
  }

  init();

  // expose evaluate for debugging
  window.calc = { evaluateExpression };
})();
