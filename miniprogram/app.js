// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'your-env-id', // 云开发环境ID
        traceUser: true,
      });
    }

    // 获取用户信息
    this.globalData.userInfo = wx.getStorageSync('userInfo') || null;
    this.globalData.userId = wx.getStorageSync('userId') || null;
  },

  globalData: {
    userInfo: null,
    userId: null,
    // 用户体能档案
    userProfile: {
      completedRoutes: [],
      totalDistance: 0,
      totalElevation: 0,
      avgPace: 0,
      preferredDifficulty: 'medium' // easy, medium, hard
    },
    // 本地存储的路线历史
    routeHistory: []
  },

  // 更新用户档案
  updateUserProfile(data) {
    this.globalData.userProfile = {
      ...this.globalData.userProfile,
      ...data
    };
    wx.setStorageSync('userProfile', this.globalData.userProfile);
  },

  // 添加完成的路线
  addCompletedRoute(route) {
    this.globalData.userProfile.completedRoutes.push({
      ...route,
      completedAt: new Date().toISOString()
    });
    this.updateUserProfile({
      totalDistance: this.globalData.userProfile.totalDistance + route.distance,
      totalElevation: this.globalData.userProfile.totalElevation + route.elevation
    });
  }
});
