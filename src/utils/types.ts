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

export type WorkPayload = {
  work: Work;
};

export type CircleNewPayload = {
  circleWorkList: CircleWork[];
};

type EmptyPayload = Record<string, never>;

export type PayloadByUsecase = {
  work: WorkPayload;
  "home:hello": EmptyPayload;
  "circle:new": CircleNewPayload;
};

export type Usecase = keyof PayloadByUsecase;

export type CharacterId = "default";
