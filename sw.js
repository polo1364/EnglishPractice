// 單字怪獸 LinguaMon - Service Worker
// 讓 App 可以安裝到手機，並在沒有網路時也能開啟（訓練場、小遊戲、競技場不需要 API）
const VERSION = 'linguamon-v15';
const SHELL = [
    './',
    './index.html',
    './tailwind.css',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png',
    './icons/favicon-64.png'
];
// Q 版美術（怪獸 24 張 + 分支最終型態 16 張 + 魔王 20 張）
const ART = [
    ...['dragon', 'sea', 'cat', 'bird', 'bunny', 'bug', 'dino', 'ghost'].flatMap(s => [`sp_${s}_guard`, `sp_${s}_battle`]),
    ...['fox', 'wolf'].flatMap(s => [1, 2, 3, 'guard', 'battle'].map(f => `sp_${s}_${f}`)),   // 傳說種族
    'sp_dragon_1', 'sp_dragon_2', 'sp_dragon_3', 'sp_sea_1', 'sp_sea_2', 'sp_sea_3',
    'sp_cat_1', 'sp_cat_2', 'sp_cat_3', 'sp_bird_1', 'sp_bird_2', 'sp_bird_3',
    'sp_bunny_1', 'sp_bunny_2', 'sp_bunny_3', 'sp_bug_1', 'sp_bug_2', 'sp_bug_3',
    'sp_dino_1', 'sp_dino_2', 'sp_dino_3', 'sp_ghost_1', 'sp_ghost_2', 'sp_ghost_3',
    'boss_daily', 'boss_food', 'boss_travel', 'boss_shop', 'boss_school', 'boss_work',
    'boss_health', 'boss_tech', 'boss_feel', 'boss_nature', 'boss_home', 'boss_transit',
    'boss_fun', 'boss_fashion', 'boss_art', 'boss_social', 'boss_game', 'boss_money',
    'boss_science', 'boss_law'
].map(n => `./art/${n}.webp`);
const RUNTIME = `${VERSION}-runtime`;
const NEVER_CACHE = ['api.anthropic.com'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(VERSION).then(c => c.addAll([...SHELL, ...ART])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (NEVER_CACHE.includes(url.hostname)) return;

    // 自己的頁面：先抓網路（拿到最新版），失敗再用快取
    if (url.origin === self.location.origin) {
        event.respondWith(
            fetch(req)
                .then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })
                .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
        );
        return;
    }

    // CDN（字型、Fluent 圖示、彩帶特效）：先用快取，背景再更新
    event.respondWith(
        caches.open(RUNTIME).then(cache => cache.match(req).then(hit => {
            const net = fetch(req).then(res => {
                if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
                return res;
            }).catch(() => hit);
            return hit || net;
        }))
    );
});
