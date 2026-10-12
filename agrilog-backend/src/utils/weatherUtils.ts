let cachedWeather: { text: string; time: number } | null = null;
const CACHE_MS = 10 * 60 * 1000; // 10 phut cache

export const formatCompactWeather = (temp: number | string, desc: string): string => {
  let cleanDesc = desc || 'Quang đãng';
  cleanDesc = cleanDesc.replace(/^Bầu trời\s+/i, '');
  cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
  return `${Math.round(Number(temp) || 30)}°C, ${cleanDesc}`;
};

export const getCurrentWeatherText = async (city = 'Hanoi'): Promise<string> => {
  if (cachedWeather && (Date.now() - cachedWeather.time < CACHE_MS)) {
    return cachedWeather.text;
  }
  try {
    const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
    if (!API_KEY) return '30°C, Quang đãng';
    const res = await fetch('https://api.openweathermap.org/data/2.5/weather?q=' + encodeURIComponent(city) + '&appid=' + API_KEY + '&units=metric&lang=vi');
    if (!res.ok) return '30°C, Quang đãng';
    const data: any = await res.json();
    const temp = Math.round(data.main?.temp || 30);
    const desc = data.weather?.[0]?.description || 'Quang đãng';
    const text = formatCompactWeather(temp, desc);
    cachedWeather = { text, time: Date.now() };
    return text;
  } catch (err) {
    return '30°C, Quang đãng';
  }
};
