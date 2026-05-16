const Quotes = (() => {
  let quotes = [];

  function init() {
    quotes = Storage.loadQuotes();
  }

  function getRandomQuote() {
    const i = Math.floor(Math.random() * quotes.length);
    return quotes[i];
  }

  function renderQuote(q) {
    const quoteBox = document.getElementById("quoteBox");
    const quoteTextEl = document.getElementById("quoteText");
    const quoteAuthorEl = document.getElementById("quoteAuthor");

    if (!q) return;
    if (Utils.prefersReduced) {
      quoteTextEl.textContent = `"${q.text}"`;
      quoteAuthorEl.textContent = `— ${q.author}`;
      return;
    }

    quoteBox.classList.add("fade-out");
    setTimeout(() => {
      quoteTextEl.textContent = `"${q.text}"`;
      quoteAuthorEl.textContent = `— ${q.author}`;
      quoteTextEl.classList.remove("pop");
      void quoteTextEl.offsetWidth;
      quoteTextEl.classList.add("pop");
      quoteBox.classList.remove("fade-out");
      quoteBox.classList.add("fade-in");
      setTimeout(() => quoteBox.classList.remove("fade-in"), 350);
    }, 160);
  }

  function addUserQuote(q) {
    if (Storage.saveQuote(q)) {
      quotes = Storage.loadQuotes();
      renderQuote(q);
      return true;
    }
    return false;
  }

  return { init, getRandomQuote, renderQuote, addUserQuote };
})();
