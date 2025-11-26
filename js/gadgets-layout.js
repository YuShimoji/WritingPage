(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-core.js
  var utils = window.ZWGadgetsUtils;
  var ZWGadgetsCore = window.ZWGadgetsCore;
  if (!utils || !ZWGadgetsCore) return;

  var ZWGadgetsInstance = new ZWGadgetsCore();

  // EditorLayout settings UI (個別ファイル化)
  ZWGadgetsInstance.registerSettings('EditorLayout', function (el, ctx) {
    try {
      var _makeRow = function (labelText, control) {
        var row = document.createElement('label');
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '4px';
        row.textContent = labelText;
        row.appendChild(control);
        return row;
      };

      // Width slider
      var widthInput = document.createElement('input');
      widthInput.type = 'range';
      widthInput.min = '600';
      widthInput.max = '2000';
      widthInput.step = '50';
      widthInput.value = ctx.get('width', 900);
      var widthLabel = document.createElement('div');
      widthLabel.textContent = ((window.UILabels && window.UILabels.LAYOUT_WIDTH_PREFIX) || '幅: ') + widthInput.value + 'px';
      widthLabel.style.fontSize = '0.85rem';
      widthLabel.style.opacity = '0.8';
      widthInput.addEventListener('input', function () {
        widthLabel.textContent = ((window.UILabels && window.UILabels.LAYOUT_WIDTH_PREFIX) || '幅: ') + widthInput.value + 'px';
        ctx.set('width', parseInt(widthInput.value, 10));
      });
      widthInput.addEventListener('change', function () {
        ctx.set('width', parseInt(widthInput.value, 10));
      });
      var widthRow = document.createElement('div');
      widthRow.style.display = 'flex';
      widthRow.style.flexDirection = 'column';
      widthRow.style.gap = '4px';
      widthRow.appendChild(widthLabel);
      widthRow.appendChild(widthInput);
      el.appendChild(widthRow);

      // Padding X slider
      var paddingInput = document.createElement('input');
      paddingInput.type = 'range';
      paddingInput.min = '0';
      paddingInput.max = '200';
      paddingInput.step = '10';
      paddingInput.value = ctx.get('paddingX', 100);
      var paddingLabel = document.createElement('div');
      paddingLabel.textContent = ((window.UILabels && window.UILabels.LAYOUT_PADDING_PREFIX) || '左右余白: ') + paddingInput.value + 'px';
      paddingLabel.style.fontSize = '0.85rem';
      paddingLabel.style.opacity = '0.8';
      paddingInput.addEventListener('input', function () {
        paddingLabel.textContent = ((window.UILabels && window.UILabels.LAYOUT_PADDING_PREFIX) || '左右余白: ') + paddingInput.value + 'px';
        ctx.set('paddingX', parseInt(paddingInput.value, 10));
      });
      paddingInput.addEventListener('change', function () {
        ctx.set('paddingX', parseInt(paddingInput.value, 10));
      });
      var paddingRow = document.createElement('div');
      paddingRow.style.display = 'flex';
      paddingRow.style.flexDirection = 'column';
      paddingRow.style.gap = '4px';
      paddingRow.appendChild(paddingLabel);
      paddingRow.appendChild(paddingInput);
      el.appendChild(paddingRow);

      // Border checkbox
      var borderRow = document.createElement('label');
      borderRow.style.display = 'flex';
      borderRow.style.alignItems = 'center';
      borderRow.style.gap = '6px';
      var borderCb = document.createElement('input');
      borderCb.type = 'checkbox';
      borderCb.checked = !!ctx.get('showBorder', false);
      var borderTxt = document.createElement('span');
      borderTxt.textContent = (window.UILabels && window.UILabels.LAYOUT_SHOW_BORDER) || '枠線を表示';
      borderCb.addEventListener('change', function () {
        ctx.set('showBorder', !!borderCb.checked);
      });
      borderRow.appendChild(borderCb);
      borderRow.appendChild(borderTxt);
      el.appendChild(borderRow);

    } catch (e) { console.error('EditorLayout settings failed:', e); }
  });

})();
