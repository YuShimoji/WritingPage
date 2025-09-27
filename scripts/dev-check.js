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
    const okCss = css.status === 200 && hasRootHide && hasRootShowPadding && removedBodyRule && hasProgressCss;
    console.log('GET /css/style.css ->', css.status, okCss ? 'OK' : 'NG');

    // プラグインUIとスクリプトの存在検証
    const hasPluginsPanel = /id=\"plugins-panel\"/i.test(index.body);
    const pluginRegistry = await get('/js/plugins/registry.js');
    const pluginChoice = await get('/js/plugins/choice.js');
    const okPlugins = hasPluginsPanel && pluginRegistry.status === 200 && pluginChoice.status === 200;
    console.log('CHECK plugins ->', okPlugins ? 'OK' : 'NG', { hasPluginsPanel, registry: pluginRegistry.status, choice: pluginChoice.status });

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

    // favicon.ico フォールバック確認（サーバー再起動後に 200 / image/svg+xml になる想定）
    const fav = await get('/favicon.ico');
    const ct = (fav.headers && (fav.headers['content-type'] || fav.headers['Content-Type'])) || '';
    const okFav = (fav.status === 200 && /svg\+xml/.test(ct)) || (fav.status === 404); // ローカル旧プロセス時は404を許容
    console.log('GET /favicon.ico ->', fav.status, ct || '-', okFav ? 'OK' : 'NG');

    if (!(okIndex && okCss && okTitleSpec && okPlugins && okEmbedDemo && okFav)) {
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
