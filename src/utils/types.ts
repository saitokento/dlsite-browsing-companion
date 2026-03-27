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

export type Usecase = "work";
