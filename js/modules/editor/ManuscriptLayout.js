/** 文書に保存した組み設定を編集面、Reader、印刷、単独 HTML で共有する。 */
(function () {
  'use strict';

  const storage = window.ZenWriterStorage;
  const controls = document.getElementById('document-layout');
  const status = document.getElementById('document-layout-status');
  const surfaces = ['editor', 'wysiwyg-editor', 'editor-preview', 'reader-preview-inner', 'print-view'];
  let charsPerSheet = 400;

  function apply(surface, layout) {
    surface.dataset.manuscriptDirection = layout.direction;
    surface.toggleAttribute('data-manuscript-measure', !!layout.charsPerLine || layout.pageFrame);
    surface.toggleAttribute('data-page-frame', layout.pageFrame);
    surface.style.setProperty('--manuscript-measure', (layout.charsPerLine || 20) + 'ic');
    surface.style.setProperty('--manuscript-page', layout.linesPerPage + 'lh');
  }

  function sync() {
    const layout = storage.getDocumentLayout();
    charsPerSheet = (layout.charsPerLine || 20) * layout.linesPerPage;
    surfaces.forEach(id => {
      const surface = document.getElementById(id);
      if (surface) apply(surface, layout);
    });
    controls.querySelector('[name="direction"]').value = layout.direction;
    controls.querySelector('[name="charsPerLine"]').value = layout.charsPerLine ?? '';
    controls.querySelector('[name="linesPerPage"]').value = layout.linesPerPage;
    controls.querySelector('[name="pageFrame"]').checked = layout.pageFrame;
    status.textContent = '';
  }

  function update(patch) {
    if (storage.updateDocumentLayout(patch)) return;
    sync();
    status.textContent = 'この文書の組み設定を保存できませんでした。';
  }

  controls.addEventListener('change', event => {
    const field = event.target;
    if (!field.checkValidity()) {
      field.reportValidity();
      return;
    }
    let value = field.value;
    if (field.type === 'number') value = value === '' ? null : field.valueAsNumber;
    if (field.type === 'checkbox') value = field.checked;
    update({ [field.name]: value });
  });

  window.ManuscriptLayout = { apply, update, get charsPerSheet() { return charsPerSheet; } };
  window.addEventListener('ZWDocumentLayoutChanged', sync);
  sync();
})();
