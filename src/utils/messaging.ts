import { defineExtensionMessaging } from "@webext-core/messaging";
import {
  UserbuyWork,
  Work,
  CartListPayload,
  DownloadListPayload,
  CircleNewPayload,
} from "@/utils/types";

interface ProtocolMap {
  "work:extracted": (data: Work) => void;
  "home:hello": (data: string) => void;
  "circle:new": (data: CircleNewPayload) => void;
  "userbuy:page1": (data: UserbuyWork[]) => void;
  "cart:list": (data: CartListPayload) => void;
  "download:list": (data: DownloadListPayload) => void;
  "comment:stream-start": () => void;
  "comment:stream-chunk": (data: string) => void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
