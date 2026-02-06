const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function listFilesSafe(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

function parseKeyLine(content, key) {
  const patterns = [
    new RegExp(`^\\*\\*${key}\\*\\*\\s*:\\s*(.*)$`, 'im'),
    new RegExp(`^-\\s*\\*\\*${key}\\*\\*\\s*:\\s*(.*)$`, 'im'),
    new RegExp(`^${key}\\s*:\\s*(.*)$`, 'im'),
    new RegExp(`^-\\s*${key}\\s*:\\s*(.*)$`, 'im'),
  ];
  for (const re of patterns) {
    const m = content.match(re);
    if (m) return m[1].trim();
  }
  return '';
}

function validateReportConsistency(reportPath, anomalies, warnings) {
  const content = readFileSafe(reportPath);
  if (!content) return;

  const timestamp = parseKeyLine(content, 'Timestamp');
  const actor = parseKeyLine(content, 'Actor');
  const type = parseKeyLine(content, 'Type');
  const duration = parseKeyLine(content, 'Duration');
  const changes = parseKeyLine(content, 'Changes');

  if (!timestamp) warnings.push(`レポート ${reportPath} に Timestamp がありません`);
  if (!actor) warnings.push(`レポート ${reportPath} に Actor がありません`);
  if (!type) warnings.push(`レポート ${reportPath} に Type がありません`);
  if (!duration) warnings.push(`レポート ${reportPath} に Duration がありません`);
  if (!changes) warnings.push(`レポート ${reportPath} に Changes がありません`);

  const hasRisk = content.includes('## Risk');
  const hasProposals = content.includes('## Proposals');
  if (!hasRisk) warnings.push(`レポート ${reportPath} に Risk セクションがありません`);
  if (!hasProposals) warnings.push(`レポート ${reportPath} に Proposals セクションがありません`);
}

function validateHandoverConsistency(handoverPath, anomalies, warnings) {
  const handoverContent = readFileSafe(handoverPath);
  if (!handoverContent) return;

  const timestamp = parseKeyLine(handoverContent, 'Timestamp');
  const actor = parseKeyLine(handoverContent, 'Actor');
  const type = parseKeyLine(handoverContent, 'Type');
  const mode = parseKeyLine(handoverContent, 'Mode');

  if (!timestamp) warnings.push(`HANDOVER.md に Timestamp がありません`);
  if (!actor) warnings.push(`HANDOVER.md に Actor がありません`);
  if (!type) warnings.push(`HANDOVER.md に Type がありません`);
  if (!mode) warnings.push(`HANDOVER.md に Mode がありません`);

  const hasRisk = handoverContent.includes('## リスク');
  const hasProposals = handoverContent.includes('## Proposals');
  if (!hasRisk) warnings.push(`HANDOVER.md に リスク セクションがありません`);
  if (!hasProposals) warnings.push(`HANDOVER.md に Proposals セクションがありません`);
}

function checkWorkerStatus(aiContextPath, anomalies, warnings) {
  const contextContent = readFileSafe(aiContextPath);
  if (!contextContent) {
    warnings.push('AI_CONTEXT.md が存在しません。Workerステータスを確認できません。');
    return;
  }
  const asyncMode = parseKeyLine(contextContent, 'async_mode');
  const isAsync = asyncMode && asyncMode.toLowerCase() === 'true';
  const workerLine = parseKeyLine(contextContent, 'Worker完了ステータス');
  if (!workerLine) {
    warnings.push('AI_CONTEXT.md に Worker完了ステータス が記載されていません。');
    return;
  }
  const workers = workerLine.split(',').map(w => w.trim());
  for (const worker of workers) {
    const parts = worker.split(',');
    const [nameStatus, priority, timeoutStr] = parts.map(p => p.trim());
    const [name, status] = nameStatus.split(':').map(s => s.trim());
    const prio = priority ? priority.split(':')[1].trim() : 'critical';
    const timeout = timeoutStr ? parseInt(timeoutStr.split(':')[1].trim()) || 30 : 30;
    if (status === 'error') {
      anomalies.push(`Worker ${name} がエラー状態です。手動介入が必要です。`);
    } else if (!isAsync && prio === 'critical' && status !== 'completed') {
      anomalies.push(`Critical Worker ${name} が未完了です (ステータス: ${status})。次のステップを中断してください。`);
    } else if (status === 'pending' && timeout < 0) { // 仮定: タイムアウト計算は別処理
      anomalies.push(`Worker ${name} がタイムアウトしました。エラー扱いにします。`);
    }
  }
}

function main() {
  const args = new Set(process.argv.slice(2));
  const noFail = args.has('--no-fail');

  const root = process.cwd();
  const docsDir = path.join(root, 'docs');
  const tasksDir = path.join(docsDir, 'tasks');
  const inboxDir = path.join(docsDir, 'inbox');
  const handoverPath = path.join(docsDir, 'HANDOVER.md');
  const aiContextPath = path.join(root, 'AI_CONTEXT.md');

  const anomalies = [];
  const warnings = [];
  const handover = readFileSafe(handoverPath) || '';

  const taskFiles = listFilesSafe(tasksDir).filter((f) => /^TASK_.*\.md$/i.test(f));
  const tasks = new Map();
  const orchestratorReports = [];

  for (const file of taskFiles) {
    const full = path.join(tasksDir, file);
    const content = readFileSafe(full);
    if (!content) continue;
    const status = (parseKeyLine(content, 'Status') || '').toUpperCase();
    const report = parseKeyLine(content, 'Report');
    tasks.set(file, { file, full, status, report });

    if (status === 'DONE' || status === 'BLOCKED') {
      if (!report) {
        anomalies.push(`${status} チケットに Report がありません: docs/tasks/${file}`);
      } else {
        const reportPath = path.isAbsolute(report) ? report : path.join(root, report);
        if (!fs.existsSync(reportPath)) {
          anomalies.push(`チケットの Report 参照先が存在しません: docs/tasks/${file} -> ${report}`);
        }
      }
    }

    if (orchestratorReports.length > 0) {
      const latestOrch = orchestratorReports[orchestratorReports.length - 1].file;
      if (!handover.includes(latestOrch)) {
        warnings.push(`HANDOVER.md に最新 Orchestrator レポート ${latestOrch} の記載がありません`);
      }
      if (!/## Outlook/i.test(handover)) {
        warnings.push('HANDOVER.md に Outlook セクションがありません（Short/Mid/Long を追加してください）');
      }
    }
  }

  const reportFiles = listFilesSafe(inboxDir).filter((f) => /^REPORT_.*\.md$/i.test(f));

  for (const file of reportFiles) {
    const full = path.join(inboxDir, file);
    const content = readFileSafe(full);
    if (!content) continue;

    const isOrchestratorReport =
      /^REPORT_ORCH_/i.test(file) || /Type\s*:\s*Orchestrator/i.test(content);

    if (isOrchestratorReport) {
      orchestratorReports.push({ file, full, content });

      validateReportConsistency(full, anomalies, warnings);

      const validatorPath = path.join(__dirname, 'report-validator.js');
      const configPath = path.join(root, 'REPORT_CONFIG.yml');
      if (fs.existsSync(validatorPath) && fs.existsSync(configPath)) {
        try {
          const result = child_process.execSync(
            `node "${validatorPath}" "${full}" "${configPath}" "${root}"`,
            { encoding: 'utf8' }
          );
          if (result.includes('Errors:')) {
            anomalies.push(`Orchestratorレポート検証エラー: ${file}`);
          } else if (result.includes('Warnings:')) {
            warnings.push(`Orchestratorレポート検証警告: ${file}`);
          }
        } catch (e) {
          warnings.push(`Orchestratorレポート検証実行失敗: ${file}`);
        }
      }

      continue;
    }

    const ticket = parseKeyLine(content, 'Ticket');
    const ticketMatch = ticket.match(/TASK_[^\s/\\]+\.md/i);
    if (!ticketMatch) {
      anomalies.push(`REPORT の Ticket が不正/不明です: docs/inbox/${file} (Ticket: ${ticket || '<empty>'})`);
      continue;
    }

    const ticketFile = ticketMatch[0];
    const task = tasks.get(ticketFile);
    if (!task) {
      anomalies.push(`REPORT に対応するチケットが見つかりません: docs/inbox/${file} -> docs/tasks/${ticketFile}`);
      continue;
    }

    if (task.status !== 'DONE') {
      anomalies.push(`REPORT はあるがチケットが DONE ではありません: docs/tasks/${ticketFile} (Status: ${task.status || '<empty>'})`);
    }

    if (task.report && task.report !== `docs/inbox/${file}`) {
      warnings.push(`チケットの Report が REPORT ファイル名と一致しません: docs/tasks/${ticketFile} (Report: ${task.report}, Actual: docs/inbox/${file})`);
    }

    validateReportConsistency(full, anomalies, warnings);

    // Run report validator
    const validatorPath = path.join(__dirname, 'report-validator.js');
    const configPath = path.join(root, 'REPORT_CONFIG.yml');
    if (fs.existsSync(validatorPath) && fs.existsSync(configPath)) {
      try {
        const result = require('child_process').execSync(`node "${validatorPath}" "${full}" "${configPath}" "${root}"`, { encoding: 'utf8' });
        if (result.includes('Errors:')) {
          anomalies.push(`レポート検証エラー: ${file}`);
        } else if (result.includes('Warnings:')) {
          warnings.push(`レポート検証警告: ${file}`);
        }
      } catch (e) {
        warnings.push(`レポート検証実行失敗: ${file}`);
      }
    }
  }

  validateHandoverConsistency(handoverPath, anomalies, warnings);
  if (handover) {
    const activeTasksSection = handover.split(/\n## Active Tasks\n/i)[1] || '';
    const activeLines = activeTasksSection.split(/\n## /)[0].trim();
    const looksPlaceholder = /\|\s*-\s*\|\s*-\s*\|\s*-\s*\|\s*-\s*\|/.test(activeLines);

    const hasOpen = Array.from(tasks.values()).some((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'BLOCKED');
    if (hasOpen && looksPlaceholder) {
      warnings.push('HANDOVER.md の Active Tasks がプレースホルダのままです（未完了チケットあり）。');
    }

    if (!/GitHubAutoApprove\s*:\s*(true|false)/i.test(handover)) {
      warnings.push('HANDOVER.md に GitHubAutoApprove: true/false が見つかりません。');
    }
  }

  // Worker完了チェック追加
  checkWorkerStatus(aiContextPath, anomalies, warnings);

  console.log('Orchestrator Audit Results');
  console.log(`- tasks: ${taskFiles.length}`);
  console.log(`- reports: ${reportFiles.length}`);

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    for (const w of warnings) console.log(`- ${w}`);
  }

  if (anomalies.length > 0) {
    console.log('\nAnomalies:');
    for (const a of anomalies) console.log(`- ${a}`);

    if (!noFail) {
      process.exitCode = 2;
      return;
    }
  }

  console.log('\nOK');
}

main();
