# Iridoporth 设计资源交付契约

本文档用于约定设计侧向前端交付的视觉资源内容、格式和命名规则。目标是在保证视觉个性化的同时，让前端实现保持语义清晰、响应式稳定、资源与逻辑分离。

## 1. 总体原则

1. 所有图样由设计侧提供，前端只负责引用、布局、响应式适配和数据逻辑。
2. 视觉资源不应绘死在 React 组件或业务逻辑中。
3. 线条类、标题类、图标类资源优先使用 SVG。
4. 纹理类、复杂质感类资源可使用 PNG 或 WebP。
5. 所有资源必须有明确命名、明确用途和稳定画布尺寸。
6. 同一视觉元素如果在 desktop 和 mobile 上构图不同，应分别提供资源。
7. 资源应尽量避免依赖系统字体；品牌标题、中文标题等关键视觉文字建议转曲。

## 2. 推荐目录结构

设计侧交付资源后，前端预期按以下结构放置：

```text
src/assets/
  home/
    title/
      iridoporth-title-desktop.svg
      iridoporth-title-mobile.svg
    porthole/
      cabin-window.svg
      paper-texture.webp
  status/
    planet/
      lonely-planet.svg
    airplane/
      passing-plane.svg
  shared/
    README.md
```

如设计侧有更细分的资源，可以在对应目录下扩展，但应保持命名语义清晰。

## 3. 标题资源

### 3.1 视觉内容

标题内容为：

```text
Iridoporth - 舷窗
```

设计目标：

1. 足够醒目。
2. 有线条感。
3. 与卡其色纸质背景、舷窗线稿风格统一。
4. 具备个人网站的识别性，不应像通用字体排版。

### 3.2 交付文件

请提供两份 SVG：

```text
src/assets/home/title/iridoporth-title-desktop.svg
src/assets/home/title/iridoporth-title-mobile.svg
```

desktop 版本：

```text
Iridoporth - 舷窗
```

要求一行展示。

mobile 版本建议拆成两行：

```text
Iridoporth
舷窗
```

也可以根据设计判断保留连接符，但应保证小屏上阅读舒适。

### 3.3 前端使用方式

前端会保留真实文本标题作为语义层：

```text
Iridoporth - 舷窗
```

用户可见标题使用设计侧提供的 SVG asset。也就是说，设计资源负责视觉呈现，真实文本负责 SEO、可访问性和页面结构。

### 3.4 SVG 导出要求

1. 必须包含 `viewBox`。
2. 不要依赖外部字体文件。
3. 关键标题文字建议转曲为 path。
4. 不要将背景色烘焙进标题 SVG，标题应为透明背景。
5. 画布边缘需要留出安全边距，避免缩放时裁切笔画。
6. 尽量删除设计软件导出的无用 metadata。
7. 如果标题颜色需要前端可控，路径颜色请使用 `currentColor`。
8. 如果标题颜色固定，请在交付说明中标明推荐背景色和标题色。

## 4. 首页舷窗资源

### 4.1 视觉内容

首页核心画面是线条描绘的飞机舷窗外场景。

设计目标：

1. 舷窗应成为第一屏的视觉中心。
2. 风格轻量、简约，避免复杂写实。
3. 线条粗细应与标题风格协调。
4. 画面可以包含窗框、云层、天空、远景等元素，但整体应克制。

### 4.2 交付文件

请优先提供：

```text
src/assets/home/porthole/cabin-window.svg
```

如 desktop 和 mobile 构图明显不同，可提供：

```text
src/assets/home/porthole/cabin-window-desktop.svg
src/assets/home/porthole/cabin-window-mobile.svg
```

### 4.3 SVG 导出要求

1. 必须包含 `viewBox`。
2. 背景透明。
3. 不要在 SVG 中包含页面背景色。
4. 线条端点、转角、连接方式应在设计稿中明确。
5. 如果需要前端统一控制颜色，线条颜色使用 `currentColor`。
6. 如果有多个颜色层级，请在交付说明中列出每个颜色的用途。

## 5. 纸质背景资源

### 5.1 视觉内容

首页背景为纯色卡其色，配少量纹理，模拟纸质感。

设计目标：

1. 质感应非常轻，不要抢过标题和舷窗。
2. 纹理需要适合大面积铺底。
3. 避免明显重复边界。
4. 不应出现高对比颗粒或脏污感。

### 5.2 交付文件

请提供：

```text
src/assets/home/porthole/paper-texture.webp
```

如需要兼容透明叠加，也可以提供：

```text
src/assets/home/porthole/paper-texture.png
```

### 5.3 交付要求

1. 纹理应可平铺或足够大以覆盖常见桌面屏。
2. 推荐提供透明纹理层，由前端叠加在背景色上。
3. 请标明推荐背景主色，例如：

```text
paper base: #c8b88f
texture opacity: 8% - 14%
```

具体颜色由设计侧确定。

## 6. 树莓派状态页背景资源

### 6.1 孤独星球

状态页中心需要一颗孤独星球。

交付文件：

```text
src/assets/status/planet/lonely-planet.svg
```

设计目标：

1. 星球应位于画面中心附近。
2. 风格与首页舷窗一致，偏线条感。
3. 可以有少量阴影、纹理或轨道线，但不要变成厚重插画。
4. 星球需要给状态文字留出共存空间。

### 6.2 飞机

状态页上空有一架飞机掠过。

交付文件：

```text
src/assets/status/airplane/passing-plane.svg
```

设计目标：

1. 飞机应适合做轻微位移动画。
2. 形态可简化为线条剪影或线稿。
3. 飞机方向、大小和初始位置应与星球构图协调。
4. 背景透明。

如果设计侧希望飞机有轨迹线、云线或残影，请单独提供，不要与飞机主体强绑定。

可选交付：

```text
src/assets/status/airplane/plane-trail.svg
```

## 7. 颜色与设计 token

请设计侧提供一组基础颜色，前端会转为 CSS 变量。

建议至少包含：

```text
paper background
primary line
secondary line
muted text
status text
accent
border or divider
```

示例格式：

```text
paper background: #c8b88f
primary line: #3e3426
secondary line: #7b6d52
muted text: #6f654f
status text: #332c22
accent: #8a5338
divider: rgba(62, 52, 38, 0.18)
```

以上仅为格式示例，不代表最终色值。

## 8. 响应式断点约定

前端默认按以下断点理解资源：

```text
mobile: 0 - 720px
tablet: 721px - 1024px
desktop: 1025px 及以上
```

标题资源已明确需要 desktop 和 mobile 两版。其他资源如在不同断点构图差异较大，也请提供对应版本。

资源命名建议：

```text
element-desktop.svg
element-tablet.svg
element-mobile.svg
```

如果同一资源可通过缩放适配所有屏幕，则只需要提供一份。

## 9. 动画相关约定

如设计侧预期某个资源需要动画，请在交付说明中标明：

```text
resource: passing-plane.svg
motion: 从右上向左上缓慢掠过
duration: 12s - 18s
loop: yes
easing: linear 或 ease-in-out
```

前端会优先用 CSS 实现轻量动画。复杂逐帧动画或路径动画需要提前讨论。

标题资源默认不做动画，除非设计侧明确提供动画方案。

## 10. 状态文字共存要求

树莓派状态页会展示以下数据：

```text
CPU 温度
CPU 占用
内存占用
```

设计侧在构图时需要预留文字区域，避免关键图形与状态文字冲突。

前端倾向于让文字轻量叠加在背景旁侧或背景周围，而不是使用厚重卡片遮挡画面。

请设计侧提供至少一张标注稿，说明：

1. desktop 状态文字推荐位置。
2. mobile 状态文字推荐位置。
3. 星球中心点。
4. 飞机运动区域。
5. 不应被文字遮挡的视觉重点区域。

## 11. 交付说明文件

请设计侧随资源一起提供一份说明文件：

```text
src/assets/shared/README.md
```

说明文件至少包含：

1. 每个资源文件的用途。
2. 推荐展示尺寸或宽高比例。
3. 推荐背景色。
4. 颜色 token。
5. 是否允许前端改色。
6. 是否允许前端缩放、裁切或旋转。
7. 是否有动画预期。
8. 是否有版权或字体授权限制。

## 12. 前端验收标准

资源交付后，前端会按以下标准验收：

1. 页面中没有将复杂图形硬编码进业务组件。
2. desktop 标题一行展示，mobile 标题两行展示。
3. 标题视觉使用 asset，页面仍保留真实语义标题。
4. 首页背景具备轻微纸质感，但不影响阅读。
5. 舷窗、星球、飞机风格一致。
6. 状态页文字与背景共存，不明显遮挡核心视觉。
7. SVG 在不同屏幕尺寸下不模糊、不裁切。
8. 文件命名清晰，后续维护者能直接理解用途。

## 13. 待确认事项

以下事项需要设计侧和前端共同确认：

1. 标题最终文案是否固定为 `Iridoporth - 舷窗`。
2. mobile 标题是否保留连接符。
3. 标题颜色是否由前端控制，还是固定在 SVG 中。
4. 首页舷窗是否需要 desktop 和 mobile 两版构图。
5. 纸质纹理是透明叠加层，还是包含底色的完整背景图。
6. 飞机是否需要动画。
7. 树莓派状态文字的推荐排版位置。
8. 是否需要深色模式资源。
