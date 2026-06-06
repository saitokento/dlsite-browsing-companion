import { defineExtensionMessaging } from "@webext-core/messaging";

export interface ProtocolMap {
  "popup:comment-triggered": () => void;
  "options:history-reset": () => void;
  "content:wait-dom-ready"(data: { timeoutMs?: number }): boolean;
  "work:extracted": (data: Work) => void;
  "home:open": (data: Home) => void;
  "home:triggered": () => void;
  "home:hello": (data: string) => void;
  "circle:new": (data: CircleNewPayload) => void;
  "userbuy:open": () => void;
  "userbuy:triggered": () => void;
  "userbuy:extracted": (data: UserbuyWork[]) => void;
  "cart:list": (data: CartListPayload) => void;
  "download:list": (data: DownloadListPayload) => void;
  "comment:stream-start": () => void;
  "comment:stream-chunk": (data: string) => void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
