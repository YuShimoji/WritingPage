# UI Rubric

## Non-completion conditions

- UI improvement without screenshot, readback, focused E2E, or real-window evidence is incomplete.
- Text-density review without a visual artifact is incomplete.
- Card avoidance alone is not a valid UI goal.
- Aesthetic commentary without a next reversible UI action is incomplete.

## Evaluation axes

| Axis | Pass condition |
|---|---|
| Primary action | The first user action for the active workflow is visually obvious. |
| Information hierarchy | Writing, save status, structure, preview, and review surfaces do not compete for the same attention. |
| Text density | Dense explanatory blocks do not dominate the first viewport of an operational surface. |
| Layout choice | Cards, tables, sidebars, previews, and canvases are chosen by task structure, not as decoration. |
| Preview | The user can see output or state, not only descriptions. |
| Japanese UX | Primary labels and CTAs are natural Japanese and match the real UI text. |
| Mobile evidence | Mobile layout is checked with screenshot or viewport capture when the changed surface is responsive. |

## Screenshot evidence format

| Date | Surface | Viewport | Path | Finding | Next action |
|---|---|---|---|---|---|
| 2026-07-07 | Documents selection focus return | desktop and constrained sidebar | `output/playwright/manual-verification-2026-07-06T17-22-39-216Z` | latest local evidence shows Documents `現在` marker and focus return route from the accepted slice | run fresh capture before changing marker density or focus-return behavior |

## Current UI gate

The next UI judgment is human tactile review in the real app window: empty Rich editing hint, Documents `現在` marker density, and Documents tree selection focus return. Do not mark a UI polish complete from prose alone.
