// scripts.js — lightweight UI interactions for Aesthetic Chat Simulator
// - Keep this file name (scripts.js)
// - Designed to be unobtrusive and easy to extend
// - Respects prefers-reduced-motion

(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DOM refs
  const contactsList = document.getElementById('contactsList');
  const messagesWrap = document.getElementById('messagesWrap');
  const chatHeader = document.getElementById('chatHeader');
  const chatName = document.getElementById('chatName');
  const chatStatus = document.getElementById('chatStatus');
  const chatAvatar = document.getElementById('chatAvatar');
  const backBtn = document.getElementById('backBtn');
  const composerInput = document.getElementById('composerInput');
  const sendBtn = document.getElementById('sendBtn');
  const emojiBtn = document.getElementById('emojiBtn');
  const attachBtn = document.getElementById('attachBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const openThemes = document.getElementById('openThemes');
  const openSettings = document.getElementById('openSettings');
  const themesPanel = document.getElementById('themesPanel');
  const settingsPanel = document.getElementById('settingsPanel');
  const themeGrid = document.getElementById('themeGrid');
  const presentToggle = document.getElementById('presentToggle');
  const sendAnimationClass = 'enter';

  // Sample data (contacts + messages)
  const seedContacts = [
    { id:'c-1', name:'Babi :> ', preview:'Sure — I’ll send the photos soon.', time:'2:18 PM', avatarColor:'linear-gradient(135deg,#ffd6e7,#fff2f9)', online:true,
      messages:[
        { who:'contact', text:'Hey! Did you get the photos from yesterday?', time:'2:12 PM' },
        { who:'you', text:'Not yet — send them when free!', time:'2:15 PM' },
        { who:'contact', text:'Sure — I’ll send the photos soon.', time:'2:18 PM' }
      ]
    },
    { id:'c-2', name:'Rheynel Gen', preview:'On my way ✨', time:'Yesterday', avatarColor:'linear-gradient(135deg,#d6f2ff,#f0fbff)', online:false,
      messages:[
        { who:'contact', text:'On my way ✨', time:'Yesterday' }
      ]
    },
    { id:'c-3', name:'Aj Mozart', preview:'Let’s meet 4pm?', time:'Mon', avatarColor:'linear-gradient(135deg,#fff7d6,#fff0cc)', online:true,
      messages:[
        { who:'contact', text:'Let’s meet 4pm?', time:'Mon' }
      ]
    }
  ];

  // Themes to show in theme selector
  const themes = [
    { id:'light', name:'Light', desc:'Soft, airy', preview: ['#f6f8fb','#ffffff'] },
    { id:'dark', name:'Dark', desc:'Calm, deep', preview: ['#071025','#0f1724'] },
    { id:'pastel-pink', name:'Pastel Pink', desc:'Warm & gentle', preview:['#fff6f8','#fff0f3'] },
    { id:'blue-neon', name:'Blue Neon', desc:'Vibrant night', preview:['#071022','#031025'] },
    { id:'sunset', name:'Sunset', desc:'Warm gradient', preview:['#fff6e8','#fff0e0'] }
  ];

  // Application state
  let currentContact = null;
  let currentTheme = localStorage.getItem('chat:theme') || 'light';
  document.body.setAttribute('data-theme', currentTheme);
  document.body.classList.toggle('theme-dark', currentTheme === 'dark');

  // Utility: create element with attrs
  function el(tag, attrs = {}, ...children){
    const e = document.createElement(tag);
    for (const k in attrs){
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    children.forEach(c => { if (typeof c === 'string') e.appendChild(document.createTextNode(c)); else if (c) e.appendChild(c); });
    return e;
  }

  // -------------------------
  // Populate contacts list
  // -------------------------
  function renderContacts(){
    contactsList.innerHTML = '';
    seedContacts.forEach(c => {
      const contactEl = el('div',{class:'contact', role:'button', tabindex:'0', 'data-id': c.id, 'aria-label': `Open chat with ${c.name}`});
      const avatar = el('div',{class:'avatar', style:`background:${c.avatarColor}`});
      const meta = el('div',{class:'meta'});
      const nameRow = el('div',{class:'name-row'});
      const name = el('div',{class:'name'}, c.name);
      const time = el('div',{class:'time'}, c.time || '');
      const preview = el('div',{class:'preview'}, c.preview || '');
      nameRow.appendChild(name);
      nameRow.appendChild(time);
      meta.appendChild(nameRow);
      meta.appendChild(preview);
      contactEl.appendChild(avatar);
      contactEl.appendChild(meta);
      contactsList.appendChild(contactEl);

      // click / keyboard open
      contactEl.addEventListener('click', ()=> openChat(c.id));
      contactEl.addEventListener('keydown', (e)=> { if (e.key === 'Enter') openChat(c.id); });
    });
  }

  // -------------------------
  // Open chat: render header + messages
  // -------------------------
  function openChat(contactId){
    const contact = seedContacts.find(s => s.id === contactId);
    if (!contact) return;
    currentContact = contact;
    // header
    chatName.textContent = contact.name;
    chatStatus.textContent = contact.online ? 'online' : 'offline';
    chatAvatar.style.background = contact.avatarColor;
    chatHeader.setAttribute('aria-hidden','false');

    // messages
    messagesWrap.innerHTML = '';
    contact.messages.forEach(msg => appendMessage(msg.who, msg.text, msg.time, {skipScroll:true}));
    // smooth scroll to bottom
    requestAnimationFrame(()=> messagesWrap.scrollTop = messagesWrap.scrollHeight);

    // small open animation
    if (!prefersReduced) {
      messagesWrap.animate([{opacity:0},{opacity:1}], {duration:320, easing:'cubic-bezier(.2,.9,.2,1)'});
    }
  }

  // -------------------------
  // Append a message
  // who: 'you' | 'contact'
  // -------------------------
  function appendMessage(who, text, time, opts = {}){
    const msg = el('div', {class:`message ${who}`});
    const bubble = el('div', {class:'bubble'}, text);
    const metaTime = el('div', {class:'meta-time'}, time || new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
    bubble.appendChild(metaTime);
    msg.appendChild(bubble);
    messagesWrap.appendChild(msg);

    // animation
    if (!prefersReduced) {
      msg.classList.add(sendAnimationClass);
      setTimeout(()=> msg.classList.remove(sendAnimationClass), 500);
    }

    if (!opts.skipScroll) {
      // auto-scroll
      setTimeout(()=> {
        messagesWrap.scrollTo({ top: messagesWrap.scrollHeight, behavior: prefersReduced ? 'auto' : 'smooth' });
      }, 80);
    }
  }

  // -------------------------
  // Send message from composer
  // -------------------------
  function sendMessage(){
    const text = composerInput.value.trim();
    if (!text) return;
    appendMessage('you', text);
    composerInput.value = '';
    composerInput.focus();

    //simulate reply for demo
    setTimeout(()=> {
      appendMessage('contact', 'Nice! ✨');
    }, 700);
  }

  // -------------------------
  // Theme grid rendering & switching
  // -------------------------
  function renderThemeGrid(){
    themeGrid.innerHTML = '';
    themes.forEach(t => {
      const card = el('div',{class:'theme-card', tabindex:'0', 'data-theme': t.id, title:t.name});
      const sw = el('div',{class:'theme-swatch', style:`background: linear-gradient(135deg, ${t.preview[0]}, ${t.preview[1]})`});
      const title = el('div', {class:'label'}, t.name);
      const desc = el('div', {class:'muted'}, t.desc);
      card.appendChild(sw); card.appendChild(title); card.appendChild(desc);
      themeGrid.appendChild(card);

      card.addEventListener('click', ()=> applyTheme(t.id));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyTheme(t.id); });
    });
  }

  function applyTheme(id){
    document.body.setAttribute('data-theme', id);
    localStorage.setItem('chat:theme', id);
  }

  // -------------------------
  // Wire up controls & interactions
  // -------------------------
  function wire(){
    // initial render
    renderContacts();
    renderThemeGrid();

    // open first contact by default on wide screens
    if (seedContacts.length && window.innerWidth > 900){
      openChat(seedContacts[0].id);
    }

    // send button
    sendBtn.addEventListener('click', sendMessage);
    composerInput.addEventListener('keydown', (e)=> {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // emoji / attach stub interactions
    emojiBtn.addEventListener('click', ()=> {
      // playful micro-animation
      emojiBtn.animate?.([{ transform:'scale(1)' }, { transform:'scale(1.12)' }, { transform:'scale(1)' }], { duration:220 });
      composerInput.value = (composerInput.value ? composerInput.value + ' ' : '') + '😊';
      composerInput.focus();
    });
    attachBtn.addEventListener('click', ()=> {
      attachBtn.animate?.([{ transform:'translateY(0)' }, { transform:'translateY(-6px)' }, { transform:'translateY(0)' }], {duration:220});
      // in a real app, trigger file picker
      alert('Attachment demo — no file picker in this simulator.');
    });

    // new chat (demo)
    newChatBtn.addEventListener('click', ()=> {
      alert('Start new chat — UI hook for adding a contact.');
    });

    // open theme/settings panels
    openThemes?.addEventListener('click', ()=> {
      themesPanel.style.display = 'block';
      settingsPanel.style.display = 'none';
    });
    openSettings?.addEventListener('click', ()=> {
      settingsPanel.style.display = 'block';
      themesPanel.style.display = 'none';
    });

    // present toggle: full-screen-like focus
    presentToggle.addEventListener('click', ()=> {
      const is = document.body.classList.toggle('present-mode');
      presentToggle.setAttribute('aria-pressed', String(is));
      presentToggle.textContent = is ? 'Exit Present' : 'Present';
      // if entering present, slightly enlarge messages
      document.documentElement.style.setProperty('--present-scale', is ? '1.04' : '1');
    });

    // back button returns to contact list on small screens
    backBtn?.addEventListener('click', ()=> {
      window.scrollTo({top:0, behavior: 'smooth'});
    });

    // theme from local storage
    const saved = localStorage.getItem('chat:theme');
    if (saved) applyTheme(saved);

    // accessibility: focus composer when a chat is opened
    contactsList.addEventListener('click', ()=> {
      setTimeout(()=> composerInput.focus(), 240);
    });
  }

  // initialize
  wire();

  // small export for console debugging
  window._chatSim = { openChat, appendMessage, applyTheme };
})();
