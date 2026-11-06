// The demo number is deliberately independent of the keyword analysis.
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_TEXT_LENGTH = 60000;
export const MAX_PDF_PAGES = 50;

const profileSkills = [
  { name: 'Python', aliases: ['python'], href: '#skills' },
  { name: 'TypeScript', aliases: ['typescript', 'type script'], href: '#skills' },
  { name: 'JavaScript', aliases: ['javascript', 'java script'], href: '#skills' },
  { name: 'Node.js', aliases: ['node.js', 'nodejs', 'node js'], href: '#agent-onboarding' },
  { name: 'NestJS', aliases: ['nestjs', 'nest.js', 'nest js'], href: '#agent-onboarding' },
  { name: 'FastAPI', aliases: ['fastapi', 'fast api'], href: '#interview-agent' },
  { name: 'Express', aliases: ['express.js', 'expressjs', 'express'], href: '#skills' },
  { name: 'React', aliases: ['react', 'react.js', 'reactjs'], href: '#agent-onboarding' },
  { name: 'Next.js', aliases: ['next.js', 'nextjs', 'next js'], href: '#skills' },
  { name: 'PostgreSQL', aliases: ['postgresql', 'postgres'], href: '#agent-onboarding' },
  { name: 'Prisma', aliases: ['prisma'], href: '#agent-onboarding' },
  { name: 'Redis', aliases: ['redis'], href: '#agent-onboarding' },
  { name: 'Kafka', aliases: ['kafka'], href: '#agent-onboarding' },
  { name: 'WebSockets', aliases: ['websocket', 'websockets', 'web sockets'], href: '#interview-agent' },
  { name: 'AWS', aliases: ['aws', 'amazon web services'], href: '#skills' },
  { name: 'Azure', aliases: ['azure'], href: '#skills' },
  { name: 'Docker', aliases: ['docker'], href: '#skills' },
  { name: 'LLMs', aliases: ['llm', 'llms', 'large language model', 'large language models'], href: '#scribing-ai' },
  { name: 'RAG', aliases: ['rag', 'retrieval augmented generation', 'retrieval-augmented generation'], href: '#skills' },
  { name: 'AI agents', aliases: ['ai agent', 'ai agents', 'agentic', 'autonomous agents'], href: '#interview-agent' },
  { name: 'LangChain', aliases: ['langchain'], href: '#skills' },
  { name: 'LangGraph', aliases: ['langgraph'], href: '#skills' },
  { name: 'Pinecone', aliases: ['pinecone'], href: '#skills' },
  { name: 'ChromaDB', aliases: ['chromadb', 'chroma db'], href: '#skills' },
  { name: 'Whisper', aliases: ['whisper'], href: '#scribing-ai' },
  { name: 'LoRA', aliases: ['lora', 'low-rank adaptation', 'low rank adaptation'], href: '#scribing-ai' },
  { name: 'Fine-tuning', aliases: ['fine-tuning', 'fine tuning', 'finetuning'], href: '#scribing-ai' },
  { name: 'LangSmith', aliases: ['langsmith'], href: '#skills' },
  { name: 'Pydantic', aliases: ['pydantic'], href: '#skills' },
  { name: 'REST APIs', aliases: ['rest api', 'rest apis', 'restful'], href: '#skills' },
  { name: 'Microservices', aliases: ['microservice', 'microservices'], href: '#skills' },
  { name: 'MCP', aliases: ['mcp', 'model context protocol'], href: '#skills' }
];

function escapeRegex(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export function findSharedSkills(text) {
  const normalized = text.normalize('NFKC').toLowerCase();
  return profileSkills.filter(skill => skill.aliases.some(alias => {
    const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}_])${escapeRegex(alias)}(?=$|[^\\p{L}\\p{N}_])`, 'u');
    return pattern.test(normalized);
  })).map(({ name, href }) => ({ name, href }));
}

export function randomDemoScore(previous, random = Math.random) {
  const excludePrevious = Number.isInteger(previous) && previous >= 86 && previous <= 99;
  let score = 86 + Math.floor(random() * (excludePrevious ? 13 : 14));
  if (excludePrevious && score >= previous) score++;
  return score;
}

export function validateText(text) {
  if (text.length > MAX_TEXT_LENGTH) throw new Error('Please keep the text under 60,000 characters.');
  if (text.trim().length < 20 || text.trim().split(/\s+/).length < 3) {
    throw new Error('Add at least 20 characters and 3 words, then try again.');
  }
  if (text.includes('\u0000')) throw new Error('This file does not look like readable text. Try a PDF, DOCX, or UTF-8 text file.');
  return text.trim();
}

export function validateFile(file) {
  if (!file || !file.size) throw new Error('That file is empty. Choose a document with selectable text.');
  if (file.size > MAX_FILE_BYTES) throw new Error('Please choose a file smaller than 5 MB.');
  const extension = file.name.toLowerCase().split('.').at(-1);
  if (!['pdf', 'docx', 'txt', 'md'].includes(extension)) {
    throw new Error('Choose a PDF, DOCX, TXT, or MD file. For older .doc files or images, paste the text instead.');
  }
  return extension;
}

// Reject large expanded DOCX archives before handing them to the text parser.
export function validateDocxArchive(buffer) {
  const bytes = new Uint8Array(buffer);
  const data = new DataView(buffer);
  const invalid = () => new Error('This DOCX could not be read. Try exporting it again or paste the text.');
  if (bytes.length < 22 || data.getUint32(0, true) !== 0x04034b50) throw invalid();
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
    if (data.getUint32(offset, true) === 0x06054b50 && offset + 22 + data.getUint16(offset + 20, true) === bytes.length) { end = offset; break; }
  }
  if (end < 0) throw invalid();
  const count = data.getUint16(end + 10, true);
  let offset = data.getUint32(end + 16, true);
  let expanded = 0;
  let hasDocument = false;
  if (count > 3000 || data.getUint16(end + 4, true) || data.getUint16(end + 6, true)) throw invalid();
  for (let index = 0; index < count; index++) {
    if (offset + 46 > end || data.getUint32(offset, true) !== 0x02014b50) throw invalid();
    expanded += data.getUint32(offset + 24, true);
    if (expanded > 25 * 1024 * 1024) throw new Error('This Word document expands to more than 25 MB. Export a smaller file or paste the text.');
    const nameLength = data.getUint16(offset + 28, true);
    const extraLength = data.getUint16(offset + 30, true);
    const commentLength = data.getUint16(offset + 32, true);
    if (offset + 46 + nameLength + extraLength + commentLength > end) throw invalid();
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if (name === 'word/document.xml') hasDocument = true;
    offset += 46 + nameLength + extraLength + commentLength;
  }
  if (!hasDocument) throw invalid();
}

export function relatedProjects(skills) {
  const found = new Set(skills.map(skill => skill.name));
  return [
    { title: 'Scribing AI', href: '#scribing-ai', skills: ['Whisper', 'LoRA', 'Fine-tuning', 'LLMs'] },
    { title: 'Interview Agent', href: '#interview-agent', skills: ['AI agents', 'WebSockets', 'FastAPI'] },
    { title: 'Agent Onboarding System', href: '#agent-onboarding', skills: ['NestJS', 'React', 'PostgreSQL', 'Prisma', 'Redis', 'Kafka'] }
  ].filter(project => project.skills.some(skill => found.has(skill))).map(({ title, href }) => ({ title, href }));
}
