# OpenSpec Change Proposal: Refactor ZWGadgets for Modularity

## Summary
Refactor ZWGadgets class to improve maintainability by separating concerns: extract rendering queue, settings management, and loadout handling into dedicated modules.

## Problem Statement
- ZWGadgets.js is a large monolithic file (3000+ lines) handling multiple responsibilities
- Rendering logic, settings persistence, and loadout management are tightly coupled
- Hard to test individual components and extend functionality
- _renderLast method mixes rendering with icon replacement logic

## Goals
- Extract rendering queue into separate module
- Separate settings management from core gadget logic
- Modularize loadout handling for better reusability
- Maintain backward compatibility with existing API

## Success Criteria
- Core ZWGadgets class reduced in size and focused on gadget registration
- Rendering queue handles all DOM updates consistently
- Settings module provides unified access to preferences
- Loadout module manages gadget groupings independently
- All existing functionality preserved without breaking changes
