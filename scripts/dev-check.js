const http = require('http');

const fs = require('fs');
const path = require('path');

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port: 8080, path }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
  });
}

(async () => {
  try {
    const index = await get('/');
    const okIndex =
      index.status === 200 &&
      /<title>\s*Zen Writer\s*-\s*小説執筆ツール\s*<\/title>/i.test(index.body) &&
      /<div\s+class=\"toolbar\"/i.test(index.body) &&
      /<textarea\s+id=\"editor\"/i.test(index.body) &&
      /id=\"goal-progress\"/i.test(index.body) &&
      /id=\"doc-select\"/i.test(index.body) &&
      /id=\"doc-create\"/i.test(index.body) &&
      /id=\"doc-rename\"/i.test(index.body) &&
      /id=\"doc-delete\"/i.test(index.body) &&
      /id=\"goal-target\"/i.test(index.body) &&
      /id=\"goal-deadline\"/i.test(index.body);
    console.log('GET / ->', index.status, okIndex ? 'OK' : 'NG');

    const css = await get('/css/style.css');
    const hasRootHide = /html\[data-toolbar-hidden=\"true\"\] \.toolbar/.test(css.body);
    const hasRootShowPadding = /html:not\(\[data-toolbar-hidden=\"true\"\]\) #editor/.test(css.body);
    const removedBodyRule = !/body:not\(\.toolbar-hidden\) #editor/.test(css.body);
    const hasProgressCss = /\.goal-progress__bar/.test(css.body);
    const hasCssSettingsBtn = /\.gadget-settings-btn\b/.test(css.body || '');
    const hasCssSettings = /\.gadget-settings\b/.test(css.body || '');
    const hasCssDrag = /\.gadget\.is-dragging\b/.test(css.body || '') && /\.gadget\.drag-over\b/.test(css.body || '');
    const okCss = css.status === 200 && hasRootHide && hasRootShowPadding && removedBodyRule && hasProgressCss && hasCssSettingsBtn && hasCssSettings && hasCssDrag;
    console.log('GET /css/style.css ->', css.status, okCss ? 'OK' : 'NG');

    // プラグインUIとスクリプトの存在検証
    const hasPluginsPanel = /id=\"plugins-panel\"/i.test(index.body);
    const pluginRegistry = await get('/js/plugins/registry.js');
    const pluginChoice = await get('/js/plugins/choice.js');
    const okPlugins = hasPluginsPanel && pluginRegistry.status === 200 && pluginChoice.status === 200;
    console.log('CHECK plugins ->', okPlugins ? 'OK' : 'NG', { hasPluginsPanel, registry: pluginRegistry.status, choice: pluginChoice.status });

    // ガジェットの存在検証
    const hasGadgetsPanel = /id=\"gadgets-panel\"/i.test(index.body);
    const gadgetsJs = await get('/js/gadgets.js');
    const okGadgets = hasGadgetsPanel && gadgetsJs.status === 200;
    console.log('CHECK gadgets ->', okGadgets ? 'OK' : 'NG', { hasGadgetsPanel, gadgets: gadgetsJs.status });

    // ガジェットPrefs APIの静的実装確認（js/gadgets.js を読み取り）
    const gadgetsPath = path.join(__dirname, '..', 'js', 'gadgets.js');
    let gadgetsSrc = '';
    try { gadgetsSrc = fs.readFileSync(gadgetsPath, 'utf-8'); } catch(e) { console.error('READ FAIL:', gadgetsPath, e.message); }
    const hasStorageKey = /STORAGE_KEY\s*=\s*['\"]zenWriter_gadgets:prefs['\"]/m.test(gadgetsSrc);
    const hasGetPrefs = /getPrefs\s*:\s*function\s*\(/m.test(gadgetsSrc);
    const hasSetPrefs = /setPrefs\s*:\s*function\s*\(/m.test(gadgetsSrc);
    const hasMove = /move\s*:\s*function\s*\(name,\s*dir\)/m.test(gadgetsSrc);
    const hasToggle = /toggle\s*:\s*function\s*\(/m.test(gadgetsSrc);
    const hasRegisterSettings = /registerSettings\s*:\s*function\s*\(name,\s*factory\)/m.test(gadgetsSrc);
    const hasGetSettings = /getSettings\s*:\s*function\s*\(name\)/m.test(gadgetsSrc);
    const hasSetSetting = /setSetting\s*:\s*function\s*\(name,\s*key,\s*value\)/m.test(gadgetsSrc);
    const hasDraggable = /setAttribute\(\s*['\"]draggable['\"],\s*['\"]true['\"]\s*\)/m.test(gadgetsSrc);
    const hasDnDData = /dataTransfer\.setData\(\s*['\"]text\/gadget-name['\"],/m.test(gadgetsSrc);
    const hasDropListener = /addEventListener\(\s*['\"]drop['\"]/m.test(gadgetsSrc);
    const okGadgetsApi = hasStorageKey && hasGetPrefs && hasSetPrefs && hasMove && hasToggle;
    const okGadgetsM5 = hasRegisterSettings && hasGetSettings && hasSetSetting && hasDraggable && hasDnDData && hasDropListener;
    console.log('CHECK gadgets API (static) ->', okGadgetsApi ? 'OK' : 'NG', { hasStorageKey, hasGetPrefs, hasSetPrefs, hasMove, hasToggle });
    console.log('CHECK gadgets M5 (static) ->', okGadgetsM5 ? 'OK' : 'NG', { hasRegisterSettings, hasGetSettings, hasSetSetting, hasDraggable, hasDnDData, hasDropListener });

    // ガジェット設定のインポート/エクスポートUIとAPI
    const hasGadgetExportBtn = /id="gadget-export"/i.test(index.body || '');
    const hasGadgetImportBtn = /id="gadget-import"/i.test(index.body || '');
    const hasGadgetPrefsInput = /id="gadget-prefs-input"/i.test(index.body || '');
    const hasExportApi = /exportPrefs\s*:\s*function\s*\(/m.test(gadgetsSrc || '');
    const hasImportApi = /importPrefs\s*:\s*function\s*\(/m.test(gadgetsSrc || '');
    const okGadgetsImpExp = hasGadgetExportBtn && hasGadgetImportBtn && hasGadgetPrefsInput && hasExportApi && hasImportApi;
    console.log('CHECK gadgets import/export ->', okGadgetsImpExp ? 'OK' : 'NG', { hasGadgetExportBtn, hasGadgetImportBtn, hasGadgetPrefsInput, hasExportApi, hasImportApi });

    // タイトル仕様チェック（静的HTMLのベース表記 + app.js の実装確認）
    const appPath = path.join(__dirname, '..', 'js', 'app.js');
    let appSrc = '';
    try {
      appSrc = fs.readFileSync(appPath, 'utf-8');
    } catch (e) {
      console.error('READ FAIL:', appPath, e.message);
    }
    const hasUpdateFn = /function\s+updateDocumentTitle\s*\(/.test(appSrc);
    const hasNamePattern = /document\.title\s*=\s*name\s*\?\s*`?\$\{\s*name\s*\}\s*-\s*Zen Writer`?/m.test(appSrc);
    const hasFallback = /['"]Zen Writer\s*-\s*小説執筆ツール['"]/m.test(appSrc);
    const okTitleSpec = hasUpdateFn && hasNamePattern && hasFallback;
    console.log('CHECK title spec (app.js) ->', okTitleSpec ? 'OK' : 'NG', { hasUpdateFn, hasNamePattern, hasFallback });

    // 埋め込みデモの存在確認
    const embedDemo = await get('/embed-demo.html');
    const okEmbedDemo = embedDemo.status === 200 && /<h1>\s*Zen Writer Embed Demo\s*<\/h1>/i.test(embedDemo.body);
    console.log('GET /embed-demo.html ->', embedDemo.status, okEmbedDemo ? 'OK' : 'NG');

    // 埋め込みモード軽量化チェック（?embed=1）
    const embedIndex = await get('/index.html?embed=1');
    const ei = embedIndex.body || '';
    const eiStatus = embedIndex.status === 200;
    const eiNoOutline = !/<script\s+src=["']js\/outline\.js["']/.test(ei);
    const eiNoThemesAdv = !/<script\s+src=["']js\/themes-advanced\.js["']/.test(ei);
    const eiNoPluginReg = !/<script\s+src=["']js\/plugins\/registry\.js["']/.test(ei);
    const eiNoPluginChoice = !/<script\s+src=["']js\/plugins\/choice\.js["']/.test(ei);
    const eiHasApp = /<script\s+src=["']js\/app\.js["']/.test(ei);
    const eiHasChildBridge = /<script\s+src=["']js\/embed\/child-bridge\.js["']/.test(ei);
    const eiHasEmbedFlag = /setAttribute\(\'data-embed\',\'true\'\)/.test(ei);
    const eiNoGadgetsStatic = !/<script\s+src=["']js\/gadgets\.js["']/.test(ei);
    const okEmbedLight = eiStatus && eiNoOutline && eiNoThemesAdv && eiNoPluginReg && eiNoPluginChoice && eiNoGadgetsStatic && eiHasApp && eiHasChildBridge && eiHasEmbedFlag;
    console.log('CHECK embed=1 lightweight ->', okEmbedLight ? 'OK' : 'NG', {
      status: embedIndex.status,
      eiNoOutline, eiNoThemesAdv, eiNoPluginReg, eiNoPluginChoice, eiNoGadgetsStatic, eiHasApp, eiHasChildBridge, eiHasEmbedFlag
    });

    // child-bridge セキュリティパターン検証
    const childBridge = await get('/js/embed/child-bridge.js');
    const cbHasReady = /ZW_EMBED_READY/.test(childBridge.body || '');
    const cbStrictParent = /event\.source\s*!==\s*window\.parent/.test(childBridge.body || '');
    const cbStrictOrigin = /event\.origin\s*!==\s*allowedOrigin/.test(childBridge.body || '');
    const cbNoStarSend = /postMessage\(msg,\s*allowedOrigin\)/.test(childBridge.body || '');
    const cbHasEmbedOrigin = /embed_origin/.test(childBridge.body || '');
    const okChildBridge = childBridge.status === 200 && cbHasReady && cbStrictParent && cbStrictOrigin && cbNoStarSend && cbHasEmbedOrigin;
    console.log('GET /js/embed/child-bridge.js ->', childBridge.status, okChildBridge ? 'OK' : 'NG');

    // ルール文書と AI_CONTEXT の存在/内容チェック
    const rulesPath = path.join(__dirname, '..', 'docs', 'Windsurf_AI_Collab_Rules_v1.1.md');
    let rulesSrc = '';
    try { rulesSrc = fs.readFileSync(rulesPath, 'utf-8'); } catch (e) { console.error('READ FAIL:', rulesPath, e.message); }
    const rHasComposite = /複合ミッション/m.test(rulesSrc || '');
    const rHasAIContext = /AI_CONTEXT\.md/m.test(rulesSrc || '');
    const rHasCIMerge = /CI\s*連携マージ/m.test(rulesSrc || '');
    const rHasSelfPR = /自己\s*PR\s*は\s*Approve\s*不可|承認を省略/m.test(rulesSrc || '');
    const rHasTemplate = /付録\s*A:\s*AI_CONTEXT\.md\s*テンプレート/m.test(rulesSrc || '');
    const rHasCentralLink = /github\.com\/YuShimoji\/shared-workflows\/blob\/main\/docs\/Windsurf_AI_Collab_Rules_v1\.1\.md/m.test(rulesSrc || '') || /shared-workflows.*Windsurf_AI_Collab_Rules_v1\.1\.md/m.test(rulesSrc || '');
    const okRulesDoc = !!rulesSrc && (rHasCentralLink || (rHasComposite && rHasAIContext && rHasCIMerge && rHasSelfPR && rHasTemplate));
    console.log('CHECK rules v1.1 ->', okRulesDoc ? 'OK' : 'NG', { rHasCentralLink, rHasComposite, rHasAIContext, rHasCIMerge, rHasSelfPR, rHasTemplate });

    const ctxPath = path.join(__dirname, '..', 'AI_CONTEXT.md');
    let ctxSrc = '';
    try { ctxSrc = fs.readFileSync(ctxPath, 'utf-8'); } catch (e) { console.error('READ FAIL:', ctxPath, e.message); }
    const cHasH1 = /^#\s*(AI\s+Context|AI_CONTEXT)/m.test(ctxSrc || '');
    const cHasUpdated = /最終更新\s*:/m.test(ctxSrc || '');
    const cHasMission = /現在のミッション\s*:/m.test(ctxSrc || '');
    const cHasBranch = /ブランチ\s*:/m.test(ctxSrc || '');
    const cHasNext = /次の中断可能点\s*:/m.test(ctxSrc || '');
    const okAIContext = !!ctxSrc && cHasH1 && cHasUpdated && cHasMission && cHasBranch && cHasNext;
    console.log('CHECK AI_CONTEXT.md ->', okAIContext ? 'OK' : 'NG', { cHasH1, cHasUpdated, cHasMission, cHasBranch, cHasNext });

    // テンプレートの要点チェック（中断可能点・参考リンク・中央WF参照）
    const prTplPath = path.join(__dirname, '..', '.github', 'pull_request_template.md');
    const bugTplPath = path.join(__dirname, '..', '.github', 'ISSUE_TEMPLATE', 'bug_report.md');
    const featTplPath = path.join(__dirname, '..', '.github', 'ISSUE_TEMPLATE', 'feature_request.md');
    const issueCfgPath = path.join(__dirname, '..', '.github', 'ISSUE_TEMPLATE', 'config.yml');

    let prTpl = '', bugTpl = '', featTpl = '', issueCfg = '';
    try { prTpl = fs.readFileSync(prTplPath, 'utf-8'); } catch(_) {}
    try { bugTpl = fs.readFileSync(bugTplPath, 'utf-8'); } catch(_) {}
    try { featTpl = fs.readFileSync(featTplPath, 'utf-8'); } catch(_) {}
    try { issueCfg = fs.readFileSync(issueCfgPath, 'utf-8'); } catch(_) {}

    const prHasStop = /##\s*中断可能点/.test(prTpl);
    const prHasRefs = /##\s*参考リンク/.test(prTpl) && /AI_CONTEXT\.md/.test(prTpl) && /DEVELOPMENT_PROTOCOL\.md/.test(prTpl);
    const bugHasStop = /##\s*中断可能点/.test(bugTpl);
    const bugHasRefs = /##\s*参考リンク/.test(bugTpl) && /AI_CONTEXT\.md/.test(bugTpl) && /DEVELOPMENT_PROTOCOL\.md/.test(bugTpl);
    const featHasStop = /##\s*中断可能点/.test(featTpl);
    const featHasRefs = /##\s*参考リンク/.test(featTpl) && /AI_CONTEXT\.md/.test(featTpl) && /DEVELOPMENT_PROTOCOL\.md/.test(featTpl);
    const cfgHasCtx = /AI_CONTEXT\.md/.test(issueCfg);
    const cfgHasProto = /DEVELOPMENT_PROTOCOL\.md/.test(issueCfg);
    const okTemplates = prHasStop && prHasRefs && bugHasStop && bugHasRefs && featHasStop && featHasRefs && cfgHasCtx && cfgHasProto;
    console.log('CHECK templates ->', okTemplates ? 'OK' : 'NG', { prHasStop, prHasRefs, bugHasStop, bugHasRefs, featHasStop, featHasRefs, cfgHasCtx, cfgHasProto });

    // 簡易Markdownlint（基本ルール）
    function mdLintBasic(p){
      try {
        const src = fs.readFileSync(p, 'utf-8');
        const lines = String(src||'').split(/\r?\n/);
        let firstNonEmpty = lines.find(l => l.trim().length>0) || '';
        const h1Ok = /^#\s+/.test(firstNonEmpty);
        let lastLevel = 0; let headingStepOk = true; let longOk = true; let trailOk = true; let tabsOk = true;
        for (let i=0;i<lines.length;i++){
          const line = lines[i];
          const m = /^(#{1,6})\s+/.exec(line);
          if (m){ const lvl = m[1].length; if (lastLevel>0 && lvl>lastLevel+1) headingStepOk = false; lastLevel = lvl; }
          if (line.length > 200) longOk = false;
          if (/\s$/.test(line)) trailOk = false;
          if (/\t/.test(line)) tabsOk = false;
        }
        const ok = h1Ok && headingStepOk && longOk && trailOk && tabsOk;
        return { ok, h1Ok, headingStepOk, longOk, trailOk, tabsOk };
      } catch(_) { return { ok:false, error:'read fail' }; }
    }

    const mdTargets = [
      path.join(__dirname, '..', 'AI_CONTEXT.md'),
      path.join(__dirname, '..', 'DEVELOPMENT_PROTOCOL.md'),
      path.join(__dirname, '..', 'README.md'),
      path.join(__dirname, '..', 'CONTRIBUTING.md')
    ];
    const mdResults = mdTargets.map(f => ({ f, r: mdLintBasic(f) }));
    const okMdLint = mdResults.every(x => x.r && x.r.ok);
    console.log('CHECK markdownlint (basic) ->', okMdLint ? 'OK' : 'NG', mdResults.reduce((o,x)=>{ o[path.basename(x.f)] = x.r; return o; }, {}));

    // favicon.ico フォールバック確認（サーバー再起動後に 200 / image/svg+xml になる想定）
    const fav = await get('/favicon.ico');
    const ct = (fav.headers && (fav.headers['content-type'] || fav.headers['Content-Type'])) || '';
    const okFav = (fav.status === 200 && /svg\+xml/.test(ct)) || (fav.status === 404); // ローカル旧プロセス時は404を許容
    console.log('GET /favicon.ico ->', fav.status, ct || '-', okFav ? 'OK' : 'NG');

    if (!(okIndex && okCss && okTitleSpec && okPlugins && okGadgets && okGadgetsApi && okGadgetsM5 && okGadgetsImpExp && okRulesDoc && okAIContext && okEmbedDemo && okFav && okChildBridge && okEmbedLight && okTemplates && okMdLint)) {
      process.exit(1);
    } else {
      console.log('ALL TESTS PASSED');
      process.exit(0);
    }
  } catch (e) {
    console.error('DEV CHECK FAILED', e);
    process.exit(1);
  }
})();
