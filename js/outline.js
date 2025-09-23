// アウトライン管理
(function(){
  const STORAGE = window.ZenWriterStorage;

  const DEFAULT_OUTLINE = {
    sets: [
      {
        id: 'default-3',
        name: '部・章・節',
        levels: [
          { key: 'part', label: '部', color: '#4a90e2' },
          { key: 'chapter', label: '章', color: '#7b8a8b' },
          { key: 'section', label: '節', color: '#b88a4a' }
        ]
      }
    ],
    currentSetId: 'default-3'
  };

  class OutlineManager {
    constructor() {
      this.state = STORAGE.loadOutline() || DEFAULT_OUTLINE;
      this.$setSelect = document.getElementById('outline-set');
      this.$levels = document.getElementById('outline-levels-container');
      this.$insert = document.getElementById('outline-insert-buttons');
      this.$newName = document.getElementById('outline-new-name');
      this.$newLevels = document.getElementById('outline-new-levels');
      this.$createBtn = document.getElementById('create-outline-set');

      if (!this.$setSelect) return; // UIが無い場合は何もしない

      this.renderSetSelect();
      this.renderCurrentSet();
      this.bindEvents();
    }

    save() {
      STORAGE.saveOutline(this.state);
    }

    get currentSet() {
      return this.state.sets.find(s => s.id === this.state.currentSetId) || this.state.sets[0];
    }

    renderSetSelect() {
      const sel = this.$setSelect;
      sel.innerHTML = '';
      this.state.sets.forEach(set => {
        const opt = document.createElement('option');
        opt.value = set.id;
        opt.textContent = set.name;
        sel.appendChild(opt);
      });
      sel.value = this.state.currentSetId;
    }

    renderCurrentSet() {
      const set = this.currentSet;
      if (!set) return;

      // レベルの編集（色変更）
      this.$levels.innerHTML = '';
      set.levels.forEach((lv, i) => {
        const row = document.createElement('div');
        row.className = 'level-row';
        row.innerHTML = `
          <label style="flex:1 1 auto;">${this.escape(lv.label)}</label>
          <div style="display:flex; align-items:center; gap:6px;">
            <input type="color" value="${lv.color || '#888888'}" data-index="${i}">
            <button class="small btn-move" data-dir="up" data-index="${i}" title="上へ">↑</button>
            <button class="small btn-move" data-dir="down" data-index="${i}" title="下へ">↓</button>
          </div>
        `;
        this.$levels.appendChild(row);
      });

      // 挿入ボタン
      this.$insert.innerHTML = '';
      set.levels.forEach((lv, i) => {
        const btn = document.createElement('button');
        btn.className = 'outline-btn';
        btn.textContent = `${lv.label} を挿入`;
        btn.style.borderColor = lv.color || '#888';
        btn.style.color = lv.color || 'inherit';
        btn.addEventListener('click', () => this.insertLevel(i));
        this.$insert.appendChild(btn);
      });
    }

    bindEvents() {
      this.$setSelect.addEventListener('change', (e) => {
        this.state.currentSetId = e.target.value;
        this.save();
        this.renderCurrentSet();
      });

      if (this.$createBtn) {
        this.$createBtn.addEventListener('click', () => {
          const name = (this.$newName.value || '').trim() || '新規プリセット';
          const levelsCsv = (this.$newLevels.value || '').trim();
          if (!levelsCsv) {
            alert('レベル名をカンマ区切りで入力してください');
            return;
          }
          const labels = levelsCsv.split(',').map(s => s.trim()).filter(Boolean);
          const palette = this.generatePalette(labels.length);
          const id = `set-${Date.now()}`;
          const set = {
            id,
            name,
            levels: labels.map((label, idx) => ({ key: `k${idx}`, label, color: palette[idx] }))
          };
          this.state.sets.push(set);
          this.state.currentSetId = id;
          this.save();
          this.$newName.value = '';
          this.$newLevels.value = '';
          this.renderSetSelect();
          this.renderCurrentSet();
        });
      }

      // 色変更（inputでの逐次反映はDOM再構築を避け、changeで保存+再描画）
      this.$levels.addEventListener('change', (e) => {
        const t = e.target;
        if (t && t.matches('input[type="color"]')) {
          const idx = parseInt(t.getAttribute('data-index'), 10);
          const set = this.currentSet;
          if (set && set.levels[idx]) {
            set.levels[idx].color = t.value;
            this.save();
            this.renderCurrentSet();
          }
        }
      });

      // 並べ替え（イベントデリゲーション）
      this.$levels.addEventListener('click', (e) => {
        const t = e.target;
        if (t && t.matches('.btn-move')) {
          const dir = t.getAttribute('data-dir');
          const idx = parseInt(t.getAttribute('data-index'), 10);
          const set = this.currentSet;
          if (!set) return;
          const newIdx = dir === 'up' ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= set.levels.length) return;
          const arr = set.levels;
          const tmp = arr[idx];
          arr[idx] = arr[newIdx];
          arr[newIdx] = tmp;
          this.save();
          this.renderCurrentSet();
        }
      });
    }

    insertLevel(index) {
      const set = this.currentSet;
      if (!set || !set.levels[index]) return;
      const depth = index + 1; // 1-based
      const prefix = '#'.repeat(Math.min(depth, 6));
      const text = `${prefix} ${set.levels[index].label} タイトル\n\n`;
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.insertTextAtCursor === 'function') {
        window.ZenWriterEditor.insertTextAtCursor(text);
      }
    }

    generatePalette(n) {
      const colors = [];
      for (let i = 0; i < n; i++) {
        const hue = Math.round((360 / n) * i);
        colors.push(this.hslToHex(hue, 60, 50));
      }
      return colors;
    }

    hslToHex(h, s, l) {
      s /= 100; l /= 100;
      const k = n => (n + h/30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      const r = Math.round(255 * f(0));
      const g = Math.round(255 * f(8));
      const b = Math.round(255 * f(4));
      return '#' + [r,g,b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    escape(str) {
      const div = document.createElement('div');
      div.textContent = String(str);
      return div.innerHTML;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.ZenWriterOutline = new OutlineManager();
  });
})();
