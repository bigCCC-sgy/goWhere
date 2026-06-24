const weatherByCity: Record<string, string> = {
  北京市: "晴 28°C",
  上海市: "多云 26°C",
  天津市: "晴 27°C",
  重庆市: "阵雨 25°C",
  南京市: "多云 26°C",
  杭州市: "小雨 24°C",
  成都市: "阴 25°C",
  广州市: "多云 29°C",
  深圳市: "晴 30°C",
  武汉市: "多云 28°C",
  西安市: "晴 27°C",
  苏州市: "多云 25°C",
  青岛市: "晴 24°C",
  厦门市: "多云 28°C",
};

const fallbackWeather = ["多云 26°C", "晴 28°C", "小雨 24°C", "阴 25°C"];

export function mockWeatherForCity(city?: string) {
  const normalized = (city || "").replace(/\s/g, "");
  if (!normalized) return "多云 26°C";
  const exact = Object.entries(weatherByCity).find(([name]) => normalized.includes(name.replace("市", "")));
  if (exact) return exact[1];
  const code = Array.from(normalized).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return fallbackWeather[code % fallbackWeather.length];
}
