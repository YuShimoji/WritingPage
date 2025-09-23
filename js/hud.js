// フェードイン/アウト型 ミニHUD
(function(){
  function hexToRgb(hex){
    hex = (hex || '').replace('#','');
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    const r = parseInt(hex.substring(0,2)||'00',16);
    const g = parseInt(hex.substring(2,4)||'00',16);
    const b = parseInt(hex.substring(4,6)||'00',16);
    return {r,g,b};
  }

  class MiniHUD {
    constructor(){
      this.el = document.createElement('div');
      this.el.className = 'mini-hud';
      this.timer = null;
      this.durationOverride = null;
      this._posClasses = ['pos-bl','pos-br','pos-tl','pos-tr'];

      document.addEventListener('DOMContentLoaded', () => {
        // 設定反映（位置/色/不透明度/既定の表示時間）
        const s = (window.ZenWriterStorage && window.ZenWriterStorage.loadSettings()) || {};
        const hud = (s && s.hud) || {};
        this.applyConfig(hud);
        document.body.appendChild(this.el);
      });
    }

    /**
     * 短いメッセージをフェード表示
     * @param {string|Node} message
     * @param {number} duration 表示継続ミリ秒（pin中は無効）
     * @param {Object} options 予備（typeなど）
     */
    publish(message, duration = null, options = {}){
      if (typeof message === 'string') {
        this.el.textContent = message;
      } else if (message instanceof Node) {
        this.el.innerHTML = '';
        this.el.appendChild(message);
      }
      this.el.classList.add('show');
      if (this.timer) { clearTimeout(this.timer); this.timer = null; }
      const dur = duration == null ? (this.durationOverride || 1200) : duration;
      if (!this.el.classList.contains('pinned')){
        this.timer = setTimeout(()=> this.hide(), dur);
      }
    }

    pin(){ this.el.classList.add('pinned', 'show'); }
    unpin(){ this.el.classList.remove('pinned'); }
    hide(){ this.el.classList.remove('show'); }
    clear(){ this.el.innerHTML = ''; this.hide(); }

    applyConfig(hud){
      hud = hud || {};
      // 位置クラス
      this._posClasses.forEach(c => this.el.classList.remove(c));
      const posMap = {
        'bottom-left': 'pos-bl',
        'bottom-right': 'pos-br',
        'top-left': 'pos-tl',
        'top-right': 'pos-tr'
      };
      this.el.classList.add(posMap[hud.position] || 'pos-bl');
      // 色・不透明度
      const rgb = hexToRgb(hud.bg || '#000000');
      const alpha = typeof hud.opacity === 'number' ? hud.opacity : 0.75;
      this.el.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      this.el.style.color = hud.fg || '#ffffff';
      // 既定の表示時間
      this.durationOverride = hud.duration || 1200;
    }

    updateFromSettings(){
      if (!window.ZenWriterStorage) return;
      const s = window.ZenWriterStorage.loadSettings() || {};
      this.applyConfig((s && s.hud) || {});
    }
  }

  window.ZenWriterHUD = new MiniHUD();
})();
