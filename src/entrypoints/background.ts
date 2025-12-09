import { onMessage } from "@/utils/messaging";

export default defineBackground(() => {
  onMessage("sendWorkInfo", (message) => {
    console.log("Received WorkInfo:", message.data);
  });
});
