/* ============================================
   INPUT-VALIDATOR.JS - Input validation logic
   ============================================ */

const InputValidator = (function () {
  const engine = CalculatorEngine;

  /**
   * Validate and append a character to the expression
   * @param {string} ch - Character to append
   * @param {string} expr - Current expression
   * @returns {string} Updated expression (or original if invalid)
   */
  function validateAppendChar(ch, expr) {
    if (ch === ".") {
      const lastNum = engine.getLastNumberSegment(expr);
      if (lastNum.includes(".")) return expr; // Already has decimal
      if (lastNum === "") expr += "0"; // Add 0 before decimal
    }

    const last = expr.slice(-1);
    if (
      engine.isOperator(last) &&
      engine.isOperator(ch) &&
      ch !== "(" &&
      ch !== ")"
    ) {
      // Replace operator with new one (unless it's unary minus)
      if (!(ch === "-" && (last === "(" || last === ""))) {
        expr = expr.slice(0, -1);
      }
    }

    return expr + ch;
  }

  /**
   * Validate percent operation
   * @param {string} expr - Current expression
   * @returns {string} Updated expression (or original if invalid)
   */
  function validateApplyPercent(expr) {
    if (expr === "") return expr;

    const last = expr.slice(-1);
    if (last === "%" || last === "(" || engine.isOperator(last)) {
      return expr; // Can't apply percent here
    }

    return expr + "%";
  }

  /**
   * Validate keyboard input and return the action
   * @param {string} key - Key pressed
   * @returns {object} { action: string, value?: string } or null
   */
  function validateKeyboardInput(key) {
    if (/^[0-9]$/.test(key)) {
      return { action: "append", value: key };
    }

    if (key === ".") {
      return { action: "append", value: "." };
    }

    if (key === "+" || key === "-" || key === "*" || key === "/") {
      return { action: "append", value: key };
    }

    if (key === "(" || key === ")") {
      return { action: "append", value: key };
    }

    if (key === "Enter" || key === "=") {
      return { action: "equals" };
    }

    if (key === "Backspace") {
      return { action: "back" };
    }

    if (key === "Escape") {
      return { action: "clear" };
    }

    if (key === "%") {
      return { action: "percent" };
    }

    return null; // Unrecognized key
  }

  return {
    validateAppendChar,
    validateApplyPercent,
    validateKeyboardInput,
  };
})();
