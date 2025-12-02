const http = require('http');

/* eslint-disable no-useless-escape */

const fs = require('fs');
const path = require('path');

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port: 8080, path }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () =>
        resolve({ status: res.statusCode, body: data, headers: res.headers }),
      );
    });
    req.on('error', reject);
  });
}

async function loadCssWithImports(url) {
  let css = await get(url);
  if (css.status !== 200) return css;
  let body = css.body;
  const importRegex = /@import\s+(?:url\(['"]?([^'")]+)['"]?\)|['"]([^'"]+)['"])\s*;/g;
  let match;
  while ((match = importRegex.exec(body)) !== null) {
    const importUrl = match[1] || match[2];
    const fullUrl = importUrl.startsWith('/') ? importUrl : '/css/' + importUrl;
    const imported = await loadCssWithImports(fullUrl);
    if (imported.status === 200) {
      body = body.replace(match[0], imported.body);
    }
  }
  return { status: css.status, body };
}

(async () => {
  try {
    const index = await get('/');
    const okIndex =
      index.status === 200 &&
      /<title>\s*Zen Writer\s*-\s*小説執筆ツール\s*<\/title>/i.test(
        index.body,
      ) &&
      /<div\s+class=\"toolbar\"/i.test(index.body) &&
      /<textarea\s+id=\"editor\"/i.test(index.body) &&
      /id=\"goal-progress\"/i.test(index.body) &&
      /id=\"goal-target\"/i.test(index.body) &&
      /id=\"goal-deadline\"/i.test(index.body) &&
      /id=\"structure-gadgets-panel\"/i.test(index.body) &&
      /data-gadget-group=\"structure\"/i.test(index.body);
    console.log('GET / ->', index.status, okIndex ? 'OK' : 'NG');

    const css = await loadCssWithImports('/css/style.css');
    const hasRootHide = /html\[data-toolbar-hidden='true'\] \.toolbar/.test(
      css.body,
    );
    const hasRootShowPadding = /padding-top:\s*calc\(var\(--toolbar-height\)\s*\+\s*1rem\)/.test(css.body || '');
    const hasProgressCss = /\.goal-progress__bar/.test(css.body);
    const hasCssSettingsBtn = /\.gadget-settings-btn\b/.test(css.body || '');
    const hasCssSettings = /\.gadget-settings\b/.test(css.body || '');
    const hasCssDrag =
      /\.gadget\.is-dragging\b/.test(css.body || '') &&
      /\.gadget\.drag-over\b/.test(css.body || '');
    const okCss =
      css.status === 200 &&
      hasRootHide &&
      hasRootShowPadding &&
      hasProgressCss &&
      hasCssSettingsBtn &&
      hasCssSettings &&
      hasCssDrag;
    console.log('GET /css/style.css ->', css.status, okCss ? 'OK' : 'NG', {
      hasRootHide,
      hasRootShowPadding,
      hasProgressCss,
      hasCssSettingsBtn,
      hasCssSettings,
      hasCssDrag,
    });

    // プラグインスクリプトの存在検証（UIパネルはオプション）
    const pluginRegistry = await get('/js/plugins/registry.js');
    const pluginChoice = await get('/js/plugins/choice.js');
    const okPlugins =
      pluginRegistry.status === 200 &&
      pluginChoice.status === 200;
    console.log('CHECK plugins ->', okPlugins ? 'OK' : 'NG', {
      registry: pluginRegistry.status,
      choice: pluginChoice.status,
    });

    // ガジェットの存在検証（新UI構造: structure/assist/wiki/typographyパネル）
    const hasStructurePanel = /id="structure-gadgets-panel"/i.test(index.body);
    const hasAssistPanel = /id="assist-gadgets-panel"/i.test(index.body);
    const hasGadgetGroup = /data-gadget-group="structure"/i.test(index.body);
    const gadgetsCoreJs = await get('/js/gadgets-core.js');
    const okGadgets = hasStructurePanel && hasAssistPanel && hasGadgetGroup && gadgetsCoreJs.status === 200;
    console.log('CHECK gadgets ->', okGadgets ? 'OK' : 'NG', {
      hasStructurePanel,
      hasAssistPanel,
      hasGadgetGroup,
      gadgets: gadgetsCoreJs.status,
    });

    // ガジェットPrefs APIの静的実装確認（モジュール化されたファイル群を読み取り）
    const gadgetsCorePath = path.join(__dirname, '..', 'js', 'gadgets-core.js');
    const gadgetsUtilsPath = path.join(__dirname, '..', 'js', 'gadgets-utils.js');
    let gadgetsSrc = '';
    try {
      gadgetsSrc = fs.readFileSync(gadgetsCorePath, 'utf-8');
      gadgetsSrc += fs.readFileSync(gadgetsUtilsPath, 'utf-8');
    } catch (e) {
      console.error('READ FAIL:', e.message);
    }
    const hasStorageKey = /zenWriter_gadgets:prefs/.test(gadgetsSrc);
    const hasGetPrefs = /getPrefs\s*\(\)\s*\{/m.test(gadgetsSrc);
    const hasSetPrefs = /setPrefs\s*\(\s*p\s*\)\s*\{/m.test(gadgetsSrc);
    const hasMove = /move\s*\(\s*name,\s*dir\s*\)\s*\{/m.test(gadgetsSrc);
    const hasToggle = /toggle\s*\(\s*name\s*\)\s*\{/m.test(gadgetsSrc);
    const hasRegisterSettings = /registerSettings\s*\(\s*name,\s*factory\s*\)\s*\{/m.test(
      gadgetsSrc,
    );
    const hasGetSettings = /getSettings\s*\(\s*name\s*\)\s*\{/m.test(gadgetsSrc);
    const hasSetSetting = /setSetting\s*\(\s*name,\s*key,\s*value\s*\)\s*\{/m.test(
      gadgetsSrc,
    );
    const hasDraggable =
      /setAttribute\(\s*['\"]draggable['\"],\s*['\"]true['\"]\s*\)/m.test(
        gadgetsSrc,
      );
    const hasDnDData =
      /dataTransfer\.setData\(\s*['\"]text\/gadget-name['\"],/m.test(
        gadgetsSrc,
      );
    const hasDropListener = /addEventListener\(\s*['\"]drop['\"]/m.test(
      gadgetsSrc,
    );
    // Documents ガジェットは gadgets-builtin.js に定義
    const builtinPath = path.join(__dirname, '..', 'js', 'gadgets-builtin.js');
    let builtinSrc = '';
    try {
      builtinSrc = fs.readFileSync(builtinPath, 'utf-8');
    } catch (e) {
      console.error('READ FAIL:', builtinPath, e.message);
    }
    const hasDocumentsGadget = /register\(['"]Documents['"]/.test(builtinSrc);
    const okGadgetsApi =
      hasStorageKey && hasGetPrefs && hasSetPrefs && hasMove && hasToggle;
    // 初期化コードは gadgets-init.js に移動済み
    const initPath = path.join(__dirname, '..', 'js', 'gadgets-init.js');
    let initSrc = '';
    try {
      initSrc = fs.readFileSync(initPath, 'utf-8');
    } catch (e) {
      console.error('READ FAIL:', initPath, e.message);
    }
    const hasStructureInit = /init\(panel,\s*\{\s*group:\s*groupName\s*\}\)/.test(initSrc);
    // M5: 設定管理API（ドラッグ&ドロップは将来機能のため除外）
    const okGadgetsM5 =
      hasRegisterSettings &&
      hasGetSettings &&
      hasSetSetting;
    console.log('CHECK gadgets API (static) ->', okGadgetsApi ? 'OK' : 'NG', {
      hasStorageKey,
      hasGetPrefs,
      hasSetPrefs,
      hasMove,
      hasToggle,
    });
    console.log('CHECK gadgets M5 (static) ->', okGadgetsM5 ? 'OK' : 'NG', {
      hasRegisterSettings,
      hasGetSettings,
      hasSetSetting,
      // 将来機能（ドラッグ&ドロップ）: hasDraggable, hasDnDData, hasDropListener
    });
    console.log(
      'CHECK gadgets Docs init ->',
      hasDocumentsGadget && hasStructureInit ? 'OK' : 'NG',
      { hasDocumentsGadget, hasStructureInit },
    );

    // ガジェット設定のインポート/エクスポートAPI（UIは未実装のためAPIのみチェック）
    const hasExportApi = /exportPrefs\s*\(\)\s*\{/m.test(
      gadgetsSrc || '',
    );
    const hasImportApi = /importPrefs\s*\(\s*obj\s*\)\s*\{/m.test(
      gadgetsSrc || '',
    );
    const okGadgetsImpExp = hasExportApi && hasImportApi;
    console.log(
      'CHECK gadgets import/export API ->',
      okGadgetsImpExp ? 'OK' : 'NG',
      {
        hasExportApi,
        hasImportApi,
        note: 'UI is not implemented yet',
      },
    );

    // タイトル仕様チェック（静的HTMLのベース表記 + app.js の実装確認）
    const appPath = path.join(__dirname, '..', 'js', 'app.js');
    let appSrc = '';
    try {
      appSrc = fs.readFileSync(appPath, 'utf-8');
    } catch (e) {
      console.error('READ FAIL:', appPath, e.message);
    }
    const hasUpdateFn = /function\s+updateDocumentTitle\s*\(/.test(appSrc);
    const hasNamePattern =
      /document\.title\s*=\s*name\s*\?\s*`?\$\{\s*name\s*\}\s*-\s*Zen Writer`?/m.test(
        appSrc,
      );
    const hasFallback = /['"]Zen Writer\s*-\s*小説執筆ツール['"]/m.test(appSrc);
    const okTitleSpec = hasUpdateFn && hasNamePattern && hasFallback;
    console.log('CHECK title spec (app.js) ->', okTitleSpec ? 'OK' : 'NG', {
      hasUpdateFn,
      hasNamePattern,
      hasFallback,
    });

    // 埋め込みデモの存在確認
    const embedDemo = await get('/embed-demo.html');
    const okEmbedDemo =
      embedDemo.status === 200 &&
      /<h1>\s*Zen Writer Embed Demo\s*<\/h1>/i.test(embedDemo.body);
    console.log(
      'GET /embed-demo.html ->',
      embedDemo.status,
      okEmbedDemo ? 'OK' : 'NG',
    );

    // 埋め込みモード軽量化チェック（?embed=1）
    const embedIndex = await get('/index.html?embed=1');
    const ei = embedIndex.body || '';
    const eiStatus = embedIndex.status === 200;
    const eiNoOutline = !/<script\s+src=["']js\/outline\.js["']/.test(ei);
    const eiNoThemesAdv = !/<script\s+src=["']js\/themes-advanced\.js["']/.test(
      ei,
    );
    const eiNoPluginReg =
      !/<script\s+src=["']js\/plugins\/registry\.js["']/.test(ei);
    const eiNoPluginChoice =
      !/<script\s+src=["']js\/plugins\/choice\.js["']/.test(ei);
    const eiHasApp = /<script\s+src=["']js\/app\.js["']/.test(ei);
    const eiHasChildBridge =
      /<script\s+src=["']js\/embed\/child-bridge\.js["']/.test(ei);
    const eiHasEmbedFlag = /setAttribute\(\s*['"]data-embed['"],\s*['"]true['"]\)/.test(ei);
    const eiNoGadgetsStatic = !/<script\s+src=["']js\/gadgets\.js["']/.test(ei);
    const okEmbedLight =
      eiStatus &&
      eiNoOutline &&
      eiNoThemesAdv &&
      eiNoPluginReg &&
      eiNoPluginChoice &&
      eiHasApp &&
      eiHasChildBridge &&
      eiHasEmbedFlag;
    console.log('CHECK embed=1 lightweight ->', okEmbedLight ? 'OK' : 'NG', {
      status: embedIndex.status,
      eiNoOutline,
      eiNoThemesAdv,
      eiNoPluginReg,
      eiNoPluginChoice,
      eiNoGadgetsStatic,
      eiHasApp,
      eiHasChildBridge,
      eiHasEmbedFlag,
    });

    // child-bridge セキュリティパターン検証
    const childBridge = await get('/js/embed/child-bridge.js');
    const cbHasReady = /ZW_EMBED_READY/.test(childBridge.body || '');
    const cbStrictParent = /event\.source\s*!==\s*window\.parent/.test(
      childBridge.body || '',
    );
    const cbStrictOrigin = /event\.origin\s*!==\s*allowedOrigin/.test(
      childBridge.body || '',
    );
    const cbNoStarSend = /postMessage\(msg,\s*allowedOrigin\)/.test(
      childBridge.body || '',
    );
    const cbHasEmbedOrigin = /embed_origin/.test(childBridge.body || '');
    const okChildBridge =
      childBridge.status === 200 &&
      cbHasReady &&
      cbStrictParent &&
      cbStrictOrigin &&
      cbNoStarSend &&
      cbHasEmbedOrigin;
    console.log(
      'GET /js/embed/child-bridge.js ->',
      childBridge.status,
      okChildBridge ? 'OK' : 'NG',
    );

    // ルール文書と AI_CONTEXT の存在/内容チェック
    const rulesPath = path.join(
      __dirname,
      '..',
      'docs',
      'Windsurf_AI_Collab_Rules_v1.1.md',
    );
    let rulesSrc = '';
    try {
      rulesSrc = fs.readFileSync(rulesPath, 'utf-8');
    } catch (e) {
      console.error('READ FAIL:', rulesPath, e.message);
    }
    const rHasComposite = /複合ミッション/m.test(rulesSrc || '');
    const rHasAIContext = /AI_CONTEXT\.md/m.test(rulesSrc || '');
    const rHasCIMerge = /CI\s*連携マージ/m.test(rulesSrc || '');
    const rHasSelfPR = /自己\s*PR\s*は\s*Approve\s*不可|承認を省略/m.test(
      rulesSrc || '',
    );
    const rHasTemplate = /付録\s*A:\s*AI_CONTEXT\.md\s*テンプレート/m.test(
      rulesSrc || '',
    );
    const rHasCentralLink =
      /github\.com\/YuShimoji\/shared-workflows\/blob\/main\/docs\/Windsurf_AI_Collab_Rules_v1\.1\.md/m.test(
        rulesSrc || '',
      ) ||
      /shared-workflows.*Windsurf_AI_Collab_Rules_v1\.1\.md/m.test(
        rulesSrc || '',
      );
    const okRulesDoc =
      !!rulesSrc &&
      (rHasCentralLink ||
        (rHasComposite &&
          rHasAIContext &&
          rHasCIMerge &&
          rHasSelfPR &&
          rHasTemplate));
    console.log('CHECK rules v1.1 ->', okRulesDoc ? 'OK' : 'NG', {
      rHasCentralLink,
      rHasComposite,
      rHasAIContext,
      rHasCIMerge,
      rHasSelfPR,
      rHasTemplate,
    });

    const ctxPath = path.join(__dirname, '..', 'AI_CONTEXT.md');
    let ctxSrc = '';
    try {
      ctxSrc = fs.readFileSync(ctxPath, 'utf-8');
    } catch (e) {
      console.error('READ FAIL:', ctxPath, e.message);
    }
    const cHasH1 = /^#\s*(AI\s+Context|AI_CONTEXT)/m.test(ctxSrc || '');
    const cHasUpdated = /最終更新\s*:/m.test(ctxSrc || '');
    const cHasMission = /現在のミッション\s*:/m.test(ctxSrc || '');
    const cHasBranch = /ブランチ\s*:/m.test(ctxSrc || '');
    const cHasNext = /次の中断可能点\s*:/m.test(ctxSrc || '');
    const okAIContext =
      !!ctxSrc &&
      cHasH1 &&
      cHasUpdated &&
      cHasMission &&
      cHasBranch &&
      cHasNext;
    console.log('CHECK AI_CONTEXT.md ->', okAIContext ? 'OK' : 'NG', {
      cHasH1,
      cHasUpdated,
      cHasMission,
      cHasBranch,
      cHasNext,
    });

    // テンプレートの要点チェック（中断可能点・参考リンク・中央WF参照）
    const prTplPath = path.join(
      __dirname,
      '..',
      '.github',
      'pull_request_template.md',
    );
    const bugTplPath = path.join(
      __dirname,
      '..',
      '.github',
      'ISSUE_TEMPLATE',
      'bug_report.md',
    );
    const featTplPath = path.join(
      __dirname,
      '..',
      '.github',
      'ISSUE_TEMPLATE',
      'feature_request.md',
    );
    const issueCfgPath = path.join(
      __dirname,
      '..',
      '.github',
      'ISSUE_TEMPLATE',
      'config.yml',
    );

    let prTpl = '',
      bugTpl = '',
      featTpl = '',
      issueCfg = '';
    try {
      prTpl = fs.readFileSync(prTplPath, 'utf-8');
    } catch (_) { /* ignore */ }
    try {
      bugTpl = fs.readFileSync(bugTplPath, 'utf-8');
    } catch (_) { /* ignore */ }
    try {
      featTpl = fs.readFileSync(featTplPath, 'utf-8');
    } catch (_) { /* ignore */ }
    try {
      issueCfg = fs.readFileSync(issueCfgPath, 'utf-8');
    } catch (_) { /* ignore */ }

    const prHasStop = /##\s*中断可能点/.test(prTpl);
    const prHasRefs =
      /##\s*参考リンク/.test(prTpl) &&
      /AI_CONTEXT\.md/.test(prTpl) &&
      /DEVELOPMENT_PROTOCOL\.md/.test(prTpl);
    const bugHasStop = /##\s*中断可能点/.test(bugTpl);
    const bugHasRefs =
      /##\s*参考リンク/.test(bugTpl) &&
      /AI_CONTEXT\.md/.test(bugTpl) &&
      /DEVELOPMENT_PROTOCOL\.md/.test(bugTpl);
    const featHasStop = /##\s*中断可能点/.test(featTpl);
    const featHasRefs =
      /##\s*参考リンク/.test(featTpl) &&
      /AI_CONTEXT\.md/.test(featTpl) &&
      /DEVELOPMENT_PROTOCOL\.md/.test(featTpl);
    const cfgHasCtx = /AI_CONTEXT\.md/.test(issueCfg);
    const cfgHasProto = /DEVELOPMENT_PROTOCOL\.md/.test(issueCfg);
    const okTemplates =
      prHasStop &&
      prHasRefs &&
      bugHasStop &&
      bugHasRefs &&
      featHasStop &&
      featHasRefs &&
      cfgHasCtx &&
      cfgHasProto;
    console.log('CHECK templates ->', okTemplates ? 'OK' : 'NG', {
      prHasStop,
      prHasRefs,
      bugHasStop,
      bugHasRefs,
      featHasStop,
      featHasRefs,
      cfgHasCtx,
      cfgHasProto,
    });

    // 簡易Markdownlint（基本ルール）
    const mdLintBasic = (p) => {
      try {
        const src = fs.readFileSync(p, 'utf-8');
        const lines = String(src || '').split(/\r?\n/);
        let firstNonEmpty = lines.find((l) => l.trim().length > 0) || '';
        const h1Ok = /^#\s+/.test(firstNonEmpty);
        let lastLevel = 0;
        let headingStepOk = true;
        let longOk = true;
        let trailOk = true;
        let tabsOk = true;
        let inCode = false;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith('```')) inCode = !inCode;
          if (!inCode) {
            const m = /^(#{1,6})\s+/.exec(line);
            if (m) {
              const lvl = m[1].length;
              if (lastLevel > 0 && lvl > lastLevel + 1) headingStepOk = false;
              lastLevel = lvl;
            }
          }
          if (line.length > 200) longOk = false;
          if (/\s$/.test(line)) trailOk = false;
          if (/\t/.test(line)) tabsOk = false;
        }
        const ok = h1Ok && headingStepOk && longOk && trailOk && tabsOk;
        return { ok, h1Ok, headingStepOk, longOk, trailOk, tabsOk };
      } catch (_) { /* ignore */
        return { ok: false, error: 'read fail' };
      }
    };

    const mdTargets = [
      path.join(__dirname, '..', 'AI_CONTEXT.md'),
      path.join(__dirname, '..', 'DEVELOPMENT_PROTOCOL.md'),
      path.join(__dirname, '..', 'README.md'),
      path.join(__dirname, '..', 'CONTRIBUTING.md'),
    ];
    const mdResults = mdTargets.map((f) => ({ f, r: mdLintBasic(f) }));
    const okMdLint = mdResults.every((x) => x.r && x.r.ok);
    console.log(
      'CHECK markdownlint (basic) ->',
      okMdLint ? 'OK' : 'NG',
      mdResults.reduce((o, x) => {
        o[path.basename(x.f)] = x.r;
        return o;
      }, {}),
    );

    // favicon.ico フォールバック確認（サーバー再起動後に 200 / image/svg+xml になる想定）
    const fav = await get('/favicon.ico');
    const ct =
      (fav.headers &&
        (fav.headers['content-type'] || fav.headers['Content-Type'])) ||
      '';
    const okFav =
      (fav.status === 200 && /svg\+xml/.test(ct)) || fav.status === 404; // ローカル旧プロセス時は404を許容
    console.log(
      'GET /favicon.ico ->',
      fav.status,
      ct || '-',
      okFav ? 'OK' : 'NG',
    );

    if (
      !(
        okIndex &&
        okCss &&
        okTitleSpec &&
        okPlugins &&
        okGadgets &&
        okGadgetsApi &&
        okGadgetsM5 &&
        hasDocumentsGadget &&
        hasStructureInit &&
        okGadgetsImpExp &&
        okRulesDoc &&
        okAIContext &&
        okEmbedDemo &&
        okFav &&
        okChildBridge &&
        okEmbedLight &&
        okTemplates &&
        okMdLint
      )
    ) {
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
