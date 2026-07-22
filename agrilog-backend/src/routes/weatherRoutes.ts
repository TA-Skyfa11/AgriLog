import express from 'express';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
    if (!API_KEY) {
      return res.json({ success: false, message: 'API Key chưa được cấu hình' });
    }
    const city = 'Hanoi';
    
    // Fetch Current Weather
    const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=vi`);
    if (!currentRes.ok) {
      return res.json({ success: false, message: 'Lỗi lấy thời tiết hiện tại' });
    }
    const currentData = await currentRes.json();
    
    // Fetch Forecast
    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=vi`);
    if (!forecastRes.ok) {
       return res.json({ success: false, message: 'Lỗi lấy dự báo thời tiết' });
    }
    const forecastData = await forecastRes.json();
    
    // wind speed is in m/s. Convert to km/h
    const windSpeedKmph = Math.round(currentData.wind.speed * 3.6);
    
    // pop is probability of precipitation 0..1
    const chanceOfRain = Math.round((forecastData.list[0]?.pop || 0) * 100);
    
    // Get 4 data points for hourly
    const hourly = forecastData.list.slice(0, 4).map((h: any) => {
      // dt_txt is "YYYY-MM-DD HH:MM:SS"
      const time = h.dt_txt.split(' ')[1].slice(0, 5); // "HH:MM"
      return {
        time: time,
        temp: Math.round(h.main.temp).toString()
      };
    });
    
    let desc = currentData.weather[0].description;
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    
    const parsedData = {
      temp: Math.round(currentData.main.temp).toString(),
      desc: desc,
      humidity: currentData.main.humidity.toString(),
      wind: windSpeedKmph.toString(),
      chanceOfRain: chanceOfRain.toString(),
      hourly: hourly
    };

    res.json({ success: true, data: parsedData });
  } catch (error) {
    res.json({ success: false, message: 'Lỗi kết nối API thời tiết' });
  }
});

export default router;
