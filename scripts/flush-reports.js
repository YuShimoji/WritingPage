#!/usr/bin/env node
/**
 * レポート削除スクリプト（flush-reports）
 * 
 * HANDOVER.md に記載されているレポートを検出し、削除する。
 * 削除前に確認プロンプトを表示（--force でスキップ可能）。
 * --dry-run オプションで削除対象の表示のみを行う。
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * HANDOVER.md からレポートパスを抽出
 * @param {string} handoverPath - HANDOVER.md のパス
 * @param {string} projectRoot - プロジェクトルート
 * @returns {string[]} レポートパスの配列
 */
function extractReportPaths(handoverPath, projectRoot) {
  const content = fs.readFileSync(handoverPath, 'utf8');
  const reportPaths = new Set();

  // 「統合レポート」セクションから抽出: `- docs/reports/REPORT_*.md`
  const integratedReportsMatch = content.match(/##\s+統合レポート\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  if (integratedReportsMatch) {
    const integratedSection = integratedReportsMatch[1];
    const integratedMatches = integratedSection.matchAll(/docs\/reports\/(REPORT_[^\s\)]+\.md)/gi);
    for (const match of integratedMatches) {
      const reportPath = path.join(projectRoot, 'docs', 'reports', match[1]);
      if (fs.existsSync(reportPath)) {
        reportPaths.add(reportPath);
      }
    }
  }

  // 「Latest Orchestrator Report」セクションから抽出: `- File: docs/reports/REPORT_*.md`
  const latestOrchMatch = content.match(/##\s+Latest Orchestrator Report\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  if (latestOrchMatch) {
    const latestOrchSection = latestOrchMatch[1];
    const fileMatch = latestOrchSection.match(/File:\s*docs\/reports\/(REPORT_[^\s\)]+\.md)/i);
    if (fileMatch) {
      const reportPath = path.join(projectRoot, 'docs', 'reports', fileMatch[1]);
      if (fs.existsSync(reportPath)) {
        reportPaths.add(reportPath);
      }
    }
  }

  // 「Latest Worker Report」セクションから抽出: `- File: docs/reports/REPORT_*.md`
  const latestWorkerMatch = content.match(/##\s+Latest Worker Report\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  if (latestWorkerMatch) {
    const latestWorkerSection = latestWorkerMatch[1];
    const fileMatch = latestWorkerSection.match(/File:\s*docs\/reports\/(REPORT_[^\s\)]+\.md)/i);
    if (fileMatch) {
      const reportPath = path.join(projectRoot, 'docs', 'reports', fileMatch[1]);
      if (fs.existsSync(reportPath)) {
        reportPaths.add(reportPath);
      }
    }
  }

  // 「進捗」セクションから抽出: `- **REPORT_*.md**:`
  const progressMatch = content.match(/##\s+進捗\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  if (progressMatch) {
    const progressSection = progressMatch[1];
    const progressMatches = progressSection.matchAll(/\*\*(REPORT_[^\s\*\:]+\.md)\*\*/gi);
    for (const match of progressMatches) {
      const reportPath = path.join(projectRoot, 'docs', 'reports', match[1]);
      if (fs.existsSync(reportPath)) {
        reportPaths.add(reportPath);
      }
    }
  }

  return Array.from(reportPaths).sort();
}

/**
 * 確認プロンプトを表示
 * @param {string[]} reportPaths - 削除対象のレポートパス
 * @returns {Promise<boolean>} 削除を実行するかどうか
 */
function confirmDeletion(reportPaths) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n以下のレポートを削除します:');
    reportPaths.forEach((p, i) => {
      console.log(`  ${i + 1}. ${path.relative(process.cwd(), p)}`);
    });
    console.log(`\n合計: ${reportPaths.length} 件`);

    rl.question('\n削除を実行しますか？ (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * コマンドライン引数をパース
 * @param {string[]} argv - コマンドライン引数
 * @returns {Object} オプション
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    projectRoot: process.cwd(),
    dryRun: false,
    force: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--project-root' && i + 1 < args.length) {
      options.projectRoot = path.resolve(args[i + 1]);
      i++;
    } else if (arg.startsWith('--project-root=')) {
      options.projectRoot = path.resolve(arg.split('=')[1]);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
使用方法: node scripts/flush-reports.js [オプション]

オプション:
  --project-root <path>  プロジェクトルートのパス（デフォルト: 現在のディレクトリ）
  --dry-run              削除対象の表示のみ（実際には削除しない）
  --force                確認プロンプトをスキップして削除を実行
  --help, -h             このヘルプを表示

例:
  node scripts/flush-reports.js --dry-run
  node scripts/flush-reports.js --force
      `);
      process.exit(0);
    }
  }

  options.projectRoot = path.resolve(options.projectRoot);
  return options;
}

/**
 * メイン処理
 */
async function main() {
  const options = parseArgs(process.argv);
  const projectRoot = options.projectRoot;
  const handoverPath = path.join(projectRoot, 'docs', 'HANDOVER.md');

  // HANDOVER.md の存在確認
  if (!fs.existsSync(handoverPath)) {
    console.error(`エラー: HANDOVER.md が見つかりません: ${handoverPath}`);
    process.exit(1);
  }

  // レポートパスの抽出
  const reportPaths = extractReportPaths(handoverPath, projectRoot);

  if (reportPaths.length === 0) {
    console.log('HANDOVER.md に記載されているレポートが見つかりませんでした。');
    process.exit(0);
  }

  console.log(`HANDOVER.md から ${reportPaths.length} 件のレポートを検出しました。`);

  // --dry-run の場合は表示のみ
  if (options.dryRun) {
    console.log('\n削除対象のレポート:');
    reportPaths.forEach((p, i) => {
      console.log(`  ${i + 1}. ${path.relative(projectRoot, p)}`);
    });
    console.log(`\n（--dry-run のため、実際には削除しません）`);
    process.exit(0);
  }

  // 確認プロンプト（--force でスキップ）
  let shouldDelete = options.force;
  if (!shouldDelete) {
    shouldDelete = await confirmDeletion(reportPaths);
  }

  if (!shouldDelete) {
    console.log('削除をキャンセルしました。');
    process.exit(0);
  }

  // 削除を実行
  let deletedCount = 0;
  let errorCount = 0;

  for (const reportPath of reportPaths) {
    try {
      fs.unlinkSync(reportPath);
      console.log(`削除: ${path.relative(projectRoot, reportPath)}`);
      deletedCount++;
    } catch (error) {
      console.error(`エラー: ${path.relative(projectRoot, reportPath)} の削除に失敗しました: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n完了: ${deletedCount} 件削除、${errorCount} 件エラー`);
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});
