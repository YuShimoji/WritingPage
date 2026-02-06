// 共有ワークフローからコピーした検証スクリプト
// ソース: shared-workflows-1/scripts/report-validator.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runCommand(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8' });
  } catch {
    return '';
  }
}

function parseGitLog(repoPath) {
  const log = runCommand('git log --oneline -10', repoPath);
  return /error|fail|exception/i.test(log);
}

function extractSection(content, header) {
  const regex = new RegExp(`## ${header}\\s*\\r?\\n([\\s\\S]*?)(?=\\n## |\\n$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

function ensureOrchestratorSections(reportContent) {
  const requiredHeaders = [
    'State',
    'Strategy',
    'Tickets',
    'Next',
    'Proposals',
    'Outlook',
    'Verification',
    'Integration Notes'
  ];
  const errors = [];
  const warnings = [];

  for (const header of requiredHeaders) {
    const section = extractSection(reportContent, header);
    if (!section) {
      errors.push(`Orchestratorレポートに必須セクション '${header}' がありません`);
    } else if (!section.replace(/[-*\s]/g, '').length) {
      warnings.push(`Orchestratorレポートの '${header}' セクションが空です`);
    }
  }

  const outlookSection = extractSection(reportContent, 'Outlook');
  if (outlookSection) {
    const hasShort = /Short-term/i.test(outlookSection);
    const hasMid = /Mid-term/i.test(outlookSection);
    const hasLong = /Long-term/i.test(outlookSection);
    if (!hasShort || !hasMid || !hasLong) {
      errors.push('Outlook セクションに Short/Mid/Long のいずれかが欠けています');
    }
  }

  const ticketsSection = extractSection(reportContent, 'Tickets');
  if (ticketsSection && !/- /.test(ticketsSection)) {
    warnings.push('Tickets セクションに箇条書きがありません（完了内容や最後の作業を記述してください）');
  }

  const verificationSection = extractSection(reportContent, 'Verification');
  if (verificationSection && !/git status|node|npm/i.test(verificationSection)) {
    warnings.push('Verification セクションにコマンド実行結果が見当たりません');
  }

  return { errors, warnings };
}

function checkFileStates(reportContent, projectRoot) {
  const changesSection = reportContent.match(/## Changes\n([\s\S]*?)(?=\n## |\n$)/);
  if (!changesSection) return { errors: [], warnings: [] };

  const errors = [];
  const warnings = [];

  const lines = changesSection[1].split('\n').filter(line => line.trim());
  for (const line of lines) {
    const match = line.match(/- \[([^\]]+)\]: (.+)/);
    if (match) {
      const file = match[1];
      const desc = match[2];
      const fullPath = path.join(projectRoot, file);
      if (!fs.existsSync(fullPath)) {
        errors.push(`変更ファイルが存在しません: ${file}`);
      }
      if (desc.includes('error') || desc.includes('fail')) {
        warnings.push(`変更記述にエラーが含まれています: ${line}`);
      }
    }
  }
  return { errors, warnings };
}

function generateSuggestions(errors, warnings) {
  const suggestions = [];
  if (errors.length) {
    suggestions.push('エラーを修正してから再報告してください。');
  }
  if (warnings.length) {
    suggestions.push('警告を考慮して報告を改善してください。');
  }
  if (errors.some(e => e.includes('完了を主張'))) {
    suggestions.push('完了主張時はエラーログを添付し、実際の状態を確認してください。');
  }
  return suggestions;
}

function extractListSection(text, key) {
  const lines = text.split(/\r?\n/);
  const result = [];
  let capturing = false;
  let baseIndent = 0;

  for (const line of lines) {
    const indent = line.match(/^\s*/)[0].length;
    const trimmed = line.trim();

    if (!capturing) {
      if (trimmed.startsWith(`${key}:`)) {
        capturing = true;
        baseIndent = indent;
      }
      continue;
    }

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (indent <= baseIndent) break;

    if (trimmed.startsWith('- ')) {
      result.push(trimmed.slice(2).trim());
    }
  }

  return result;
}

function extractStylePresets(text) {
  const lines = text.split(/\r?\n/);
  const presets = {};
  let capturing = false;
  let current = null;
  let baseIndent = 0;
  let inHeaders = false;

  for (const line of lines) {
    const indent = line.match(/^\s*/)[0].length;
    const trimmed = line.trim();

    if (!capturing) {
      if (trimmed.startsWith('style_presets:')) {
        capturing = true;
        baseIndent = indent;
      }
      continue;
    }

    if (!trimmed) continue;

    if (indent <= baseIndent && !trimmed.startsWith('-')) {
      break;
    }

    if (indent === baseIndent + 2 && trimmed.endsWith(':')) {
      current = trimmed.slice(0, -1).trim();
      presets[current] = { headers: [] };
      inHeaders = false;
      continue;
    }

    if (indent === baseIndent + 4 && trimmed.startsWith('headers:')) {
      inHeaders = true;
      continue;
    }

    if (inHeaders) {
      if (trimmed.startsWith('- ')) {
        presets[current].headers.push(trimmed.slice(2).trim());
        continue;
      } else if (!trimmed.startsWith('#')) {
        inHeaders = false;
      }
    }
  }

  return presets;
}

function loadReportConfig(configPath) {
  const text = fs.readFileSync(configPath, 'utf8');
  const config = {};

  const defaultStyleMatch = text.match(/default_style:\s*([A-Za-z0-9_]+)/);
  config.default_style = defaultStyleMatch ? defaultStyleMatch[1] : 'standard';

  const strictMatch = text.match(/strict_mode:\s*(true|false)/i);
  config.strict_mode = strictMatch ? strictMatch[1].toLowerCase() === 'true' : true;

  config.banned_phrases = extractListSection(text, 'banned_phrases');
  config.style_presets = extractStylePresets(text);

  return config;
}

function validateHandover(handoverPath) {
  const content = fs.readFileSync(handoverPath, 'utf8');
  const errors = [];
  const warnings = [];

  const timestamp = content.match(/\*\*Timestamp\*\*\s*:\s*(.+)/i);
  const actor = content.match(/\*\*Actor\*\*\s*:\s*(.+)/i);
  const type = content.match(/\*\*Type\*\*\s*:\s*(.+)/i);
  const mode = content.match(/\*\*Mode\*\*\s*:\s*(.+)/i);

  if (!timestamp) errors.push('HANDOVER.md に Timestamp がありません');
  if (!actor) errors.push('HANDOVER.md に Actor がありません');
  if (!type) errors.push('HANDOVER.md に Type がありません');
  if (!mode) errors.push('HANDOVER.md に Mode がありません');

  if (!content.includes('## リスク')) {
    warnings.push('HANDOVER.md に リスク セクションがありません');
  }
  if (!content.includes('## Proposals')) {
    warnings.push('HANDOVER.md に Proposals セクションがありません');
  }

  console.log(`Validation for ${handoverPath}:`);
  if (errors.length) console.log('Errors:', errors);
  if (warnings.length) console.log('Warnings:', warnings);
  if (errors.length === 0) {
    console.log('OK');
    return true;
  }
  return false;
}

function parseCliArgs(argv) {
  const args = argv.slice(2);
  let profile = null;
  const positional = [];

  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--profile') {
      profile = args[i + 1] || null;
      i += 1;
      continue;
    }
    positional.push(a);
  }

  const [reportPath, configPath, projectRoot] = positional;
  return { profile, reportPath, configPath, projectRoot };
}

function validateReport(reportPath, configPath, projectRoot) {
  const reportContent = fs.readFileSync(reportPath, 'utf8');
  const config = loadReportConfig(configPath);

  let warnings = [];
  let errors = [];

  // Strict mode check
  if (config.strict_mode) {
    const style = config.style_presets[config.default_style];
    if (style) {
      for (const header of style.headers) {
        if (!reportContent.includes(`## ${header}`)) {
          warnings.push(`必須ヘッダー '${header}' がありません`);
        }
      }
    }
  }

  // Banned phrases check
  for (const phrase of config.banned_phrases || []) {
    if (reportContent.includes(phrase)) {
      errors.push(`禁止フレーズ '${phrase}' が含まれています`);
    }
  }

  const typeMatch = reportContent.match(/Type\s*:\s*(.*)/i);
  const reportType = typeMatch ? typeMatch[1].trim() : '';
  if (/Orchestrator/i.test(reportType)) {
    const orchestrationChecks = ensureOrchestratorSections(reportContent);
    errors.push(...orchestrationChecks.errors);
    warnings.push(...orchestrationChecks.warnings);
  }

  // Virtual error detection with log check
  const hasErrorIndicators = /error|fail|exception/i.test(reportContent);
  const claimsCompletion = /完了しました|向上されました/i.test(reportContent);

  if (claimsCompletion && hasErrorIndicators) {
    errors.push('完了を主張しているが、エラー指標が見つかりました');
  }

  if (claimsCompletion && parseGitLog(projectRoot)) {
    errors.push('完了を主張しているが、Gitログにエラーが見つかりました');
  }

  // Git log check
  if (parseGitLog(projectRoot)) {
    warnings.push('Gitログにエラーが見つかりました。');
  }

  // File states check
  const fileChecks = checkFileStates(reportContent, projectRoot);
  errors.push(...fileChecks.errors);
  warnings.push(...fileChecks.warnings);

  console.log(`Validation for ${reportPath}:`);
  if (errors.length) {
    console.log('Errors:', errors);
  }
  if (warnings.length) {
    console.log('Warnings:', warnings);
  }
  const suggestions = generateSuggestions(errors, warnings);
  if (suggestions.length) {
    console.log('Suggestions:', suggestions);
  }
  if (errors.length === 0) {
    console.log('OK');
    return true;
  }
  return false;
}

const { profile, reportPath, configPath, projectRoot } = parseCliArgs(process.argv);

if (!reportPath) {
  console.error('Usage: node scripts/report-validator.js [--profile handover] <reportPath> <configPath> [projectRoot]');
  process.exit(1);
}

if (profile && profile.toLowerCase() === 'handover') {
  const ok = validateHandover(reportPath);
  process.exit(ok ? 0 : 1);
}

validateReport(reportPath, configPath, projectRoot || path.dirname(reportPath));
