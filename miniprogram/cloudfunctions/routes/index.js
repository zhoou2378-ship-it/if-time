// 云函数：获取路线列表
// 文件：cloudfunctions/routes/index.js

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, data } = event;

  switch (action) {
    case 'getList':
      return await getRouteList(data);
    case 'getDetail':
      return await getRouteDetail(data);
    case 'getRecommend':
      return await getRecommendRoute(data);
    case 'search':
      return await searchRoutes(data);
    default:
      return { success: false, message: '未知操作' };
  }
};

// 获取路线列表
async function getRouteList(params) {
  const { difficulty, duration, season, page = 1, pageSize = 10 } = params;
  
  let query = {};
  
  // 筛选条件
  if (difficulty && difficulty !== '全部难度') {
    const difficultyMap = {
      '轻松': { max: 30 },
      '中等': { min: 30, max: 60 },
      '困难': { min: 60, max: 80 },
      '挑战': { min: 80 }
    };
    const range = difficultyMap[difficulty];
    if (range) {
      query.difficulty = {};
      if (range.min) query.difficulty = _.gte(range.min);
      if (range.max) query.difficulty = _.lte(range.max);
    }
  }

  if (duration && duration !== '全部时长') {
    const durationMap = {
      '3小时内': { max: 3 },
      '3-5小时': { min: 3, max: 5 },
      '5小时以上': { min: 5 }
    };
    const range = durationMap[duration];
    if (range) {
      query.duration = {};
      if (range.min) query.duration = _.gte(range.min);
      if (range.max) query.duration = _.lte(range.max);
    }
  }

  if (season && season !== '全部季节') {
    query.season = season;
  }

  try {
    const result = await db.collection('routes')
      .where(query)
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    // 获取总数
    const countResult = await db.collection('routes')
      .where(query)
      .count();

    return {
      success: true,
      data: result.data,
      total: countResult.total,
      page,
      pageSize
    };
  } catch (err) {
    console.error('获取路线列表失败', err);
    return { success: false, message: '获取路线列表失败' };
  }
}

// 获取路线详情
async function getRouteDetail(params) {
  const { id } = params;

  try {
    const result = await db.collection('routes')
      .doc(id)
      .get();

    return {
      success: true,
      data: result.data
    };
  } catch (err) {
    console.error('获取路线详情失败', err);
    return { success: false, message: '获取路线详情失败' };
  }
}

// 获取推荐路线
async function getRecommendRoute(params) {
  const { userId, userLevel } = params;

  try {
    // 基于用户等级推荐路线
    let difficultyRange;
    if (userLevel <= 2) {
      difficultyRange = { max: 40 }; // 新手推荐轻松路线
    } else if (userLevel <= 5) {
      difficultyRange = { min: 30, max: 60 }; // 中级
    } else {
      difficultyRange = { min: 50 }; // 高级
    }

    const result = await db.collection('routes')
      .where({
        difficulty: _.gte(difficultyRange.min || 0)
          .and(_.lte(difficultyRange.max || 100))
      })
      .orderBy('rating', 'desc')
      .limit(1)
      .get();

    return {
      success: true,
      data: result.data[0] || null
    };
  } catch (err) {
    console.error('获取推荐路线失败', err);
    return { success: false, message: '获取推荐路线失败' };
  }
}

// 搜索路线
async function searchRoutes(params) {
  const { keyword } = params;

  try {
    const result = await db.collection('routes')
      .where(_.or([
        { name: db.RegExp({ regexp: keyword, options: 'i' }) },
        { description: db.RegExp({ regexp: keyword, options: 'i' }) },
        { features: db.RegExp({ regexp: keyword, options: 'i' }) }
      ]))
      .limit(20)
      .get();

    return {
      success: true,
      data: result.data
    };
  } catch (err) {
    console.error('搜索路线失败', err);
    return { success: false, message: '搜索路线失败' };
  }
}
