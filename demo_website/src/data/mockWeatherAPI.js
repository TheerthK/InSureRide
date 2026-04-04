/**
 * Simulated Weather API with zone-level forecasts.
 * Provides 7-day forecasts and real-time conditions for premium calculation and trigger evaluation.
 */

const WEATHER_CONDITIONS = ['clear', 'partly_cloudy', 'cloudy', 'light_rain', 'moderate_rain', 'heavy_rain', 'thunderstorm', 'heatwave'];
const SEVERITY_MAP = { clear: 0, partly_cloudy: 0.05, cloudy: 0.1, light_rain: 0.3, moderate_rain: 0.55, heavy_rain: 0.8, thunderstorm: 0.95, heatwave: 0.7 };

function generateHourlyForecast(baseTemp, baseHumidity, condition) {
  const hours = [];
  for (let h = 0; h < 24; h++) {
    const tempVariation = Math.sin((h - 6) * Math.PI / 12) * 6;
    const temp = baseTemp + tempVariation + (Math.random() - 0.5) * 2;
    const humidity = Math.min(100, baseHumidity + (condition.includes('rain') ? 20 : 0) + (Math.random() - 0.5) * 10);
    const feelsLike = temp + (humidity > 70 ? (humidity - 70) * 0.15 : 0) + (condition === 'heatwave' ? 4 : 0);
    hours.push({
      hour: h,
      temperature: Math.round(temp * 10) / 10,
      feelsLike: Math.round(feelsLike * 10) / 10,
      humidity: Math.round(humidity),
      windSpeed: Math.round((8 + Math.random() * 15) * 10) / 10,
      precipitation: condition.includes('rain') || condition === 'thunderstorm'
        ? Math.round((condition === 'heavy_rain' ? 40 : condition === 'moderate_rain' ? 20 : condition === 'thunderstorm' ? 55 : 8) * (0.5 + Math.random()) * 10) / 10
        : 0,
      condition: h >= 14 && h <= 18 && condition.includes('rain') ? 'heavy_rain' : condition,
      waterloggingProbability: 0
    });
    // Calculate waterlogging probability based on cumulative rainfall
    const recentRain = hours.slice(Math.max(0, hours.length - 3)).reduce((s, hr) => s + hr.precipitation, 0);
    hours[hours.length - 1].waterloggingProbability = Math.min(1, recentRain / 120);
  }
  return hours;
}

const ZONE_WEATHER_SEEDS = {
  'zone-koramangala': { baseTemp: 29, baseHumidity: 68, weekPattern: ['partly_cloudy', 'cloudy', 'moderate_rain', 'heavy_rain', 'light_rain', 'partly_cloudy', 'clear'] },
  'zone-indiranagar': { baseTemp: 28, baseHumidity: 65, weekPattern: ['clear', 'partly_cloudy', 'light_rain', 'moderate_rain', 'partly_cloudy', 'clear', 'clear'] },
  'zone-whitefield': { baseTemp: 30, baseHumidity: 72, weekPattern: ['cloudy', 'moderate_rain', 'heavy_rain', 'thunderstorm', 'heavy_rain', 'moderate_rain', 'cloudy'] },
  'zone-jayanagar': { baseTemp: 28, baseHumidity: 58, weekPattern: ['clear', 'clear', 'partly_cloudy', 'light_rain', 'clear', 'clear', 'clear'] },
  'zone-hsr-layout': { baseTemp: 29, baseHumidity: 64, weekPattern: ['partly_cloudy', 'light_rain', 'moderate_rain', 'heavy_rain', 'light_rain', 'clear', 'partly_cloudy'] },
  'zone-electronic-city': { baseTemp: 31, baseHumidity: 70, weekPattern: ['cloudy', 'moderate_rain', 'thunderstorm', 'thunderstorm', 'heavy_rain', 'moderate_rain', 'light_rain'] },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function getWeatherForecast(zoneId) {
  const seed = ZONE_WEATHER_SEEDS[zoneId] || ZONE_WEATHER_SEEDS['zone-koramangala'];
  return seed.weekPattern.map((condition, i) => {
    const hourly = generateHourlyForecast(seed.baseTemp, seed.baseHumidity, condition);
    const maxTemp = Math.max(...hourly.map(h => h.temperature));
    const maxFeelsLike = Math.max(...hourly.map(h => h.feelsLike));
    const totalPrecipitation = hourly.reduce((s, h) => s + h.precipitation, 0);
    const maxWaterlogging = Math.max(...hourly.map(h => h.waterloggingProbability));

    return {
      day: DAYS[i],
      dayIndex: i,
      condition,
      severity: SEVERITY_MAP[condition],
      maxTemp: Math.round(maxTemp * 10) / 10,
      maxFeelsLike: Math.round(maxFeelsLike * 10) / 10,
      totalPrecipitation: Math.round(totalPrecipitation * 10) / 10,
      maxWaterloggingProb: Math.round(maxWaterlogging * 100) / 100,
      heatwaveAlert: maxFeelsLike > 45,
      severeRainAlert: totalPrecipitation > 80,
      hourly
    };
  });
}

export function getCurrentWeather(zoneId) {
  const forecast = getWeatherForecast(zoneId);
  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1;
  const todayData = forecast[dayIndex] || forecast[0];
  const hour = new Date().getHours();
  const currentHour = todayData.hourly[hour] || todayData.hourly[12];
  return {
    ...currentHour,
    day: todayData.day,
    alerts: [
      ...(currentHour.feelsLike > 45 ? [{ type: 'heatwave', message: `Extreme heat: Feels like ${currentHour.feelsLike}°C`, severity: 'critical' }] : []),
      ...(currentHour.precipitation > 40 ? [{ type: 'heavy_rain', message: `Heavy rainfall: ${currentHour.precipitation}mm/hr`, severity: 'high' }] : []),
      ...(currentHour.waterloggingProbability > 0.6 ? [{ type: 'waterlogging', message: `Waterlogging risk: ${Math.round(currentHour.waterloggingProbability * 100)}%`, severity: 'high' }] : []),
    ]
  };
}

export function getWeatherRiskScore(zoneId) {
  const forecast = getWeatherForecast(zoneId);
  const totalSeverity = forecast.reduce((s, d) => s + d.severity, 0);
  const rainDays = forecast.filter(d => d.condition.includes('rain') || d.condition === 'thunderstorm').length;
  const heatDays = forecast.filter(d => d.heatwaveAlert).length;
  return {
    weeklyScore: Math.round((totalSeverity / 7) * 100),
    rainDays,
    heatDays,
    surchargeApplicable: totalSeverity > 3.0,
    surchargeAmount: totalSeverity > 3.0 ? Math.round((totalSeverity - 3.0) * 5 * 10) / 10 : 0
  };
}
