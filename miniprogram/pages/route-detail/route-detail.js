// pages/route-detail/route-detail.js
const app = getApp();

Page({
  data: {
    route: null,
    isFavorite: false
  },

  onLoad(options) {
    const { id } = options;
    this.loadRouteDetail(id);
  },

  async loadRouteDetail(id) {
    // 模拟数据，实际应从云函数获取
    const route = {
      id: id,
      name: '将军坨环穿',
      distance: 11,
      elevation: 400,
      duration: '4-5',
      difficulty: 45,
      difficultyLevel: 2,
      season: '春季赏花',
      coverImage: '/images/routes/jiangjuntuo.jpg',
      description: '将军坨位于北京门头沟区，是一条经典的环穿路线。路线全长约11公里，累计爬升400米，适合有一定基础的徒步爱好者。沿途可以欣赏到山脊风光、古寺遗址，春季还可观赏山花。',
      features: [
        '🏔️ 人少清静，远离喧嚣',
        '🧗 山脊攀岩，体验刺激',
        '🏛️ 古寺探秘，文化底蕴',
        '🌸 春季赏花，风景优美'
      ],
      staminaRequired: 40,
      staminaLevel: '中等',
      techRequired: 30,
      techLevel: '简单',
      riskLevel: 20,
      riskText: '较低',
      transport: {
        car: '导航至"将军坨"，停车场约可停20辆车',
        bus: '地铁S1线苹果园站换乘892路，将军坨站下车'
      },
      notices: [
        '建议携带登山杖，部分路段较陡',
        '春秋季注意防风，冬季注意防滑',
        '沿途无补给点，需自带饮用水和食物',
        '建议下载离线地图，部分路段无信号'
      ]
    };

    this.setData({ route });
    
    // 检查是否已收藏
    this.checkFavorite();
  },

  checkFavorite() {
    // 检查收藏状态
    const favorites = wx.getStorageSync('favorites') || [];
    this.setData({
      isFavorite: favorites.includes(this.data.route.id)
    });
  },

  goBack() {
    wx.navigateBack();
  },

  toggleFavorite() {
    const { route, isFavorite } = this.data;
    let favorites = wx.getStorageSync('favorites') || [];
    
    if (isFavorite) {
      favorites = favorites.filter(id => id !== route.id);
    } else {
      favorites.push(route.id);
    }
    
    wx.setStorageSync('favorites', favorites);
    this.setData({ isFavorite: !isFavorite });
    
    wx.showToast({
      title: isFavorite ? '已取消收藏' : '收藏成功',
      icon: 'success'
    });
  },

  shareRoute() {
    // 触发分享
  },

  startRoute() {
    const { route } = this.data;
    
    wx.showModal({
      title: '开始徒步',
      content: `确定要开始「${route.name}」的徒步记录吗？`,
      success: (res) => {
        if (res.confirm) {
          // 开始记录轨迹
          wx.navigateTo({
            url: `/pages/tracking/tracking?id=${route.id}`
          });
        }
      }
    });
  },

  onShareAppMessage() {
    const { route } = this.data;
    return {
      title: `推荐路线：${route.name}`,
      path: `/pages/route-detail/route-detail?id=${route.id}`,
      imageUrl: route.coverImage
    };
  }
});
