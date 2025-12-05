export interface Price {
  prefix: string;
  amount: number | null;
  suffix: string;
}

export interface WorkInfo {
  name: string;
  price: Price;
  coupon_price: Price | null;
  genres: string[];
  description: string;
}
