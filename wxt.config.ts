import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  webExt: {
    startUrls: ["chrome://newtab/"],
  },
  manifest: {
    name: "DLsite Browsing Companion",
    description:
      "DLsiteの閲覧中にAIキャラクターがコメントをしてくれるブラウザ拡張機能です。 作品情報、購入履歴、サークルの作品一覧、カート内容などをもとに、コメントを生成してサイドパネルに表示します。",
    permissions: ["storage", "scripting"],
    host_permissions: ["https://www.dlsite.com/*"],
    side_panel: {
      default_path: "sidepanel.html",
    },
  },
  srcDir: "src",
});
