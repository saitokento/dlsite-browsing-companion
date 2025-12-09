export interface WorkInfo {
  name: string;
  price: number;
  officialPrice: number;
  couponPrice: number | null;
  prefix: string;
  suffix: string;
  genres: string[];
  description: string;
}
