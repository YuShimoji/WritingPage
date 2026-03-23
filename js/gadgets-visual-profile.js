/**
 * gadgets-visual-profile.js
 * Visual Profile 選択・管理ガジェット
 */
(function () {
  'use strict';

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function register() {
    if (!window.ZWGadgets || typeof window.ZWGadgets.register !== 'function') return;
    if (!window.ZenWriterVisualProfile) return;

    const VP = window.ZenWriterVisualProfile;

    window.ZWGadgets.register('VisualProfile', function (root) {
      root.innerHTML = '';
      root.style.display = 'flex';
      root.style.flexDirection = 'column';
      root.style.gap = '0.5rem';

      // ===== 作業シーン (Typography Pack) =====
      var TP = window.ZenWriterTypographyPack;
      if (TP) {
        var packSection = el('div');
        packSection.style.display = 'flex';
        packSection.style.flexDirection = 'column';
        packSection.style.gap = '0.25rem';
        packSection.style.paddingBottom = '0.5rem';
        packSection.style.borderBottom = '1px solid var(--border-color, #ddd)';

        var packHeading = el('div');
        packHeading.textContent = '作業シーン';
        packHeading.style.fontSize = '0.6875rem';
        packHeading.style.opacity = '0.7';
        packHeading.style.fontWeight = 'bold';
        packSection.appendChild(packHeading);

        var packBtnRow = el('div');
        packBtnRow.style.display = 'flex';
        packBtnRow.style.flexWrap = 'wrap';
        packBtnRow.style.gap = '0.25rem';

        function updatePackButtons() {
          var currentId = TP.getCurrentPackId();
          packBtnRow.querySelectorAll('button[data-pack-id]').forEach(function (btn) {
            btn.classList.toggle('is-active', btn.dataset.packId === currentId);
          });
        }

        TP.getBuiltInPacks().forEach(function (pack) {
          var btn = el('button', 'vp-pack-btn');
          btn.textContent = pack.label;
          btn.title = pack.description;
          btn.dataset.packId = pack.id;
          btn.addEventListener('click', function () {
            TP.applyTypographyPack(pack.id);
          });
          packBtnRow.appendChild(btn);
        });

        packSection.appendChild(packBtnRow);

        var packInfo = el('div');
        packInfo.style.fontSize = '0.6875rem';
        packInfo.style.opacity = '0.6';

        function updatePackInfo() {
          var currentId = TP.getCurrentPackId();
          var pack = currentId ? TP.getPack(currentId) : null;
          packInfo.textContent = pack ? ('適用中: ' + pack.label) : '未設定';
        }

        updatePackInfo();
        packSection.appendChild(packInfo);

        window.addEventListener('ZenWriterTypographyPackApplied', function () {
          updatePackInfo();
          updatePackButtons();
        });

        updatePackButtons();
        root.appendChild(packSection);
      }

      // プロファイル選択
      const selectRow = el('div');
      selectRow.style.display = 'flex';
      selectRow.style.gap = '0.375rem';
      selectRow.style.alignItems = 'center';

      const selectLabel = el('label');
      selectLabel.textContent = (window.UILabels && window.UILabels.PROFILE_LABEL) || 'プロファイル';
      selectLabel.style.fontSize = '0.75rem';
      selectLabel.style.minWidth = '4.375rem';

      const select = el('select');
      select.style.flex = '1';

      function refreshSelect() {
        const currentId = VP.getCurrentProfileId();
        select.innerHTML = '';
        
        // 組み込みプロファイル
        const builtInGroup = el('optgroup');
        builtInGroup.label = (window.UILabels && window.UILabels.PROFILE_BUILTIN) || '組み込み';
        VP.getBuiltInProfiles().forEach(function (p) {
          const opt = el('option');
          opt.value = p.id;
          opt.textContent = p.label;
          if (p.id === currentId) opt.selected = true;
          builtInGroup.appendChild(opt);
        });
        select.appendChild(builtInGroup);

        // ユーザー定義プロファイル
        const userProfiles = VP.getUserProfiles();
        if (userProfiles.length > 0) {
          const userGroup = el('optgroup');
          userGroup.label = (window.UILabels && window.UILabels.PROFILE_USER_DEFINED) || 'ユーザー定義';
          userProfiles.forEach(function (p) {
            const opt = el('option');
            opt.value = p.id;
            opt.textContent = p.label;
            if (p.id === currentId) opt.selected = true;
            userGroup.appendChild(opt);
          });
          select.appendChild(userGroup);
        }
      }

      refreshSelect();

      select.addEventListener('change', function () {
        const profileId = select.value;
        if (profileId) {
          VP.applyProfileById(profileId);
          updateDeleteBtn();
        }
      });

      selectRow.appendChild(selectLabel);
      selectRow.appendChild(select);

      // ボタン行
      const btnRow = el('div');
      btnRow.style.display = 'flex';
      btnRow.style.gap = '0.25rem';
      btnRow.style.flexWrap = 'wrap';

      const btnApply = el('button', 'small');
      btnApply.textContent = (window.UILabels && window.UILabels.APPLY) || '適用';
      btnApply.title = (window.UILabels && window.UILabels.PROFILE_APPLY_TOOLTIP) || '選択したプロファイルを適用';
      btnApply.addEventListener('click', function () {
        const profileId = select.value;
        if (profileId) {
          VP.applyProfileById(profileId);
        }
      });

      const btnSave = el('button', 'small');
      btnSave.textContent = (window.UILabels && window.UILabels.SAVE) || '保存';
      btnSave.title = (window.UILabels && window.UILabels.PROFILE_SAVE_TOOLTIP) || '現在の設定を新規プロファイルとして保存';
      btnSave.addEventListener('click', function () {
        const name = prompt((window.UILabels && window.UILabels.PROFILE_NAME_PROMPT) || 'プロファイル名を入力してください:', '');
        if (name && name.trim()) {
          VP.saveCurrentAsProfile(name.trim());
          refreshSelect();
          // 新しく作成したプロファイルを選択
          const userProfiles = VP.getUserProfiles();
          if (userProfiles.length > 0) {
            const lastProfile = userProfiles[userProfiles.length - 1];
            select.value = lastProfile.id;
            VP.setCurrentProfileId(lastProfile.id);
            updateDeleteBtn();
          }
        }
      });

      const btnDelete = el('button', 'small');
      btnDelete.textContent = (window.UILabels && window.UILabels.DELETE) || '削除';
      btnDelete.title = (window.UILabels && window.UILabels.PROFILE_DELETE_TOOLTIP) || 'ユーザー定義プロファイルを削除';

      function updateDeleteBtn() {
        const profileId = select.value;
        btnDelete.disabled = !profileId || !profileId.startsWith('user-');
      }

      btnDelete.addEventListener('click', function () {
        const profileId = select.value;
        if (!profileId || !profileId.startsWith('user-')) return;
        
        const profile = VP.getProfile(profileId);
        if (!profile) return;
        
        if (confirm(((window.UILabels && window.UILabels.PROFILE_DELETE_CONFIRM) || 'プロファイル「{name}」を削除しますか？').replace('{name}', profile.label))) {
          VP.deleteUserProfile(profileId);
          refreshSelect();
          // デフォルトに戻す
          if (VP.getBuiltInProfiles().length > 0) {
            const defaultId = VP.getBuiltInProfiles()[0].id;
            select.value = defaultId;
            VP.applyProfileById(defaultId);
          }
          updateDeleteBtn();
        }
      });

      updateDeleteBtn();

      btnRow.appendChild(btnApply);
      btnRow.appendChild(btnSave);
      btnRow.appendChild(btnDelete);

      // 現在のプロファイル情報
      const infoDiv = el('div');
      infoDiv.style.fontSize = '0.6875rem';
      infoDiv.style.opacity = '0.7';
      infoDiv.style.marginTop = '0.25rem';

      function updateInfo() {
        const currentId = VP.getCurrentProfileId();
        const profile = currentId ? VP.getProfile(currentId) : null;
        if (profile) {
          infoDiv.textContent = ((window.UILabels && window.UILabels.PROFILE_CURRENT) || '現在: ') + profile.label + ' (' + profile.theme + ', ' + profile.editorWidthMode + ')';
        } else {
          infoDiv.textContent = (window.UILabels && window.UILabels.PROFILE_NOT_SET) || '現在: 未設定';
        }
      }

      updateInfo();

      // プロファイル適用イベントをリッスン
      window.addEventListener('ZenWriterVisualProfileApplied', function () {
        updateInfo();
        refreshSelect();
      });

      root.appendChild(selectRow);
      root.appendChild(btnRow);
      root.appendChild(infoDiv);

    }, { title: 'Visual Profile', groups: ['theme'], description: 'テーマ・フォント・レイアウトをまとめた複合プロファイルの管理・適用。' });
  }

  // 登録実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register);
  } else {
    register();
  }
})();
