# OpenSpec Change Proposal: Refactor ZWGadgets for Modularity

## Summary
Refactor ZWGadgets class to improve maintainability by separating concerns: extract rendering queue, settings management, and loadout handling into dedicated modules.

## Why
ZWGadgets.js has grown into a large monolith, making it difficult to maintain, test, and extend. Separating these concerns follows better architectural patterns and prepares the system for future plugin support.

## Problem
- ZWGadgets.js is a large monolithic file (3000+ lines) handling multiple responsibilities
- Rendering logic, settings persistence, and loadout management are tightly coupled
- Hard to test individual components and extend functionality
- _renderLast method mixes rendering with icon replacement logic

## Goal
- Extract rendering queue into separate module
- Separate settings management from core gadget logic
- Modularize loadout handling for better reusability
- Maintain backward compatibility with existing API

## What Changes
- Modularization of gadgets-core.js into core/utils/loadouts/init/builtin.
- Extraction of rendering queue into gadgets-renderer.js (mocked/impl).
- Separation of settings management into gadgets-settings.js (mocked/impl).
- Modularization of loadout handling into gadgets-loadouts.js.
- Creation of gadgets-init.js for application-level initialization.
