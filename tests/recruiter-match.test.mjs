import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { findSharedSkills, randomDemoScore, relatedProjects, validateText, validateFile, validateDocxArchive, MAX_FILE_BYTES, MAX_TEXT_LENGTH } from '../match-core.mjs';
import { readDocument } from '../document-reader.mjs';

test('demo scores stay above 85, below 100, and differ from the previous result', () => {
  for (const previous of [undefined, ...Array.from({ length: 14 }, (_, i) => i + 86)]) {
    for (const random of [0, .01, .25, .5, .75, .999999]) {
      const score = randomDemoScore(previous, () => random);
      assert(score >= 86 && score <= 99 && Number.isInteger(score));
      assert.notEqual(score, previous);
    }
  }
});

test('keyword analysis recognizes aliases, casing and punctuation, without substring matches', () => {
  const names = findSharedSkills('Use PYTHON, Node.js, fast api, Amazon Web Services, and retrieval-augmented generation. Python again.').map(skill => skill.name);
  assert.deepEqual(names, ['Python', 'Node.js', 'FastAPI', 'AWS', 'RAG']);
  assert.deepEqual(findSharedSkills('A baker working with sourdough, flour, and bread.'), []);
  assert.deepEqual(findSharedSkills('ragtag awsomeness reactive postgresqlish pythonic'), []);
});

test('related work only links projects supported by shared skills', () => {
  assert.deepEqual(relatedProjects(findSharedSkills('NestJS and React')), [{ title: 'Agent Onboarding System', href: '#agent-onboarding' }]);
  assert.deepEqual(relatedProjects([]), []);
});

test('input validation rejects blank, binary, unsupported and oversized inputs', () => {
  assert.throws(() => validateText('  '), /20 characters/);
  assert.throws(() => validateText('x'.repeat(30)), /3 words/);
  assert.throws(() => validateText('The role needs Python\u0000 in production'), /readable text/);
  assert.throws(() => validateText('x'.repeat(MAX_TEXT_LENGTH + 1)), /60,000/);
  assert.throws(() => validateFile({ name: 'old.doc', size: 500 }), /PDF, DOCX/);
  assert.throws(() => validateFile({ name: 'large.pdf', size: MAX_FILE_BYTES + 1 }), /5 MB/);
  assert.throws(() => validateFile({ name: 'empty.pdf', size: 0 }), /empty/);
  assert.equal(validateFile({ name: 'ROLE.DOCX', size: 500 }), 'docx');
});

test('UTF-8 text imports preserve punctuation and reject unreadable or oversized content', async () => {
  const signal = new AbortController().signal;
  assert.equal(await readDocument(new File(['Python & FastAPI\r\nBuild APIs with AWS.'], 'role.txt'), signal), 'Python & FastAPI\nBuild APIs with AWS.');
  await assert.rejects(readDocument(new File([new Uint8Array([0xff, 0xfe])], 'role.txt'), signal), /UTF-8/);
  await assert.rejects(readDocument(new File(['x'.repeat(MAX_TEXT_LENGTH + 1)], 'role.md'), signal), /60,000/);
  await assert.rejects(readDocument(new File(['\n \t'], 'empty.txt'), signal), /No selectable text/);
  const aborted = new AbortController(); aborted.abort();
  await assert.rejects(readDocument(new File(['Python APIs on AWS.'], 'role.txt'), aborted.signal), { name: 'AbortError' });
});

// Generate a minimal, valid Word archive to exercise the actual bundled parser.
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function makeDocx() {
  const entries = [
    ['[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ['_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ['word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Build Python and FastAPI services on AWS.</w:t></w:r></w:p></w:body></w:document>']
  ];
  const files = [], directory = [];
  let offset = 0;
  for (const [name, value] of entries) {
    const filename = Buffer.from(name), data = Buffer.from(value), crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4);
    header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(filename.length, 26);
    files.push(header, filename, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(filename.length, 28); central.writeUInt32LE(offset, 42);
    directory.push(central, filename); offset += header.length + filename.length + data.length;
  }
  const central = Buffer.concat(directory), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(central.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...files, central, end]);
}
function asArrayBuffer(bytes) { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); }

test('DOCX bounds check accepts valid Word data and rejects corrupt or expanded archives', () => {
  const valid = makeDocx();
  validateDocxArchive(asArrayBuffer(valid));
  assert.throws(() => validateDocxArchive(new ArrayBuffer(10)), /could not be read/);
  const oversized = Buffer.from(valid);
  const centralStart = oversized.readUInt32LE(oversized.length - 6);
  oversized.writeUInt32LE(26 * 1024 * 1024, centralStart + 24);
  assert.throws(() => validateDocxArchive(asArrayBuffer(oversized)), /25 MB/);
});

test('the real bundled Word reader extracts text from a DOCX', async () => {
  const require = createRequire(import.meta.url);
  const previousWindow = globalThis.window, previousDocument = globalThis.document;
  globalThis.window = { mammoth: require('../vendor/mammoth/mammoth.browser.min.js') };
  // Simulate only the browser script-load hook; extraction uses Mammoth itself.
  globalThis.document = { createElement() { return {}; }, head: { append(script) { queueMicrotask(() => script.onload()); } } };
  try {
    const text = await readDocument(new File([makeDocx()], 'role.docx'), new AbortController().signal);
    assert.equal(text, 'Build Python and FastAPI services on AWS.');
  } finally { globalThis.window = previousWindow; globalThis.document = previousDocument; }
});

test('the real bundled PDF reader extracts the repository resume', async () => {
  const bytes = await fs.readFile(new URL('../sushant%20kulkarni%20resume.pdf', import.meta.url));
  const text = await readDocument(new File([bytes], 'resume.pdf'), new AbortController().signal);
  assert(text.length > 1000);
  assert(findSharedSkills(text).some(skill => skill.name === 'Python'));
  await assert.rejects(readDocument(new File(['This is not a PDF'], 'wrong.pdf'), new AbortController().signal), /valid PDF/);
});
