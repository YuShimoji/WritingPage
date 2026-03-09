// Temporary script to parse E2E test results
const fs = require('fs');
const data = fs.readFileSync(process.env.TEMP + '/e2e-results.json', 'utf8');
const j = JSON.parse(data);
const failed = [];
function walk(suite) {
  (suite.specs || []).forEach(s => {
    const failedResults = [];
    if (s.tests) {
      s.tests.forEach(t => {
        if (t.results) {
          t.results.forEach(r => {
            if (r.status === 'failed') {
              const msg = (r.errors || []).map(e => {
                const m = (e.message || '').replace(/\x1b\[[0-9;]*m/g, '');
                // Extract just the first line of the error
                return m.split('\n').slice(0, 3).join(' | ');
              }).join('; ');
              failedResults.push(msg);
            }
          });
        }
      });
    }
    if (failedResults.length > 0) {
      failed.push({ file: s.file, title: s.title, line: s.line, error: failedResults[0].substring(0, 200) });
    }
  });
  (suite.suites || []).forEach(ss => walk(ss));
}
j.suites.forEach(s => walk(s));

// Group by error pattern
const patterns = {};
failed.forEach(f => {
  let pattern = 'other';
  if (f.error.includes('sidebar-toggle') || f.error.includes('#sidebar-toggle')) pattern = 'sidebar-toggle missing';
  else if (f.error.includes('settings-modal') || f.error.includes('toggle-settings')) pattern = 'settings access';
  else if (f.error.includes('accordion')) pattern = 'accordion issue';
  else if (f.error.includes('not.toBeVisible') || f.error.includes('toBeVisible')) pattern = 'visibility';
  else if (f.error.includes('toHaveAttribute')) pattern = 'attribute mismatch';
  else if (f.error.includes('toBeAttached') || f.error.includes('toHaveCount')) pattern = 'element missing';
  else if (f.error.includes('Timeout')) pattern = 'timeout';
  if (!patterns[pattern]) patterns[pattern] = [];
  patterns[pattern].push(f);
});

Object.entries(patterns).forEach(([p, items]) => {
  console.log('\n=== ' + p + ' (' + items.length + ') ===');
  items.forEach(f => {
    console.log('  ' + f.file + ':' + f.line + ' ' + f.title);
    console.log('    ERR: ' + f.error.substring(0, 150));
  });
});
console.log('\nTotal: ' + failed.length + ' failed');
