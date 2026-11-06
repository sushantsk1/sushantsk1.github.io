# Sushant Kulkarni — Portfolio

A static portfolio hosted with GitHub Pages at https://sushantkulkarni.me.

## Local preview

Run `node scripts/preview.cjs`, then open http://127.0.0.1:4173.
There are no build dependencies. Edit `index.html`, `style.css`, and `script.js` directly.

## Assets and content

- `profile.png` is the original portrait. The page serves responsive JPEG versions.
- From the repository root, run `Get-Content scripts/optimize-assets.ps1 -Raw | Invoke-Expression` in PowerShell to regenerate the portrait sizes and social preview.
- Résumé links download the PDF included in this repository.
- Project details and outcomes are based on the existing portfolio content. Update them alongside the résumé.
- The contact form prepares an email draft in the visitor's email app and preserves their input. Sending happens in that app.
- The quick questions panel is a static FAQ.

## Recruiter playground

The recruiter section accepts pasted job descriptions or local PDF, DOCX, TXT, and MD files (5 MB maximum). PDF and Word text readers load on demand from `vendor/`; extraction happens in the browser. Scanned PDFs need OCR and are not supported. PDFs are limited to 50 pages, extracted text to 60,000 characters, and expanded DOCX contents to 25 MB.

The prominently labeled **demo score** is random from 86–99%, changes on each successful run, and is not an ATS assessment. Shared skill keywords and related project links come from the supplied text and the portfolio's listed skills. No text or documents are persisted or submitted to a server.

Run `node --test tests/recruiter-match.test.mjs` to check the score rules, keyword boundaries, input limits, and actual PDF/Word text extraction. PDF.js may log warnings about optional canvas bindings in Node; the text reader does not render documents or need a canvas.

## Publishing

Commit and push the source files to the branch configured for GitHub Pages. The repository's existing `CNAME` preserves the custom domain.
