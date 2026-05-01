/* ============================================
   CALCULATOR.JS - Core calculation engine
   ============================================ */

const CalculatorEngine = (function () {
  /* Safe expression evaluation using Shunting Yard algorithm */

  function formatNumber(n) {
    if (!isFinite(n)) throw new Error("Non-finite result");
    const rounded = Math.round((n + Number.EPSILON) * 1e12) / 1e12;
    if (Math.abs(rounded - Math.round(rounded)) < 1e-12)
      return Math.round(rounded);
    return String(rounded).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
  }

  function tokenize(s) {
    const tokens = [];
    let i = 0;

    while (i < s.length) {
      const ch = s[i];

      // Skip whitespace
      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      // Numbers
      if (/[0-9.]/.test(ch)) {
        let num = ch;
        i++;
        while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
        if ((num.match(/\./g) || []).length > 1)
          throw new Error("Invalid number");
        tokens.push({ type: "num", value: parseFloat(num) });
        continue;
      }

      // Unary +/-
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

      // Percent
      if (ch === "%") {
        tokens.push({ type: "pct" });
        i++;
        continue;
      }

      // Parentheses
      if (ch === "(" || ch === ")") {
        tokens.push({ type: "par", value: ch });
        i++;
        continue;
      }

      // Operators
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
      if (tok.type === "num") {
        out.push(tok);
      } else if (tok.type === "pct") {
        out.push({ type: "op", value: "%" });
      } else if (tok.type === "op") {
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
        if (tok.value === "(") {
          ops.push(tok);
        } else {
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
      if (tok.type === "num") {
        st.push(tok.value);
      } else if (tok.type === "op") {
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
      } else {
        throw new Error("Invalid token");
      }
    }

    if (st.length !== 1) throw new Error("Syntax error");
    return st[0];
  }

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

  function evaluate(expression) {
    const tokens = tokenize(expression);
    const rpn = toRPN(tokens);
    return evalRPN(rpn);
  }

  return {
    evaluate,
    formatNumber,
    isOperator,
    getLastNumberSegment,
  };
})();
