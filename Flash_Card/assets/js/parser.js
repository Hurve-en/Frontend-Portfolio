/** ===============================
 *  PARSER.JS - Input Parsing Logic
 *  =============================== */

const Parser = (() => {
  // Parse raw input text into Q&A cards
  function parseInput(rawText) {
    const raw = rawText.trim();
    if (!raw) {
      return { success: false, cards: [] };
    }

    let parsed = [];

    // Strategy 1: Find explicit labels like "Q:" followed by "A:"
    const qaPattern =
      /(?:Q(?:uestion)?[\s:.]+)(.+?)(?:\r?\n)(?:A(?:nswer)?[\s:.]+)(.+?)(?=\r?\n\s*\r?\n|\r?\n\s*Q(?:uestion)?[\s:.]|$)/gis;
    let m;
    while ((m = qaPattern.exec(raw)) !== null) {
      const q = m[1].trim(),
        a = m[2].trim();
      if (q && a) parsed.push({ q, a });
    }

    // Strategy 2: If no labels, split on blank lines
    if (parsed.length === 0) {
      const blocks = raw
        .split(/\r?\n\s*\r?\n/)
        .map((b) => b.trim())
        .filter(Boolean);
      for (const block of blocks) {
        const lines = block
          .split(/\r?\n/)
          .map((l) =>
            l
              .replace(/^\s*[\d]+[\.\)]\s*/, "")
              .replace(/^\s*[-*•]\s*/, "")
              .trim(),
          )
          .filter(Boolean);
        if (lines.length >= 2) {
          parsed.push({ q: lines[0], a: lines.slice(1).join(" ") });
        }
      }
    }

    // Strategy 3: As fallback, take even-odd line pairs
    if (parsed.length === 0) {
      const lines = raw
        .split(/\r?\n/)
        .map((l) =>
          l
            .replace(/^\s*[\d]+[\.\)]\s*/, "")
            .replace(/^\s*[-*•]\s*/, "")
            .trim(),
        )
        .filter(Boolean);
      for (let i = 0; i + 1 < lines.length; i += 2) {
        if (lines[i] && lines[i + 1]) {
          parsed.push({ q: lines[i], a: lines[i + 1] });
        }
      }
    }

    if (parsed.length === 0) {
      return { success: false, cards: [] };
    }

    return { success: true, cards: parsed };
  }

  // Public API
  return {
    parseInput,
  };
})();
