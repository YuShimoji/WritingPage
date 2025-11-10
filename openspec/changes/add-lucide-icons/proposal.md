# OpenSpec Change Proposal: Add Lucide Icons

## Summary
Introduce Lucide icon set to replace text emojis in UI components, improving visual consistency and accessibility. Implement minimal subset for core UI elements.

## Problem Statement
- Current UI uses text emojis (e.g., 📂, 👁️) which are inconsistent across platforms and may not convey meaning clearly.
- No scalable icon system exists for future UI extensions.
- Accessibility concerns with emoji reliance for icons.

## Goals
- Replace key UI emojis with Lucide icons.
- Establish icon loading and usage patterns.
- Maintain lightweight bundle size with minimal subset.

## Success Criteria
- Core UI buttons (overlay toggle, settings) use consistent icons.
- Icons load reliably across browsers.
- No performance impact on page load.
- Accessible icon usage with proper labels.
