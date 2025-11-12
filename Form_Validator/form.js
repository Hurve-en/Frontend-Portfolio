/* Robust theme + password-visibility initializer
   - Paste this into app.js (replace existing theme/eye code)
   - Defensively finds elements by multiple common ids/classes
   - Persists theme in localStorage under key "form_theme"
   - Makes sure password toggle buttons are type="button" and work reliably
*/
(function () {
  'use strict';

  const THEME_KEY = 'form_theme';

  // Utility: wait for DOM
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // Utility: find first element by list of selectors
  function findOne(selectors) {
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    return null;
  }

  // Utility: find all matching selectors flattened
  function findAll(selectors) {
    const set = new Set();
    for (const s of selectors) {
      document.querySelectorAll(s).forEach(n => set.add(n));
    }
    return Array.from(set);
  }

  onReady(() => {
    // -------------------------
    // THEME TOGGLE (robust)
    // -------------------------
    // selectors we will accept for the toggle button
    const themeBtn = findOne([
      '#themeToggle',         // common id used before
      '.theme-toggle',        // alternate class
      '[data-theme-toggle]'   // data attribute
    ]);

    // Determine saved theme or system preference
    function getSavedTheme() {
      try {
        return localStorage.getItem(THEME_KEY);
      } catch (_) { return null; }
    }
    function saveTheme(t) {
      try { localStorage.setItem(THEME_KEY, t); } catch (_) {}
    }

    function applyTheme(theme) {
      if (theme === 'dark') {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      } else {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
      }
      // update accessible label/icon on button
      if (themeBtn) {
        themeBtn.setAttribute('aria-pressed', String(theme === 'dark'));
        // try to pick a simple icon/text that won't break layout
        themeBtn.textContent = theme === 'dark' ? '☀' : '🌙';
      }
    }

    // initialize theme
    (function initTheme() {
      let saved = getSavedTheme();
      if (!saved) {
        // fallback to prefers-color-scheme
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        saved = prefersDark ? 'dark' : 'light';
      }
      applyTheme(saved);
    })();

    if (themeBtn) {
      // ensure it's a button that doesn't submit forms
      themeBtn.type = 'button';
      themeBtn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark');
        const next = isDark ? 'light' : 'dark';
        applyTheme(next);
        saveTheme(next);
      });
      // keyboard activation
      themeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          themeBtn.click();
        }
      });
    } else {
      console.info('THEME: toggle button not found (looking for #themeToggle, .theme-toggle, [data-theme-toggle])');
    }

    // -------------------------
    // PASSWORD VISIBILITY TOGGLERS (robust)
    // -------------------------
    // Accept common toggle patterns:
    // - <button class="toggle-password"> inside .password-wrapper next to input
    // - <button data-toggle-for="passwordId">
    // - <button aria-controls="passwordId">
    //
    // We'll find any button matching those selectors and wire it.

    const toggleButtons = findAll([
      '.toggle-password',
      'button[data-toggle-for]',
      'button[aria-controls]',
      'button.password-toggle',
      'button[data-password-toggle]'
    ]);

    if (toggleButtons.length === 0) {
      // no explicit toggle buttons — attempt to auto-insert for common password wrappers
      const wrappers = document.querySelectorAll('.password-wrapper');
      wrappers.forEach((wrap) => {
        // do not duplicate if wrapper already has a button
        if (wrap.querySelector('button.toggle-password') || wrap.querySelector('button.password-toggle')) return;
        // find input inside
        const input = wrap.querySelector('input[type="password"], input[type="text"]');
        if (!input) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'toggle-password';
        btn.setAttribute('aria-label', 'Show password');
        btn.textContent = '👁';
        // append and collect
        wrap.appendChild(btn);
        toggleButtons.push(btn);
      });
    }

    // Helper: given a toggle button, find its target input
    function resolveTargetInput(btn) {
      // 1) data-toggle-for attribute (ID)
      const dataTarget = btn.getAttribute('data-toggle-for');
      if (dataTarget) {
        const el = document.getElementById(dataTarget);
        if (el && (el.tagName === 'INPUT')) return el;
      }
      // 2) aria-controls attribute
      const ariaTarget = btn.getAttribute('aria-controls');
      if (ariaTarget) {
        const el = document.getElementById(ariaTarget);
        if (el && (el.tagName === 'INPUT')) return el;
      }
      // 3) if button is inside .password-wrapper, find sibling input
      const wrapper = btn.closest('.password-wrapper');
      if (wrapper) {
        const input = wrapper.querySelector('input[type="password"], input[type="text"]');
        if (input) return input;
      }
      // 4) previousElementSibling if that is an input (common markup)
      const prev = btn.previousElementSibling;
      if (prev && prev.tagName === 'INPUT') return prev;
      // 5) nextElementSibling (just in case)
      const next = btn.nextElementSibling;
      if (next && next.tagName === 'INPUT') return next;
      // not found
      return null;
    }

    // Wire up each toggle button
    toggleButtons.forEach((btn) => {
      // ensure button doesn't submit forms
      try { btn.type = 'button'; } catch (_) {}
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = resolveTargetInput(btn);
        if (!input) {
          console.warn('PASSWORD TOGGLE: target input not found for button', btn);
          return;
        }
        // toggle type
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        // update aria label and icon/text
        btn.setAttribute('aria-pressed', String(!isPassword));
        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        // choose icon text that is safe across fonts
        try {
          btn.textContent = isPassword ? '🙈' : '👁';
        } catch (_) {}
      });

      // keyboard accessible
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });

    if (toggleButtons.length === 0) {
      console.info('PASSWORD: no toggle buttons found and none auto-inserted (check markup .password-wrapper)');
    } else {
      console.info('PASSWORD: wired', toggleButtons.length, 'toggle(s)');
    }

    // -------------------------
    // Small helpful fix: ensure any inline "eye" buttons inside the form are not type=submit
    // (some markup mistakenly places <button> without type inside a form)
    // -------------------------
    Array.from(document.querySelectorAll('form button')).forEach(b => {
      if (!b.hasAttribute('type')) {
        // leave submit buttons alone if they have "submit" text or class
        const text = (b.textContent || '').trim().toLowerCase();
        // if the button looks like an icon (contains emoji or 'eye' text) treat it as neutral and set type=button
        if (text.length <= 2 || text.includes('eye') || text.includes('👁') || text.includes('🙈')) {
          try { b.type = 'button'; } catch (_) {}
        }
      }
    });

    // Done init
    console.info('INIT: theme + password toggles initialized.');
  }); // onReady

})();
