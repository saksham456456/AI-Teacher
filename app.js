import { Whiteboard } from './whiteboard.js';

const boardViewport = document.getElementById('boardViewport');
const boardIntro = document.getElementById('boardIntro');
const topicForm = document.getElementById('topicForm');
const topicInput = document.getElementById('topicInput');
const askDock = document.getElementById('askDock');
const askForm = document.getElementById('askForm');
const askInput = document.getElementById('askInput');
const askButton = askForm.querySelector('button');
const newTopicBtn = document.getElementById('newTopicBtn');
const statusLine = document.getElementById('statusLine');

let whiteboard = null;
let interactionId = null;

topicForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const topic = topicInput.value.trim();
  if (!topic) return;
  startLesson(topic);
});

askForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const question = askInput.value.trim();
  if (!question) return;
  askInput.value = '';
  askQuestion(question);
});

newTopicBtn.addEventListener('click', resetBoard);

async function startLesson(topic) {
  boardIntro.hidden = true;
  if (!whiteboard) {
    whiteboard = new Whiteboard(boardViewport);
  } else {
    whiteboard.reset();
  }
  interactionId = null;
  askDock.hidden = true;
  newTopicBtn.hidden = true;
  setStatus('Thinking…');
  setBusy(true);

  try {
    const res = await fetch('/api/lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');

    interactionId = data.interactionId;
    askDock.hidden = false;
    newTopicBtn.hidden = false;
    setStatus('Writing on the board…');
    await whiteboard.runBlocks(data.blocks);
    setStatus('Ask a follow-up question any time.');
  } catch (err) {
    setStatus('⚠ ' + err.message);
    boardIntro.hidden = false;
  } finally {
    setBusy(false);
  }
}

async function askQuestion(question) {
  setStatus('Thinking…');
  setBusy(true);

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, interactionId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');

    interactionId = data.interactionId;
    setStatus('Writing on the board…');
    await whiteboard.runBlocks(data.blocks);
    setStatus('Ask another question any time.');
  } catch (err) {
    setStatus('⚠ ' + err.message);
  } finally {
    setBusy(false);
  }
}

function resetBoard() {
  interactionId = null;
  askDock.hidden = true;
  newTopicBtn.hidden = true;
  if (whiteboard) whiteboard.reset();
  topicInput.value = '';
  boardIntro.hidden = false;
  setStatus('');
}

function setBusy(isBusy) {
  askInput.disabled = isBusy;
  askButton.disabled = isBusy;
  topicInput.disabled = isBusy;
}

function setStatus(msg) {
  statusLine.textContent = msg;
}
