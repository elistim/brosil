const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const dayNames = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
let data = {};
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = dateKey();

function dateKey(date = new Date()) {
  return date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
}

async function loadData() {
  const r = await fetch('/api/data');
  data = await r.json();
  render();
}

async function saveDay(date, smoke, drink, diary=false) {
  await fetch('/api/day', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({date, smoke, drink, diary})
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
    type === 'diary' || old.diary || false
  );
}

async function saveBoth() {
  const old = data[selectedDate] || {};
  await saveDay(selectedDate, true, true, old.diary || false);
}

async function resetToday() {
  await saveDay(selectedDate, false, false, false);
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
    if (item.smoke) html += '<div class="ok">✓ не курил</div>';
    if (item.drink) html += '<div class="ok">✓ не пил</div>';
    if (item.diary) html += '<div class="ok">✓ дневник</div>';
    
    div.innerHTML = html;
    calendar.appendChild(div);
  }
}

loadData();

const fox = document.getElementById('fox');

const foxFrames = [];
for (let i = 0; i <= 14; i++) {
  const num = String(i).padStart(2, '0');
  foxFrames.push(`/foxy/animation/run/foxy-run_${num}.png`);
}

let foxFrame = 0;
let foxX = 100;
let foxY = 100;
let targetX = 400;
let targetY = 300;
let foxSpeed = 3.0;
let foxDirection = 1;

let foxMode = 'chase'; // chase | flee
let chaseLockUntil = 0;

function preloadFoxFrames() {
  foxFrames.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

function animateFoxFrames() {
  foxFrame = (foxFrame + 1) % foxFrames.length;
  fox.src = foxFrames[foxFrame];
}

document.addEventListener('mousemove', (e) => {
  targetX = e.clientX - 36;
  targetY = e.clientY - 36;
});

fox.addEventListener('click', (e) => {
  e.stopPropagation();
  foxMode = 'chase';
  chaseLockUntil = Date.now() + 1200;
});

function moveFox() {
  const dx = targetX - foxX;
  const dy = targetY - foxY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (foxMode === 'chase' && dist < 45 && Date.now() > chaseLockUntil) {
    foxMode = 'flee';
  }

  let moveX = 0;
  let moveY = 0;

  if (dist > 1) {
    if (foxMode === 'chase') {
      moveX = dx / dist;
      moveY = dy / dist;
    } else {
      moveX = -dx / dist;
      moveY = -dy / dist;
    }
  }

  foxX += moveX * foxSpeed;
  foxY += moveY * foxSpeed;

  foxX = Math.max(0, Math.min(window.innerWidth - 72, foxX));
  foxY = Math.max(0, Math.min(window.innerHeight - 72, foxY));

  if (moveX > 0) foxDirection = 1;
  if (moveX < 0) foxDirection = -1;

  fox.style.left = `${foxX}px`;
  fox.style.top = `${foxY}px`;
  fox.style.transform = `scaleX(${foxDirection})`;

  requestAnimationFrame(moveFox);
}

preloadFoxFrames();
setInterval(animateFoxFrames, 70);
moveFox();
