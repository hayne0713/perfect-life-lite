# Perfect Life Lite

極簡的繁體中文個人生活紀錄 PWA。睡眠、每日任務、飲食與壓縮照片儲存在目前裝置瀏覽器的 IndexedDB，不需要帳號或伺服器；第一次開啟後可離線使用。

## 本機啟動

需要 Node.js 20 或更新版本。

```bash
npm install
npm run dev
```

終端機會顯示本機網址，通常是 `http://localhost:5173`。正式安裝與離線使用請使用 GitHub Pages 的 HTTPS 網址。

## GitHub Pages

App 網址：[https://hayne0713.github.io/perfect-life-lite/](https://hayne0713.github.io/perfect-life-lite/)。每次推送到 `main`，GitHub Actions 都會自動建置和部署；可在 repository 的 **Actions** 頁面查看進度。

## 在 Android 手機安裝

1. 用 Android Chrome 開啟 [Perfect Life Lite](https://hayne0713.github.io/perfect-life-lite/)，等待頁面載入完成一次。
2. 點 Chrome 右上角 **⋮ → 安裝應用程式**；若顯示 **新增至主畫面**，也可以選擇它。
3. 從主畫面開啟 Perfect Life Lite。第一次載入後，可切換飛航模式再開啟，確認離線使用正常。

## 每日提醒

第一版沒有背景推播。可在 Android **時鐘 → 鬧鐘 → 新增** 設定每天重複的提醒，標籤填「記錄今天的生活」；也可用 Google 日曆建立每日重複提醒。App 首頁會列出當天尚未記錄的項目。

## 資料與備份

- 紀錄只存在目前瀏覽器或已安裝 App 的本機 IndexedDB。清除 Chrome 網站資料、解除安裝或更換裝置可能移除紀錄。
- 首頁的 **備份** 會下載完整 JSON，包含睡眠、任務、飲食與照片。用 **還原** 匯入備份前，App 會先確認；匯入會取代該裝置現有紀錄。
- 餐點照片會縮至最長邊 1400 像素，再以 JPEG 儲存。建議定期備份。
- 資料不會自動同步到其他瀏覽器或裝置。
