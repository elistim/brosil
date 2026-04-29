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
