export interface Work {
  name: string;
  price: string;
  officialPrice: string;
  couponPrice: string | null;
  pricePrefix: string;
  priceSuffix: string;
  genres: string[];
  description: string;
}

export interface CircleWork {
  productId: string;
  category: string;
  name: string;
  author: string | null;
  price: string;
  officialPrice: string;
  pricePrefix: string;
  priceSuffix: string;
  label: string | null;
}

export interface UserbuyWork {
  productId: string;
  buyDate: string;
  name: string;
  makerName: string;
  genres: string[];
  price: string;
  pricePrefix: string;
  priceSuffix: string;
}

export interface CartWork {
  productId: string;
  name: string;
  makerName: string;
  category: string;
  price: string;
  officialPrice: string;
}

export interface DownloadWork {
  productId: string;
  name: string;
  makerName: string;
  genre: string;
}

export type HomeHelloPayload = {
  floor: string;
};

export type WorkPayload = {
  work: Work;
};

export type CircleNewPayload = {
  makerName: string;
  circleWorkList: CircleWork[];
};

export type UserbuyPage1Payload = {
  userbuyWorkList: UserbuyWork[];
};

export type CartListPayload = {
  cartWorkList: CartWork[];
  totalDiscount: string;
  totalOriginal: string | null;
  couponName: string | null;
  totalCoupon: string | null;
  pricePrefix: string;
  priceSuffix: string;
};

export type DownloadListPayload = {
  downloadWorkList: DownloadWork[];
};

type EmptyPayload = Record<string, never>;

export type PayloadByUsecase = {
  work: WorkPayload;
  "home:hello": HomeHelloPayload;
  "circle:new": CircleNewPayload;
  "userbuy:page1": UserbuyPage1Payload;
  "cart:list": CartListPayload;
  "download:list": DownloadListPayload;
};

export type Usecase = keyof PayloadByUsecase;

export type CharacterId = "default";
