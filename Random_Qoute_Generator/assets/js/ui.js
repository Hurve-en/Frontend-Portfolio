const UI = (() => {
  function ensureAddQuoteUI() {
    let addWrap = document.getElementById("addQuoteContainer");
    if (addWrap) return;
    const controls = document.querySelector(".controls .left-controls") || document.querySelector(".controls");
    if (!controls) return;

    addWrap = document.createElement("div");
    addWrap.id = "addQuoteContainer";
    addWrap.className = "add-quote-wrap";

    addWrap.innerHTML = `
      <input id="quoteInputText" type="text" placeholder="Add quote text (required)"/>
      <input id="quoteInputAuthor" type="text" placeholder="Author (optional)"/>
      <button id="addQuoteBtn" title="Add quote">Save</button>
    `;
    controls.appendChild(addWrap);
  }

  function init() {
    document.getElementById("hint") || Utils.createHint();
    ensureAddQuoteUI();
    Quotes.renderQuote(Quotes.getRandomQuote());
    Utils.showHint("Quotes are saved locally in your browser.");
  }

  return { init };
})();
