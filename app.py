import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE_DIR = Path(__file__).parent
DATA_FILE = BASE_DIR / "data.json"

app = FastAPI()

class MarkRequest(BaseModel):
    date: str
    smoke: bool
    drink: bool

def load_data():
    if not DATA_FILE.exists():
        return {}
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))

def save_data(data):
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

@app.get("/api/data")
def get_data():
    return load_data()

@app.post("/api/day")
def save_day(req: MarkRequest):
    data = load_data()
    data[req.date] = {
        "smoke": req.smoke,
        "drink": req.drink
    }
    save_data(data)
    return {"ok": True}

app.mount("/", StaticFiles(directory=BASE_DIR / "static", html=True), name="static")
