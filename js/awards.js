// 賞/メタ情報の管理と表示（アコーディオン/フローティング）
(function(){
  const STORAGE_KEY = 'zenWriter_awards';

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { items: [], effect: 'accordion' };
    }catch(e){
      console.error('賞データ読込エラー', e);
      return { items: [], effect: 'accordion' };
    }
  }

  function saveState(state){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    }catch(e){
      console.error('賞データ保存エラー', e);
      return false;
    }
  }

  function uid(){ return 'aw-' + Math.random().toString(36).slice(2,9); }

  class AwardsUI{
    constructor(){
      this.state = loadState();
      this.$title = document.getElementById('award-title');
      this.$year = document.getElementById('award-year');
      this.$add = document.getElementById('add-award');
      this.$list = document.getElementById('award-list');
      this.$effect = document.getElementById('award-effect');
      this.$display = document.getElementById('awards-display');

      if (!this.$display || !this.$effect) return; // UIが無い場合は抜ける

      this.bind();
      this.renderList();
      this.renderDisplay();
    }

    bind(){
      this.$effect.value = this.state.effect || 'accordion';
      this.$effect.addEventListener('change', (e)=>{
        this.state.effect = e.target.value;
        saveState(this.state);
        this.renderDisplay();
      });

      if (this.$add){
        this.$add.addEventListener('click', ()=>{
          const title = (this.$title && this.$title.value.trim()) || '';
          const year = (this.$year && this.$year.value.trim()) || '';
          if (!title){
            alert('賞名を入力してください');
            return;
          }
          this.state.items.push({ id: uid(), title, year });
          saveState(this.state);
          if (this.$title) this.$title.value = '';
          if (this.$year) this.$year.value = '';
          this.renderList();
          this.renderDisplay();
        });
      }

      if (this.$list){
        this.$list.addEventListener('click', (e)=>{
          const t = e.target;
          if (t && t.matches('button[data-remove]')){
            const id = t.getAttribute('data-remove');
            const idx = this.state.items.findIndex(x=>x.id===id);
            if (idx>=0){
              this.state.items.splice(idx,1);
              saveState(this.state);
              this.renderList();
              this.renderDisplay();
            }
          }
        });
      }
    }

    renderList(){
      if (!this.$list) return;
      this.$list.innerHTML = '';
      if (this.state.items.length === 0){
        this.$list.innerHTML = '<div class="muted">（未登録）</div>';
        return;
      }
      const ul = document.createElement('ul');
      ul.className = 'award-admin-list';
      this.state.items.forEach(item=>{
        const li = document.createElement('li');
        const text = item.year ? `${item.title}（${item.year}）` : item.title;
        li.innerHTML = `<span>${this.escape(text)}</span> <button data-remove="${item.id}" class="small danger">削除</button>`;
        ul.appendChild(li);
      });
      this.$list.appendChild(ul);
    }

    renderDisplay(){
      const effect = this.state.effect || 'accordion';
      this.$display.innerHTML = '';
      this.$display.classList.remove('floating');

      if (this.state.items.length === 0){ return; }

      if (effect === 'accordion'){
        const wrap = document.createElement('div');
        wrap.className = 'awards-accordion';
        this.state.items.forEach(item=>{
          const details = document.createElement('details');
          const summary = document.createElement('summary');
          summary.textContent = item.title + (item.year ? `（${item.year}）` : '');
          const body = document.createElement('div');
          body.className = 'award-card';
          body.textContent = item.title + (item.year ? ` — ${item.year}` : '');
          details.appendChild(summary);
          details.appendChild(body);
          wrap.appendChild(details);
        });
        this.$display.appendChild(wrap);
      } else if (effect === 'floating'){
        this.$display.classList.add('floating');
        this.state.items.forEach((item, i)=>{
          const badge = document.createElement('div');
          badge.className = 'floating-badge';
          badge.textContent = item.title;
          const left = Math.random()*80 + 10; // 10%〜90%
          const duration = 10 + Math.random()*10; // 10〜20s
          const delay = Math.random()*5;
          badge.style.left = left + '%';
          badge.style.animationDuration = duration + 's';
          badge.style.animationDelay = delay + 's';
          this.$display.appendChild(badge);
        });
      }
    }

    escape(str){
      const d = document.createElement('div');
      d.textContent = String(str);
      return d.innerHTML;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.ZenWriterAwards = new AwardsUI();
  });
})();
