# OpenSpec Change Proposal: Add Lucide Icons

## Summary
Introduce Lucide icon set to replace text emojis in UI components, improving visual consistency and accessibility. Implement minimal subset for core UI elements.

## Why
Using emojis as icons leads to inconsistent appearance across different operating systems and browsers. A dedicated icon set like Lucide provides a premium, consistent look and better accessibility support.

## Problem
- Current UI uses text emojis (e.g., 📂, 👁️) which are inconsistent across platforms and may not convey meaning clearly.
- No scalable icon system exists for future UI extensions.
- Accessibility concerns with emoji reliance for icons.

## Goal
- Replace key UI emojis with Lucide icons.
- Establish icon loading and usage patterns.
- Maintain lightweight bundle size with minimal subset.

## What Changes
- Integration of Lucide Icons (via CDN).
- Replacement of emojis with `<i data-lucide="...">` in toolbar and gadgets.
- Implementation of `window.lucide.createIcons()` call in `app.js`.
- CSS styling for icon consistency.
