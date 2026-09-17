# media-gallery

一个基于 **Next.js 15** 的本地媒体站，从 `../downloads` 目录流式提供图片和视频。

## 目录结构约定

```
nextjs-gallery/
├── downloads/                # 媒体根目录 (MEDIA_ROOT)
│   └── new_zhizun/
│       ├── middle/<girl-dir>/
│       │   ├── images/poster.webp, image_001.webp, ...
│       │   ├── videos/<...>/video.mp4
│       │   ├── auth-videos/<...>/video.mp4
│       │   └── metadata.json
│       └── premium/<girl-dir>/
└── media-gallery/            # ← 本项目
```

只要目录里有 `images/`（放 webp/jpg/png）和 / 或 `videos/ + auth-videos/`（放 mp4/webm）就会被索引出来；`metadata.json` 中的 `title / cityName / displayPrice / id` 用作展示信息，缺失时回退到目录名。

## 启动

```bash
cd media-gallery
npm install
npm run dev        # 开发模式 http://localhost:3456
# 或
npm run build
npm start          # 生产模式
```

`media-gallery` 默认从 `../downloads` 读取。改成别的位置：

```bash
MEDIA_ROOT=/path/to/downloads npm run dev
```

## 公开访问

出于隐私安全考虑，middleware 默认只允许 `127.0.0.1 / 10.x / 192.168.x / 172.16-31 / 100.64-127` 来源。彻底放开（不推荐）：

```bash
MEDIA_GALLERY_ALLOW_ALL=1 npm start
```

## API

- `GET /api/files?path=<rel>` — 流式返回文件，支持 `Range` 头（HTML5 视频点状播放必需）

## 页面

- `/` — tier 总览 + 每个 tier 预览
- `/tier/new_zhizun/middle?page=N` — 列表 + 分页
- `/girl/<目录名>?tier=...` — 详情（封面、信息、视频、入口图库）
- `/girl/<目录名>/gallery?tier=&index=` — 全屏图片浏览（左右切换、缩略图、下载原图）
- `/girl/<目录名>/video/{media|auth}/<i>?tier=` — 视频播放
