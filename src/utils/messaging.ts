import { defineExtensionMessaging } from "@webext-core/messaging";
import { Work } from "@/utils/types";

interface ProtocolMap {
  "work:extracted": (data: Work) => void;
  "comment:stream-start": () => void;
  "comment:stream-chunk": (data: string) => void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
