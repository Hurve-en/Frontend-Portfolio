(function(){
  const board = document.getElementById('board');
  const addBtn = document.getElementById('add-group');
  const resetAllBtn = document.getElementById('reset-all');
  const togglePresent = document.getElementById('toggle-present');

  let nextId = 1; // group ids

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
        <div class="value" role="status" aria-label="Score for group ${id}">${initial}</div>
      </div>
      <div class="group-controls">
        <button class="btn-add">+10</button>
        <button class="btn-minus">-1</button>
        <button class="btn-reset">Reset</button>
      </div>
    `;

    attachListeners(box);
    board.appendChild(box);
    updateLeading();
    return box;
  }

  function escapeHtml(s){return String(s).replace(/[&<>\"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':"&#39;" }[c]));}

  function readScoreFromBox(box){
    const v = parseInt(box.querySelector('.value').textContent,10);
    return Number.isFinite(v)?v:0;
  }
  function writeScoreToBox(box,n){
    box.querySelector('.value').textContent = String(n);
    updateLeading();
  }

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

    nameInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') nameInput.blur(); });
  }

  function updateLeading(){
    const boxes = Array.from(board.querySelectorAll('.group-box'));
    if(boxes.length===0) return;
    let max = -Infinity;
    boxes.forEach(b=>{ const s = readScoreFromBox(b); if(s>max) max = s; });
    boxes.forEach(b=> b.classList.toggle('leading', readScoreFromBox(b)===max && max>=0));
  }

  addBtn.addEventListener('click', ()=> createGroup());
  resetAllBtn.addEventListener('click', ()=>{
    if(!confirm('Reset scores for all groups?')) return;
    board.querySelectorAll('.group-box').forEach(b=> writeScoreToBox(b,0));
  });

  togglePresent.addEventListener('click', ()=>{
    const isPresent = document.body.classList.toggle('present');
    togglePresent.textContent = isPresent? 'Exit Present Mode' : 'Enter Present Mode';
  });

  document.addEventListener('keydown', (e)=>{
    if(document.activeElement && document.activeElement.tagName==='INPUT') return;
    const focused = document.querySelector('.group-box:focus-within') || document.querySelector('.group-box');
    if(!focused) return;
    if(e.key === '+') { focused.querySelector('.btn-add').click(); }
    if(e.key === '-') { focused.querySelector('.btn-minus').click(); }
  });

  for(let i=0;i<5;i++) createGroup();

  window.createGroup = createGroup; window.updateLeading = updateLeading;
})();
