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
      // 位置が未適用でも左下に出るように既定クラスを付与
      this.el.classList.add('pos-bl');
      this.timer = null;
      this.durationOverride = null;
      this.defaultMessage = '';
      this.defaultPinned = false;
      this.defaultWidth = 240;
      this.defaultFontSize = 14;
      this._posClasses = ['pos-bl','pos-br','pos-tl','pos-tr'];
      this._inited = false;

      const init = () => {
        if (this._inited) return;
        this._inited = true;
        // 設定反映（位置/色/不透明度/既定の表示時間）
        const s = (window.ZenWriterStorage && window.ZenWriterStorage.loadSettings && window.ZenWriterStorage.loadSettings()) || {};
        const hud = (s && s.hud) || {};
        this.applyConfig(hud);
        if (hud && typeof hud.message === 'string' && hud.message) {
          this.publish(hud.message, hud.duration || null, { force: true });
        }
        if (hud && hud.pinned) {
          this.pin();
        } else {
          this.unpin();
        }
        if (!document.body.contains(this.el)) {
          document.body.appendChild(this.el);
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
      } else {
        init();
      }
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
      if (options && (options.persistMessage || options.force)) {
        this.defaultMessage = typeof message === 'string' ? message : this.el.textContent;
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
      this.el.style.minWidth = (hud.width || this.defaultWidth) + 'px';
      this.el.style.maxWidth = Math.min(Math.max(hud.width || this.defaultWidth, 120), window.innerWidth * 0.8) + 'px';
      this.el.style.fontSize = (hud.fontSize || this.defaultFontSize) + 'px';
      // 既定の表示時間
      this.durationOverride = hud.duration || 1200;
      this.defaultMessage = typeof hud.message === 'string' ? hud.message : '';
      this.defaultPinned = !!hud.pinned;
      if (this.defaultPinned) this.pin(); else this.unpin();
    }

    updateFromSettings(){
      if (!window.ZenWriterStorage) return;
      const s = window.ZenWriterStorage.loadSettings() || {};
      this.applyConfig((s && s.hud) || {});
    }

    refresh(){
      this.el.textContent = this.defaultMessage || '';
      if (this.defaultPinned){
        this.pin();
      } else if (this.defaultMessage){
        this.publish(this.defaultMessage, this.durationOverride, { persistMessage: true });
      }
    }
  }

  window.ZenWriterHUD = new MiniHUD();
})();
