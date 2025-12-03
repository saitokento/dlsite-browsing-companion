export default defineContentScript({
  matches: ["https://www.dlsite.com/*/work/=/product_id/*.html"],
  main() {
    console.log("Hello content.");
  },
});
