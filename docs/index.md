# WritingPage Local Docs View

This page is a local browser entry point for reading, auditing, and temporary page-translation checks across the repository Markdown files.

The Markdown files themselves remain the source documents. This view does not create a permanent translation, summary, or rewritten version of those documents. Use Chrome, Edge, or a DeepL browser extension page-translation feature only as a temporary reading aid while reviewing the local site.

## Start Locally

From Windows PowerShell at the repository root:

```powershell
python -m pip install mkdocs-material
python -m mkdocs serve
```

Then open:

```text
http://127.0.0.1:8000/
```

The left navigation pane groups the existing Markdown files by practical review purpose: overview documents, specifications, runtime state, development notes, artifacts, and miscellaneous or low-confidence items.

## Translation Check

1. Start the MkDocs local server.
2. Open `http://127.0.0.1:8000/` in Chrome or Edge.
3. Use the browser or DeepL page-translation extension on the current page.
4. Treat the translated page as a temporary reading surface only; do not copy it back into the repository as a new source document.

## Navigation Maintenance

If Markdown files are added or moved, regenerate a nav candidate without changing files:

```powershell
powershell -ExecutionPolicy Bypass -File tools/generate-doc-nav.ps1
```

Review the candidate manually before copying any changes into `mkdocs.yml`, especially for files placed under `Misc`.
