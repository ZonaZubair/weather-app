# Weather App 🌤

Built by **Zona Zubair** as part of the PM Accelerator AI Bootcamp Technical Assessment.

> **PM Accelerator** — The #1 Product Management Bootcamp. We equip aspiring and experienced PMs with real-world skills, mentorship, and job placement support to accelerate their careers in tech.

---

## Live Demo

- **Frontend:** https://magical-florentine-3c46d1.netlify.app
- **Backend API:** https://weather-app-production-6b19.up.railway.app
- **API Docs:** https://weather-app-production-6b19.up.railway.app/docs

> Note: Backend is hosted on Railway free tier — first request may take 10-15 seconds to wake up.

---

## Screenshots

### Main Page
![Main Page](screenshots/main%20page.png)

### Current Weather
![Current Weather](screenshots/current%20weather.png)

### Save Weather Query
![Save Weather Query](screenshots/save%20weather%20query.png)

### Saved Records & Export Options
![Saved Records](screenshots/saved%20record%20&%20export%20options.png)

---

## What This App Does

A full-stack weather application that lets users:
- Search current weather by city name
- Detect weather using GPS location
- View a 5-day forecast
- Save, edit, and delete weather queries (full CRUD)
- Export saved records as CSV or JSON

---

## Tech Stack & Why

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite | Industry standard, fast development, component-based UI |
| Backend | Python + FastAPI | Modern, fast, auto-generates API docs, Python is best fit for this project |
| Database | SQLite | Zero configuration, file-based, perfect for this scale |
| Weather Data | OpenWeatherMap API | Free, well-documented, supports city search + GPS + forecast |
| HTTP Client | Axios | Cleaner syntax than fetch, better error handling |
| Frontend Deploy | Netlify | Free, instant deployment from GitHub, CDN-backed |
| Backend Deploy | Railway | Free tier, supports Python, auto-deploys from GitHub |

---

## Project Structure
weather-app/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env (not pushed - contains API key)
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── main.jsx
├── screenshots/
└── README.md

---

## How to Run Locally

### 1. Clone the repo
git clone https://github.com/ZonaZubair/weather-app.git
cd weather-app

### 2. Backend setup
cd backend
pip install -r requirements.txt
Create a `.env` file inside the `backend` folder:
WEATHER_API_KEY=your_openweathermap_api_key_here
Start the backend:
py -3.11 -m uvicorn main:app --reload

### 3. Frontend setup
cd ../frontend
npm install
npm run dev

### 4. Open the app
Go to `http://localhost:5173` in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /weather/current?city= | Get current weather by city |
| GET | /weather/forecast?city= | Get 5-day forecast by city |
| GET | /weather/by-coords?lat=&lon= | Get weather by GPS coordinates |
| POST | /records | Save a weather query |
| GET | /records | Get all saved records |
| PUT | /records/{id} | Update a record |
| DELETE | /records/{id} | Delete a record |
| GET | /records/export/csv | Download all records as CSV |
| GET | /records/export/json | Download all records as JSON |

---

## Key Design Decisions

- **Why FastAPI over Flask?** FastAPI is faster, has built-in data validation via Pydantic, and auto-generates interactive API documentation at `/docs`.
- **Why SQLite over PostgreSQL?** This is a single-user app — SQLite handles this perfectly without needing a database server to configure or maintain.
- **Why Vite over create-react-app?** Vite is significantly faster and is what modern React projects use in production.
- **Why separate frontend and backend?** Clean separation of concerns — frontend handles UI, backend handles data and business logic. This is industry standard architecture.
- **Why Netlify + Railway?** Both are free, deploy directly from GitHub, and are production-grade platforms used by real companies.
