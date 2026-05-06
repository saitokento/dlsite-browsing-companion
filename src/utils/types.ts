export interface Work {
  name: string;
  makerName: string;
  price: string;
  officialPrice: string;
  couponPrice: string | null;
  pricePrefix: string;
  priceSuffix: string;
  genres: string[];
  description: string;
}

export interface CircleAnnounceWork {
  productId: string;
  name: string;
  author: string | null;
  category: string;
  expectedDate: string;
  freeSample: boolean;
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
  labels: string[];
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

export interface CartWork {
  productId: string;
  name: string;
  makerName: string;
  category: string;
  price: string;
  officialPrice: string;
}

export interface DownloadWork {
  productId: string;
  name: string;
  makerName: string;
  genre: string;
}

export type HomeHelloPayload = {
  floor: string;
};

export type WorkPayload = {
  work: Work;
};

export type CircleNewPayload = {
  makerName: string;
  circleAnnounceWorkList: CircleAnnounceWork[];
  circleWorkList: CircleWork[];
};

export type UserbuyPage1Payload = {
  userbuyWorkList: UserbuyWork[];
};

export type CartListPayload = {
  cartWorkList: CartWork[];
  totalDiscount: string;
  totalOriginal: string | null;
  couponName: string | null;
  totalCoupon: string | null;
  pricePrefix: string;
  priceSuffix: string;
};

export type DownloadListPayload = {
  downloadWorkList: DownloadWork[];
};

// export type EmptyPayload = Record<string, never>;

export type PayloadByUsecase = {
  work: WorkPayload;
  "home:hello": HomeHelloPayload;
  "circle:new": CircleNewPayload;
  "userbuy:page1": UserbuyPage1Payload;
  "cart:list": CartListPayload;
  "download:list": DownloadListPayload;
};

export type Usecase = keyof PayloadByUsecase;

export const CHARACTER_IDS = ["default", "dela"] as const;

export type CharacterId = (typeof CHARACTER_IDS)[number];

export class Character {
  readonly id: CharacterId;
  readonly name: string;

  constructor(id: CharacterId, name: string) {
    this.id = id;
    this.name = name;
  }
}

export const characters: Character[] = [
  new Character("default", "デフォルト"),
  new Character("dela", "でらちゃん"),
];

export class Home {
  readonly path: string;
  readonly name: string;

  constructor(path: string, name: string) {
    this.path = path;
    this.name = name;
  }

  get match(): string {
    return `https://www.dlsite.com${this.path}`;
  }
}

export const homes: Home[] = [
  new Home("/home/", "DLsite 同人フロア（全年齢）"),
  new Home("/soft/", "DLsite PCソフトフロア（全年齢）"),
  new Home("/app/", "DLsite スマホゲームフロア（全年齢）"),
  new Home("/ai/", "DLsite AI生成フロア（全年齢）"),
  new Home("/maniax/", "DLsite 同人フロア（R18）"),
  new Home("/pro/", "DLsite 美少女ゲームフロア"),
  new Home("/books/", "DLsite 成年コミックフロア"),
  new Home("/appx/", "DLsite スマホゲームフロア（R18）"),
  new Home("/aix/", "DLsite AI生成フロア（R18）"),
  new Home(
    "/garumani/voice",
    "がるまに 乙女向け/TL・BLボイス・ASMRフロア（全年齢）",
  ),
  new Home("/girls/", "DLsite がるまに 乙女向け同人フロア"),
  new Home("/girls-pro/", "DLsite がるまに TLコミック・ティーンズラブフロア"),
  new Home("/girls-drama/", "DLsite がるまに 乙女向けドラマCDフロア"),
  new Home("/bl/", "DLsite がるまに BL同人フロア"),
  new Home("/bl-pro/", "DLsite がるまに BLコミックフロア"),
  new Home("/bl-drama/", "DLsite がるまに BLドラマCDフロア"),
  new Home("/home/tool", "DLsite 制作ソフト・素材フロア（全年齢）"),
  new Home("/maniax/tool", "DLsite 制作ソフト・素材フロア（R18）"),
];
