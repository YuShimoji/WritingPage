/**
 * 長文貼り付け時のパフォーマンス計測スクリプト
 * ブラウザのコンソールで実行するか、Puppeteer/Playwrightで自動実行
 */
(function () {
  'use strict';

  const SAMPLE_SIZES = [1000, 5000, 10000, 50000, 100000];

  function generateText(charCount) {
    const lorem = 'これは長文テストのためのサンプルテキストです。日本語の文章を生成して、エディタの性能を測定します。';
    let result = '';
    while (result.length < charCount) {
      result += lorem + '\n';
    }
    return result.substring(0, charCount);
  }

  async function measurePastePerformance(charCount) {
    const editor = document.getElementById('editor');
    if (!editor) {
      console.error('Editor not found');
      return null;
    }

    const text = generateText(charCount);

    // Clear editor
    editor.value = '';
    editor.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for any pending operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Measure paste performance
    const start = performance.now();

    // Simulate paste
    editor.value = text;
    editor.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for word count update
    await new Promise(resolve => setTimeout(resolve, 500));

    const end = performance.now();
    const duration = end - start;

    return {
      charCount,
      durationMs: Math.round(duration),
      charsPerMs: Math.round(charCount / duration)
    };
  }

  async function runAllTests() {
    console.log('=== 長文貼り付けパフォーマンステスト ===');
    console.log('');

    const results = [];

    for (const size of SAMPLE_SIZES) {
      console.log(`Testing ${size} characters...`);
      const result = await measurePastePerformance(size);
      if (result) {
        results.push(result);
        console.log(`  Duration: ${result.durationMs}ms (${result.charsPerMs} chars/ms)`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('');
    console.log('=== 結果サマリー ===');
    console.table(results);

    // Clear editor after test
    const editor = document.getElementById('editor');
    if (editor) {
      editor.value = '';
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }

    return results;
  }

  // Export for external use
  window.ZWPerfTest = {
    measurePastePerformance,
    runAllTests,
    generateText
  };

  console.log('Performance test loaded. Run window.ZWPerfTest.runAllTests() to start.');
})();
