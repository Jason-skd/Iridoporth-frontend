# Iridoporth Frontend

Iridoporth 的个人前端，基于 React 19、TypeScript、Vite 8。

## 页面

- `/`：首页
- `/raspi-status`：Raspi 状态
- `/flight-log`：Ask Me Anything / 匿名提问
- `/login`：admin 登录
- `/admin`：flight-log 管理后台

`/login`、`/admin` 不在主导航中；`/admin` 自校验权限，非管理员会被引导离开。登录态由后端 HttpOnly cookie 维持，无登出入口。

## 本地运行

```sh
npm install
npm run dev
```

默认将 `/api/*` 代理到 `http://127.0.0.1:3000`。如需覆盖：

```sh
VITE_DEV_API_TARGET=http://127.0.0.1:3000 npm run dev
```

flight-log 与 admin 依赖后端 `/api/v1/*`，单独跑前端时这两个页面会取不到数据。

## 检查

```sh
npm run lint
npm run build     # 先 tsc -b 类型检查，再 vite build
npx tsc -b        # 仅类型检查
```

本项目无测试框架。

## 部署

`Dockerfile` 两段构建：`node:22-alpine` 跑 `npm run build`，`nginx:1.27-alpine` 托管 `dist/`，nginx 将 `/api/` 反代到 `http://backend:3000/api/`。打 `v*.*.*` tag 会触发 GitHub Actions 构建并推送到 `ghcr.io/jason-skd/iridoporth-frontend`。
