document.addEventListener("DOMContentLoaded", () => {
  Quotes.init();
  UI.init();
  Actions.bindNewQuote();
  Actions.bindCopyQuote();
  Actions.bindTweet();
  Actions.bindKeyboard();
  Actions.bindAddQuote();
  window._quotes = Quotes;
});
