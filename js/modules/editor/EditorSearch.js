/**
 * EditorSearch module
 * Handles search and replace functionality in the editor.
 */
(function () {
    window.EditorSearch = {
        /**
         * 検索パネルを表示
         * @param {EditorManager} manager
         */
        showSearchPanel(manager) {
            const panel = document.getElementById('search-panel');
            if (!panel) return;
            panel.style.display = 'block';
            panel.setAttribute('aria-hidden', 'false');

            // 他のパネルを隠す
            if (typeof manager.hideFontDecorationPanel === 'function') manager.hideFontDecorationPanel();
            if (typeof manager.hideTextAnimationPanel === 'function') manager.hideTextAnimationPanel();
            if (manager.floatingFontPanel) manager.floatingFontPanel.style.display = 'none';

            const input = document.getElementById('search-input');
            if (input) {
                // 選択中のテキストを検索入力に設定
                const selected = manager.editor?.value?.substring(
                    manager.editor.selectionStart,
                    manager.editor.selectionEnd
                );
                if (selected) {
                    input.value = selected;
                }
                input.focus();
            }
            this.updateSearchMatches(manager);
        },

        /**
         * 検索パネルを非表示
         * @param {EditorManager} manager
         */
        hideSearchPanel(manager) {
            const panel = document.getElementById('search-panel');
            if (panel) {
                panel.style.display = 'none';
                panel.setAttribute('aria-hidden', 'true');
            }
            this.clearSearchHighlights(manager);
            // エディタにフォーカスを戻す
            if (manager.editor) {
                manager.editor.focus();
            }
        },

        /**
         * 検索条件に基づいて正規表現を取得
         * @returns {RegExp|null}
         */
        getSearchRegex() {
            const input = document.getElementById('search-input');
            const caseSensitive = document.getElementById('search-case-sensitive')?.checked;
            const useRegex = document.getElementById('search-regex')?.checked;
            const query = input?.value || '';

            if (!query) return null;

            let flags = 'g';
            if (!caseSensitive) flags += 'i';

            try {
                return useRegex ? new RegExp(query, flags) : new RegExp(this.escapeRegex(query), flags);
            } catch (e) {
                return null;
            }
        },

        /**
         * 正規表現の特殊文字をエスケープ
         * @param {string} str
         * @returns {string}
         */
        escapeRegex(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },

        /**
         * マッチを検索してハイライト
         * @param {EditorManager} manager
         */
        updateSearchMatches(manager) {
            this.clearSearchHighlights(manager);
            const regex = this.getSearchRegex();
            if (!regex) {
                manager.currentMatches = [];
                manager.currentMatchIndex = -1;
                this.updateMatchCount(0);
                return;
            }

            const text = manager.editor.value;
            const matches = [];
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                });
            }

            manager.currentMatches = matches;

            if (matches.length > 0) {
                manager.currentMatchIndex = 0;
                this.updateMatchCount(matches.length);
                this.highlightMatches(manager, matches);
                this.selectMatch(manager, matches[0]);
            } else {
                manager.currentMatchIndex = -1;
                this.updateMatchCount(0);
            }
        },

        /**
         * マッチ数を更新
         * @param {number} count
         */
        updateMatchCount(count) {
            const countEl = document.getElementById('match-count');
            if (countEl) {
                if (count === 0) {
                    countEl.textContent = '一致するテキストが見つかりません';
                } else {
                    countEl.textContent = `${count} 件一致しました`;
                }
            }
        },

        /**
         * マッチをハイライト
         * @param {EditorManager} manager
         * @param {Array} matches
         */
        highlightMatches(manager, matches) {
            const overlay = manager.editorOverlay;
            if (!overlay) return;

            matches.forEach((match, index) => {
                const highlight = document.createElement('div');
                highlight.className = 'search-highlight';
                highlight.dataset.matchIndex = index;

                const rect = this.getTextPosition(manager, match.start, match.end);
                if (rect) {
                    highlight.style.left = rect.left + 'px';
                    highlight.style.top = rect.top + 'px';
                    highlight.style.width = rect.width + 'px';
                    highlight.style.height = rect.height + 'px';
                    overlay.appendChild(highlight);
                }
            });
        },

        /**
         * テキスト位置を取得
         * @param {EditorManager} manager
         * @param {number} start
         * @param {number} end
         * @returns {Object|null}
         */
        getTextPosition(manager, start, end) {
            const mirror = manager.editorMirror;
            if (!mirror) return null;

            const text = manager.editor.value;
            const before = text.substring(0, start);
            const match = text.substring(start, end);
            const after = text.substring(end);

            const escapeHtml = typeof manager.escapeHtml === 'function'
                ? manager.escapeHtml.bind(manager)
                : (str) => (str || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));

            mirror.innerHTML = escapeHtml(before) +
                '<span class="search-match">' + escapeHtml(match) + '</span>' +
                escapeHtml(after);
            mirror.innerHTML = mirror.innerHTML.replace(/\n/g, '<br>');

            const matchEl = mirror.querySelector('.search-match');
            if (matchEl) {
                const rect = matchEl.getBoundingClientRect();
                const editorRect = manager.editor.getBoundingClientRect();
                return {
                    left: rect.left - editorRect.left,
                    top: rect.top - editorRect.top,
                    width: rect.width,
                    height: rect.height
                };
            }
            return null;
        },

        /**
         * ハイライトをクリア
         * @param {EditorManager} manager
         */
        clearSearchHighlights(manager) {
            const highlights = manager.editorOverlay?.querySelectorAll('.search-highlight');
            if (highlights) {
                highlights.forEach(h => h.remove());
            }
        },

        /**
         * 次/前のマッチに移動
         * @param {EditorManager} manager
         * @param {number} direction - 1 for next, -1 for previous
         */
        navigateMatch(manager, direction) {
            if (!manager.currentMatches || manager.currentMatches.length === 0) return;

            if (direction > 0) {
                manager.currentMatchIndex = (manager.currentMatchIndex + 1) % manager.currentMatches.length;
            } else {
                manager.currentMatchIndex = manager.currentMatchIndex <= 0 ?
                    manager.currentMatches.length - 1 : manager.currentMatchIndex - 1;
            }

            const match = manager.currentMatches[manager.currentMatchIndex];
            this.selectMatch(manager, match);
        },

        /**
         * マッチを選択
         * @param {EditorManager} manager
         * @param {Object} match
         */
        selectMatch(manager, match) {
            manager.editor.selectionStart = match.start;
            manager.editor.selectionEnd = match.end;
            manager.editor.focus();
            this.scrollToMatch(manager, match);
        },

        /**
         * マッチにスクロール
         * @param {EditorManager} manager
         * @param {Object} match
         */
        scrollToMatch(manager, match) {
            const lineHeight = parseFloat(getComputedStyle(manager.editor).lineHeight) || 20;
            const lines = manager.editor.value.substring(0, match.start).split('\n').length - 1;
            const y = lines * lineHeight;
            manager.editor.scrollTop = Math.max(0, y - manager.editor.clientHeight / 2);
        },

        /**
         * 単一置換
         * @param {EditorManager} manager
         */
        replaceSingle(manager) {
            const replaceInput = document.getElementById('replace-input');
            const replaceText = replaceInput?.value || '';

            if (!manager.currentMatches || manager.currentMatchIndex < 0) return;

            const match = manager.currentMatches[manager.currentMatchIndex];
            const before = manager.editor.value.substring(0, match.start);
            const after = manager.editor.value.substring(match.end);

            manager.editor.value = before + replaceText + after;
            if (typeof manager.saveContent === 'function') manager.saveContent();
            if (typeof manager._updateWordCountImmediate === 'function') manager._updateWordCountImmediate();

            manager.currentMatches.splice(manager.currentMatchIndex, 1);

            for (let i = manager.currentMatchIndex; i < manager.currentMatches.length; i++) {
                manager.currentMatches[i].start += replaceText.length - match.text.length;
                manager.currentMatches[i].end += replaceText.length - match.text.length;
            }

            if (manager.currentMatches.length === 0) {
                manager.currentMatchIndex = -1;
            } else {
                manager.currentMatchIndex = Math.min(manager.currentMatchIndex, manager.currentMatches.length - 1);
            }

            this.updateMatchCount(manager.currentMatches.length);
            this.updateSearchMatches(manager);

            if (manager.currentMatchIndex >= 0) {
                const newMatch = manager.currentMatches[manager.currentMatchIndex];
                this.selectMatch(manager, newMatch);
            }
        },

        /**
         * すべて置換
         * @param {EditorManager} manager
         */
        replaceAll(manager) {
            const replaceInput = document.getElementById('replace-input');
            const replaceText = replaceInput?.value || '';
            const regex = this.getSearchRegex();

            if (!regex || !manager.currentMatches) return;

            let result = manager.editor.value;
            let offset = 0;

            manager.currentMatches.forEach(match => {
                const before = result.substring(0, match.start + offset);
                const after = result.substring(match.end + offset);
                result = before + replaceText + after;
                offset += replaceText.length - match.text.length;
            });

            manager.editor.value = result;
            if (typeof manager.saveContent === 'function') manager.saveContent();
            if (typeof manager._updateWordCountImmediate === 'function') manager._updateWordCountImmediate();
            this.updateSearchMatches(manager);
            if (typeof manager.showNotification === 'function') manager.showNotification('すべて置換しました');
        },

        /**
         * 検索パネルを表示/非表示
         * @param {EditorManager} manager
         */
        toggleSearchPanel(manager) {
            const panel = document.getElementById('search-panel');
            if (!panel) return;
            const isVisible = panel.style.display !== 'none';
            if (isVisible) {
                this.hideSearchPanel(manager);
            } else {
                this.showSearchPanel(manager);
            }
        }
    };
})();
