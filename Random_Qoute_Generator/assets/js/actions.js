const Actions = (() => {
  function bindNewQuote() {
    const newBtn = document.getElementById("newQuoteBtn");
    newBtn.addEventListener("click", () => {
      Quotes.renderQuote(Quotes.getRandomQuote());
    });
  }

  function bindCopyQuote() {
    const copyBtn = document.getElementById("copyBtn");
    copyBtn.addEventListener("click", async () => {
      const quoteTextEl = document.getElementById("quoteText");
      const quoteAuthorEl = document.getElementById("quoteAuthor");
      const text = `${quoteTextEl.textContent} ${quoteAuthorEl.textContent}`;
      try {
        await navigator.clipboard.writeText(text);
        Utils.showHint("Copied to clipboard!");
      } catch (e) {
        Utils.showHint("Copy not supported in this browser.");
      }
    });
  }

  function bindTweet() {
    const tweetBtn = document.getElementById("tweetBtn");
    tweetBtn.addEventListener("click", () => {
      const quoteTextEl = document.getElementById("quoteText");
      const quoteAuthorEl = document.getElementById("quoteAuthor");
      const quote = quoteTextEl.textContent;
      const author = quoteAuthorEl.textContent;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(quote + " " + author)}`;
      window.open(url, "_blank", "noopener");
    });
  }

  function bindKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key.toLowerCase() === "n") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        e.preventDefault();
        Quotes.renderQuote(Quotes.getRandomQuote());
      }
    });
  }

  function bindAddQuote() {
    const quoteInput = document.getElementById("quoteInputText");
    const authorInput = document.getElementById("quoteInputAuthor");
    const addBtn = document.getElementById("addQuoteBtn");

    const submit = () => {
      const text = quoteInput.value.trim();
      const author = authorInput.value.trim() || "Unknown";
      if (!text) {
        Utils.showHint("Please enter a quote text first.");
        quoteInput.focus();
        return;
      }
      if (Quotes.addUserQuote({ text, author })) {
        quoteInput.value = "";
        authorInput.value = "";
        Utils.showHint("Quote saved locally!");
      } else {
        Utils.showHint("Save failed.");
      }
    };

    addBtn.addEventListener("click", submit);
    [quoteInput, authorInput].forEach((inp) => {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      });
    });
  }

  return { bindNewQuote, bindCopyQuote, bindTweet, bindKeyboard, bindAddQuote };
})();
