export default defineContentScript({
  matches: ["https://www.dlsite.com/*/circle/profile/=/maker_id/*.html"],
  main,
});

function main(): void {
  sendMessage("circle:new").catch((err) => {
    console.error("Failed to send 'circle:new':", err);
  });
}
