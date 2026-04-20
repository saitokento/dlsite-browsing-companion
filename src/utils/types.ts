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

export type WorkPayload = {
  work: Work;
};

type EmptyPayload = Record<string, never>;

export type PayloadByUsecase = {
  work: WorkPayload;
  "home:hello": EmptyPayload;
};

export type Usecase = keyof PayloadByUsecase;

export type CharacterId = "default";
