import { defineExtensionMessaging } from "@webext-core/messaging";
import { WorkInfo } from "@/utils/types";

interface ProtocolMap {
  sendWorkInfo(data: WorkInfo): void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
