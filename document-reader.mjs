import { validateFile, validateDocxArchive, MAX_TEXT_LENGTH, MAX_PDF_PAGES } from './match-core.mjs';

let pdfParser;
let docxParser;
async function loadPdfParser() {
  if (!pdfParser) {
    pdfParser = import('./vendor/pdfjs/pdf.min.mjs').then(parser => {
      parser.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
      return parser;
    }).catch(error => { pdfParser = null; throw error; });
  }
  return pdfParser;
}
async function loadDocxParser() {
  if (!docxParser) {
    docxParser = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('./vendor/mammoth/mammoth.browser.min.js', import.meta.url).href;
      script.onload = () => window.mammoth ? resolve(window.mammoth) : reject(new Error('Word reader unavailable. Please paste the text instead.'));
      script.onerror = () => { script.remove(); reject(new Error('Word reader could not load. Please paste the text instead.')); };
      document.head.append(script);
    }).catch(error => { docxParser = null; throw error; });
  }
  return docxParser;
}

export async function readDocument(file, signal, onProgress = () => {}) {
  const extension = validateFile(file);
  signal?.throwIfAborted();
  let text;
  if (extension === 'txt' || extension === 'md') {
    const buffer = await file.arrayBuffer();
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
    catch { throw new Error('Please save this text file as UTF-8, or paste its contents.'); }
  } else if (extension === 'docx') {
    const buffer = await file.arrayBuffer();
    signal?.throwIfAborted();
    validateDocxArchive(buffer);
    const parser = await loadDocxParser();
    signal?.throwIfAborted();
    const result = await parser.extractRawText({ arrayBuffer: buffer }, { externalFileAccess: false });
    text = result.value;
  } else {
    const parser = await loadPdfParser();
    signal?.throwIfAborted();
    const data = new Uint8Array(await file.arrayBuffer());
    signal?.throwIfAborted();
    if (!new TextDecoder().decode(data.subarray(0, 1024)).includes('%PDF-')) throw new Error('This file does not appear to be a valid PDF. Try exporting it again.');
    const task = parser.getDocument({ data, isEvalSupported: false, disableFontFace: true, useSystemFonts: true, useWasm: false, stopAtErrors: true });
    const cancel = () => { void task.destroy().catch(() => {}); };
    signal?.addEventListener('abort', cancel, { once: true });
    try {
      const pdf = await task.promise;
      if (pdf.numPages > MAX_PDF_PAGES) throw new Error('Please use a PDF of 50 pages or fewer, or paste the relevant text.');
      const pages = [];
      let length = 0;
      for (let index = 1; index <= pdf.numPages; index++) {
        signal?.throwIfAborted();
        onProgress(`Reading PDF page ${index} of ${pdf.numPages}…`);
        const page = await pdf.getPage(index);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '')).join('');
        length += pageText.length;
        if (length > MAX_TEXT_LENGTH) throw new Error('This document contains more than 60,000 characters. Paste the relevant section instead.');
        pages.push(pageText);
        page.cleanup();
      }
      text = pages.join('\n\n');
    } catch (error) {
      if (error.name === 'PasswordException') throw new Error('This PDF is password protected. Use an unlocked copy or paste the text.');
      throw error;
    } finally {
      signal?.removeEventListener('abort', cancel);
      await task.destroy();
    }
  }
  signal?.throwIfAborted();
  text = text.replace(/\r\n?/g, '\n').trim();
  if (!text) throw new Error('No selectable text was found. Scanned PDFs and images need OCR; please paste the text instead.');
  if (text.length > MAX_TEXT_LENGTH) throw new Error('This document contains more than 60,000 characters. Paste the relevant section instead.');
  if (text.includes('\u0000')) throw new Error('This file does not contain readable text. Please paste its contents instead.');
  return text;
}
