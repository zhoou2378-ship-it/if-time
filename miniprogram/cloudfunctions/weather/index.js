// 云函数：天气服务
// 文件：cloudfunctions/weather/index.js

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { action, data } = event;

  switch (action) {
    case 'getCurrent':
      return await getCurrentWeather(data);
    case 'getForecast':
      return await getForecast(data);
    case 'getHikingAdvice':
      return await getHikingAdvice(data);
    default:
      return { success: false, message: '未知操作' };
  }
};

// 获取当前天气
async function getCurrentWeather(params) {
  const { lat, lng } = params;

  // 使用和风天气 API (需要注册获取 key)
  // https://dev.qweather.com/
  const QWEATHER_KEY = process.env.QWEATHER_KEY || 'your-api-key';

  try {
    // 获取城市 ID
    const locationResponse = await fetch(
      `https://geoapi.qweather.com/v2/city/lookup?location=${lng},${lat}&key=${QWEATHER_KEY}`
    );
    const locationData = await locationResponse.json();

    if (locationData.code !== '200') {
      return { success: false, message: '获取城市信息失败' };
    }

    const locationId = locationData.location[0].id;
    const cityName = locationData.location[0].name;

    // 获取实时天气
    const weatherResponse = await fetch(
      `https://devapi.qweather.com/v7/weather/now?location=${locationId}&key=${QWEATHER_KEY}`
    );
    const weatherData = await weatherResponse.json();

    if (weatherData.code !== '200') {
      return { success: false, message: '获取天气失败' };
    }

    const now = weatherData.now;

    return {
      success: true,
      data: {
        location: cityName,
        temp: parseInt(now.temp),
        feelsLike: parseInt(now.feelsLike),
        condition: now.text,
        humidity: parseInt(now.humidity),
        visibility: parseInt(now.vis),
        windSpeed: parseFloat(now.windSpeed),
        windDir: now.windDir,
        pressure: parseInt(now.pressure),
        updateTime: now.obsTime
      }
    };
  } catch (err) {
    console.error('获取天气失败', err);
    // 返回模拟数据
    return {
      success: true,
      data: getMockWeatherData()
    };
  }
}

// 获取天气预报
async function getForecast(params) {
  const { lat, lng } = params;

  const QWEATHER_KEY = process.env.QWEATHER_KEY || 'your-api-key';

  try {
    // 获取城市 ID
    const locationResponse = await fetch(
      `https://geoapi.qweather.com/v2/city/lookup?location=${lng},${lat}&key=${QWEATHER_KEY}`
    );
    const locationData = await locationResponse.json();

    if (locationData.code !== '200') {
      return { success: false, message: '获取城市信息失败' };
    }

    const locationId = locationData.location[0].id;

    // 获取 7 天预报
    const forecastResponse = await fetch(
      `https://devapi.qweather.com/v7/weather/7d?location=${locationId}&key=${QWEATHER_KEY}`
    );
    const forecastData = await forecastResponse.json();

    if (forecastData.code !== '200') {
      return { success: false, message: '获取预报失败' };
    }

    const forecast = forecastData.daily.map(day => ({
      date: day.fxDate,
      high: parseInt(day.tempMax),
      low: parseInt(day.tempMin),
      conditionDay: day.textDay,
      conditionNight: day.textNight,
      humidity: parseInt(day.humidity),
      windDir: day.windDirDay,
      windScale: day.windScaleDay,
      uvIndex: parseInt(day.uvIndex),
      isGoodForHiking: isGoodWeatherForHiking(day)
    }));

    return {
      success: true,
      data: forecast
    };
  } catch (err) {
    console.error('获取预报失败', err);
    return {
      success: true,
      data: getMockForecastData()
    };
  }
}

// 获取徒步建议
async function getHikingAdvice(params) {
  const { weather } = params;

  const temp = weather.temp;
  const condition = weather.condition;
  const humidity = weather.humidity;
  const windSpeed = weather.windSpeed;
  const visibility = weather.visibility;

  // 计算适宜性评分
  let score = 100;
  let level = 'good';
  let levelText = '适合徒步';
  let advice = [];
  let gear = [];

  // 温度评估
  if (temp < 5) {
    score -= 30;
    advice.push('气温较低，注意保暖');
    gear.push('保暖衣物、手套、帽子');
  } else if (temp > 35) {
    score -= 25;
    advice.push('气温过高，注意防暑');
    gear.push('防晒衣、遮阳帽、充足饮水');
  } else if (temp >= 15 && temp <= 25) {
    gear.push('轻薄外套（早晚温差）');
  }

  // 天气状况评估
  if (condition.includes('雨') || condition.includes('雪')) {
    score -= 40;
    advice.push('天气恶劣，不建议徒步');
    gear.push('雨具、防滑鞋');
    level = 'poor';
    levelText = '不建议徒步';
  } else if (condition.includes('阴') || condition.includes('多云')) {
    score -= 5;
    advice.push('天气尚可，适合户外活动');
  } else if (condition.includes('晴')) {
    if (temp > 28) {
      score -= 10;
      advice.push('晴天注意防晒');
      gear.push('防晒霜 SPF30+、太阳镜');
    } else {
      advice.push('天气晴朗，非常适合徒步');
    }
  }

  // 湿度评估
  if (humidity > 80) {
    score -= 10;
    advice.push('湿度较大，体感闷热');
  }

  // 风速评估
  if (windSpeed > 5) {
    score -= 15;
    advice.push('风力较大，注意安全');
    gear.push('防风外套');
  }

  // 能见度评估
  if (visibility < 5) {
    score -= 20;
    advice.push('能见度较低，谨慎出行');
  }

  // 综合评级
  if (score < 40) {
    level = 'poor';
    levelText = '不建议徒步';
  } else if (score < 70) {
    level = 'moderate';
    levelText = '谨慎徒步';
  } else {
    level = 'good';
    levelText = '适合徒步';
  }

  // 基本装备建议
  if (!gear.includes('饮用水')) {
    gear.unshift('饮用水 1.5-2L');
  }
  gear.push('登山杖');
  gear.push('手机充电宝');

  return {
    success: true,
    data: {
      score,
      level,
      levelText,
      advice: advice.join('；'),
      gear
    }
  };
}

// 判断是否适合徒步
function isGoodWeatherForHiking(day) {
  const condition = day.textDay;
  const tempMax = parseInt(day.tempMax);
  const windScale = parseInt(day.windScaleDay);

  if (condition.includes('雨') || condition.includes('雪')) return false;
  if (tempMax > 38 || tempMax < -5) return false;
  if (windScale >= 7) return false;

  return true;
}

// 模拟天气数据
function getMockWeatherData() {
  return {
    location: '北京市',
    temp: 19,
    feelsLike: 17,
    condition: '多云',
    humidity: 45,
    visibility: 15,
    windSpeed: 3.2,
    windDir: '东北风',
    pressure: 1015,
    updateTime: new Date().toISOString()
  };
}

// 模拟预报数据
function getMockForecastData() {
  const days = [];
  const conditions = ['晴', '多云', '晴', '多云', '小雨', '晴', '晴'];
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    days.push({
      date: date.toISOString().split('T')[0],
      high: 20 + Math.floor(Math.random() * 5),
      low: 8 + Math.floor(Math.random() * 4),
      conditionDay: conditions[i],
      conditionNight: conditions[i],
      humidity: 40 + Math.floor(Math.random() * 30),
      windDir: '东北风',
      windScale: Math.floor(Math.random() * 4) + 1,
      uvIndex: Math.floor(Math.random() * 8) + 2,
      isGoodForHiking: conditions[i] !== '小雨'
    });
  }

  return days;
}
