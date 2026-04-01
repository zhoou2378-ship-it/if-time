// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    userLevel: 1,
    stats: {
      totalRoutes: 3,
      totalDistance: 37.9,
      totalElevation: 2079,
      progress: 35
    },
    recentRoutes: [
      {
        id: 'jiangjuntuo-001',
        name: '将军坨环穿',
        date: '2026-03-28',
        distance: 11,
        elevation: 400,
        coverImage: '/images/routes/jiangjuntuo.jpg'
      },
      {
        id: 'tianmenshan-001',
        name: '天门山穿越',
        date: '2026-03-21',
        distance: 10,
        elevation: 429,
        coverImage: '/images/routes/tianmenshan.jpg'
      }
    ]
  },

  onShow() {
    this.loadUserStats();
  },

  loadUserStats() {
    const profile = app.globalData.userProfile;
    if (profile && profile.completedRoutes) {
      const totalDistance = profile.totalDistance || 0;
      const totalElevation = profile.totalElevation || 0;
      const totalRoutes = profile.completedRoutes.length;
      
      // 计算等级
      const level = Math.floor(totalDistance / 50) + 1;
      const progress = ((totalDistance % 50) / 50) * 100;

      this.setData({
        stats: {
          totalRoutes,
          totalDistance: totalDistance.toFixed(1),
          totalElevation,
          progress: Math.round(progress)
        },
        userLevel: level,
        recentRoutes: profile.completedRoutes.slice(0, 5)
      });
    }
  },

  goToHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  goToFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' });
  },

  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  goToFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  },

  goToAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/route-detail/route-detail?id=${id}` });
  }
});
