export interface Price {
  prefix: string;
  amount: number;
  suffix: string;
}

export interface WorkInfo {
  name: string;
  price: Price;
  coupon_price: Price;
  genres: string[];
  description: string;
}
