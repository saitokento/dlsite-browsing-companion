import { defineExtensionMessaging } from "@webext-core/messaging";
import { WorkInfo } from "@/utils/types";

interface ProtocolMap {
  "work:info-extracted": (data: WorkInfo) => void;
  "comment:stream-start": () => void;
  "comment:stream-chunk": (data: string) => void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
