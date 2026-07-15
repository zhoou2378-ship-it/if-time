<template>
  <main class="app" id="appRoot">
      <section class="phone" id="phoneShell">
        <header class="topbar">
          <div class="brand">
            <p>TIME BAGGAGE</p>
            <h1>时光行李签</h1>
            <small id="orderMeta">碎片册 · 13-18岁</small>
            <h2 id="orderTitle">晚自习后的书桌</h2>
            <p id="heroText">抽一格旧物，点亮一页回忆。</p>
          </div>
          <button class="icon-action top-share scene-action" type="button" id="shareButton" disabled aria-label="回忆场景尚未亮起">
            <span class="action-symbol share"></span>
          </button>
        </header>

        <div class="toast" id="toast"></div>

        <section class="stage">
          <section class="memory-book">
            <section class="desk-zone lottery-zone">
              <div class="memory-lottery" id="deskScene">
                <div class="lottery-board">
                  <div class="lottery-title">
                    <span>碎片盲盒</span>
                    <b id="heroTitle">先别急着解释</b>
                    <small id="deskHint">开一格，看看今天浮上来的旧物。</small>
                  </div>
                  <div class="lottery-grid" aria-hidden="true">
                    <span class="lottery-cell sealed"><b>?</b></span>
                    <span class="lottery-cell sealed soft"><b>?</b></span>
                    <span class="lottery-cell opened"><b>旧物</b></span>
                    <span class="lottery-cell sealed warm"><b>?</b></span>
                    <span class="lottery-cell sealed"><b>?</b></span>
                    <span class="lottery-cell sealed cool"><b>?</b></span>
                    <span class="lottery-cell sealed soft"><b>?</b></span>
                    <span class="lottery-cell opened quiet"><b>碎片</b></span>
                    <span class="lottery-cell sealed warm"><b>?</b></span>
                  </div>
                  <div class="lottery-ribbon">翻出后点一下拾取</div>
                </div>

                <button class="found-item" type="button" id="foundItem" aria-label="拾起翻出的旧物">
                  <span id="foundItemIcon">?</span>
                  <b id="foundItemName">翻出的旧物</b>
                  <small>拾取</small>
                </button>
              </div>
              <article class="fragment-reveal" id="fragmentReveal" role="status" aria-live="polite" aria-atomic="true"></article>
            </section>

            <section class="bottom-dock" id="repairOrder">
              <section class="dock-age-rail" id="bottomAlbumStrip"></section>
              <div class="dock-main">
                <button class="archive-head" type="button" id="albumButton">
                  <span>碎片册</span>
                  <small id="currentArchiveProgress">当前 0/0</small>
                </button>
                <div class="story-missing dock-clue-stack">
                  <div class="dock-copy">
                    <span id="dockRewardText">还差 3 件，点亮本页</span>
                    <small id="dockSubText">翻出后点一下拾取。</small>
                  </div>
                  <div class="order-slots" id="orderSlots"></div>
                </div>
              </div>
              <div class="bottom-actions">
                <button class="pickup-card pickup-action" type="button" id="drawButton" aria-label="拾取一段">
                  <span class="pickup-card-icon">
                    <span class="action-symbol paper"></span>
                  </span>
                  <span class="pickup-card-copy">
                    <b id="drawActionText">翻出一件</b>
                    <span id="drawLeft">今日还可 9 次</span>
                    <small id="resetLeft"></small>
                  </span>
                </button>
              </div>
            </section>
          </section>
        </section>

        <section class="sheet" id="albumSheet">
          <div class="sheet-head">
            <div>
              <p class="small-label">CURRENT AGE FILE</p>
              <h3 id="sheetTitle">13-18岁 / 嘴硬的晚风</h3>
            </div>
            <button class="ghost" type="button" id="closeAlbum">收起</button>
          </div>
          <div class="sheet-summary">
            <span id="sheetProgress">0/5 枚碎片</span>
            <i><b id="sheetProgressBar"></b></i>
              <p id="sheetSummary">切换上方页签，这里只显示当前这一页里的碎片。</p>
          </div>
          <section class="album-strip sheet-albums" id="albumStrip"></section>
          <div class="fragment-list" id="albumDetail"></div>
        </section>

        <section class="overlay" id="sceneOverlay">
          <div class="panel scene-panel">
            <div class="scene-card" id="sceneCard"></div>
            <button class="primary" type="button" id="closeScene">继续翻找</button>
          </div>
        </section>
      </section>
    </main>
</template>

<script setup>
import { onMounted } from 'vue';
import {
  collectFragment,
  getLocalStorage,
  loadCollectionState,
  saveCollectionState,
} from './collection-state.mjs';

onMounted(() => {
  
        const DAILY_LIMIT = 9;
        const memoryScenes = {
          childhood: {
            label: '放学后的房间',
            mood: '窗帘被晚风吹起一点，作业本摊着，糖纸压在铅笔盒下面。',
            objects: ['糖纸', '作业本', '铅笔盒', '玩具贴纸'],
            whisper: '这一段没有真正结束，只是被你翻到桌面上，暂时亮了一下。',
          },
          teen: {
            label: '晚自习后的书桌',
            mood: '蓝白校服搭在椅背，耳机线绕着草稿纸，没送出的信夹在书页里。',
            objects: ['校服袖口', '草稿纸', '耳机', '没送出的信'],
            whisper: '你不用立刻回答那时的自己，只要先让这阵晚风留一会儿。',
          },
          young: {
            label: '雨后站台旁',
            mood: '车票被雨气打软，出租屋钥匙还带着陌生城市的温度。',
            objects: ['折痕车票', '钥匙', '便利店小票', '凌晨消息'],
            whisper: '有些路口不会给结论，只会在你再次路过时变得清楚一点。',
          },
          adult: {
            label: '办公室夜灯',
            mood: '电脑还没合上，便签贴在杯沿旁，未拨出的电话停在屏幕里。',
            objects: ['夜灯', '便签', '工牌', '未拨出的电话'],
            whisper: '它不是一个结尾，只是提醒你，沉默也曾经很努力地保护过你。',
          },
        };
        const albums = [
          {
            id: 'childhood',
            label: '7-12岁',
            title: '小小的天塌下来',
            required: 6,
            color: '#d8c49a',
            summary: '童年的大事常常很小，却能被记很多年。',
            fragments: [
              { icon: '糖', name: '融化的糖纸', text: '口袋里有甜味，也有一点点委屈' },
              { icon: '本', name: '没写完的作业本', text: '田字格里还压着放学后的影子' },
              { icon: '盒', name: '磨花的铅笔盒', text: '拉链卡住时，你也跟着急了一下' },
              { icon: '贴', name: '贴歪的奖状星星', text: '那天你假装不在乎，其实看了很久' },
              { icon: '错', name: '不敢承认的错', text: '大人还没问，你已经在心里排练道歉' },
              { icon: '友', name: '赌气的朋友', text: '放学路上谁也不先说话' },
            ],
            quote: '你已经长成了能替小时候的自己撑伞的人。',
          },
          {
            id: 'teen',
            label: '13-18岁',
            title: '嘴硬的晚风',
            required: 5,
            color: '#c6d1c8',
            summary: '青春期的骄傲，后来都变成了很轻的风。',
            fragments: [
              { icon: '校', name: '蓝白校服', text: '袖口还有圆珠笔画过的痕迹' },
              { icon: '铃', name: '下课铃', text: '铃声一响，走廊就像被风推开' },
              { icon: '操', name: '操场看台', text: '有人把名字藏进晚风里' },
              { icon: '信', name: '没送出的信', text: '折痕比字迹更用力' },
              { icon: '歌', name: '循环的歌', text: '耳机里那句歌词替你说了很多遍' },
              { icon: '橡', name: '借来的橡皮', text: '边角被抠掉一小块，像没说出口的谢谢' },
              { icon: '纸', name: '写满名字的草稿纸', text: '公式旁边偷偷长出一行很轻的心事' },
              { icon: '短', name: '没发出的短信', text: '光标闪了很久，最后还是暗下去' },
            ],
            quote: '你没有真的错过青春，你只是终于敢承认自己在乎过。',
          },
          {
            id: 'young',
            label: '19-24岁',
            title: '刚学会告别',
            required: 7,
            color: '#d9b88f',
            summary: '有些路口看起来普通，回头才知道它很重要。',
            fragments: [
              { icon: '票', name: '折痕车票', text: '目的地被手心的汗晕开了一点' },
              { icon: '雨', name: '雨后站台', text: '地面倒映着没说完的再见' },
              { icon: '租', name: '第一间出租屋', text: '窗帘短了一截，月光刚好漏进来' },
              { icon: '夜', name: '凌晨消息', text: '屏幕亮起时，城市还没醒' },
              { icon: '钥', name: '出租屋钥匙', text: '钥匙齿很新，你却已经学会了装作熟悉' },
              { icon: '票', name: '便利店小票', text: '泡面和雨伞写在同一张薄薄的纸上' },
              { icon: '箱', name: '贴着胶带的行李箱', text: '轮子卡过的地方，后来都叫路' },
            ],
            quote: '不是每一次告别都需要追回，有些人负责路过，有些你负责记得。',
          },
          {
            id: 'adult',
            label: '25岁以后',
            title: '沉默的大人',
            required: 7,
            color: '#b8c7d6',
            summary: '成年人的遗憾常常不响，但会在某天突然回声很大。',
            fragments: [
              { icon: '表', name: '没拨出的电话', text: '联系人还在，只是手指停了很久' },
              { icon: '灯', name: '办公室夜灯', text: '窗外的城市像一张未保存的草稿' },
              { icon: '退', name: '一次妥协', text: '你说算了，其实心里没有算了' },
              { icon: '家', name: '回家车窗', text: '玻璃里映着一个努力镇定的人' },
              { icon: '牌', name: '磨旧的工牌', text: '照片里的你比现在更用力地微笑' },
              { icon: '签', name: '贴在杯沿的便签', text: '提醒事项写得很满，真正想说的却很少' },
              { icon: '杯', name: '冷掉的咖啡', text: '苦味留到最后，像一场没结束的会' },
            ],
            quote: '你真正长大了，开始允许遗憾存在，也开始放过那个无能为力的自己。',
          },
        ];

        const oldItemPools = {
          childhood: {
            title: '放学后的房间',
            intro: '窗帘被晚风吹起一点，糖纸压在铅笔盒下，像一句还没来得及说出口的道歉。',
            deskLine: '有些委屈很小',
            hint: '桌角总会先亮起几样容易承认的东西。',
            items: [
              { name: '融化的糖纸', tier: 'shallow' },
              { name: '没写完的作业本', tier: 'shallow' },
              { name: '磨花的铅笔盒', tier: 'shallow' },
              { name: '贴歪的奖状星星', tier: 'middle' },
              { name: '不敢承认的错', tier: 'deep' },
              { name: '赌气的朋友', tier: 'deep' },
            ],
          },
          teen: {
            title: '晚自习后的书桌',
            intro: '蓝白校服搭在椅背，耳机线绕着草稿纸，有些话被夹进书页里。',
            deskLine: '先别急着解释',
            hint: '今晚桌面先亮起三样，别的慢慢会浮上来。',
            items: [
              { name: '蓝白校服', tier: 'shallow' },
              { name: '下课铃', tier: 'shallow' },
              { name: '循环的歌', tier: 'shallow' },
              { name: '借来的橡皮', tier: 'shallow' },
              { name: '写满名字的草稿纸', tier: 'middle' },
              { name: '操场看台', tier: 'middle' },
              { name: '没送出的信', tier: 'deep' },
              { name: '没发出的短信', tier: 'deep' },
            ],
          },
          young: {
            title: '雨后站台旁',
            intro: '车票被雨气打软，出租屋钥匙还带着陌生城市的温度。',
            deskLine: '雨刚停',
            hint: '路口很多，今晚只先认出三处脚印。',
            items: [
              { name: '折痕车票', tier: 'shallow' },
              { name: '出租屋钥匙', tier: 'shallow' },
              { name: '便利店小票', tier: 'shallow' },
              { name: '雨后站台', tier: 'middle' },
              { name: '贴着胶带的行李箱', tier: 'middle' },
              { name: '第一间出租屋', tier: 'deep' },
              { name: '凌晨消息', tier: 'deep' },
            ],
          },
          adult: {
            title: '办公室夜灯',
            intro: '电脑还没合上，便签贴在杯沿旁，未拨出的电话停在屏幕里。',
            deskLine: '灯还没关',
            hint: '先找轻一点的东西，重的会在灯下慢慢显影。',
            items: [
              { name: '办公室夜灯', tier: 'shallow' },
              { name: '磨旧的工牌', tier: 'shallow' },
              { name: '贴在杯沿的便签', tier: 'shallow' },
              { name: '冷掉的咖啡', tier: 'middle' },
              { name: '回家车窗', tier: 'middle' },
              { name: '没拨出的电话', tier: 'deep' },
              { name: '一次妥协', tier: 'deep' },
            ],
          },
        };
  
        const storage = getLocalStorage(window);
        const state = loadCollectionState(storage, albums);
  
        const el = (id) => document.getElementById(id);
        const selectedAlbum = () => albums.find((album) => album.id === state.selectedAlbumId) || albums[0];
        const selectedOrder = () => oldItemPools[state.selectedAlbumId] || oldItemPools.teen;
        const albumProgress = (album) => state.found[album.id].length;
        const isComplete = (album) => albumProgress(album) >= album.required;
        const fragmentByName = (album, name) => album.fragments.find((fragment) => fragment.name === name);
        const poolForAlbum = (album) => oldItemPools[album.id] || oldItemPools.teen;
        const currentClues = (album) => state.currentClues[album.id] || pickCurrentClues(album);
  
        function randomFragment(album) {
          const owned = new Set(state.found[album.id]);
          const missing = album.fragments.filter((fragment) => !owned.has(fragment.name));
          if (missing.length) return { fragment: missing[Math.floor(Math.random() * missing.length)], duplicate: false };
          return { fragment: album.fragments[Math.floor(Math.random() * album.fragments.length)], duplicate: true };
        }

        function shuffle(items) {
          return [...items].sort(() => Math.random() - 0.5);
        }

        function takePreferred(items, count, used, owned) {
          const fresh = shuffle(items.filter((item) => !used.has(item.name) && !owned.has(item.name)));
          const fallback = shuffle(items.filter((item) => !used.has(item.name) && owned.has(item.name)));
          const picked = [...fresh, ...fallback].slice(0, count);
          picked.forEach((item) => used.add(item.name));
          return picked;
        }

        function pickCurrentClues(album) {
          const pool = poolForAlbum(album).items;
          const owned = new Set(state.found[album.id]);
          const used = new Set();
          const shallow = pool.filter((item) => item.tier === 'shallow');
          const heavier = pool.filter((item) => item.tier !== 'shallow');
          const clues = [
            ...takePreferred(shallow, 2, used, owned),
            ...takePreferred(heavier, 1, used, owned),
          ];

          if (clues.length < 3) {
            clues.push(...takePreferred(pool, 3 - clues.length, used, owned));
          }

          state.currentClues[album.id] = clues.slice(0, 3).map((item) => item.name);
          return state.currentClues[album.id];
        }
  
        function showToast(message) {
          const toast = el('toast');
          toast.textContent = message;
          toast.classList.remove('show');
          void toast.offsetWidth;
          toast.classList.add('show');
        }
  
        function popDeskItem() {
          const desk = el('deskScene');
          desk.classList.remove('pop');
          void desk.offsetWidth;
          desk.classList.add('pop');
          state.deskLayer = (state.deskLayer + 1) % 4;
        }
  
        function revealFragment(album, fragment, duplicate) {
          const reveal = el('fragmentReveal');
          reveal.innerHTML = `<b>${album.label} / ${fragment.name}</b><p>${duplicate ? '重复碎片化成了一点旧光。' : fragment.text}</p>`;
          reveal.classList.remove('show');
          void reveal.offsetWidth;
          reveal.classList.add('show');
        }

        function clearPendingPickup() {
          state.pendingPickup = null;
        }

        function nextOrderItem(album) {
          const clues = currentClues(album);
          const owned = new Set(state.orderFound[album.id]);
          const missing = clues.filter((item) => !owned.has(item));
          return missing[0] || clues[Math.floor(Math.random() * clues.length)];
        }

        function completeOrder(album) {
          const clues = currentClues(album);
          const owned = new Set(state.found[album.id]);
          clues.forEach((item) => {
            if (!owned.has(item) && fragmentByName(album, item)) {
              state.found[album.id].push(item);
              owned.add(item);
            }
          });
          const becameComplete = isComplete(album) && !state.completed.includes(album.id);
          showToast(`三件旧物放回去了，${album.title}亮了一点。`);
          state.orderFound[album.id] = [];
          pickCurrentClues(album);
          if (becameComplete) {
            state.completed.push(album.id);
            state.lastCompletedId = album.id;
            window.setTimeout(() => openMemoryScene(album), 850);
          }
        }
  
        function drawFragment() {
          if (state.pendingPickup) {
            showToast('先把刚翻出来的旧物拾起来。');
            return;
          }

          if (state.drawsLeft <= 0) {
            if (state.resetsLeft > 0) {
              resetByShare();
            } else {
              showToast('今晚的小灯已经暗了，明天窗边小书桌会再亮起。');
            }
            return;
          }
  
          popDeskItem();
          state.drawsLeft -= 1;
          const album = selectedAlbum();
          const itemName = nextOrderItem(album);
          const fragment = fragmentByName(album, itemName) || randomFragment(album).fragment;
          const duplicate = state.orderFound[album.id].includes(itemName);
          state.selectedAlbumId = album.id;

          state.pendingPickup = {
            albumId: album.id,
            itemName,
            duplicate,
          };
  
          render();
        }

        function collectPendingItem() {
          if (!state.pendingPickup) return;
          const album = albums.find((item) => item.id === state.pendingPickup.albumId) || selectedAlbum();
          const { itemName, duplicate } = state.pendingPickup;
          const fragment = fragmentByName(album, itemName) || randomFragment(album).fragment;

          const collection = collectFragment(state, album, itemName, currentClues(album));

          revealFragment(album, fragment, duplicate || collection.alreadyCollected);
          clearPendingPickup();

          if (collection.orderComplete) {
            completeOrder(album);
          }

          render();
        }
  
        function openShare(album = selectedAlbum()) {
          if (!isComplete(album)) {
            showToast(`${album.label} 还差 ${album.required - albumProgress(album)} 枚碎片才能进入回忆场景。`);
            return;
          }
          openMemoryScene(album);
        }
  
        function openMemoryScene(album = selectedAlbum()) {
          if (!isComplete(album)) {
            showToast(`${album.label} 还差 ${album.required - albumProgress(album)} 枚碎片才能进入回忆场景。`);
            return;
          }
          state.selectedAlbumId = album.id;
          const scene = memoryScenes[album.id] || memoryScenes.teen;
          const collected = album.fragments.filter((fragment) => state.found[album.id].includes(fragment.name));
          el('sceneCard').innerHTML = `
            <small>${album.label} / ${scene.label}</small>
            <h3>${album.title}</h3>
            <div class="memory-scene ${album.id}">
              <span class="scene-window"></span>
              <span class="scene-light"></span>
              <span class="scene-object a"></span>
              <span class="scene-object b"></span>
              <span class="scene-object c"></span>
            </div>
            <p>${scene.mood}</p>
            <div class="scene-tags">${scene.objects.map((item) => `<span>${item}</span>`).join('')}</div>
            <p>${scene.whisper}</p>
            <ul>${collected.map((fragment) => `<li>${fragment.name}</li>`).join('')}</ul>
          `;
          el('sceneOverlay').classList.add('open');
          render();
        }
  
        function resetByShare() {
          if (state.drawsLeft > 0) {
            openShare();
            return;
          }
          if (state.resetsLeft <= 0) {
            showToast('今晚的小灯已经重亮过 3 次了。');
            return;
          }
          state.resetsLeft -= 1;
          state.drawsLeft = DAILY_LIMIT;
          showToast(`窗边小灯又亮了，今晚还可以再翻找 ${DAILY_LIMIT} 次。`);
          render();
        }

        function renderAlbumStrip() {
          const albumButtons = albums.map((album) => {
            const progress = albumProgress(album);
            const percent = Math.min(100, (progress / album.required) * 100);
            const classes = [
              'album-chip',
              state.selectedAlbumId === album.id ? 'active' : '',
              isComplete(album) ? 'complete' : '',
            ].join(' ');
            return `
              <button type="button" class="${classes}" data-album="${album.id}">
                <strong>${album.label}</strong>
                <span>${progress}/${album.required}</span>
                <div class="mini-bar"><i style="width:${percent}%"></i></div>
              </button>
            `;
          }).join('');
          el('albumStrip').innerHTML = albumButtons;
          el('bottomAlbumStrip').innerHTML = albumButtons;
          document.querySelectorAll('[data-album]').forEach((button) => {
            button.addEventListener('click', () => {
              clearPendingPickup();
              state.selectedAlbumId = button.dataset.album;
              render();
            });
          });
        }

        function renderOrder() {
          const album = selectedAlbum();
          const clues = currentClues(album);
          const owned = new Set(state.orderFound[album.id]);
          el('orderMeta').textContent = `碎片册 · ${album.label}`;
          el('orderTitle').textContent = selectedOrder().title;
          el('orderSlots').innerHTML = clues.map((item) => {
            const filled = owned.has(item);
            const fragment = fragmentByName(album, item);
            return `
              <article class="order-slot ${filled ? 'filled' : ''}">
                <span>${filled && fragment ? fragment.icon : '?'}</span>
                <b>${filled ? item : '未拾起'}</b>
              </article>
            `;
          }).join('');
        }
  
        function renderAlbumDetail() {
          const album = selectedAlbum();
          const owned = new Set(state.found[album.id]);
          const progress = albumProgress(album);
          const percent = Math.min(100, (progress / album.required) * 100);
          const complete = isComplete(album);
          el('sheetTitle').textContent = `${album.label} / ${album.title}`;
          el('sheetProgress').textContent = `${progress}/${album.required} 枚碎片`;
          el('sheetProgressBar').style.width = `${percent}%`;
          el('sheetSummary').textContent = complete
            ? '这组碎片已经拼成一处回忆场景，右上角可以进去看看。'
            : `${album.summary} 还差 ${album.required - progress} 枚碎片亮起场景。`;
          el('albumDetail').innerHTML = album.fragments.map((fragment) => {
            const found = owned.has(fragment.name);
            return `
              <article class="fragment-card ${found ? '' : 'missing'}">
                <div class="fragment-icon">${found ? fragment.icon : '?'}</div>
                <div>
                  <small>${found ? '已拾取' : '未拾取'}</small>
                  <b>${found ? fragment.name : '未获得碎片'}</b>
                  <p>${found ? fragment.text : '还没有在桌上的旧物里找到。'}</p>
                </div>
              </article>
            `;
          }).join('');
        }
  
        function render() {
          const album = selectedAlbum();
          const progress = albumProgress(album);
          const canShareAlbum = isComplete(album);
          const outOfDraws = state.drawsLeft <= 0;
          const order = selectedOrder();
          const clues = currentClues(album);
          const pendingAlbum = state.pendingPickup
            ? albums.find((item) => item.id === state.pendingPickup.albumId)
            : null;
          const pendingFragment = state.pendingPickup && pendingAlbum
            ? fragmentByName(pendingAlbum, state.pendingPickup.itemName)
            : null;
          el('drawActionText').textContent = outOfDraws ? (state.resetsLeft > 0 ? '再翻一轮' : '明天再翻') : '翻出一件';
          el('drawLeft').textContent = outOfDraws
            ? (state.resetsLeft > 0 ? '今晚的小灯暂时暗了' : '这一页先停在这里')
            : `今日还可 ${state.drawsLeft} 次`;
          el('resetLeft').textContent = outOfDraws && state.resetsLeft > 0 ? `可重亮 ${state.resetsLeft} 次` : '';
          el('currentArchiveProgress').textContent = `当前 ${progress}/${album.required}`;
          el('dockRewardText').textContent = canShareAlbum
            ? '这一页已经亮起，可以走进回忆'
            : `还差 ${Math.max(0, clues.length - state.orderFound[album.id].length)} 件，点亮本页`;
          el('dockSubText').textContent = state.pendingPickup
            ? '已翻出，点一下收下。'
            : '翻出后点一下拾取。';
          el('heroTitle').textContent = order.deskLine;
          el('deskHint').textContent = state.pendingPickup ? '翻出来了，点一下收进碎片册。' : '开一格，看看今天浮上来的旧物。';
          el('heroText').textContent = canShareAlbum ? '这一页已亮起，可以走进回忆。' : '开一格旧物，点亮一页回忆。';
          el('drawButton').disabled = state.drawsLeft <= 0 && state.resetsLeft <= 0;
          el('drawButton').setAttribute('aria-label', state.drawsLeft > 0 ? '翻找一件旧物' : state.resetsLeft > 0 ? '重新点亮小灯' : '今晚翻找已结束');
          el('deskScene').classList.toggle('layer-1', state.deskLayer === 1);
          el('deskScene').classList.toggle('layer-2', state.deskLayer === 2);
          el('deskScene').classList.toggle('layer-3', state.deskLayer === 3);
          ['childhood', 'teen', 'young', 'adult'].forEach((id) => {
            el('appRoot').classList.toggle(`scene-${id}`, album.id === id);
            el('phoneShell').classList.toggle(`scene-${id}`, album.id === id);
            el('deskScene').classList.toggle(`scene-${id}`, album.id === id);
          });
          el('foundItem').classList.toggle('show', Boolean(state.pendingPickup));
          el('foundItemIcon').textContent = pendingFragment ? pendingFragment.icon : '?';
          el('foundItemName').textContent = pendingFragment ? pendingFragment.name : '翻出的旧物';
          el('shareButton').setAttribute('aria-label', outOfDraws && state.resetsLeft > 0 ? '重新点亮小灯' : canShareAlbum ? '进入回忆场景' : `回忆场景尚未亮起，已收集 ${progress}/${album.required} 枚`);
          el('shareButton').disabled = outOfDraws ? state.resetsLeft <= 0 : !canShareAlbum;
          el('albumSheet').classList.toggle('open', state.sheetOpen);
          renderAlbumStrip();
          renderOrder();
          renderAlbumDetail();
          saveCollectionState(storage, state);
        }
  
        el('drawButton').addEventListener('click', drawFragment);
        el('albumButton').addEventListener('click', () => {
          state.sheetOpen = true;
          render();
        });
        el('closeAlbum').addEventListener('click', () => {
          state.sheetOpen = false;
          render();
        });
        el('shareButton').addEventListener('click', resetByShare);
        el('closeScene').addEventListener('click', () => el('sceneOverlay').classList.remove('open'));
        el('foundItem').addEventListener('click', collectPendingItem);
        render();
      
});
</script>
