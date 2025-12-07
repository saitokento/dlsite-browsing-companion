export interface WorkInfo {
  name: string;
  price: number;
  official_price: number;
  coupon_price: number | null;
  prefix: string;
  suffix: string;
  genres: string[];
  description: string;
}

export interface WorkInfoMessage {
  type: "WORK_INFO";
  payload: WorkInfo;
}
