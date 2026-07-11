import express from 'express';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

const translateWeather = (enDesc: string) => {
  const desc = enDesc.toLowerCase();
  if (desc.includes('sun') || desc.includes('clear')) return 'Trời nắng';
  if (desc.includes('partly cloudy')) return 'Có mây vài nơi';
  if (desc.includes('cloud')) return 'Nhiều mây';
  if (desc.includes('overcast')) return 'U ám';
  if (desc.includes('rain') && desc.includes('light')) return 'Mưa nhỏ';
  if (desc.includes('rain') && desc.includes('heavy')) return 'Mưa to';
  if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) return 'Có mưa';
  if (desc.includes('thund')) return 'Có giông bão';
  if (desc.includes('mist') || desc.includes('fog')) return 'Có sương mù';
  if (desc.includes('smoke') || desc.includes('haze') || desc.includes('smoky')) return 'Có khói bụi';
  return enDesc;
};

router.get('/', protect, async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://wttr.in/Hanoi?format=j1&lang=vi', {
      headers: {
        'Accept-Language': 'vi',
        'User-Agent': 'curl/7.68.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
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
        hourly: todayHourly.filter((h: any, i: number) => i % 2 === 0).map((h: any) => ({
          time: h.time.length < 3 ? '00:00' : h.time.padStart(4, '0').slice(0, 2) + ':00',
          temp: h.tempC
        })).slice(0, 4) // Get 4 data points (e.g., 00:00, 06:00, 12:00, 18:00)
      };

      res.json({ success: true, data: parsedData });
    } else {
      res.json({ success: false, message: 'Lỗi lấy thời tiết' });
    }
  } catch (error) {
    res.json({ success: false, message: 'Lỗi kết nối API thời tiết' });
  }
});

export default router;
