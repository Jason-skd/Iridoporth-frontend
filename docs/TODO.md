> 20260617

# flight-log TODO list

P0:

- [ ] admin 管理后台

P1:

- [ ] 用户点赞/编辑/删除

P2:

- [ ] ip -> 城市, 用户可选记录在每条 flight-log

P3:

- [ ] 拓充 assets

## 1. admin 管理后台

- [ ] 邮箱/密码登录页, 暂不设注册方法, 也不在 home page 留入口, 先供给 admin 使用, 预先将账号密码信息打进数据库, 通过端点 `/login` 直接使用
- [ ] admin 管理后台, 其中核心功能是 filght-log 管理界面, 需要支持回复/隐藏, 需要能看到几个列表:
    1. active
    2. unreplied
    3. hidden
    4. deleted

    对于 active, admin 只能 hide, 对于 hidden, admin 能够 display, 对于 unreplied, admin 可以 hide 或者 reply

## 2. 用户点赞/编辑/删除

- [ ] 仅查看不发放身份; 首次写操作由后端懒创建 90 天匿名 cookie, 后端返回列表时, 需要标注哪些 flight-log 是用户自己创建的, 哪些是用户已经点赞的, 前端依据渲染大拇指是否点亮/是否可以 edit/delete

## 3. ip -> 城市, 用户可选记录在每条 flight-log

技术路径和实践方法研究中
