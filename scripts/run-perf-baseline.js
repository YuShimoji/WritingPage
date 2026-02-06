const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const REPORT_DIR = path.resolve(__dirname, '../docs/reports');
const BASE_URL = 'http://localhost:8080';

async function ensureDir(dir) {
    await fs.promises.mkdir(dir, { recursive: true });
}

async function runPerformanceTests() {
    console.log('Starting Performance Tests...');
    await ensureDir(REPORT_DIR);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    const metrics = {
        loadTime: [],
        pastePerformance: []
    };

    try {
        // --- 1. Load Time Test (3 iterations) ---
        console.log('\n=== Load Time Test ===');
        for (let i = 0; i < 3; i++) {
            console.log(`Iteration ${i + 1}/3...`);
            const start = Date.now();
            await page.goto(BASE_URL, { waitUntil: 'load' }); // wait for window.onload

            // Get precise navigation timing
            const timing = await page.evaluate(() => {
                const nav = performance.getEntriesByType('navigation')[0];
                return nav ? nav.loadEventEnd - nav.startTime : 0;
            });

            const loadTime = timing || (Date.now() - start); // Fallback
            console.log(`  Load Time: ${Math.round(loadTime)}ms`);
            metrics.loadTime.push(loadTime);

            // Wait a bit before next reload
            await new Promise(r => setTimeout(r, 1000));
        }

        const avgLoad = metrics.loadTime.reduce((a, b) => a + b, 0) / metrics.loadTime.length;
        console.log(`> Average Load Time: ${Math.round(avgLoad)}ms`);


        // --- 2. Paste Performance Test (Existing Script) ---
        console.log('\n=== Paste Performance Test ===');
        // Ensure the editor is ready
        await page.waitForSelector('#editor');

        // Inject the performance test script
        const perfScriptPath = path.resolve(__dirname, 'perf-paste-test.js');
        const perfScriptContent = fs.readFileSync(perfScriptPath, 'utf8');
        await page.evaluate((content) => {
            const script = document.createElement('script');
            script.textContent = content;
            document.head.appendChild(script);
        }, perfScriptContent);

        // Run the test function
        console.log('Running window.ZWPerfTest.runAllTests()...');
        const pasteResults = await page.evaluate(async () => {
            if (window.ZWPerfTest && window.ZWPerfTest.runAllTests) {
                return await window.ZWPerfTest.runAllTests();
            } else {
                return 'ZWPerfTest failed to load even after injection';
            }
        });

        if (Array.isArray(pasteResults)) {
            metrics.pastePerformance = pasteResults;
            console.table(pasteResults);
        } else {
            console.error('Paste Test Failed:', pasteResults);
        }

    } catch (e) {
        console.error('Error during testing:', e);
        process.exit(1);
    } finally {
        await browser.close();
    }

    // --- Generate Report ---
    generateReport(metrics);
}

function generateReport(metrics) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `PERFORMANCE_BASELINE_${date}.md`;
    const reportPath = path.join(REPORT_DIR, filename);

    const avgLoad = Math.round(metrics.loadTime.reduce((a, b) => a + b, 0) / metrics.loadTime.length);
    const minLoad = Math.round(Math.min(...metrics.loadTime));
    const maxLoad = Math.round(Math.max(...metrics.loadTime));

    let markdown = `# Performance Baseline Report\n\n`;
    markdown += `**Date**: ${new Date().toISOString()}\n`;
    markdown += `**Environment**: Local Dev (Puppeteer)\n`;
    markdown += `**Branch**: feature/perf-baseline\n\n`;

    markdown += `## 1. Load Time (Initial Page Load)\n`;
    markdown += `| Metric | Value (ms) |\n| :--- | :--- |\n`;
    markdown += `| Average | **${avgLoad}** |\n`;
    markdown += `| Min | ${minLoad} |\n`;
    markdown += `| Max | ${maxLoad} |\n\n`;
    markdown += `*Samples: ${metrics.loadTime.map(t => Math.round(t)).join(', ')}*\n\n`;

    markdown += `## 2. Paste Performance (Large Text)\n`;
    markdown += `| Char Count | Duration (ms) | Speed (chars/ms) |\n| :--- | :--- | :--- |\n`;

    if (metrics.pastePerformance.length > 0) {
        metrics.pastePerformance.forEach(r => {
            markdown += `| ${r.charCount.toLocaleString()} | ${r.durationMs} | ${r.charsPerMs} |\n`;
        });
    } else {
        markdown += `| - | Error | - |\n`;
    }

    markdown += `\n## 3. Analysis\n`;
    markdown += `- **Load Time**: < 1000ms is good. Current: ${avgLoad}ms.\n`;
    markdown += `- **Editor Limit**: 50k chars should allow smooth typing. Check 50k result.\n`;

    fs.writeFileSync(reportPath, markdown);
    console.log(`\nReport generated: ${reportPath}`);
}

runPerformanceTests();
