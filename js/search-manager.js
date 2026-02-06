// SearchManager: 検索・置換機能の管理
class SearchManager {
    constructor(editor) {
        this.editor = editor;
        this.searchPanel = document.getElementById('search-panel');
        this.closeSearchBtn = document.getElementById('close-search-panel');
        this.searchInput = document.getElementById('search-input');
        this.replaceInput = document.getElementById('replace-input');
        this.replaceSingleBtn = document.getElementById('replace-single');
        this.replaceAllBtn = document.getElementById('replace-all');
        this.searchPrevBtn = document.getElementById('search-prev');
        this.searchNextBtn = document.getElementById('search-next');
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.closeSearchBtn) {
            this.closeSearchBtn.addEventListener('click', () => this.hideSearchPanel());
        }

        if (this.searchInput) {
            let searchTimeout;
            this.searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.updateSearchMatches();
                }, 200); // 200ms遅延で検索
            });
        }

        if (this.replaceSingleBtn) {
            this.replaceSingleBtn.addEventListener('click', () => this.replaceSingle());
        }
        if (this.replaceAllBtn) {
            this.replaceAllBtn.addEventListener('click', () => this.replaceAll());
        }
        if (this.searchPrevBtn) {
            this.searchPrevBtn.addEventListener('click', () => this.navigateMatch(-1));
        }
        if (this.searchNextBtn) {
            this.searchNextBtn.addEventListener('click', () => this.navigateMatch(1));
        }

        // 検索オプションの変更時にも再検索
        ['search-case-sensitive', 'search-regex'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    this.updateSearchMatches();
                });
            }
        });
    }

    showSearchPanel() {
        if (this.searchPanel) {
            this.searchPanel.style.display = 'block';
            if (this.searchInput) {
                this.searchInput.focus();
            }
        }
    }

    hideSearchPanel() {
        if (this.searchPanel) {
            this.searchPanel.style.display = 'none';
        }
    }

    updateSearchMatches() {
        // 実際の検索ロジックはEditorManagerに委譲
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.updateSearchMatches === 'function') {
            window.ZenWriterEditor.updateSearchMatches();
        }
    }

    replaceSingle() {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.replaceSingle === 'function') {
            window.ZenWriterEditor.replaceSingle();
        }
    }

    replaceAll() {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.replaceAll === 'function') {
            window.ZenWriterEditor.replaceAll();
        }
    }

    navigateMatch(direction) {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.navigateMatch === 'function') {
            window.ZenWriterEditor.navigateMatch(direction);
        }
    }
}

// グローバルに公開
window.SearchManager = SearchManager;
