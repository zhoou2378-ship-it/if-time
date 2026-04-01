// pages/index/index.js
const app = getApp();

Page({
  data: {
    recommendRoute: null,
    weather: {
      temp: '--',
      feelsLike: '--',
      condition: '加载中',
      humidity: '--',
      uvIndex: '--',
      visibility: '--',
      icon: '',
      hint: ''
    },
    userStats: {
      totalRoutes: 0,
      totalDistance: 0,
      totalElevation: 0
    }
  },

  onLoad() {
    this.loadRecommendRoute();
    this.loadWeather();
    this.loadUserStats();
  },

  onShow() {
    this.loadUserStats();
  },

  // 加载推荐路线
  async loadRecommendRoute() {
    try {
      // 这里应该调用云函数获取推荐路线
      // 临时使用模拟数据
      this.setData({
        recommendRoute: {
          id: 'jiangjuntuo-001',
          name: '将军坨环穿',
          distance: 11,
          elevation: 400,
          duration: '4-5',
          difficulty: 45,
          difficultyLevel: 2,
          season: '春季赏花',
          coverImage: '/images/routes/jiangjuntuo.jpg'
        }
      });
    } catch (err) {
      console.error('加载推荐路线失败', err);
    }
  },

  // 加载天气
  async loadWeather() {
    try {
      // 获取位置
      const location = await this.getLocation();
      
      // 调用天气 API
      // 这里应该调用云函数或第三方天气 API
      const weatherData = await this.fetchWeather(location);
      
      this.setData({
        weather: weatherData
      });
    } catch (err) {
      console.error('加载天气失败', err);
    }
  },

  // 获取位置
  getLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => resolve(res),
        fail: reject
      });
    });
  },

  // 获取天气数据（模拟）
  async fetchWeather(location) {
    // 实际应该调用天气 API
    return {
      temp: 19,
      feelsLike: 17,
      condition: '多云',
      humidity: 45,
      uvIndex: '中等',
      visibility: 15,
      icon: '/images/weather/cloudy.png',
      hint: '☀️ 紫外线中等，建议涂抹防晒霜'
    };
  },

  // 加载用户统计
  loadUserStats() {
    const profile = app.globalData.userProfile;
    this.setData({
      userStats: {
        totalRoutes: profile.completedRoutes?.length || 0,
        totalDistance: profile.totalDistance || 0,
        totalElevation: profile.totalElevation || 0
      }
    });
  },

  // 页面跳转
  goToRoutes() {
    wx.switchTab({ url: '/pages/routes/routes' });
  },

  goToRouteDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/route-detail/route-detail?id=${id}` });
  },

  goToWeather() {
    wx.switchTab({ url: '/pages/weather/weather' });
  },

  goToHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  goToFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' });
  },

  goToProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  }
});
