/* ============================================
   APP.JS - Main calculator application
   ============================================ */

const CalculatorApp = (function () {
  const keysEl = document.querySelector(".keys");
  const engine = CalculatorEngine;
  const ui = UIManager;
  const history = HistoryManager;
  const theme = ThemeManager;

  let expr = "";
  let lastResult = null;
  let evaluating = false;

  /* Input Operations */

  function appendChar(ch) {
    expr = InputValidator.validateAppendChar(ch, expr);
    ui.renderPrimary(expr);
  }

  function deleteLast() {
    expr = expr.slice(0, -1);
    ui.renderPrimary(expr);
  }

  function clearAll() {
    expr = "";
    ui.renderPrimary("0");
  }

  function applyPercent() {
    expr = InputValidator.validateApplyPercent(expr);
    ui.renderPrimary(expr);
  }

  function evaluateNow() {
    if (evaluating) return;
    evaluating = true;

    try {
      const value = engine.evaluate(expr);
      lastResult = engine.formatNumber(value);
      ui.renderSecondary(lastResult);
      ui.renderPrimary(String(lastResult));
      history.addEntry(expr, lastResult);
      expr = String(lastResult);
      ui.showToast("✓ Calculated");
    } catch (err) {
      ui.renderPrimary(err.message || "Error", true);
      ui.showToast("✗ Invalid expression");
    } finally {
      evaluating = false;
    }
  }

  /* Event Handlers */

  function handleKeyClick(ev) {
    const btn = ev.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    const value = btn.dataset.value;

    if (action === "clear") {
      clearAll();
      lastResult = null;
      ui.renderSecondary(null);
      ui.showToast("Cleared");
      return;
    }

    if (action === "back") {
      deleteLast();
      ui.showToast("⌫");
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
  }

  function handleKeyboardInput(e) {
    const input = InputValidator.validateKeyboardInput(e.key);
    if (!input) return; // Unrecognized key

    e.preventDefault();

    if (input.action === "append") {
      appendChar(input.value);
    } else if (input.action === "equals") {
      evaluateNow();
    } else if (input.action === "back") {
      deleteLast();
      ui.showToast("⌫");
    } else if (input.action === "clear") {
      clearAll();
      lastResult = null;
      ui.renderSecondary(null);
      ui.showToast("Cleared");
    } else if (input.action === "percent") {
      applyPercent();
    }
  }

  function handleHistorySelect(e) {
    expr = e.detail.expr;
    ui.renderPrimary(expr);
  }

  /* Initialization */

  function init() {
    theme.init();
    history.init();

    ui.renderPrimary("0");
    ui.renderSecondary(null);

    keysEl.addEventListener("click", handleKeyClick);
    window.addEventListener("keydown", handleKeyboardInput);
    window.addEventListener("history-select", handleHistorySelect);

    // Expose for debugging
    window.calc = { evaluateExpression: engine.evaluate };
  }

  return { init };
})();

// Start app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => CalculatorApp.init());
} else {
  CalculatorApp.init();
}
