const Storage = (() => {
  const STORAGE_KEY = "quotes:user";

  function loadQuotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const user = raw ? JSON.parse(raw) : [];
      return [...user, ...QuoteData.builtIn];
    } catch (e) {
      return QuoteData.builtIn.slice();
    }
  }

  function saveQuote(q) {
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift(q);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 200)));
      return true;
    } catch (e) {
      return false;
    }
  }

  return { loadQuotes, saveQuote };
})();
