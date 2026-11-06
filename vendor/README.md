# Document text readers

These files are served locally and loaded only after selecting a document. No visitor document is sent to a service.

- PDF.js / `pdfjs-dist` **6.5.438**, Mozilla, Apache-2.0. [Source and documentation](https://github.com/mozilla/pdf.js). Distributed files: `legacy/build/pdf.min.mjs`, `legacy/build/pdf.worker.min.mjs` (the compatibility build). License: `pdfjs/LICENSE`.
- Mammoth **1.13.0**, Michael Williamson, BSD-2-Clause. [Source and documentation](https://github.com/mwilliamson/mammoth.js). Distributed file: `mammoth.browser.min.js`. License: `mammoth/LICENSE`.

Downloaded from the official npm packages with lifecycle scripts disabled. To update, obtain a reviewed version from npm, replace these browser distribution files and licenses, update the versions here, and rerun the document extraction checks. No dependency installation or build is required to serve the site.
