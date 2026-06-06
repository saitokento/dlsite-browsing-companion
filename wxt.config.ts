import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  webExt: {
    startUrls: ["chrome://newtab/"],
  },
  manifest: {
    name: "DLsite Browsing Companion",
    description: "",
    permissions: ["sidePanel", "storage", "scripting"],
    host_permissions: ["https://www.dlsite.com/*"],
    side_panel: {
      default_path: "sidepanel.html",
    },
  },
  srcDir: "src",
});
