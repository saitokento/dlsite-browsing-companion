import { defineExtensionMessaging } from "@webext-core/messaging";
import { UserbuyWork, Work, CartListPayload } from "@/utils/types";

interface ProtocolMap {
  "work:extracted": (data: Work) => void;
  "home:hello": () => void;
  "circle:new": (data: CircleWork[]) => void;
  "userbuy:page1": (data: UserbuyWork[]) => void;
  "cart:list": (data: CartListPayload) => void;
  "comment:stream-start": () => void;
  "comment:stream-chunk": (data: string) => void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
