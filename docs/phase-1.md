# Iridoporth 开发阶段一

阶段一目标是清理默认模板，建立页面结构、视觉基调和后续资源接入点。

## 已完成范围

1. 移除 Vite 默认首页内容。
2. 建立两屏页面结构：
   - 首页：舷窗意象、标题区域、纸质背景基调。
   - 下滑页：树莓派状态信息、孤独星球和飞机掠过的背景占位。
3. 建立树莓派状态轮询骨架：
   - 默认每 5 秒刷新。
   - 支持通过 `VITE_STATUS_ENDPOINT` 指定真实接口。
   - 接口未配置或请求失败时使用本地 mock 数据。
4. 重写基础 CSS 变量：
   - 卡其纸色背景。
   - 深色线条。
   - 柔和分隔线。
   - 轻量纸纹占位。
5. 保留后续设计 asset 的替换空间。

## 当前占位说明

阶段一暂未接入真实设计资源，以下元素由 CSS 临时绘制：

1. 首页舷窗。
2. 舷窗内云线和地平线。
3. 状态页孤独星球。
4. 状态页飞机。
5. 纸质纹理。
6. 标题视觉。

这些占位只用于建立布局和节奏。设计侧资源到位后，应替换为 `src/assets/` 下的正式 asset。

## 状态接口约定草案

前端当前预期接口返回：

```json
{
  "cpuTemp": 47.8,
  "cpuUsage": 18,
  "memoryUsage": 42,
  "updatedAt": "2026-05-21T00:00:00.000Z"
}
```

字段说明：

1. `cpuTemp`: CPU 温度，单位摄氏度。
2. `cpuUsage`: CPU 占用，百分比数值。
3. `memoryUsage`: 内存占用，百分比数值。
4. `updatedAt`: 数据更新时间，ISO 字符串。

真实接口地址通过环境变量配置：

```text
VITE_STATUS_ENDPOINT=https://example.com/status
```

## 下一阶段建议

1. 接入设计侧标题 SVG：
   - `src/assets/home/title/iridoporth-title-desktop.svg`
   - `src/assets/home/title/iridoporth-title-mobile.svg`
2. 接入首页舷窗 SVG 和纸纹图片。
3. 接入状态页星球、飞机 SVG。
4. 根据正式 asset 微调布局比例和响应式断点。
5. 与后端确认树莓派状态接口结构。
