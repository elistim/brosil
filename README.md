# 🦊 Brosil — трекер привычек

Простой веб-сервис с настраиваемыми счётчиками для отслеживания:
- 🚭 дней без курения
- 🍺 дней без алкоголя
- 📓 ведения дневника
- 📚 учёбы и любых других пользовательских привычек

---

## 🚀 Возможности

- 📅 Календарь с отметками по дням
- 🔢 Счётчик непрерывной серии (streak)
- 🎯 Выбор любого дня и редактирование
- ➕ Добавление и удаление собственных счётчиков
- 💾 Сохранение данных в `data.json`
- 🌐 Доступ с любых устройств
- 🦊 Интерактивный лисёнок

---

## 🏗 Стек

- FastAPI
- HTML / CSS / JS
- nginx + uvicorn

---

## 📂 Структура

brosil/  
├── app.py  
├── data.json  
├── static/  
│   ├── index.html  
│   ├── style.css  
│   ├── script.js  
│   └── foxy/  
├── deploy/  
│   └── brosil.service  

---

## ⚙️ Установка

```bash
sudo apt update
sudo apt install python3-venv python3-pip -y

cd /opt/brosil
python3 -m venv venv
source venv/bin/activate

pip install fastapi uvicorn
```

## ▶️ Ручной запуск

```bash
cd /opt/brosil
source venv/bin/activate
uvicorn app:app --host 127.0.0.1 --port 8090
```

---

## 💾 Данные

data.json:

{
  "2026-04-29": {
    "smoke": true,
    "drink": true,
    "diary": false
  }
}

---

## 🦊 Поведение лиса

- бегает за курсором
- убегает
- засыпает у края
- просыпается по клику

## 🔐 Приватный доступ через nginx Basic Auth

Весь рабочий сервис закрыт паролем на уровне nginx: главная страница, календарь и все API-маршруты. Публичная демонстрация с вымышленными данными находится отдельно по адресу `https://elitepuma.ru/demo/brosil/` и не подключена к базе Brosil.

### 1. Установка утилиты

```bash
sudo apt install apache2-utils -y
sudo htpasswd -c /etc/nginx/.brosil_auth elisey
```

## Конфигурация nginx

```bash
sudo cp deploy/nginx-brosil /etc/nginx/sites-available/brosil
sudo nginx -t
sudo systemctl reload nginx
```
## Запуск как сервис
```bash
sudo cp deploy/brosil.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable brosil
sudo systemctl start brosil
```

Проверка
```bash
systemctl status brosil
```

# Недостатки
- Рассчитан на одного пользователя
- Просмотр открыт всем, у кого есть ссылка
- Нет переключателя отключения лиса
- Данные хранятся в JSON-файле, без полноценной БД
