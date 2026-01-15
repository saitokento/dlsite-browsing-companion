import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "DLsite Browsing Companion",
    description: "",
    permissions: ["sidePanel"],
    side_panel: {
      default_path: "entrypoints/sidepanel.html",
    },
  },
  srcDir: "src",
});
