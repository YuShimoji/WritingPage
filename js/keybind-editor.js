/**
 * keybind-editor.js
 * キーバインド編集機能のコアロジック
 * ショートカットの再割当、保存、復元、競合検出を管理
 */
(function () {
  'use strict';

  // デフォルトキーバインド定義
  const DEFAULT_KEYBINDS = {
    'sidebar.toggle': {
      key: '1',
      altKey: true,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
      description: 'サイドバーを開閉'
    },
    'toolbar.toggle': {
      key: 'w',
      altKey: true,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
      description: 'ツールバー表示/非表示切り替え'
    },
    'search.toggle': {
      key: 'f',
      altKey: false,
      ctrlKey: true,
      shiftKey: false,
      metaKey: false,
      description: '検索パネル開閉'
    },
    'snapshot.restore': {
      key: 'z',
      altKey: false,
      ctrlKey: true,
      shiftKey: true,
      metaKey: false,
      description: '最後のスナップショットから復元'
    },
    'ui.mode.cycle': {
      key: 'F2',
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
      description: 'UIモード切替 (Normal → Focus → Blank)'
    },
    'ui.mode.exit': {
      key: 'Escape',
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
      description: 'Focus/Blankモードから Normal に戻る'
    },
    'command-palette.toggle': {
      key: 'p',
      altKey: false,
      ctrlKey: true,
      shiftKey: false,
      metaKey: false,
      description: 'コマンドパレット開閉'
    },
    'editor.save': {
      key: 's',
      altKey: false,
      ctrlKey: true,
      shiftKey: false,
      metaKey: false,
      description: '保存'
    },
    'editor.bold': {
      key: 'b',
      altKey: false,
      ctrlKey: true,
      shiftKey: false,
      metaKey: false,
      description: '太字'
    },
    'editor.italic': {
      key: 'i',
      altKey: false,
      ctrlKey: true,
      shiftKey: false,
      metaKey: false,
      description: '斜体'
    },
    'editor.font.increase': {
      key: '+',
      altKey: false,
      ctrlKey: true,
      shiftKey: false,
      metaKey: false,
      description: 'フォントサイズを大きく'
    },
    'editor.font.decrease': {
      key: '-',
      altKey: false,
      ctrlKey: true,
      shiftKey: false,
      metaKey: false,
      description: 'フォントサイズを小さく'
    },
    'editor.font.reset': {
      key: '0',
      altKey: false,
      ctrlKey: true,
      shiftKey: false,
      metaKey: false,
      description: 'フォントサイズをリセット'
    }
  };

  // ストレージキー
  const STORAGE_KEY = 'zenWriter_keybinds';

  /**
   * キーバインドを文字列形式に変換（比較・保存用）
   */
  function keybindToString(keybind) {
    if (!keybind || typeof keybind !== 'object') return '';
    const parts = [];
    if (keybind.ctrlKey) parts.push('Ctrl');
    if (keybind.metaKey) parts.push('Meta');
    if (keybind.altKey) parts.push('Alt');
    if (keybind.shiftKey) parts.push('Shift');
    parts.push(keybind.key || '');
    return parts.join('+');
  }

  /**
   * キーイベントからキーバインドオブジェクトを生成
   */
  function eventToKeybind(e) {
    return {
      key: e.key,
      altKey: e.altKey || false,
      ctrlKey: e.ctrlKey || false,
      shiftKey: e.shiftKey || false,
      metaKey: e.metaKey || false
    };
  }

  /**
   * キーバインドが一致するかチェック
   */
  function keybindMatches(keybind, event) {
    if (!keybind || !event) return false;
    return (
      keybind.key === event.key &&
      !!keybind.altKey === !!event.altKey &&
      !!keybind.ctrlKey === !!event.ctrlKey &&
      !!keybind.shiftKey === !!event.shiftKey &&
      !!keybind.metaKey === !!event.metaKey
    );
  }

  /**
   * キーバインドを読み込む
   */
  function loadKeybinds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULT_KEYBINDS);
      const custom = JSON.parse(raw);
      // デフォルトとマージ（カスタムが優先）
      return Object.assign({}, DEFAULT_KEYBINDS, custom);
    } catch (e) {
      console.error('キーバインド読込エラー:', e);
      return Object.assign({}, DEFAULT_KEYBINDS);
    }
  }

  /**
   * キーバインドを保存
   */
  function saveKeybinds(keybinds) {
    try {
      // デフォルトと同じものは保存しない（ストレージをクリーンに保つ）
      const custom = {};
      Object.keys(keybinds).forEach(id => {
        const kb = keybinds[id];
        const def = DEFAULT_KEYBINDS[id];
        if (!def || keybindToString(kb) !== keybindToString(def)) {
          custom[id] = kb;
        }
      });
      if (Object.keys(custom).length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
      }
      return true;
    } catch (e) {
      console.error('キーバインド保存エラー:', e);
      return false;
    }
  }

  /**
   * キーバインドの競合を検出
   */
  function detectConflicts(keybinds, targetId, newKeybind) {
    const conflicts = [];
    const newString = keybindToString(newKeybind);
    Object.keys(keybinds).forEach(id => {
      if (id === targetId) return;
      const existing = keybinds[id];
      if (keybindToString(existing) === newString) {
        conflicts.push({
          id: id,
          description: existing.description || id
        });
      }
    });
    return conflicts;
  }

  /**
   * キーバインドをリセット（デフォルトに戻す）
   */
  function resetKeybinds() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('キーバインドリセットエラー:', e);
      return false;
    }
  }

  /**
   * キーバインドを取得（ID指定）
   */
  function getKeybind(id) {
    const keybinds = loadKeybinds();
    return keybinds[id] || null;
  }

  /**
   * キーバインドを設定
   */
  function setKeybind(id, keybind) {
    const keybinds = loadKeybinds();
    keybinds[id] = Object.assign({}, keybind);
    return saveKeybinds(keybinds);
  }

  /**
   * イベントから対応するキーバインドIDを取得
   */
  function getKeybindIdForEvent(event, keybinds) {
    const kb = keybinds || loadKeybinds();
    for (const id in kb) {
      if (keybindMatches(kb[id], event)) {
        return id;
      }
    }
    return null;
  }

  /**
   * キーバインドを人間が読める形式で表示
   */
  function formatKeybind(keybind) {
    if (!keybind) return '';
    const parts = [];
    if (keybind.ctrlKey) parts.push('Ctrl');
    if (keybind.metaKey) parts.push('⌘');
    if (keybind.altKey) parts.push('Alt');
    if (keybind.shiftKey) parts.push('Shift');
    const key = keybind.key || '';
    // 特殊キーの表示を改善
    if (key === ' ') parts.push('Space');
    else if (key.startsWith('F') && /^F\d+$/.test(key)) parts.push(key);
    else if (key === 'Escape') parts.push('Esc');
    else parts.push(key.toUpperCase());
    return parts.join(' + ');
  }

  // グローバルAPIとして公開
  window.ZenWriterKeybinds = {
    // データ操作
    load: loadKeybinds,
    save: saveKeybinds,
    get: getKeybind,
    set: setKeybind,
    reset: resetKeybinds,
    getDefaults: () => Object.assign({}, DEFAULT_KEYBINDS),

    // ユーティリティ
    detectConflicts: detectConflicts,
    format: formatKeybind,
    eventToKeybind: eventToKeybind,
    keybindMatches: keybindMatches,
    getKeybindIdForEvent: getKeybindIdForEvent,
    keybindToString: keybindToString
  };

})();
