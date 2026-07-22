const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const dayNames = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

let data = {};
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = null;

function dateKey(date = new Date()) {
  return date.getFullYear() + '-' +
    String(date.getMonth()+1).padStart(2,'0') + '-' +
    String(date.getDate()).padStart(2,'0');
}

async function loadData() {
  const r = await fetch('/api/data');
  data = await r.json();
  render();
}

async function saveDay(date, smoke, drink, diary=false, finance=false) {
  await fetch('/api/day', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({date, smoke, drink, diary, finance})
  });
  await loadData();
}

async function saveToday(type) {
  const key = selectedDate;
  const old = data[key] || {};

  await saveDay(
    key,
    type === 'smoke' || old.smoke || false,
    type === 'drink' || old.drink || false,
    type === 'diary' || old.diary || false,
    type === 'finance' || old.finance || false
  );
}

async function saveBoth() {
  const old = data[selectedDate] || {};
  await saveDay(selectedDate, true, true, old.diary || false, old.finance || false);
}

async function resetToday() {
  if (!selectedDate) return;
  await saveDay(selectedDate, false, false, false, false);
  selectedDate = null;
  render();
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

function render() {
  document.getElementById('smokeCount').textContent = countDays('smoke');
  document.getElementById('drinkCount').textContent = countDays('drink');
  document.getElementById('diaryCount').textContent = countDays('diary');
  document.getElementById('financeCount').textContent = countDays('finance');
  document.getElementById('smokeRecord').textContent = recordDays('smoke');
  document.getElementById('drinkRecord').textContent = recordDays('drink');
  document.getElementById('diaryRecord').textContent = recordDays('diary');
  document.getElementById('financeRecord').textContent = recordDays('finance');
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

    let html = '<b>' + day + '</b>';

    if (item.smoke) {
      html += `<div class="ok">${isMobile ? '🚭' : '✓ не курил'}</div>`;
    }

    if (item.drink) {
      html += `<div class="ok">${isMobile ? '🍺×' : '✓ не пил'}</div>`;
    }

    if (item.diary) {
      html += `<div class="ok">${isMobile ? '📓' : '✓ дневник'}</div>`;
    }

    if (item.finance) {
      html += `<div class="ok">${isMobile ? '₽' : '✓ финансы'}</div>`;
    }

    div.innerHTML = html;
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
  document.getElementById('editSmoke').checked = Boolean(item.smoke);
  document.getElementById('editDrink').checked = Boolean(item.drink);
  document.getElementById('editDiary').checked = Boolean(item.diary);
  document.getElementById('editFinance').checked = Boolean(item.finance);
  editor.hidden = false;
}

document.getElementById('dayEditor').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!selectedDate) return;

  await saveDay(
    selectedDate,
    document.getElementById('editSmoke').checked,
    document.getElementById('editDrink').checked,
    document.getElementById('editDiary').checked,
    document.getElementById('editFinance').checked
  );
  selectedDate = null;
  render();
});

document.getElementById('editorCancel').addEventListener('click', () => {
  selectedDate = null;
  render();
});

document.getElementById('editorReset').addEventListener('click', resetToday);

loadData();

const fox = document.getElementById('fox');
const foxChair = document.getElementById('foxChair');

const foxFrames = [];
for (let i = 0; i <= 14; i++) {
  const num = String(i).padStart(2, '0');
  foxFrames.push(`/foxy/animation/run/foxy-run_${num}.png`);
}

const foxIdleFrames = [];
for (let i = 0; i <= 14; i++) {
  const num = String(i).padStart(2, '0');
  foxIdleFrames.push(`/foxy/animation/idle/foxy-idle_${num}.png`);
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
