const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port: 8080, path }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
  });
}

(async () => {
  try {
    const index = await get('/');
    const okIndex =
      index.status === 200 &&
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

    if (!(okIndex && okCss)) {
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
