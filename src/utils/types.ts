/** 作品ページから抽出する作品情報 */
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

/** サークルページの予告作品情報 */
export interface CircleAnnounceWork {
  productId: string;
  name: string;
  author: string | null;
  category: string;
  expectedDate: string;
  freeSample: boolean;
}

/** サークルページの販売中作品情報 */
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

/** 購入履歴の作品情報 */
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

/** カート内の作品情報 */
export interface CartWork {
  productId: string;
  name: string;
  makerName: string;
  category: string;
  price: string;
  officialPrice: string;
}

/** 購入後ページ一覧の作品情報 */
export interface DownloadWork {
  productId: string;
  name: string;
  makerName: string;
  genre: string;
}

/** 挨拶コメント生成に使用するペイロード */
export type HomeHelloPayload = {
  floor: string;
};

/** 作品ページのコメント生成に使用するペイロード */
export type WorkPayload = {
  work: Work;
};

/** サークルページのコメント生成に使用するペイロード */
export type CircleNewPayload = {
  makerName: string;
  circleAnnounceWorkList: CircleAnnounceWork[];
  circleWorkList: CircleWork[];
};

/** 購入履歴ページのコメント生成に使用するペイロード */
export type UserbuyPage1Payload = {
  userbuyWorkList: UserbuyWork[];
};

/** カートページのコメント生成に使用するペイロード */
export type CartListPayload = {
  cartWorkList: CartWork[];
  totalDiscount: string;
  totalOriginal: string | null;
  couponName: string | null;
  totalCoupon: string | null;
  pricePrefix: string;
  priceSuffix: string;
};

/** 購入後ページのコメント生成に使用するペイロード */
export type DownloadListPayload = {
  downloadWorkList: DownloadWork[];
};

// export type EmptyPayload = Record<string, never>;

/** usecaseと対応するペイロードの対応表 */
export type PayloadByUsecase = {
  work: WorkPayload;
  "home:hello": HomeHelloPayload;
  "circle:new": CircleNewPayload;
  "userbuy:page1": UserbuyPage1Payload;
  "cart:list": CartListPayload;
  "download:list": DownloadListPayload;
};

/** コメント生成で利用可能なusecase名の型 */
export type Usecase = keyof PayloadByUsecase;

/** 利用可能なキャラクターIDの一覧 */
export const CHARACTER_IDS = [
  "default",
  "dela",
  "athena",
  "nyansak",
  "nijiyomechan",
  "saotome",
] as const;

/** 利用可能なキャラクターIDを表す型 */
export type CharacterId = (typeof CHARACTER_IDS)[number];

/** コメント生成に使用するキャラクターの設定 */
export class Character {
  readonly id: CharacterId;
  readonly name: string;

  /**
   * キャラクター設定を生成
   * @param id キャラクターID
   * @param name キャラクター名
   */
  constructor(id: CharacterId, name: string) {
    this.id = id;
    this.name = name;
  }
}

/** 選択可能なキャラクター設定の一覧 */
export const characters: readonly Character[] = [
  new Character("default", "デフォルト"),
  new Character("dela", "でらちゃん"),
  new Character("athena", "アテナちゃん"),
  new Character("nyansak", "ニャン作"),
  new Character("nijiyomechan", "にじよめちゃん"),
  new Character("saotome", "早乙女"),
];

/** フロアのパスと表示名を表す型 */
export class Home {
  readonly path: string;
  readonly name: string;

  /**
   * フロア設定を生成
   * @param path ドメイン以下のパス
   * @param name フロア名
   */
  constructor(path: string, name: string) {
    this.path = path;
    this.name = name;
  }

  /**
   * フロアのトップページの完全URLを返す
   * @returns DLsiteドメインとフロアパスを結合したURL
   */
  get match(): string {
    return `https://www.dlsite.com${this.path}`;
  }
}

/** 対応しているフロア設定の一覧 */
export const homes: readonly Home[] = [
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

/** バックエンドから受信するコメントストリームイベントを表す型 */
export type CommentStreamEvent =
  | {
      type: "delta";
      text: string;
    }
  | {
      type: "done";
      responseId: string;
    };

/** 保存済みコメント履歴の1項目を表す型 */
export type CommentHistoryItem = {
  text: string;
  createdAt: string;
};

/** ストリーミング生成中のコメントを表す型 */
export type CurrentComment = {
  text: string;
  createdAt: string;
};
