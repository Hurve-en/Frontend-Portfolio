(function(){
  // ------------------ DOM ELEMENTS ------------------
  const board = document.getElementById('board');
  const addBtn = document.getElementById('add-group');
  const resetAllBtn = document.getElementById('reset-all');
  const togglePresent = document.getElementById('toggle-present');

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let nextId = 1; // group IDs

  // ------------------ CREATE A GROUP ------------------
  function createGroup(name = null, initial = 0){
    const id = nextId++;
    const box = document.createElement('article');
    box.className = 'group-box';
    box.dataset.group = id;

    box.innerHTML = `
      <div class="group-top">
        <div>
          <input class="name-input" value="${escapeHtml(name ?? 'Group '+id)}" />
        </div>
        <div class="group-actions">
          <button title="Remove group" class="icon-btn remove">✕</button>
        </div>
      </div>
      <div class="group-score">
        <div class="value" role="status" aria-live="polite" aria-atomic="true" aria-label="Score for group ${id}">${initial}</div>
      </div>
      <div class="group-controls">
        <button class="btn-add">+10</button>
        <button class="btn-minus">-1</button>
        <button class="btn-reset">Reset</button>
      </div>
    `;

    attachListeners(box);
    board.appendChild(box);

    // Focus name input for easy renaming
    const nameInput = box.querySelector('.name-input');
    if(nameInput) nameInput.focus();

    // Small entrance animation
    if(!prefersReduced){
      box.style.transform = 'translateY(6px)';
      box.style.opacity = '0';
      requestAnimationFrame(()=> {
        box.style.transition = 'transform 280ms cubic-bezier(.2,.9,.2,1), opacity 240ms ease';
        box.style.transform = '';
        box.style.opacity = '';
      });
    }

    updateLeading();
    return box;
  }

  // ------------------ ESCAPE HTML ------------------
  function escapeHtml(s){
    return String(s).replace(/[&<>\"']/g, c=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '\"':'&quot;',
      '\'':"&#39;"
    }[c]));
  }

  // ------------------ READ / WRITE SCORE ------------------
  function readScoreFromBox(box){
    const v = parseInt(box.querySelector('.value').textContent,10);
    return Number.isFinite(v)?v:0;
  }

  function writeScoreToBox(box,n){
    const valueEl = box.querySelector('.value');
    valueEl.textContent = String(n);
    valueEl.setAttribute('aria-label', `Score ${n} for group ${box.dataset.group || ''}`);

    // Animate score change
    if(!prefersReduced){
      valueEl.classList.remove('pop');
      void valueEl.offsetWidth; // force reflow
      valueEl.classList.add('pop');
      clearTimeout(valueEl._popTimeout);
      valueEl._popTimeout = setTimeout(()=> valueEl.classList.remove('pop'), 450);
    }

    updateLeading();
  }

  // ------------------ ATTACH LISTENERS ------------------
  function attachListeners(box){
    const add = box.querySelector('.btn-add');
    const minus = box.querySelector('.btn-minus');
    const reset = box.querySelector('.btn-reset');
    const remove = box.querySelector('.remove');
    const valueEl = box.querySelector('.value');
    const nameInput = box.querySelector('.name-input');

    add.addEventListener('click',()=>{
      const n = readScoreFromBox(box);
      writeScoreToBox(box, Math.max(0,n+10));
      add.animate?.([{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }, { transform: 'translateY(0)' }], { duration: 160 });
    });

    minus.addEventListener('click',()=>{
      const n = readScoreFromBox(box);
      writeScoreToBox(box, Math.max(0,n-1));
    });

    reset.addEventListener('click',()=> writeScoreToBox(box,0));

    remove.addEventListener('click', ()=>{
      if(confirm('Remove this group?')){ box.remove(); updateLeading(); }
    });

    valueEl.addEventListener('click', ()=>{
      const cur = readScoreFromBox(box);
      const v = prompt('Set score for "'+(nameInput.value||'Group')+'":',String(cur));
      if(v===null) return;
      const parsed = parseInt(v,10);
      if(Number.isFinite(parsed)) writeScoreToBox(box, Math.max(0,parsed));
    });

    // Blur input on Enter
    nameInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); nameInput.blur(); } });
  }

  // ------------------ UPDATE LEADING GROUP ------------------
  function updateLeading(){
    const boxes = Array.from(board.querySelectorAll('.group-box'));
    if(boxes.length===0) return;
    let max = -Infinity;
    boxes.forEach(b=>{ const s = readScoreFromBox(b); if(s>max) max = s; });
    boxes.forEach(b=> b.classList.toggle('leading', readScoreFromBox(b)===max && max>=0));
  }

  // ------------------ BUTTON HANDLERS ------------------
  addBtn.addEventListener('click', ()=> createGroup());

  resetAllBtn.addEventListener('click', ()=>{
    if(!confirm('Reset scores for all groups?')) return;
    board.querySelectorAll('.group-box').forEach(b=> writeScoreToBox(b,0));
  });

  // ------------------ PRESENTATION MODE TOGGLE ------------------
  togglePresent.addEventListener('click', () => {
    const enabled = document.body.classList.toggle('present');
    togglePresent.textContent = enabled ? 'Exit Present Mode' : 'Enter Present Mode';
  });

  // ------------------ KEYBOARD SHORTCUTS ------------------
  document.addEventListener('keydown', (e)=>{
    if(document.activeElement && document.activeElement.tagName==='INPUT') return;
    const focused = document.querySelector('.group-box:focus-within') || document.querySelector('.group-box');
    if(!focused) return;
    if(e.key === '+') { const btn = focused.querySelector('.btn-add'); if(btn) btn.click(); }
    if(e.key === '-') { const btn = focused.querySelector('.btn-minus'); if(btn) btn.click(); }
    // Global shortcut: P toggles presentation mode
    if(e.key.toLowerCase() === 'p'){
      const enabled = document.body.classList.toggle('present');
      togglePresent.textContent = enabled ? 'Exit Present Mode' : 'Enter Present Mode';
      togglePresent.focus({ preventScroll: true });
    }
  });

  // ------------------ INITIAL SAMPLE GROUPS ------------------
  for(let i=0;i<5;i++) createGroup();

  // ------------------ EXPORT HELPERS ------------------
  window.createGroup = createGroup;
  window.updateLeading = updateLeading;

})();
