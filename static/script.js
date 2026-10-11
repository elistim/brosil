const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const dayNames = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

let data = {};
let trackers = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = null;

function dateKey(date = new Date()) {
  return date.getFullYear() + '-' +
    String(date.getMonth()+1).padStart(2,'0') + '-' +
    String(date.getDate()).padStart(2,'0');
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let message = 'Не удалось выполнить действие';
    try {
      const body = await response.json();
      if (body.detail) message = body.detail;
    } catch (_) {
      // Сервер может вернуть пустой или не-JSON ответ.
    }
    if (response.status === 401) message = 'Нужна авторизация для изменения счётчиков';
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function loadData() {
  [data, trackers] = await Promise.all([
    apiRequest('/api/data'),
    apiRequest('/api/trackers')
  ]);
  render();
  renderTrackerManager();
}

async function saveDay(date, values) {
  await apiRequest('/api/day', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({date, values})
  });
}

async function resetToday() {
  if (!selectedDate) return;
  const values = Object.fromEntries(trackers.map(tracker => [tracker.id, false]));
  await saveDay(selectedDate, values);
  selectedDate = null;
  await loadData();
}

function countDays(type) {
  let count = 0;
  const today = new Date();
  for (let i=0; i<3650; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const item = data[dateKey(d)];
    if (item && item[type]) count++;
    else break;
  }
  return count;
}

function recordDays(type) {
  const days = Object.keys(data)
    .filter(key => data[key] && data[key][type])
    .sort();

  let record = 0;
  let current = 0;
  let previous = null;

  days.forEach(key => {
    const date = new Date(key + 'T00:00:00');

    if (previous) {
      const diffDays = Math.round((date - previous) / 86400000);
      current = diffDays === 1 ? current + 1 : 1;
    } else {
      current = 1;
    }

    if (current > record) record = current;
    previous = date;
  });

  return record;
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  render();
}

function renderCards() {
  const cards = document.getElementById('trackerCards');
  cards.innerHTML = '';

  if (!trackers.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-trackers';
    empty.textContent = 'Пока нет счётчиков. Нажмите «Настроить», чтобы добавить первый.';
    cards.appendChild(empty);
    return;
  }

  trackers.forEach(tracker => {
    const card = document.createElement('div');
    card.className = 'card';

    const number = document.createElement('div');
    number.className = 'number';
    number.textContent = countDays(tracker.id);

    const label = document.createElement('div');
    label.className = 'card-label';
    label.textContent = tracker.cardLabel || `дней: ${tracker.name}`;

    const record = document.createElement('div');
    record.className = 'record';
    record.textContent = `рекорд: ${recordDays(tracker.id)}`;

    card.append(number, label, record);
    cards.appendChild(card);
  });
}

function render() {
  renderCards();
  document.getElementById('monthTitle').textContent = monthNames[currentMonth] + ' ' + currentYear;

  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';

  dayNames.forEach(name => {
    const div = document.createElement('div');
    div.className = 'day-name';
    div.textContent = name;
    calendar.appendChild(div);
  });

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  let offset = firstDay.getDay() - 1;
  if (offset < 0) offset = 6;

  for (let i=0; i<offset; i++) {
    const div = document.createElement('div');
    div.className = 'day empty';
    calendar.appendChild(div);
  }

  const isMobile = window.innerWidth <= 900;

  for (let day=1; day<=lastDay.getDate(); day++) {
    const d = new Date(currentYear, currentMonth, day);
    const key = dateKey(d);
    const item = data[key] || {};

    const div = document.createElement('div');
    div.className = 'day';
    div.onclick = () => {
      selectedDate = key;
      render();
    };

    if (key === dateKey()) div.classList.add('today');
    if (key === selectedDate) div.classList.add('selected');

    const number = document.createElement('b');
    number.textContent = day;
    div.appendChild(number);

    trackers.forEach(tracker => {
      if (!item[tracker.id]) return;
      const mark = document.createElement('div');
      mark.className = 'ok';
      mark.textContent = isMobile
        ? (tracker.icon || '✓')
        : `✓ ${tracker.shortLabel || tracker.name}`;
      div.appendChild(mark);
    });

    calendar.appendChild(div);
  }

  renderDayEditor();
}

function renderDayEditor() {
  const editor = document.getElementById('dayEditor');
  if (!selectedDate) {
    editor.hidden = true;
    return;
  }

  const item = data[selectedDate] || {};
  const date = new Date(selectedDate + 'T00:00:00');
  document.getElementById('editorTitle').textContent = date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const checks = document.getElementById('trackerChecks');
  checks.innerHTML = '';
  if (!trackers.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-trackers';
    empty.textContent = 'Сначала добавьте хотя бы один счётчик.';
    checks.appendChild(empty);
  }

  trackers.forEach(tracker => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    const text = document.createElement('span');

    input.type = 'checkbox';
    input.dataset.trackerId = tracker.id;
    input.checked = Boolean(item[tracker.id]);
    text.textContent = tracker.name;

    label.append(input, text);
    checks.appendChild(label);
  });
  editor.hidden = false;
}

document.getElementById('dayEditor').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!selectedDate) return;

  const values = {};
  document.querySelectorAll('#trackerChecks input[data-tracker-id]').forEach(input => {
    values[input.dataset.trackerId] = input.checked;
  });

  try {
    await saveDay(selectedDate, values);
    selectedDate = null;
    await loadData();
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('editorCancel').addEventListener('click', () => {
  selectedDate = null;
  render();
});

document.getElementById('editorReset').addEventListener('click', resetToday);

const trackerManager = document.getElementById('trackerManager');
const trackerManagerToggle = document.getElementById('trackerManagerToggle');
const trackerMessage = document.getElementById('trackerMessage');

function setTrackerMessage(message = '', isError = false) {
  trackerMessage.textContent = message;
  trackerMessage.classList.toggle('error', isError);
}

function renderTrackerManager() {
  const list = document.getElementById('trackerList');
  list.innerHTML = '';

  trackers.forEach(tracker => {
    const row = document.createElement('div');
    row.className = 'tracker-list-item';

    const name = document.createElement('span');
    name.textContent = tracker.name;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'danger-link';
    remove.textContent = 'Удалить';
    remove.addEventListener('click', async () => {
      const confirmed = confirm(`Удалить счётчик «${tracker.name}» и всю его историю?`);
      if (!confirmed) return;

      remove.disabled = true;
      setTrackerMessage('Удаляю…');
      try {
        await apiRequest(`/api/manage/trackers/${encodeURIComponent(tracker.id)}`, {
          method: 'DELETE'
        });
        setTrackerMessage(`Счётчик «${tracker.name}» удалён`);
        await loadData();
      } catch (error) {
        setTrackerMessage(error.message, true);
        remove.disabled = false;
      }
    });

    row.append(name, remove);
    list.appendChild(row);
  });
}

trackerManagerToggle.addEventListener('click', () => {
  trackerManager.hidden = !trackerManager.hidden;
  trackerManagerToggle.textContent = trackerManager.hidden ? 'Настроить' : 'Закрыть';
  if (!trackerManager.hidden) document.getElementById('trackerName').focus();
});

document.getElementById('trackerForm').addEventListener('submit', async event => {
  event.preventDefault();
  const input = document.getElementById('trackerName');
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  const name = input.value.trim();
  if (!name) return;

  submit.disabled = true;
  setTrackerMessage('Добавляю…');
  try {
    await apiRequest('/api/manage/trackers', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name})
    });
    input.value = '';
    setTrackerMessage(`Счётчик «${name}» добавлен`);
    await loadData();
  } catch (error) {
    setTrackerMessage(error.message, true);
  } finally {
    submit.disabled = false;
  }
});

loadData().catch(error => {
  setTrackerMessage(error.message, true);
  console.error(error);
});

const fox = document.getElementById('fox');
const foxChair = document.getElementById('foxChair');

const foxFrames = [];
for (let i = 0; i <= 14; i++) {
  const num = String(i).padStart(2, '0');
  foxFrames.push(`/foxy/animation/run/foxy-run_${num}.webp`);
}

const foxIdleFrames = [];
for (let i = 0; i <= 14; i++) {
  const num = String(i).padStart(2, '0');
  foxIdleFrames.push(`/foxy/animation/idle/foxy-idle_${num}.webp`);
}

let foxFrame = 0;
let foxX = 100;
let foxY = window.innerHeight - 128;
let targetX = 0;
let targetY = 0;
let foxSpeed = 2.8;
let foxDirection = 1;

let foxMode = 'rest';
const catchDistance = 18;
let caughtUntil = 0;

function preloadFoxFrames() {
  [...foxFrames, ...foxIdleFrames].forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

function foxSize() {
  return window.matchMedia('(max-width: 600px)').matches ? 44 : 72;
}

function updateChairTarget() {
  const chair = foxChair.getBoundingClientRect();
  const size = foxSize();
  const seatAnchor = {
    x: chair.left + chair.width * 0.52,
    y: chair.top + chair.height * 0.69,
  };
  const foxSitAnchor = {
    x: size * 0.5,
    y: size * 0.78,
  };

  targetX = seatAnchor.x - foxSitAnchor.x;
  targetY = seatAnchor.y - foxSitAnchor.y;
}

function updatePlayTarget(event) {
  targetX = event.clientX - foxSize() / 2;
  targetY = event.clientY - foxSize() / 2;
}

function startPlay(event) {
  updatePlayTarget(event);
  foxMode = 'ready';
  fox.style.opacity = '1';
}

document.addEventListener('mousemove', (event) => {
  if (foxMode === 'ready' || foxMode === 'play') {
    updatePlayTarget(event);
  }
});
document.addEventListener('touchmove', (event) => {
  if (event.touches[0] && (foxMode === 'ready' || foxMode === 'play')) {
    updatePlayTarget(event.touches[0]);
  }
}, { passive: true });

fox.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();

  startPlay(e);
});

fox.addEventListener('touchstart', (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (event.touches[0]) {
    startPlay(event.touches[0]);
  }
}, { passive: false });

let lastFoxFrameTime = 0;

function moveFox(timestamp) {
  if (!lastFoxFrameTime) lastFoxFrameTime = timestamp;

  if (foxMode === 'go-rest' || foxMode === 'rest') {
    updateChairTarget();
  }

  if (timestamp - lastFoxFrameTime > 70) {
    const frames = foxMode === 'play' || foxMode === 'go-rest' ? foxFrames : foxIdleFrames;
    foxFrame = (foxFrame + 1) % frames.length;
    fox.src = frames[foxFrame];
    lastFoxFrameTime = timestamp;
  }

  const dx = targetX - foxX;
  const dy = targetY - foxY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (foxMode === 'rest') {
    foxX = targetX;
    foxY = targetY;
    fox.style.left = `${foxX}px`;
    fox.style.top = `${foxY}px`;
    fox.style.opacity = '1';
    fox.style.transform = `scaleX(${foxDirection}) rotate(-8deg)`;
    requestAnimationFrame(moveFox);
    return;
  }

  fox.style.opacity = '1';

  if (foxMode === 'ready') {
    if (dist > catchDistance * 2) {
      foxMode = 'play';
    } else {
      fox.style.left = `${foxX}px`;
      fox.style.top = `${foxY}px`;
      fox.style.transform = `scaleX(${foxDirection})`;
      requestAnimationFrame(moveFox);
      return;
    }
  }

  if (foxMode === 'play' && dist < catchDistance) {
    foxMode = 'caught';
    caughtUntil = Date.now() + 900;
    foxFrame = 0;
    fox.src = foxIdleFrames[0];
    requestAnimationFrame(moveFox);
    return;
  }

  if (foxMode === 'caught') {
    if (Date.now() >= caughtUntil) {
      foxMode = 'go-rest';
      updateChairTarget();
    } else {
      fox.style.left = `${foxX}px`;
      fox.style.top = `${foxY}px`;
      fox.style.transform = `scaleX(${foxDirection})`;
      requestAnimationFrame(moveFox);
      return;
    }
  }

  if (foxMode === 'go-rest' && dist < 4) {
    foxMode = 'rest';
    foxFrame = 0;
    fox.src = foxIdleFrames[0];
    requestAnimationFrame(moveFox);
    return;
  }

  if (dist < 1) {
    fox.style.left = `${foxX}px`;
    fox.style.top = `${foxY}px`;
    fox.style.transform = `scaleX(${foxDirection})`;
    requestAnimationFrame(moveFox);
    return;
  }

  const step = Math.min(foxSpeed, dist);
  const moveX = dx / dist;
  const moveY = dy / dist;

  foxX += moveX * step;
  foxY += moveY * step;

  if (moveX > 0) foxDirection = 1;
  if (moveX < 0) foxDirection = -1;

  fox.style.left = `${foxX}px`;
  fox.style.top = `${foxY}px`;
  fox.style.transform = `scaleX(${foxDirection})`;

  requestAnimationFrame(moveFox);
}

preloadFoxFrames();
updateChairTarget();
requestAnimationFrame(moveFox);
