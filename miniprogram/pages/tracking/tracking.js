// pages/tracking/tracking.js
const app = getApp();

Page({
  data: {
    // 地图相关
    latitude: 39.9042,
    longitude: 116.4074,
    scale: 16,
    markers: [],
    polyline: [],
    mapType: 'standard', // standard, satellite

    // 轨迹记录
    isTracking: false,
    isLocked: false,
    isExpanded: false,
    showEndModal: false,

    // 统计数据
    stats: {
      distance: 0,
      elevation: 0,
      duration: 0,
      currentPace: 0,
      avgPace: 0,
      speed: 0,
      altitude: 0,
      calories: 0,
      steps: 0
    },

    // 路线信息
    routeId: null,
    routeName: '',

    // 轨迹点
    trackPoints: [],
    startTime: null
  },

  mapContext: null,
  locationTimer: null,
  durationTimer: null,

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ routeId: id });
      this.loadRouteInfo(id);
    }

    this.mapContext = wx.createMapContext('trackingMap', this);
    this.initLocation();
  },

  onUnload() {
    this.stopTracking();
    this.clearTimers();
  },

  // 加载路线信息
  async loadRouteInfo(routeId) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'routes',
        data: {
          action: 'getDetail',
          data: { id: routeId }
        }
      });

      if (res.result.success) {
        this.setData({
          routeName: res.result.data.name
        });
      }
    } catch (err) {
      console.error('加载路线信息失败', err);
    }
  },

  // 初始化位置
  async initLocation() {
    try {
      const location = await this.getLocation();
      this.setData({
        latitude: location.latitude,
        longitude: location.longitude
      });
    } catch (err) {
      wx.showToast({
        title: '获取位置失败',
        icon: 'none'
      });
    }
  },

  // 获取当前位置
  getLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        altitude: true,
        success: resolve,
        fail: reject
      });
    });
  },

  // 开始/暂停记录
  toggleTracking() {
    if (this.data.isTracking) {
      // 检查是否应该结束
      if (this.data.stats.distance > 0.5) {
        this.setData({ showEndModal: true });
      } else {
        this.pauseTracking();
      }
    } else {
      this.startTracking();
    }
  },

  // 开始记录
  startTracking() {
    this.setData({
      isTracking: true,
      startTime: this.data.startTime || Date.now()
    });

    // 开始位置更新
    this.locationTimer = setInterval(() => {
      this.updateLocation();
    }, 3000);

    // 开始计时
    this.durationTimer = setInterval(() => {
      this.updateDuration();
    }, 1000);

    wx.showToast({
      title: '开始记录',
      icon: 'success'
    });
  },

  // 暂停记录
  pauseTracking() {
    this.setData({ isTracking: false });
    this.clearTimers();
    wx.showToast({
      title: '已暂停',
      icon: 'none'
    });
  },

  // 停止记录
  stopTracking() {
    this.pauseTracking();
  },

  // 结束并保存
  async endTracking() {
    this.hideEndModal();
    this.stopTracking();

    const { stats, routeId, trackPoints } = this.data;

    try {
      // 保存到云数据库
      await wx.cloud.callFunction({
        name: 'users',
        data: {
          action: 'addCompletedRoute',
          data: {
            routeId,
            distance: stats.distance,
            elevation: stats.elevation,
            duration: stats.duration,
            photos: [],
            notes: '',
            rating: 0
          }
        }
      });

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      // 返回详情页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('保存失败', err);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  // 更新位置
  async updateLocation() {
    if (!this.data.isTracking || this.data.isLocked) return;

    try {
      const location = await this.getLocation();
      const { latitude, longitude, altitude, speed } = location;
      const { trackPoints, stats } = this.data;

      // 添加轨迹点
      const newPoint = { latitude, longitude, altitude, time: Date.now() };
      const newPoints = [...trackPoints, newPoint];

      // 计算距离增量
      if (trackPoints.length > 0) {
        const lastPoint = trackPoints[trackPoints.length - 1];
        const distanceDelta = this.calculateDistance(
          lastPoint.latitude, lastPoint.longitude,
          latitude, longitude
        );

        // 爬升计算
        let elevationDelta = 0;
        if (altitude && lastPoint.altitude && altitude > lastPoint.altitude) {
          elevationDelta = altitude - lastPoint.altitude;
        }

        this.setData({
          trackPoints: newPoints,
          latitude,
          longitude,
          'stats.distance': stats.distance + distanceDelta,
          'stats.elevation': Math.round(stats.elevation + elevationDelta),
          'stats.altitude': Math.round(altitude || stats.altitude),
          'stats.speed': speed ? (speed * 3.6).toFixed(1) : stats.speed,
          polyline: [{
            points: newPoints.map(p => ({ latitude: p.latitude, longitude: p.longitude })),
            color: '#2D5A27',
            width: 6,
            arrowLine: true
          }]
        });
      } else {
        this.setData({
          trackPoints: newPoints,
          latitude,
          longitude,
          'stats.altitude': Math.round(altitude || 0)
        });
      }

      // 更新标记
      this.updateMarkers();
    } catch (err) {
      console.error('更新位置失败', err);
    }
  },

  // 计算两点距离（km）
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球半径（km）
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRad(deg) {
    return deg * (Math.PI / 180);
  },

  // 更新时长
  updateDuration() {
    const { startTime, stats } = this.data;
    const duration = Math.floor((Date.now() - startTime) / 1000);

    // 计算配速
    const distance = stats.distance;
    const avgPace = distance > 0 ? Math.round(duration / 60 / distance) : 0;

    // 估算卡路里（简单算法）
    const calories = Math.round(distance * 60 + duration * 0.1);

    // 估算步数
    const steps = Math.round(distance * 1300);

    this.setData({
      'stats.duration': duration,
      'stats.avgPace': avgPace,
      'stats.currentPace': avgPace,
      'stats.calories': calories,
      'stats.steps': steps
    });
  },

  // 更新标记
  updateMarkers() {
    const { trackPoints } = this.data;
    if (trackPoints.length === 0) return;

    const markers = [
      // 起点
      {
        id: 'start',
        latitude: trackPoints[0].latitude,
        longitude: trackPoints[0].longitude,
        iconPath: '/images/icons/marker-start.png',
        width: 32,
        height: 32
      }
    ];

    // 当前位置
    if (trackPoints.length > 1) {
      const last = trackPoints[trackPoints.length - 1];
      markers.push({
        id: 'current',
        latitude: last.latitude,
        longitude: last.longitude,
        iconPath: '/images/icons/marker-current.png',
        width: 32,
        height: 32
      });
    }

    this.setData({ markers });
  },

  // 格式化距离
  formatDistance(km) {
    if (km < 1) {
      return Math.round(km * 1000);
    }
    return km.toFixed(2);
  },

  // 格式化时长
  formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  // 地图定位到当前位置
  centerLocation() {
    this.mapContext.moveToLocation();
  },

  // 切换地图类型
  toggleMapType() {
    const newType = this.data.mapType === 'standard' ? 'satellite' : 'standard';
    this.setData({ mapType: newType });
  },

  // 切换面板展开
  togglePanel() {
    this.setData({ isExpanded: !this.data.isExpanded });
  },

  // 切换锁定
  toggleLock() {
    this.setData({ isLocked: !this.data.isLocked });
  },

  // 拍照
  takePhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        // 保存照片路径和时间戳
        console.log('拍摄照片:', res.tempFilePaths[0]);
        wx.showToast({
          title: '照片已保存',
          icon: 'success'
        });
      }
    });
  },

  // 弹窗控制
  showEndModal() {
    this.setData({ showEndModal: true });
  },

  hideEndModal() {
    this.setData({ showEndModal: false });
  },

  preventBubble() {},

  // 清除定时器
  clearTimers() {
    if (this.locationTimer) {
      clearInterval(this.locationTimer);
      this.locationTimer = null;
    }
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  },

  onRegionChange(e) {
    // 地图区域变化
  }
});
