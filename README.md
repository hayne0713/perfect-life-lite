# Perfect Life Lite

以手機為主的繁體中文個人生活紀錄 PWA。用活動計時記下每天實際做了什麼，安排日期提醒，並紀錄睡眠與飲食。資料儲存在本機 IndexedDB，不需要帳號或後端；完成首次載入後可離線開啟。

## 功能

- 活動計時：輸入任意活動名稱開始，切換活動會結束上一段；重複活動會分段保存並彙總當日時數。休息可計時，也可以留白。計時以儲存的起迄時間計算，App 在背景或關閉時畫面不會常駐更新，重新開啟後會正確回算時長。
- 睡眠計時：睡前開始、起床結束；跨日計算，過去紀錄可補登或修正。
- 日期提醒：替任務選擇到期日，在 App 內查看、完成或修改。提醒不會在 App 關閉時推播。
- 月曆：直接選取日期，並用小點標示活動、睡眠、飲食與提醒。
- 飲食紀錄：早餐、午餐、晚餐或其他，可加文字與照片；照片會縮小後存入本機。
- 備份：匯出包含照片的完整 JSON，支援匯入舊版備份。匯入會取代本機資料，執行前會再次確認。
- PWA 離線使用：畫面和資料在本機，不會自動同步到其他瀏覽器或裝置。

## 本機啟動與檢查

需要 Node.js 22 或更新版本。

```bash
npm install
npm run dev
```

開啟終端機顯示的網址，通常是 `http://localhost:5173`。

```bash
npm test
npm run build
npm run preview
```

`npm test` 執行計時和跨日彙總測試；`npm run build` 會先執行 TypeScript 檢查，再建置 PWA。

## GitHub Pages 部署

線上 App：[https://hayne0713.github.io/perfect-life-lite/](https://hayne0713.github.io/perfect-life-lite/)。推送到 `main` 後，GitHub Actions 會自動建置並部署；可在 repo 的 **Actions** 頁面查看結果。Pages 發布來源需使用 **GitHub Actions**。

## Android Chrome 安裝

1. 用 Android Chrome 開啟 [Perfect Life Lite](https://hayne0713.github.io/perfect-life-lite/)，等首次載入完成。
2. 點右上角 **⋮ → 安裝應用程式**；若顯示 **新增至主畫面**，也可以選擇。
3. 從主畫面開啟 App。可先開啟一次，再暫時切換飛航模式重新打開，測試離線快取。

## 每日提醒

App 不會在背景推播。若想固定提醒自己打開 App，可在 Android **時鐘 → 鬧鐘 → 新增** 設定每日重複鬧鐘，標籤例如「記錄今天的生活」。日期提醒會在你打開 App 時出現在首頁。

## 資料架構

畫面依功能放在 `src/features/`，共用頁面狀態由 `src/App.tsx` 管理，本機 IndexedDB 與備份邏輯集中在 `src/data.ts`，日期和時間輔助函式放在 `src/shared/`。新增功能時，優先放進對應 feature，再透過共用資料層存取資料。

所有資料只存在目前裝置的瀏覽器儲存區。清除 Chrome 網站資料、解除安裝 App 或更換裝置可能移除紀錄，請定期匯出備份。
