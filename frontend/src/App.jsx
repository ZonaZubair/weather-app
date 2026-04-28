import { useState, useEffect } from "react";
import axios from "axios";
import {
  WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog,
} from "react-icons/wi";

const API = "http://127.0.0.1:8000";

// Maps OpenWeatherMap condition codes to icons
// We use weather id ranges as documented in OWM API docs
function WeatherIcon({ id, size = 64 }) {
  const style = { fontSize: size };
  if (id >= 200 && id < 300) return <WiThunderstorm style={style} />;
  if (id >= 300 && id < 600) return <WiRain style={style} />;
  if (id >= 600 && id < 700) return <WiSnow style={style} />;
  if (id >= 700 && id < 800) return <WiFog style={style} />;
  if (id === 800) return <WiDaySunny style={style} />;
  return <WiCloudy style={style} />;
}

// Extracts one reading per day from the 3-hour interval forecast list
function getDailyForecast(list) {
  const seen = {};
  return list.filter((item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!seen[date]) { seen[date] = true; return true; }
    return false;
  }).slice(0, 5);
}

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ city: "", start_date: "", end_date: "", notes: "" });
  const [editId, setEditId] = useState(null);
  const [formError, setFormError] = useState("");

  // Load saved records when app first opens
  useEffect(() => { fetchRecords(); }, []);

  async function fetchRecords() {
    const res = await axios.get(`${API}/records`);
    setRecords(res.data);
  }

  async function searchWeather(searchCity) {
    if (!searchCity.trim()) return;
    setLoading(true);
    setError("");
    setWeather(null);
    setForecast([]);
    try {
      const [weatherRes, forecastRes] = await Promise.all([
        axios.get(`${API}/weather/current`, { params: { city: searchCity } }),
        axios.get(`${API}/weather/forecast`, { params: { city: searchCity } }),
      ]);
      setWeather(weatherRes.data);
      setForecast(getDailyForecast(forecastRes.data.list));
    } catch (err) {
      // Show user-friendly message instead of raw error
      setError(err.response?.data?.detail || "City not found. Please try again.");
    }
    setLoading(false);
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await axios.get(`${API}/weather/by-coords`, {
            params: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          });
          setWeather(res.data);
          setCity(res.data.name);
          const forecastRes = await axios.get(`${API}/weather/forecast`, {
            params: { city: res.data.name },
          });
          setForecast(getDailyForecast(forecastRes.data.list));
        } catch {
          setError("Could not fetch weather for your location.");
        }
        setLoading(false);
      },
      () => {
        setError("Location access denied. Please allow location or search manually.");
        setLoading(false);
      }
    );
  }

  async function handleFormSubmit() {
    setFormError("");
    if (!form.city || !form.start_date || !form.end_date) {
      setFormError("Please fill in city, start date, and end date.");
      return;
    }
    if (form.start_date > form.end_date) {
      setFormError("End date must be after start date.");
      return;
    }
    try {
      if (editId) {
        await axios.put(`${API}/records/${editId}`, form);
        setEditId(null);
      } else {
        await axios.post(`${API}/records`, form);
      }
      setForm({ city: "", start_date: "", end_date: "", notes: "" });
      fetchRecords();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Something went wrong.");
    }
  }

  function startEdit(record) {
    setEditId(record.id);
    setForm({
      city: record.city,
      start_date: record.start_date,
      end_date: record.end_date,
      notes: record.notes,
    });
  }

  async function deleteRecord(id) {
    await axios.delete(`${API}/records/${id}`);
    fetchRecords();
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)", color: "#fff", fontFamily: "Segoe UI, sans-serif" }}>

      {/* PM Accelerator Info Banner */}
      <div style={{ background: "#e94560", padding: "10px", textAlign: "center", fontSize: "13px" }}>
        <strong>PM Accelerator</strong> — The #1 Product Management Bootcamp. We equip aspiring and experienced PMs with real-world skills, mentorship, and job placement support to accelerate their careers in tech.
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1rem" }}>

        {/* Header */}
        <h1 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "0.25rem" }}>🌤 Weather App</h1>
        <p style={{ textAlign: "center", color: "#aaa", marginBottom: "2rem", fontSize: "14px" }}>Built by Zona Zubair</p>

        {/* Search Bar */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchWeather(city)}
            placeholder="Enter city name..."
            style={{ flex: 1, padding: "12px 16px", borderRadius: "8px", border: "none", fontSize: "15px", background: "rgba(255,255,255,0.1)", color: "#fff" }}
          />
          <button onClick={() => searchWeather(city)} style={{ padding: "12px 20px", borderRadius: "8px", border: "none", background: "#e94560", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>
            Search
          </button>
          <button onClick={useMyLocation} style={{ padding: "12px 20px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer" }}>
            📍 My Location
          </button>
        </div>

        {/* Error Message */}
        {error && <div style={{ background: "#e94560", padding: "12px", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}

        {/* Loading */}
        {loading && <p style={{ textAlign: "center", color: "#aaa" }}>Fetching weather...</p>}

        {/* Current Weather */}
        {weather && (
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.8rem", margin: 0 }}>{weather.name}, {weather.sys.country}</h2>
            <WeatherIcon id={weather.weather[0].id} size={80} />
            <p style={{ fontSize: "3rem", margin: "0.25rem 0", fontWeight: "bold" }}>{Math.round(weather.main.temp)}°C</p>
            <p style={{ textTransform: "capitalize", color: "#ccc", margin: 0 }}>{weather.weather[0].description}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1rem", fontSize: "14px", color: "#aaa" }}>
              <span>💧 Humidity: {weather.main.humidity}%</span>
              <span>💨 Wind: {weather.wind.speed} m/s</span>
              <span>🌡 Feels like: {Math.round(weather.main.feels_like)}°C</span>
            </div>
          </div>
        )}

        {/* 5-Day Forecast */}
        {forecast.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "0.75rem" }}>5-Day Forecast</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
              {forecast.map((item) => (
                <div key={item.dt} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1rem", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>{new Date(item.dt_txt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                  <WeatherIcon id={item.weather[0].id} size={36} />
                  <p style={{ margin: 0, fontWeight: "bold" }}>{Math.round(item.main.temp)}°C</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#aaa", textTransform: "capitalize" }}>{item.weather[0].description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Weather Query Form */}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0 }}>{editId ? "Edit Record" : "Save Weather Query"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" style={inputStyle} />
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" style={inputStyle} />
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} style={inputStyle} />
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} style={inputStyle} />
          </div>
          {formError && <p style={{ color: "#e94560", fontSize: "13px" }}>{formError}</p>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleFormSubmit} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#e94560", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>
              {editId ? "Update" : "Save"}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm({ city: "", start_date: "", end_date: "", notes: "" }); }} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer" }}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Saved Records */}
        {records.length > 0 && (
          <div>
            <h3>Saved Records</h3>
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
              <a href="http://127.0.0.1:8000/records/export/csv" download>
              <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer" }}>⬇ Export CSV</button>
              </a>
              <a href="http://127.0.0.1:8000/records/export/json" download>
              <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer" }}>⬇ Export JSON</button>
              </a>
            </div>
            {records.map((r) => (
              <div key={r.id} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1rem", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{r.city}</strong>
                  <span style={{ color: "#aaa", fontSize: "13px", marginLeft: "12px" }}>{r.start_date} → {r.end_date}</span>
                  {r.notes && <span style={{ color: "#ccc", fontSize: "13px", marginLeft: "12px" }}>📝 {r.notes}</span>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => startEdit(r)} style={{ padding: "6px 14px", borderRadius: "6px", border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => deleteRecord(r.id)} style={{ padding: "6px 14px", borderRadius: "6px", border: "none", background: "#e94560", color: "#fff", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "rgba(255,255,255,0.1)",
  color: "#fff",
  fontSize: "14px",
  width: "100%",
  boxSizing: "border-box",
};