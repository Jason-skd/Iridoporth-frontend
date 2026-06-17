# Iridoporth Frontend

Iridoporth 的个人前端，基于 React、TypeScript、Vite。

## 页面

- `/`：首页
- `/raspi-status`：Raspi 状态
- `/flight-log`：飞行日志

## 本地运行

```sh
npm install
npm run dev
```

默认将 `/api/*` 代理到 `http://127.0.0.1:3000`。如需覆盖：

```sh
VITE_DEV_API_TARGET=http://127.0.0.1:3000 npm run dev
```

## 检查

```sh
npm run lint
npm run build
```
