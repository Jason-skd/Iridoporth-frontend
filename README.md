# Iridoporth Frontend

Iridoporth 的前端界面，使用 React、TypeScript 和 Vite 构建。页面以舷窗、航线和纸面地图为视觉主题，展示入口画面，并轮询设备状态接口呈现树莓派运行遥测。

## 功能

- 提供 Iridoporth 舷窗主题单页界面
- 支持鼠标滚轮、方向键和翻页键切换页面
- 每 5 秒请求一次树莓派状态
- 展示 CPU 温度、CPU 占用和内存占用
- 在设备不可用或数据缺失时显示对应的离线 / 信号缺失状态

## 环境要求

- Node.js 22 或兼容当前依赖的版本
- npm

## 本地运行

安装依赖：

```sh
npm install
```

启动开发服务器：

```sh
npm run dev
```

前端会请求：

```http
GET /api/v1/raspi/status
```

开发环境中如需连接本地后端，可在 Vite 或本地代理中将 `/api/` 转发到后端服务。

## 构建

```sh
npm run build
```

构建产物默认输出到：

```text
dist/
```

本地预览构建产物：

```sh
npm run preview
```

## 检查

```sh
npm run lint
```

## Docker

构建镜像：

```sh
docker build -t iridoporth-frontend:dev .
```

运行：

```sh
docker run --rm -p 8080:80 iridoporth-frontend:dev
```

镜像使用 Nginx 托管静态文件，并将 `/api/` 代理到 `backend:3000`。

## 目录结构

```text
src/
  App.tsx                    # 页面结构、状态请求和翻页交互
  App.css                    # 页面视觉和响应式样式
  index.css                  # 全局变量和基础样式
  main.tsx                   # 应用入口
  assets/                    # 舷窗、标题和状态插画
public/
  favicon.svg
  icons.svg
docs/
  demand.md                  # 需求说明
  design-asset-contract.md   # 设计资产约定
  phase-1.md                 # 阶段记录
```
