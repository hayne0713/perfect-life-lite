# Perfect Life Lite

極簡的繁體中文個人生活紀錄 PWA。睡眠、每日任務、飲食與照片都儲存在目前瀏覽器的 IndexedDB，不需要帳號或伺服器。完成第一次載入後，Service Worker 會快取 App 檔案，之後可以離線開啟。

## 本機啟動

需要 Node.js 20 或更新版本。

```bash
npm install
npm run dev
```

終端機會顯示本機網址，通常是 `http://localhost:5173`。在同一個 Wi-Fi 網路用手機測試時，可執行：

```bash
npm run dev -- --host 0.0.0.0
```

開發伺服器網址不支援安裝成正式 PWA；請以 GitHub Pages 的 HTTPS 網址進行安裝和離線測試。

## 部署到 GitHub Pages

1. 將專案放進 GitHub repository，並把預設分支命名為 `main`。
2. 在 repository 的 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。
3. 推送到 `main`，或在 **Actions → Deploy to GitHub Pages → Run workflow** 手動啟動部署。
4. 等待 workflow 成功後，Actions 的部署工作會顯示網站網址，通常是 `https://<帳號>.github.io/<repository>/`。

Workflow 會依 repository 名稱設定 Vite 子路徑，所以不需要手動改路徑。也可以在本機執行 `npm run build` 建立 `dist` 資料夾。

## 在 Android 手機安裝

1. 用 Android 上的 Chrome 開啟已部署的 GitHub Pages HTTPS 網址，等待頁面載入完成一次。
2. 點右上角 Chrome **⋮**，選擇 **安裝應用程式**；部分版本會顯示 **新增至主畫面**。依畫面提示確認。
3. 回到主畫面點開 Perfect Life Lite。安裝後會以獨立視窗顯示。
4. 開啟一次後，可關閉 Wi-Fi 或切換飛航模式，再開啟 App 測試離線使用。

如果找不到安裝選項，先確認網站使用 HTTPS、Chrome 已更新，並重新整理頁面。首次開啟必須先連線，讓 App 完成快取。

## 每日提醒

第一版不使用背景推播。可以在 Android 系統的 **時鐘 → 鬧鐘 → 新增** 設定每天重複的提醒，在標籤中寫上「記錄今天的生活」，時間可選睡前或起床後。不同品牌的手機名稱可能略有差異；也可用 Google 日曆建立每天重複的提醒。App 首頁會列出當天尚未記錄的項目。

## 資料與備份

- 所有紀錄只存在目前瀏覽器或已安裝 App 的本機 IndexedDB。清除 Chrome 網站資料、解除安裝或更換裝置可能移除紀錄。
- 點首頁的 **備份** 可下載完整 JSON，內含睡眠、任務、飲食與壓縮照片。請將檔案保存到安全位置。
- 在新裝置點 **還原** 並選擇備份 JSON。匯入前 App 會要求確認，匯入會以備份內容取代該裝置原有紀錄。
- 每日餐點照片會縮至最長邊 1400 像素，再以 JPEG 存入 IndexedDB。可用空間由 Android/Chrome 管理，建議定期備份。
- 同一份資料不會自動同步到其他瀏覽器或裝置。
