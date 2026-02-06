#!/usr/bin/env node
/**
 * Orchestrator Output Validator
 * 
 * Orchestratorのチャット出力を検証し、固定5セクション形式が守られているか確認する。
 * 
 * Usage:
 *   node scripts/orchestrator-output-validator.js <output_text>
 *   echo "## 現状\n..." | node scripts/orchestrator-output-validator.js
 * 
 * Exit codes:
 *   0: 検証成功
 *   1: 検証失敗（必須セクション欠落など）
 */

const fs = require('fs');

// 固定5セクション（順番厳守）
const REQUIRED_SECTIONS = [
  '現状',
  '次のアクション',
  'ガイド',
  'メタプロンプト再投入条件',
  '改善提案（New Feature Proposal）'
];

/**
 * セクションを抽出する
 * @param {string} content - 検証対象のテキスト
 * @param {string} header - セクション名（## の後）
 * @returns {string} セクションの内容（空文字列の場合は存在しない）
 */
function extractSection(content, header) {
  // ## セクション名 の後に続く内容を抽出（次の ## まで、または終端まで）
  const regex = new RegExp(`##\\s+${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\r?\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * ユーザー返信テンプレが含まれているか確認
 * @param {string} nextActionSection - 「次のアクション」セクションの内容
 * @returns {boolean} テンプレが含まれているか
 */
function hasUserReplyTemplate(nextActionSection) {
  // 選択肢1-3のパターンを検出
  const hasChoices = /選択肢\s*[123]|\[選択肢\s*[123]\]|1\)|2\)|3\)/i.test(nextActionSection);
  // 完了判定のパターンを検出（スラッシュをエスケープ）
  const hasCompletion = /完了\s*\/\s*未完了|完了判定|【確認】/i.test(nextActionSection);
  return hasChoices && hasCompletion;
}

/**
 * Orchestrator出力を検証する
 * @param {string} content - 検証対象のテキスト
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
function validateOrchestratorOutput(content) {
  const errors = [];
  const warnings = [];

  // 1. 必須セクションの存在確認
  const sections = {};
  for (const header of REQUIRED_SECTIONS) {
    const sectionContent = extractSection(content, header);
    sections[header] = sectionContent;
    
    if (!sectionContent) {
      errors.push(`必須セクション '${header}' が欠落しています`);
    } else if (!sectionContent.replace(/[-*\s]/g, '').length) {
      warnings.push(`セクション '${header}' が空です`);
    }
  }

  // 2. セクションの順序確認（最初に出現する順序をチェック）
  const sectionOrder = [];
  for (const header of REQUIRED_SECTIONS) {
    const index = content.indexOf(`## ${header}`);
    if (index !== -1) {
      sectionOrder.push({ header, index });
    }
  }
  
  if (sectionOrder.length > 1) {
    for (let i = 1; i < sectionOrder.length; i++) {
      if (sectionOrder[i].index < sectionOrder[i - 1].index) {
        warnings.push(`セクションの順序が正しくありません。'${sectionOrder[i].header}' が '${sectionOrder[i - 1].header}' より前に出現しています`);
      }
    }
  }

  // 3. 「次のアクション」にユーザー返信テンプレが含まれているか確認
  const nextActionContent = sections['次のアクション'];
  if (nextActionContent) {
    if (!hasUserReplyTemplate(nextActionContent)) {
      errors.push(`'次のアクション' セクションにユーザー返信テンプレ（完了判定 + 選択肢1-3）が含まれていません`);
    }
  }

  // 4. 禁止セクションの確認（作業評価/結論など）
  const forbiddenSections = [
    '作業評価',
    '完了した作業',
    '進め方の評価',
    '問題点・改善点',
    '結論'
  ];
  
  for (const forbidden of forbiddenSections) {
    if (extractSection(content, forbidden)) {
      warnings.push(`禁止セクション '${forbidden}' が含まれています。固定5セクション以外は追加しないでください`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * メイン処理
 */
function main() {
  let input = '';
  
  // 引数からファイルパスまたはテキストを取得
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // 標準入力から読み込む
    input = fs.readFileSync(0, 'utf8');
  } else {
    const arg = args[0];
    // ファイルパスとして解釈を試みる
    if (fs.existsSync(arg)) {
      input = fs.readFileSync(arg, 'utf8');
    } else {
      // テキストとして解釈
      input = arg;
    }
  }

  if (!input.trim()) {
    console.error('エラー: 検証対象のテキストが空です');
    process.exit(1);
  }

  const result = validateOrchestratorOutput(input);

  // 結果を出力
  if (result.errors.length > 0) {
    console.error('検証失敗:');
    result.errors.forEach(err => console.error(`  ERROR: ${err}`));
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach(warn => console.warn(`  WARN: ${warn}`));
  }

  if (result.valid) {
    console.log('検証成功: 固定5セクション形式が正しく守られています');
    process.exit(0);
  } else {
    console.error(`検証失敗: ${result.errors.length} 件のエラーが見つかりました`);
    process.exit(1);
  }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
  main();
}

module.exports = { validateOrchestratorOutput, extractSection, hasUserReplyTemplate };

