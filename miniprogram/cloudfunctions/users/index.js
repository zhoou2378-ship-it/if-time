// 云函数：用户服务
// 文件：cloudfunctions/users/index.js

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, data } = event;
  const wxContext = cloud.getWXContext();

  switch (action) {
    case 'getProfile':
      return await getUserProfile(wxContext.OPENID);
    case 'updateProfile':
      return await updateUserProfile(wxContext.OPENID, data);
    case 'addCompletedRoute':
      return await addCompletedRoute(wxContext.OPENID, data);
    case 'getFavorites':
      return await getFavorites(wxContext.OPENID);
    case 'toggleFavorite':
      return await toggleFavorite(wxContext.OPENID, data);
    case 'getHistory':
      return await getHistory(wxContext.OPENID, data);
    default:
      return { success: false, message: '未知操作' };
  }
};

// 获取用户档案
async function getUserProfile(openid) {
  try {
    const result = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (result.data.length === 0) {
      // 创建新用户
      const newUser = {
        _openid: openid,
        createdAt: new Date().toISOString(),
        level: 1,
        totalRoutes: 0,
        totalDistance: 0,
        totalElevation: 0,
        completedRoutes: [],
        favorites: [],
        preferences: {
          preferredDifficulty: 'medium',
          notifications: true
        }
      };

      await db.collection('users').add({ data: newUser });

      return { success: true, data: newUser };
    }

    return { success: true, data: result.data[0] };
  } catch (err) {
    console.error('获取用户档案失败', err);
    return { success: false, message: '获取用户档案失败' };
  }
}

// 更新用户档案
async function updateUserProfile(openid, data) {
  try {
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' };
    }

    const userId = userResult.data[0]._id;

    await db.collection('users')
      .doc(userId)
      .update({
        data: {
          ...data,
          updatedAt: new Date().toISOString()
        }
      });

    return { success: true, message: '更新成功' };
  } catch (err) {
    console.error('更新用户档案失败', err);
    return { success: false, message: '更新失败' };
  }
}

// 添加完成的路线
async function addCompletedRoute(openid, data) {
  const { routeId, distance, elevation, duration, photos, notes, rating } = data;

  try {
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' };
    }

    const user = userResult.data[0];
    const userId = user._id;

    const completedRoute = {
      routeId,
      distance,
      elevation,
      duration,
      photos: photos || [],
      notes: notes || '',
      rating: rating || 0,
      completedAt: new Date().toISOString()
    };

    // 更新用户统计
    const newTotalRoutes = (user.totalRoutes || 0) + 1;
    const newTotalDistance = (user.totalDistance || 0) + distance;
    const newTotalElevation = (user.totalElevation || 0) + elevation;
    const newLevel = Math.floor(newTotalDistance / 50) + 1;

    await db.collection('users')
      .doc(userId)
      .update({
        data: {
          totalRoutes: newTotalRoutes,
          totalDistance: newTotalDistance,
          totalElevation: newTotalElevation,
          level: newLevel,
          completedRoutes: _.push(completedRoute),
          updatedAt: new Date().toISOString()
        }
      });

    // 同时记录到历史表
    await db.collection('route_history').add({
      data: {
        _openid: openid,
        ...completedRoute
      }
    });

    return {
      success: true,
      data: {
        totalRoutes: newTotalRoutes,
        totalDistance: newTotalDistance,
        totalElevation: newTotalElevation,
        level: newLevel
      }
    };
  } catch (err) {
    console.error('添加完成路线失败', err);
    return { success: false, message: '添加失败' };
  }
}

// 获取收藏列表
async function getFavorites(openid) {
  try {
    const result = await db.collection('users')
      .where({ _openid: openid })
      .field({ favorites: true })
      .get();

    if (result.data.length === 0) {
      return { success: true, data: [] };
    }

    const favorites = result.data[0].favorites || [];

    // 获取路线详情
    if (favorites.length > 0) {
      const routesResult = await db.collection('routes')
        .where({ _id: _.in(favorites) })
        .get();

      return { success: true, data: routesResult.data };
    }

    return { success: true, data: [] };
  } catch (err) {
    console.error('获取收藏失败', err);
    return { success: false, message: '获取收藏失败' };
  }
}

// 切换收藏状态
async function toggleFavorite(openid, data) {
  const { routeId } = data;

  try {
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' };
    }

    const user = userResult.data[0];
    const userId = user._id;
    const favorites = user.favorites || [];

    const index = favorites.indexOf(routeId);
    let newFavorites;

    if (index > -1) {
      // 取消收藏
      newFavorites = favorites.filter(id => id !== routeId);
    } else {
      // 添加收藏
      newFavorites = [...favorites, routeId];
    }

    await db.collection('users')
      .doc(userId)
      .update({
        data: {
          favorites: newFavorites,
          updatedAt: new Date().toISOString()
        }
      });

    return {
      success: true,
      data: {
        isFavorite: index === -1,
        favorites: newFavorites
      }
    };
  } catch (err) {
    console.error('切换收藏失败', err);
    return { success: false, message: '操作失败' };
  }
}

// 获取历史记录
async function getHistory(openid, data) {
  const { page = 1, pageSize = 10 } = data || {};

  try {
    const result = await db.collection('route_history')
      .where({ _openid: openid })
      .orderBy('completedAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    return {
      success: true,
      data: result.data,
      page,
      pageSize
    };
  } catch (err) {
    console.error('获取历史记录失败', err);
    return { success: false, message: '获取历史记录失败' };
  }
}
