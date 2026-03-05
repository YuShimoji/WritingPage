// main-hub-panel.js
// 統合メインハブパネルのタブ切り替えロジック
(function () {
  'use strict';

  function initMainHubPanel() {
    const mainHubPanel = document.getElementById('main-hub-panel');
    if (!mainHubPanel) return;

    const tabs = mainHubPanel.querySelectorAll('.panel-tab');
    const tabContents = mainHubPanel.querySelectorAll('.tab-content');
    const closePanelBtn = document.getElementById('close-main-hub-panel');

    // タブ切り替え
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');

        // すべてのタブを非アクティブに
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });

        // すべてのタブコンテンツを非表示に
        tabContents.forEach(content => {
          content.classList.remove('active');
          content.style.display = 'none';
        });

        // クリックされたタブをアクティブに
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // 対応するタブコンテンツを表示
        const targetContent = document.getElementById(`tab-${targetTab}`);
        if (targetContent) {
          targetContent.classList.add('active');
          targetContent.style.display = 'block';
        }
      });
    });

    // パネルを閉じる
    if (closePanelBtn) {
      closePanelBtn.addEventListener('click', () => {
        mainHubPanel.style.display = 'none';
      });
    }

    // フローティングパネル機能を適用
    if (window.ZenWriterFloatingPanels) {
      window.ZenWriterFloatingPanels.preparePanel(mainHubPanel);
    }
  }

  // メインハブパネルを表示する関数
  function showMainHubPanel(tabName) {
    const mainHubPanel = document.getElementById('main-hub-panel');
    if (!mainHubPanel) return;

    mainHubPanel.style.display = 'block';

    // フローティングパネル機能を適用
    if (window.ZenWriterFloatingPanels) {
      window.ZenWriterFloatingPanels.preparePanel(mainHubPanel);
    }

    // 指定されたタブに切り替え
    if (tabName) {
      const targetTab = mainHubPanel.querySelector(`.panel-tab[data-tab="${tabName}"]`);
      if (targetTab) {
        targetTab.click();
      }
    }
  }

  // メインハブパネルをトグルする関数
  function toggleMainHubPanel(tabName) {
    const mainHubPanel = document.getElementById('main-hub-panel');
    if (!mainHubPanel) return;

    const isVisible = mainHubPanel.style.display !== 'none';

    if (isVisible) {
      mainHubPanel.style.display = 'none';
    } else {
      showMainHubPanel(tabName);
    }
  }

  // グローバルAPIを公開
  window.MainHubPanel = {
    init: initMainHubPanel,
    show: showMainHubPanel,
    toggle: toggleMainHubPanel
  };

  // DOMContentLoaded時に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMainHubPanel);
  } else {
    initMainHubPanel();
  }
})();
