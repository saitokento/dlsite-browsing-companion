export interface Work {
  name: string;
  price: number;
  officialPrice: number;
  couponPrice: number | null;
  priceCurrency: string;
  genres: string[];
  description: string;
}

export type Path = "ask";
