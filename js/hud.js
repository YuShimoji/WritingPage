// フェードイン/アウト型 ミニHUD
(function(){
  class MiniHUD {
    constructor(){
      this.el = document.createElement('div');
      this.el.className = 'mini-hud';
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.el);
      });
      this.timer = null;
    }

    /**
     * 短いメッセージをフェード表示
     * @param {string|Node} message
     * @param {number} duration 表示継続ミリ秒（pin中は無効）
     * @param {Object} options 予備（typeなど）
     */
    publish(message, duration = 1200, options = {}){
      if (typeof message === 'string') {
        this.el.textContent = message;
      } else if (message instanceof Node) {
        this.el.innerHTML = '';
        this.el.appendChild(message);
      }
      this.el.classList.add('show');
      if (this.timer) { clearTimeout(this.timer); this.timer = null; }
      if (!this.el.classList.contains('pinned')){
        this.timer = setTimeout(()=> this.hide(), duration);
      }
    }

    pin(){ this.el.classList.add('pinned', 'show'); }
    unpin(){ this.el.classList.remove('pinned'); }
    hide(){ this.el.classList.remove('show'); }
    clear(){ this.el.innerHTML = ''; this.hide(); }
  }

  window.ZenWriterHUD = new MiniHUD();
})();
