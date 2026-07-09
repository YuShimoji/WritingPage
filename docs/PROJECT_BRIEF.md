# Project Brief

## Project name

Zen Writer / WritingPage

## Purpose

Zen Writer is a local-first writing studio for Japanese long-form fiction and visual-novel-adjacent drafting. It keeps the daily authoring path focused on writing, structure, save/resume trust, preview, and export without requiring a server.

## Primary users

- Japanese writers who want a lightweight, offline-capable manuscript editor.
- Operators reviewing the app's writing workflow, local evidence, and tactile UI behavior before broader release decisions.
- Developers extending authoring surfaces through narrow, reversible slices.

## User language

Japanese is the primary user language. Developer and verification notes may be bilingual when existing repo docs already use English labels or command names.

## Core value

The app should make the authoring loop feel trustworthy: launch, write, structure, save, resume, preview, and export should be observable with local evidence.

## Product surface

- Web app served locally by `npm run dev`.
- Built `dist/` preview from `npm run build`.
- Electron packaged/local launch routes for real-window review.
- Review and evidence surfaces such as Design Cockpit, UI capture, full showcase capture, and docs/verification notes.

## Non-goals

- Cloud/account/public sharing is not part of the current accepted scope.
- EPUB/DOCX output remains out of scope unless explicitly reopened.
- Broad architecture migration, publication, billing, and brand direction changes require a separate user decision.

## Current product hypothesis

The current bottleneck is not more feature breadth. The latest accepted lane is Documents Selection-to-Writing Focus Return + Marker Width Evidence, and the next product decision should come from the operator tactile review or from a separately selected narrow BUILD candidate.

## Re-kickstart rule

This project prioritizes material evidence over report volume. BUILD turns must produce implementation, validation, screenshot, generated artifact, or reproducible probe evidence.
