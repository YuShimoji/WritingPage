# Rich Heading Feature Closure Checklist

Date: 2026-06-22

## Feature name

Rich editing typed heading shortcut.

## Purpose

Close the current review loop for the Rich editing typed heading shortcut so
future work can refer to one checklist instead of re-asking the same IME,
shortcut, and placeholder questions.

This checklist consumes the implementation through
`75726f9 fix: polish empty rich heading placeholder`, the 2026-06-18 IME
spot-check note, the user/supervisor review intake, and the 2026-06-22
placeholder polish note. It does not introduce new implementation scope.

## Review memory line

```text
prior_review_count=1
accepted_scope=IME_and_shortcut_functional_path
resolved_scope=placeholder_caret_visual_debt_by_css_first_fix
not_accepted_scope=release_wide_visual_acceptance
next_axis=next_product_slice_or_optional_release_visual_check
repeated_general_review=false
```

## Scope checklist

| bucket | state | concrete meaning | evidence |
| --- | --- | --- | --- |
| accepted_scope | accepted | Microsoft IME candidate use and direct `#` / `##` / `###` + Space shortcut behavior were treated as functionally OK from user review. | `docs/verification/2026-06-18/rich-heading-ime-spotcheck.md`; user/supervisor review intake |
| resolved_scope | resolved | Empty-heading placeholder / caret visual debt was fixed by CSS-first polish without changing shortcut semantics. | `docs/verification/2026-06-22/rich-heading-placeholder-polish.md`; `css/style.css`; `e2e/wysiwyg-editor.spec.js` |
| optional_scope | optional, not blocking | A later human visual feel pass before a release may check the final screen impression. | Optional USER_OPEN_ONLY / USER_RUN_REQUIRED release check, only if release readiness needs it |
| not_accepted_scope | not accepted as done | Release-wide visual acceptance across unrelated editor surfaces was not decided by this slice. | This checklist is limited to Rich heading shortcut closure |

## Acceptance ladder state

| ladder step | state | what is known now | next rule |
| --- | --- | --- | --- |
| candidate_seen | complete | The heading shortcut was selected as a narrow Rich editing affordance, not a general Markdown shortcut engine. | Do not reopen for broad Markdown shortcut work without a new product decision. |
| positive_signal | complete | `#`, `##`, or `###` followed by Space converts to H1/H2/H3, negative cases stay literal, Undo restores the typed marker, and synthetic composition is gated. | Use existing focused E2E before asking for review. |
| user_functional_signal | complete | User review accepted the Microsoft IME / direct shortcut functional path. | Do not ask the user to re-check this same axis unless behavior changes or regression evidence appears. |
| resolved_UX_debt | complete | Placeholder / caret flicker debt was resolved by CSS-first polish and focused E2E. | Reopen only with a new reproduction or changed placeholder implementation. |
| optional_release_visual_check | optional | Release-wide visual acceptance is useful but not required to close this feature slice. | If needed later, ask only for release visual feel, not IME / shortcut / placeholder basics again. |

Current classification: functionality accepted, placeholder UX debt resolved,
optional release visual check not blocking.

## Verification matrix

| axis | status | proof | notes for future agents |
| --- | --- | --- | --- |
| Branch / remote state | pass at closure | `main` synced with `origin/main`; `HEAD...origin/main = 0 0` before this docs slice | Re-check before future edits. |
| H1/H2/H3 positive conversion | pass | Focused Playwright heading shortcut grep | Covered by `e2e/wysiwyg-editor.spec.js`. |
| Negative cases | pass | Focused Playwright heading shortcut grep | `#hashtag`, inline marker, `####`, paste remain literal. |
| Undo | pass | Focused Playwright heading shortcut grep | One Undo restores the typed marker. |
| Synthetic IME guard | pass | Focused Playwright heading shortcut grep | Synthetic composition is not native IME, but it covers implementation gating. |
| Native Microsoft IME functional path | accepted by user review | Review intake after `rich-heading-ime-spotcheck` | Do not re-ask without changed behavior or a new regression report. |
| Placeholder / caret visual debt | resolved | CSS-first polish and focused placeholder E2E | Placeholder is out of text flow and not generated while editor focus is active. |
| Release-wide visual acceptance | optional / not blocking | Not part of this closure | Ask later only if release readiness needs a broader visual pass. |

## Known non-targets

- No implementation change in this checklist slice.
- No changes to `js/editor-wysiwyg.js`.
- No change to `#` / `##` / `###` shortcut semantics.
- No general Markdown shortcut engine.
- No IME composition guard redesign.
- No storage, import/export, Electron/package, dependency, DB/auth/API, GitHub
  Issue / PR cleanup, embed security, or AGENTS changes.
- No release-wide visual acceptance claim.

## Next nonredundant axis

The next nonredundant axis is either:

- `next_product_slice`: return to the selected product/docs slice after the
  Rich heading closure, such as stale spec reconciliation.
- `optional_release_visual_check`: if release readiness needs it, check final
  screen feel for the Rich heading path as a release visual pass.

Neither axis should ask the user to re-review the same IME / shortcut /
placeholder basics.

## When to reopen

Reopen this feature only when at least one of these is true:

- A new regression report says `#`, `##`, or `###` followed by Space no longer
  converts as expected.
- Native IME behavior changes after code changes, browser changes, or platform
  changes.
- Undo no longer restores the typed marker after conversion.
- Placeholder or caret behavior regresses after CSS/editor changes.
- A future product decision deliberately expands Rich editing shortcuts beyond
  the current narrow trigger.

## When not to ask the user again

Do not emit another Review Card for the same IME / shortcut / placeholder axis
when:

- no relevant implementation changed;
- focused E2E still passes;
- the request is only a status refresh or handoff;
- the next work is a different product slice;
- the only open question is optional release-wide visual acceptance.

If a later Review Card is genuinely needed, it must state:

- target;
- axis;
- prior_review_count;
- prior_signal_summary;
- what_changed;
- what_this_review_decides;
- not_asking;
- input_mode;
- completion_signal.

The `not_asking` field must explicitly say that IME / direct shortcut /
placeholder basics are not being re-requested unless that is the changed axis.

## Artifact access

- artifact_id: `rich-heading-feature-closure-checklist`
- repo_relative_path:
  `docs/verification/2026-06-22/rich-heading-feature-closure-checklist.md`
- user_action: 実行不要
