# Performance Baseline Report

**Date**: 2026-01-28T04:55:56.323Z
**Environment**: Local Dev (Puppeteer)
**Branch**: feature/perf-baseline

## 1. Load Time (Initial Page Load)
| Metric | Value (ms) |
| :--- | :--- |
| Average | **377** |
| Min | 132 |
| Max | 841 |

*Samples: 841, 157, 132*

## 2. Paste Performance (Large Text)
| Char Count | Duration (ms) | Speed (chars/ms) |
| :--- | :--- | :--- |
| 1,000 | 506 | 2 |
| 5,000 | 506 | 10 |
| 10,000 | 506 | 20 |
| 50,000 | 508 | 99 |
| 100,000 | 504 | 199 |

## 3. Analysis
- **Load Time**: < 1000ms is good. Current: 377ms.
- **Editor Limit**: 50k chars should allow smooth typing. Check 50k result.
