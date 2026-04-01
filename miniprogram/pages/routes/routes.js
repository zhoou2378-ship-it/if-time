// pages/routes/routes.js
Page({
  data: {
    difficultyOptions: ['全部难度', '轻松', '中等', '困难', '挑战'],
    difficultyIndex: 0,
    durationOptions: ['全部时长', '3小时内', '3-5小时', '5小时以上'],
    durationIndex: 0,
    seasonOptions: ['全部季节', '春季赏花', '夏季避暑', '秋季红叶', '冬季雪景'],
    seasonIndex: 0,
    routes: []
  },

  onLoad() {
    this.loadRoutes();
  },

  async loadRoutes() {
    // 模拟数据，实际应从云函数获取
    const routes = [
      {
        id: 'jiangjuntuo-001',
        name: '将军坨环穿',
        distance: 11,
        elevation: 400,
        duration: '4-5',
        difficultyLevel: 2,
        rating: 4.5,
        isHot: true,
        coverImage: '/images/routes/jiangjuntuo.jpg',
        description: '人少清静、山脊攀岩、古寺探秘、冷门路线'
      },
      {
        id: 'tianmenshan-001',
        name: '天门山穿越',
        distance: 10,
        elevation: 429,
        duration: '4',
        difficultyLevel: 2,
        rating: 4.3,
        isNew: true,
        coverImage: '/images/routes/tianmenshan.jpg',
        description: '经典穿越路线，风景优美，适合新手'
      },
      {
        id: 'baipusi-001',
        name: '白瀑寺环穿',
        distance: 10,
        elevation: 661,
        duration: '4-5',
        difficultyLevel: 3,
        rating: 4.6,
        coverImage: '/images/routes/baipusi.jpg',
        description: '古寺探秘，山脊风光，适合有一定基础的驴友'
      },
      {
        id: 'sanfeng-001',
        name: '三峰中小环',
        distance: 17.9,
        elevation: 1289,
        duration: '7-8',
        difficultyLevel: 4,
        rating: 4.8,
        isHot: true,
        coverImage: '/images/routes/sanfeng.jpg',
        description: '经典拉练路线，强度较大，风景绝美'
      }
    ];

    this.setData({ routes });
  },

  onDifficultyChange(e) {
    this.setData({ difficultyIndex: e.detail.value });
    this.filterRoutes();
  },

  onDurationChange(e) {
    this.setData({ durationIndex: e.detail.value });
    this.filterRoutes();
  },

  onSeasonChange(e) {
    this.setData({ seasonIndex: e.detail.value });
    this.filterRoutes();
  },

  filterRoutes() {
    // 根据筛选条件过滤路线
    // 实际应调用云函数重新获取
    console.log('筛选路线');
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/route-detail/route-detail?id=${id}` });
  }
});
