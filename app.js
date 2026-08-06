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

// Gamification State
let currentXP = parseInt(localStorage.getItem('aiTeacherXP') || '0', 10);
let currentLevel = parseInt(localStorage.getItem('aiTeacherLevel') || '1', 10);
const levelXPThresholds = [0, 100, 250, 500, 800, 1200, 1800, 2500];

function getXPForNextLevel() {
  return levelXPThresholds[currentLevel] || (currentLevel * 1000);
}

function updateGamificationUI() {
  const levelBadge = document.getElementById('levelBadge');
  const xpBarFill = document.getElementById('xpBarFill');
  const xpText = document.getElementById('xpText');

  if (levelBadge) levelBadge.textContent = `LVL ${currentLevel}`;

  const xpNeeded = getXPForNextLevel();
  const prevLevelXP = levelXPThresholds[currentLevel - 1] || 0;
  const currentLevelProgress = currentXP - prevLevelXP;
  const requiredLevelProgress = xpNeeded - prevLevelXP;

  const percentage = Math.min(100, Math.max(0, (currentLevelProgress / requiredLevelProgress) * 100));

  if (xpBarFill) xpBarFill.style.width = `${percentage}%`;
  if (xpText) xpText.textContent = `${currentXP} / ${xpNeeded} XP`;
}

function showFloatingText(text, isLevelUp = false) {
  const el = document.createElement('div');
  el.className = isLevelUp ? 'floating-text level-up-text' : 'floating-text';
  el.textContent = text;

  if (isLevelUp) {
    el.style.left = '50%';
    el.style.top = '40%';
  } else {
    // Randomize position slightly around the center
    const rx = 30 + Math.random() * 40;
    const ry = 40 + Math.random() * 30;
    el.style.left = `${rx}%`;
    el.style.top = `${ry}%`;
  }

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function addXP(amount) {
  currentXP += amount;
  showFloatingText(`+${amount} XP`);

  let xpNeeded = getXPForNextLevel();
  while (currentXP >= xpNeeded) {
    currentLevel++;
    setTimeout(() => {
      showFloatingText('LEVEL UP!', true);
    }, 500);
    xpNeeded = getXPForNextLevel();
  }

  localStorage.setItem('aiTeacherXP', currentXP);
  localStorage.setItem('aiTeacherLevel', currentLevel);

  updateGamificationUI();
}

// Initialize UI
updateGamificationUI();


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
    await whiteboard.runBlocks(data.blocks, (block) => {
      let xpGain = 10;
      if (block.type === 'heading') xpGain = 20;
      if (block.type === 'diagram') xpGain = 35;
      if (block.type === 'equation') xpGain = 25;
      addXP(xpGain);
    });
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
    await whiteboard.runBlocks(data.blocks, (block) => {
      let xpGain = 10;
      if (block.type === 'heading') xpGain = 20;
      if (block.type === 'diagram') xpGain = 35;
      if (block.type === 'equation') xpGain = 25;
      addXP(xpGain);
    });
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
  setBusy(false);
  setTimeout(() => topicInput.focus(), 50); // Force browser to focus the input after un-hiding
}

function setBusy(isBusy) {
  askInput.disabled = isBusy;
  askButton.disabled = isBusy;
  topicInput.disabled = isBusy;
}

function setStatus(msg) {
  statusLine.textContent = msg;
}
