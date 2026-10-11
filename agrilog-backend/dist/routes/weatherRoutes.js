"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
let weatherCache = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
router.get('/', authMiddleware_1.protect, async (req, res) => {
    try {
        const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
        if (!API_KEY) {
            return res.json({ success: false, message: 'API Key chưa được cấu hình' });
        }
        const city = 'Hanoi';
        // Serve from cache if fresh
        if (weatherCache && weatherCache.city === city && (Date.now() - weatherCache.cachedAt < CACHE_TTL_MS)) {
            return res.json({ success: true, data: weatherCache.data });
        }
        // Fetch Current Weather & Forecast in parallel
        const [currentRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=vi`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=vi`)
        ]);
        if (!currentRes.ok) {
            return res.json({ success: false, message: 'Lỗi lấy thời tiết hiện tại' });
        }
        const currentData = await currentRes.json();
        let forecastData = { list: [] };
        if (forecastRes.ok) {
            forecastData = await forecastRes.json();
        }
        // wind speed is in m/s. Convert to km/h
        const windSpeedKmph = Math.round(currentData.wind.speed * 3.6);
        // pop is probability of precipitation 0..1
        const chanceOfRain = Math.round((forecastData.list?.[0]?.pop || 0) * 100);
        // Get 4 data points for hourly
        const hourly = (forecastData.list || []).slice(0, 4).map((h) => {
            // dt_txt is "YYYY-MM-DD HH:MM:SS"
            const time = h.dt_txt ? h.dt_txt.split(' ')[1].slice(0, 5) : '12:00'; // "HH:MM"
            return {
                time: time,
                temp: Math.round(h.main.temp).toString()
            };
        });
        let desc = currentData.weather?.[0]?.description || 'Trời nắng';
        desc = desc.charAt(0).toUpperCase() + desc.slice(1);
        const parsedData = {
            temp: Math.round(currentData.main.temp).toString(),
            desc: desc,
            humidity: currentData.main.humidity.toString(),
            wind: windSpeedKmph.toString(),
            chanceOfRain: chanceOfRain.toString(),
            hourly: hourly
        };
        // Store in cache
        weatherCache = {
            city,
            data: parsedData,
            cachedAt: Date.now()
        };
        res.json({ success: true, data: parsedData });
    }
    catch (error) {
        res.json({ success: false, message: 'Lỗi kết nối API thời tiết' });
    }
});
exports.default = router;
