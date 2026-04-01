// pages/weather/weather.js
Page({
  data: {
    location: '北京市',
    currentWeather: {
      temp: 19,
      feelsLike: 17,
      condition: '多云',
      humidity: 45,
      uvIndex: '中等',
      visibility: 15,
      windSpeed: 3.2,
      icon: '/images/weather/cloudy.png'
    },
    hikingAdvice: {
      level: 'good',
      levelText: '适合徒步',
      text: '今天天气条件良好，温度适宜，能见度高，非常适合户外徒步活动。建议选择中等强度路线，注意防晒补水。',
      gear: [
        '防晒霜（紫外线中等）',
        '轻薄外套（早晚温差）',
        '登山杖（部分路段较陡）',
        '饮用水 1.5L'
      ]
    },
    forecast: [],
    aqi: {
      value: 65,
      level: 'good',
      levelText: '良',
      text: '空气质量良好，适合户外活动',
      advice: '可以正常进行户外运动'
    }
  },

  onLoad() {
    this.loadWeather();
    this.loadForecast();
  },

  async loadWeather() {
    try {
      const location = await this.getLocation();
      // 实际应调用天气 API
      this.setData({
        location: location.city || '北京市'
      });
    } catch (err) {
      console.error('获取位置失败', err);
    }
  },

  getLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          // 逆地理编码
          resolve({ city: '北京市' });
        },
        fail: reject
      });
    });
  },

  loadForecast() {
    // 模拟7天预报数据
    const days = ['今天', '明天', '后天', '周六', '周日', '周一', '周二'];
    const conditions = ['多云', '晴', '晴', '多云', '小雨', '晴', '晴'];
    
    const forecast = days.map((day, index) => ({
      dateText: day,
      high: 20 + Math.floor(Math.random() * 5),
      low: 8 + Math.floor(Math.random() * 4),
      condition: conditions[index],
      icon: '/images/weather/cloudy.png',
      isGoodForHiking: conditions[index] !== '小雨'
    }));

    this.setData({ forecast });
  }
});
