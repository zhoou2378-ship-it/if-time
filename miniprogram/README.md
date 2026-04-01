# 山野周末 - 微信小程序

户外徒步路线规划平台微信小程序

## 项目结构

```
miniprogram/
├── app.js              # 小程序入口
├── app.json            # 小程序配置
├── app.wxss            # 全局样式
├── pages/
│   ├── index/          # 首页
│   ├── routes/         # 路线列表
│   ├── route-detail/   # 路线详情
│   ├── tracking/       # 轨迹记录 ⭐ 新增
│   ├── weather/        # 天气页面
│   └── profile/        # 个人中心
├── cloudfunctions/     # 云函数
│   ├── routes/         # 路线服务
│   ├── weather/        # 天气服务
│   └── users/          # 用户服务
├── images/             # 图片资源
│   ├── routes/         # 路线封面
│   ├── weather/        # 天气图标
│   ├── tab/            # 导航图标
│   └── icons/          # 功能图标
└── utils/              # 工具函数
```

## 功能特性

### 已完成页面

- ✅ 首页（推荐路线、今日天气、我的足迹）
- ✅ 路线列表（筛选功能）
- ✅ 路线详情（完整信息展示）
- ✅ 轨迹记录（实时GPS追踪、数据统计）⭐ 新增
- ✅ 天气页面（天气预报、徒步建议）
- ✅ 个人中心（统计数据、历史记录）

### 云函数

- ✅ routes - 路线获取、详情、推荐、搜索
- ✅ weather - 天气查询、预报、徒步建议
- ✅ users - 用户档案、收藏、历史记录

### 核心功能

1. **路线推荐**
   - 基于用户体能的智能推荐
   - 季节性主题路线
   - 难度等级分类

2. **轨迹记录** ⭐ 新增
   - 实时GPS追踪
   - 距离/爬升/时长统计
   - 配速/速度/卡路里计算
   - 拍照打卡
   - 地图轨迹绘制

3. **天气服务**
   - 实时天气查询
   - 7天天气预报
   - 徒步适宜性分析
   - 装备建议

4. **个人档案**
   - 完成路线统计
   - 累计里程/爬升
   - 等级系统

## 技术栈

- 微信小程序原生开发
- 云开发（云函数、云数据库）
- 和风天气 API
- 地图服务

## 部署说明

1. 在微信开发者工具中导入项目
2. 修改 `project.config.json` 中的 `appid`
3. 开通云开发，创建以下数据表：
   - `routes` - 路线数据
   - `users` - 用户数据
   - `route_history` - 历史记录
4. 上传并部署云函数
5. 配置天气 API Key（可选）

## 数据库结构

### routes 表
```javascript
{
  name: String,           // 路线名称
  distance: Number,       // 里程(km)
  elevation: Number,      // 爬升(m)
  duration: String,       // 用时
  difficulty: Number,     // 难度(0-100)
  description: String,    // 描述
  features: Array,        // 特色
  transport: Object,      // 交通
  notices: Array,         // 注意事项
  coverImage: String,     // 封面图
  season: String,         // 季节
  rating: Number,         // 评分
  createdAt: Date
}
```

### users 表
```javascript
{
  _openid: String,        // 用户ID
  level: Number,          // 等级
  totalRoutes: Number,    // 完成路线数
  totalDistance: Number,  // 总里程
  totalElevation: Number, // 总爬升
  favorites: Array,       // 收藏
  completedRoutes: Array, // 完成记录
  preferences: Object     // 偏好设置
}
```
