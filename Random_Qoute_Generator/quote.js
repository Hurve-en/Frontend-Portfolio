/* quotes.js
   Externalized JavaScript for the Quote Generator.
   - Animates new quotes (fade + pop)
   - Copy / Tweet actions
   - Add & persist new quotes (localStorage)
   - Beginner-friendly comments
*/

(() => {
  // --------- DOM references ----------
  const quoteBox = document.getElementById('quoteBox');
  const quoteTextEl = document.getElementById('quoteText');
  const quoteAuthorEl = document.getElementById('quoteAuthor');

  const newBtn = document.getElementById('newQuoteBtn');
  const copyBtn = document.getElementById('copyBtn');
  const tweetBtn = document.getElementById('tweetBtn');

  // add-quote UI elements (we inject them into DOM if not present)
  // we'll expect a container div with id 'addQuoteContainer' or we create one
  let addWrap = document.getElementById('addQuoteContainer');

  const hintEl = document.getElementById('hint') || createHint();

  const STORAGE_KEY = 'quotes:user'; // user-added quotes
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --------- Default quote list (you provided) ----------
  const builtIn = [
    { text: "Life is like riding a bicycle. To keep your balance you must keep moving.", author: "Albert Einstein" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
    { text: "When something is important enough, you do it even if the odds are not in your favor.", author: "Elon Musk" },
    { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
    { text: "Don't compare yourself with anyone in this world.", author: "Bill Gates" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
    { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
    { text: "The best way out is always through.", author: "Robert Frost" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  ];

  // combine built-in + saved user
  function loadQuotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const user = raw ? JSON.parse(raw) : [];
      return [...user, ...builtIn];
    } catch (e) {
      return builtIn.slice();
    }
  }
  let quotes = loadQuotes();

  // ---------- Helper: create hint element if missing ----------
  function createHint() {
    const el = document.createElement('div');
    el.id = 'hint';
    el.textContent = 'Quotes are saved locally in your browser.';
    // find a place to attach: card element
    const card = document.querySelector('.card');
    if (card) card.appendChild(el);
    return el;
  }

  // ---------- Random quote selection ----------
  function getRandomQuote() {
    const i = Math.floor(Math.random() * quotes.length);
    return quotes[i];
  }

  // ---------- Render a quote with smooth animation ----------
  function renderQuote(q) {
    if (!q) return;
    // If reduced motion, just set directly
    if (prefersReduced) {
      quoteTextEl.textContent = `“${q.text}”`;
      quoteAuthorEl.textContent = `— ${q.author}`;
      return;
    }

    // Fade-out current, then replace text, then fade-in + pop
    quoteBox.classList.add('fade-out');
    // small delay to allow CSS fade-out
    setTimeout(() => {
      quoteTextEl.textContent = `“${q.text}”`;
      quoteAuthorEl.textContent = `— ${q.author}`;

      // trigger text pop
      quoteTextEl.classList.remove('pop');
      void quoteTextEl.offsetWidth; // force reflow
      quoteTextEl.classList.add('pop');

      // fade-in container
      quoteBox.classList.remove('fade-out');
      quoteBox.classList.add('fade-in');

      // remove fade-in after transition
      setTimeout(() => quoteBox.classList.remove('fade-in'), 350);
    }, prefersReduced ? 0 : 160);
  }

  // ---------- New quote button ----------
  newBtn.addEventListener('click', () => {
    renderQuote(getRandomQuote());
  });

  // ---------- Copy button ----------
  copyBtn.addEventListener('click', async () => {
    const text = `${quoteTextEl.textContent} ${quoteAuthorEl.textContent}`;
    try {
      await navigator.clipboard.writeText(text);
      showHint('Copied to clipboard!');
    } catch (e) {
      showHint('Copy not supported in this browser.');
    }
  });

  // ---------- Tweet button ----------
  tweetBtn.addEventListener('click', () => {
    const quote = quoteTextEl.textContent;
    const author = quoteAuthorEl.textContent;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(quote + ' ' + author)}`;
    window.open(url, '_blank', 'noopener');
  });

  // ---------- Keyboard shortcuts: Space / N for next ----------
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key.toLowerCase() === 'n') {
      // avoid when typing in input fields
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      renderQuote(getRandomQuote());
    }
  });

  // ---------- Hint display ----------
  let hintTimeout;
  function showHint(msg, ms = 1600) {
    hintEl.textContent = msg;
    clearTimeout(hintTimeout);
    if (ms > 0) hintTimeout = setTimeout(() => hintEl.textContent = 'Quotes are saved locally in your browser.', ms);
  }

  // ---------- Add-quote UI: create controls and wiring ----------
  // If HTML already has a container with id 'addQuoteContainer' we use it,
  // otherwise we'll inject the UI into the controls area.
  function ensureAddQuoteUI() {
    addWrap = document.getElementById('addQuoteContainer');
    if (addWrap) return;
    const controls = document.querySelector('.controls .left-controls') || document.querySelector('.controls');
    if (!controls) return;

    // build the wrapper
    addWrap = document.createElement('div');
    addWrap.id = 'addQuoteContainer';
    addWrap.className = 'add-quote-wrap';

    addWrap.innerHTML = `
      <input id="quoteInputText" type="text" placeholder="Add quote text (required)"/>
      <input id="quoteInputAuthor" type="text" placeholder="Author (optional)"/>
      <button id="addQuoteBtn" title="Add quote">Save</button>
    `;
    controls.appendChild(addWrap);

    // wire events
    const quoteInput = addWrap.querySelector('#quoteInputText');
    const authorInput = addWrap.querySelector('#quoteInputAuthor');
    const addBtn = addWrap.querySelector('#addQuoteBtn');

    addBtn.addEventListener('click', () => {
      const text = quoteInput.value.trim();
      const author = authorInput.value.trim() || 'Unknown';
      if (!text) {
        showHint('Please enter a quote text first.');
        quoteInput.focus();
        return;
      }
      addUserQuote({ text, author });
      quoteInput.value = '';
      authorInput.value = '';
      showHint('Quote saved locally!');
    });

    // allow Enter to submit in either field
    [quoteInput, authorInput].forEach(inp => {
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addBtn.click();
        }
      });
    });
  }

  // ---------- Add user quote (persist to localStorage) ----------
  function addUserQuote(q) {
    try {
      // fetch existing user quotes (we store only user quotes, builtIns are static)
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift(q); // add newest first
      // limit to last 200 user quotes to avoid bloat
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 200)));
      // refresh in-memory quotes and show the newly added immediately
      quotes = loadAllQuotes();
      renderQuote(q);
    } catch (e) {
      console.error('Saving quote failed', e);
      showHint('Save failed.');
    }
  }

  function loadAllQuotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const user = raw ? JSON.parse(raw) : [];
      return [...user, ...builtIn];
    } catch (e) {
      return builtIn.slice();
    }
  }

  // ---------- Init ----------
  // Create hint if missing, add-quote UI, and render an initial quote.
  (function init() {
    // render initial from combined list
    quotes = loadAllQuotes();
    ensureAddQuoteUI();
    renderQuote(getRandomQuote());
    showHint('Quotes are saved locally in your browser.');

    // expose for dev console
    window._quotes = quotes;
  })();

})();
