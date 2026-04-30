# 🦊 Brosil — трекер привычек

Простой веб-сервис для отслеживания:
- 🚭 дней без курения
- 🍺 дней без алкоголя
- 📓 ведения дневника

---

## 🚀 Возможности

- 📅 Календарь с отметками по дням
- 🔢 Счётчик непрерывной серии (streak)
- 🎯 Выбор любого дня и редактирование
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

## 🔐 Защита редактирования через nginx Basic Auth

Просмотр календаря открыт всем, а изменение данных закрыто паролем на уровне nginx.

### 1. Установка утилиты

```bash
sudo apt install apache2-utils -y
sudo htpasswd -c /etc/nginx/.brosil_auth elisey
```

## Config nginx

```bash
sudo nano /etc/nginx/sites-available/brosil
```

```
server {
    server_name brosil.elitepuma.ru;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/day {
        auth_basic "Edit calendar";
        auth_basic_user_file /etc/nginx/.brosil_auth;

        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    listen 80;
}
```

```bash
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
