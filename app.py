import json
import threading
import uuid
from datetime import date
from pathlib import Path
from typing import Dict

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


BASE_DIR = Path(__file__).parent
DATA_FILE = BASE_DIR / "data.json"
TRACKERS_FILE = BASE_DIR / "trackers.json"
DATA_LOCK = threading.RLock()
MAX_TRACKERS = 20

DEFAULT_TRACKERS = [
    {
        "id": "smoke",
        "name": "Не курил",
        "cardLabel": "дней не курил",
        "shortLabel": "не курил",
        "icon": "🚭",
    },
    {
        "id": "drink",
        "name": "Не пил",
        "cardLabel": "дней не пил",
        "shortLabel": "не пил",
        "icon": "🍺×",
    },
    {
        "id": "diary",
        "name": "Дневник",
        "cardLabel": "дней вел дневник",
        "shortLabel": "дневник",
        "icon": "📓",
    },
    {
        "id": "finance",
        "name": "Финансы",
        "cardLabel": "дней вел финансы",
        "shortLabel": "финансы",
        "icon": "₽",
    },
]

app = FastAPI()


class MarkRequest(BaseModel):
    date: str
    values: Dict[str, bool]


class TrackerRequest(BaseModel):
    name: str


def read_json(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    temporary_file = path.with_suffix(path.suffix + ".tmp")
    temporary_file.write_text(
        json.dumps(value, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temporary_file.replace(path)


def load_data():
    return read_json(DATA_FILE, {})


def load_trackers():
    trackers = read_json(TRACKERS_FILE, DEFAULT_TRACKERS)
    return [dict(tracker) for tracker in trackers]


@app.get("/api/data")
def get_data():
    with DATA_LOCK:
        return load_data()


@app.get("/api/trackers")
def get_trackers():
    with DATA_LOCK:
        return load_trackers()


@app.post("/api/day")
def save_day(req: MarkRequest):
    try:
        date.fromisoformat(req.date)
    except ValueError:
        raise HTTPException(status_code=422, detail="Некорректная дата")

    with DATA_LOCK:
        trackers = load_trackers()
        tracker_ids = {tracker["id"] for tracker in trackers}
        data = load_data()
        data[req.date] = {
            tracker_id: bool(req.values.get(tracker_id, False))
            for tracker_id in tracker_ids
        }
        write_json(DATA_FILE, data)

    return {"ok": True}


@app.post("/api/manage/trackers", status_code=201)
def create_tracker(req: TrackerRequest):
    name = " ".join(req.name.split())
    if not name:
        raise HTTPException(status_code=422, detail="Введите название счётчика")
    if len(name) > 40:
        raise HTTPException(status_code=422, detail="Название должно быть не длиннее 40 символов")

    with DATA_LOCK:
        trackers = load_trackers()
        if len(trackers) >= MAX_TRACKERS:
            raise HTTPException(status_code=422, detail=f"Можно создать не больше {MAX_TRACKERS} счётчиков")
        if any(tracker["name"].casefold() == name.casefold() for tracker in trackers):
            raise HTTPException(status_code=409, detail="Счётчик с таким названием уже существует")

        tracker = {
            "id": f"tracker_{uuid.uuid4().hex[:12]}",
            "name": name,
            "cardLabel": f"дней: {name}",
            "shortLabel": name,
            "icon": name[0].upper(),
        }
        trackers.append(tracker)
        write_json(TRACKERS_FILE, trackers)

    return tracker


@app.delete("/api/manage/trackers/{tracker_id}")
def delete_tracker(tracker_id: str):
    with DATA_LOCK:
        trackers = load_trackers()
        tracker = next((item for item in trackers if item["id"] == tracker_id), None)
        if tracker is None:
            raise HTTPException(status_code=404, detail="Счётчик не найден")

        write_json(
            TRACKERS_FILE,
            [item for item in trackers if item["id"] != tracker_id],
        )

        data = load_data()
        for day in data.values():
            if isinstance(day, dict):
                day.pop(tracker_id, None)
        write_json(DATA_FILE, data)

    return {"ok": True}


app.mount("/", StaticFiles(directory=BASE_DIR / "static", html=True), name="static")
