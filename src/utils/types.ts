export interface WorkInfo {
  name: string;
  price: number;
  officialPrice: number;
  couponPrice: number | null;
  pricePrefix: string;
  priceSuffix: string;
  genres: string[];
  description: string;
}
