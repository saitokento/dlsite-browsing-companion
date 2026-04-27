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

export type WorkPayload = {
  work: Work;
};

export type CircleNewPayload = {
  circleWorkList: CircleWork[];
};

export type UserbuyPage1Payload = {
  userbuyWorkList: UserbuyWork[];
};

type EmptyPayload = Record<string, never>;

export type PayloadByUsecase = {
  work: WorkPayload;
  "home:hello": EmptyPayload;
  "circle:new": CircleNewPayload;
  "userbuy:page1": UserbuyPage1Payload;
};

export type Usecase = keyof PayloadByUsecase;

export type CharacterId = "default";
