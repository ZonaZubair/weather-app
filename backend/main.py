from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

# Load environment variables from .env file
# This keeps our API key secure and out of the code
load_dotenv()

app = FastAPI()

# Allow React frontend (running on port 5173) to talk to this backend
# Without this, browser blocks cross-origin requests by default
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLite database file will be created automatically in the backend folder
# We use SQLite because it needs zero configuration — perfect for this project
DATABASE_URL = "sqlite:///./weather.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# This defines what a saved weather query looks like in the database
class WeatherRecord(Base):
    __tablename__ = "weather_records"
    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    notes = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

# Creates the table if it doesn't exist yet
Base.metadata.create_all(bind=engine)

# Pydantic model validates incoming data before it touches the database
class RecordInput(BaseModel):
    city: str
    start_date: str
    end_date: str
    notes: str = ""

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5"

# ── Weather API routes ──────────────────────────────────────────────────────

@app.get("/weather/current")
async def get_current_weather(city: str):
    # Fetch live weather data from OpenWeatherMap for the searched city
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/weather",
            params={"q": city, "appid": WEATHER_API_KEY, "units": "metric"}
        )
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="City not found")
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Weather API error")
    return response.json()

@app.get("/weather/forecast")
async def get_forecast(city: str):
    # 5-day forecast returned in 3-hour intervals — we display one reading per day
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/forecast",
            params={"q": city, "appid": WEATHER_API_KEY, "units": "metric"}
        )
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="City not found")
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Weather API error")
    return response.json()

@app.get("/weather/by-coords")
async def get_weather_by_coords(lat: float, lon: float):
    # Used when user clicks "Use my location" — browser gives us GPS coordinates
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/weather",
            params={"lat": lat, "lon": lon, "appid": WEATHER_API_KEY, "units": "metric"}
        )
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Weather API error")
    return response.json()

# ── CRUD routes ─────────────────────────────────────────────────────────────

@app.post("/records")
def create_record(data: RecordInput):
    # Validate that end date is not before start date
    if data.start_date > data.end_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")
    db = SessionLocal()
    record = WeatherRecord(**data.dict())
    db.add(record)
    db.commit()
    db.refresh(record)
    db.close()
    return record

@app.get("/records")
def get_records():
    # Return all saved records, newest first
    db = SessionLocal()
    records = db.query(WeatherRecord).order_by(WeatherRecord.created_at.desc()).all()
    db.close()
    return records

@app.put("/records/{record_id}")
def update_record(record_id: int, data: RecordInput):
    if data.start_date > data.end_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")
    db = SessionLocal()
    record = db.query(WeatherRecord).filter(WeatherRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    record.city = data.city
    record.start_date = data.start_date
    record.end_date = data.end_date
    record.notes = data.notes
    db.commit()
    db.refresh(record)
    db.close()
    return record

@app.delete("/records/{record_id}")
def delete_record(record_id: int):
    db = SessionLocal()
    record = db.query(WeatherRecord).filter(WeatherRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    db.close()
from fastapi.responses import StreamingResponse
import csv
import io
import json

@app.get("/records/export/csv")
def export_csv():
    # Export all saved records as a downloadable CSV file
    db = SessionLocal()
    records = db.query(WeatherRecord).all()
    db.close()
    output = io.StringIO()
    writer = csv.writer(output)
    # Write header row first
    writer.writerow(["ID", "City", "Start Date", "End Date", "Notes", "Created At"])
    for r in records:
        writer.writerow([r.id, r.city, r.start_date, r.end_date, r.notes, r.created_at])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=weather_records.csv"}
    )

@app.get("/records/export/json")
def export_json():
    # Export all saved records as a downloadable JSON file
    db = SessionLocal()
    records = db.query(WeatherRecord).all()
    db.close()
    data = [{"id": r.id, "city": r.city, "start_date": r.start_date, "end_date": r.end_date, "notes": r.notes, "created_at": str(r.created_at)} for r in records]
    return StreamingResponse(
        io.BytesIO(json.dumps(data, indent=2).encode()),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=weather_records.json"}
    )
    return {"message": "Record deleted"}