import { findSharedSkills, randomDemoScore, relatedProjects, validateText, MAX_TEXT_LENGTH } from './match-core.mjs';
import { readDocument } from './document-reader.mjs';

const form = document.querySelector('#match-form');
const input = document.querySelector('#match-text');
const fileInput = document.querySelector('#match-file');
const status = document.querySelector('#match-status');
const submit = document.querySelector('#match-submit');
const result = document.querySelector('#match-result');
let previousScore;
let importController;

function updateCounter() {
  document.querySelector('#match-counter').textContent = `${input.value.length.toLocaleString('en-US')} / 60,000`;
}
function setStatus(message, error = false) {
  status.textContent = message;
  status.classList.toggle('is-error', error);
  if (!error) {
    input.removeAttribute('aria-invalid');
    fileInput.removeAttribute('aria-invalid');
  }
}
function resetResult() {
  document.querySelector('#match-details').hidden = true;
  document.querySelector('#match-empty').hidden = false;
  document.querySelector('#match-score').textContent = '—';
  document.querySelector('#match-score-ring').style.removeProperty('--demo-score');
  document.querySelector('#match-score-label').textContent = 'Demo score';
  document.querySelector('#match-result-title').textContent = "Let's find some common ground.";
  result.classList.remove('has-result');
}
function cancelImport() {
  importController?.abort();
  importController = undefined;
  submit.disabled = false;
  input.readOnly = false;
  form.removeAttribute('aria-busy');
}
function clearAll() {
  cancelImport();
  form.reset();
  updateCounter();
  resetResult();
  setStatus('Cleared. Add another role whenever you like.');
  input.focus();
}

input.addEventListener('input', () => {
  resetResult();
  setStatus('');
  updateCounter();
});
document.querySelector('#match-clear').addEventListener('click', clearAll);
document.querySelector('#match-sample').addEventListener('click', () => {
  cancelImport();
  fileInput.value = '';
  input.value = "We’re hiring an AI & Backend Engineer to build production LLM applications. You’ll use Python, FastAPI, RAG, LangChain, and PostgreSQL, deploy on AWS with Docker, and work on streaming APIs and AI agents. Experience with Redis, WebSockets, model evaluation, and LoRA fine-tuning is a plus.";
  updateCounter();
  resetResult();
  setStatus('Example role added. Select “Show my demo match” to try it.');
  input.focus();
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  cancelImport();
  const controller = new AbortController();
  importController = controller;
  submit.disabled = true;
  input.readOnly = true;
  form.setAttribute('aria-busy', 'true');
  resetResult();
  setStatus('Reading your document locally…');
  const timeout = setTimeout(() => controller.abort(new Error('Reading took too long. Try a smaller document or paste the text.')), 30000);
  let rejectOnAbort;
  const interrupted = new Promise((resolve, reject) => {
    rejectOnAbort = () => reject(controller.signal.reason);
    controller.signal.addEventListener('abort', rejectOnAbort, { once: true });
  });
  try {
    const text = await Promise.race([readDocument(file, controller.signal, message => {
      if (importController === controller) setStatus(message);
    }), interrupted]);
    if (importController !== controller) return;
    input.value = text;
    updateCounter();
    setStatus(`“${file.name}” is ready. Review the extracted text, then show your demo match.`);
    input.focus();
  } catch (error) {
    if (importController !== controller) return;
    fileInput.value = '';
    // Preserve any pasted text when a document import fails.
    const message = controller.signal.aborted ? controller.signal.reason?.message : error.message;
    setStatus(message || 'The document could not be read. Please paste its text instead.', true);
    fileInput.setAttribute('aria-invalid', 'true');
  } finally {
    clearTimeout(timeout);
    controller.signal.removeEventListener('abort', rejectOnAbort);
    if (importController === controller) cancelImport();
  }
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (importController || !form.reportValidity()) return;
  let text;
  try { text = validateText(input.value); }
  catch (error) { setStatus(error.message, true); input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
  const skills = findSharedSkills(text);
  const score = randomDemoScore(previousScore);
  previousScore = score;
  const projects = relatedProjects(skills);
  const skillList = document.querySelector('#match-keywords');
  skillList.replaceChildren(...skills.map(skill => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.textContent = skill.name;
    link.href = skill.href;
    item.append(link);
    return item;
  }));
  const projectLinks = document.querySelector('#match-project-links');
  projectLinks.replaceChildren(...projects.map(project => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.textContent = `${project.title} ↗`;
    link.href = project.href;
    item.append(link);
    return item;
  }));
  document.querySelector('#match-projects').hidden = projects.length === 0;
  document.querySelector('#match-score').textContent = `${score}%`;
  document.querySelector('#match-score-ring').style.setProperty('--demo-score', `${score}%`);
  document.querySelector('#match-score-label').textContent = 'Random demo score';
  document.querySelector('#match-result-title').textContent = 'Your demo result is ready.';
  document.querySelector('#match-summary').textContent = skills.length
    ? `${skills.length} shared keyword${skills.length === 1 ? '' : 's'} found in your text and my portfolio. Keyword mentions alone do not assess proficiency or suitability for the role.`
    : 'No shared skill keywords found. The demo score is still random; this document does not show a keyword overlap with my listed skills.';
  skillList.hidden = skills.length === 0;
  document.querySelector('#match-empty').hidden = true;
  document.querySelector('#match-details').hidden = false;
  result.classList.add('has-result');
  setStatus(`Your demo result is ready in the highlighted score card. ${skills.length} shared keywords found.`);
  document.querySelector('#match-result-title').focus({ preventScroll: true });
  if (window.matchMedia('(max-width: 900px)').matches) result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
});
submit.disabled = false;
input.maxLength = MAX_TEXT_LENGTH;
updateCounter();
