# 💪 每日训练打卡（PWA）

手机上的训练记录工具，支持添加到 iPhone 主屏幕、离线使用。

## 功能
- 📝 **记录页**：俯卧撑（个）、平板支撑（秒），每天可改可删，含历史列表
- 📈 **进度页**：折线图看进步，可切换近 7 天 / 近 30 天 / 全部，含最佳成绩
- 🎯 **舒尔特方格**：3×3 / 4×4 / 5×5 难度，自动计时、记录每次耗时，含耗时曲线与历史
- 💾 **备份**：数据仅存在手机本地，可一键导出 / 导入 JSON 备份

## 本地运行
```
python -m http.server 8000 --directory .   # 或任意静态服务器
```
手机与电脑连同一 WiFi，访问 `http://<电脑IP>:8000`。

## 部署到 GitHub Pages
1. 注册 GitHub 账号，新建仓库（如 `training-tracker`）
2. 把本文件夹所有文件上传到仓库（网页端可直接拖拽上传）
3. 仓库 Settings → Pages → Source 选 `Deploy from a branch`，分支选 `main`，目录 `/ (root)`
4. 保存后等待 1-2 分钟，访问 `https://<你的用户名>.github.io/training-tracker/`
5. 在 iPhone Safari 打开该网址 → 分享按钮 → 「添加到主屏幕」

> 提示：GitHub Pages 打开后，首次浏览会自动缓存全部文件（Service Worker），之后断网也能用。

## 文件结构
```
index.html      记录页
charts.html     进度页
schulte.html    舒尔特方格页
styles.css      全局样式
data.js         数据层（localStorage）
chart.umd.min.js  Chart.js（本地离线版）
sw.js           Service Worker（离线缓存）
manifest.json   PWA 清单
icon-*.png      App 图标
```

## 测试
```
node test-syntax.mjs   # 语法检查
node test-data.mjs     # 数据层单元测试
```
