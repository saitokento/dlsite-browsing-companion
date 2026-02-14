import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  webExt: {
    startUrls: ["https://www.dlsite.com/index.html"],
  },
  manifest: {
    name: "DLsite Browsing Companion",
    description: "",
    permissions: ["sidePanel"],
    side_panel: {
      default_path: "entrypoints/sidepanel.html",
    },
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA42yyi2ug2xexit66k4B9FcNAq2OP8Hf4OUcktyvMN0OZ+aruvL4udovobs3RFyR0zMD4ABv0fYHDLTsiLrqlayhce5ty9AhicdV1Ysu6/AV8I5Ecrz3vsi79220ZFFvlFw+ImINon28YJFGuk4s20X/vV6aFnOuPVG1iNHNgomoBJAk4FPA0f1QzjyXpcoOu0ppKgwE8tTCpjP5SH2uKeyuUuG3Oo+3gP7a41moACI1x4ifOnKGyQ4TIYZcJ9o6DshlTCJSGpv8huLYwn+nyTHpEaoXFO/YQxRkAgIj5oibFMQcU6EI8bfxqQxMzGVTey4zPhv89fkL7LHRjvgIXPQIDAQAB",
  },
  srcDir: "src",
});
