"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const translateWeather = (enDesc) => {
    const desc = enDesc.toLowerCase();
    if (desc.includes('sun') || desc.includes('clear'))
        return 'Trời nắng';
    if (desc.includes('partly cloudy'))
        return 'Có mây vài nơi';
    if (desc.includes('cloud'))
        return 'Nhiều mây';
    if (desc.includes('overcast'))
        return 'U ám';
    if (desc.includes('rain') && desc.includes('light'))
        return 'Mưa nhỏ';
    if (desc.includes('rain') && desc.includes('heavy'))
        return 'Mưa to';
    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower'))
        return 'Có mưa';
    if (desc.includes('thund'))
        return 'Có giông bão';
    if (desc.includes('mist') || desc.includes('fog'))
        return 'Có sương mù';
    return enDesc;
};
router.get('/', authMiddleware_1.protect, async (req, res) => {
    try {
        const response = await fetch('https://wttr.in/Hanoi?format=j1&lang=vi', {
            headers: {
                'Accept-Language': 'vi',
                'User-Agent': 'curl/7.68.0'
            }
        });
        if (response.ok) {
            const data = await response.json();
            // Parse the useful bits
            const current = data.current_condition[0];
            const todayHourly = data.weather[0].hourly;
            const parsedData = {
                temp: current.temp_C,
                desc: translateWeather(current.weatherDesc[0].value),
                humidity: current.humidity,
                wind: current.windspeedKmph,
                chanceOfRain: todayHourly[0].chanceofrain, // Take the chance of rain from the first hourly block
                hourly: todayHourly.filter((h, i) => i % 2 === 0).map((h) => ({
                    time: h.time.length < 3 ? '00:00' : h.time.padStart(4, '0').slice(0, 2) + ':00',
                    temp: h.tempC
                })).slice(0, 4) // Get 4 data points (e.g., 00:00, 06:00, 12:00, 18:00)
            };
            res.json({ success: true, data: parsedData });
        }
        else {
            res.json({ success: false, message: 'Lỗi lấy thời tiết' });
        }
    }
    catch (error) {
        res.json({ success: false, message: 'Lỗi kết nối API thời tiết' });
    }
});
exports.default = router;
