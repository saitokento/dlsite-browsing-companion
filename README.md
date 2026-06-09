# DLsite Browsing Companion

> [!IMPORTANT]
> 本拡張機能は個人開発の**非公式**ツールです。
> 株式会社viviONおよびDLsiteの公式プロダクトではありません。
>
> コメント生成に利用するため、DLsiteの閲覧内容・購入履歴・カート情報等のデータが外部のバックエンドサーバーおよびAI APIに送信されます。
> ご理解・ご了承のうえご使用ください。

DLsiteの閲覧中にAIキャラクターがコメントをしてくれるブラウザ拡張機能です。
作品情報、購入履歴、サークルの作品一覧、カート内容などをもとに、コメントを生成してサイドパネルに表示します。

![demo](README-assets/demo.gif)

（バックエンド：[DLsite Browsing Companion Backend](https://github.com/saitokento/dlsite-browsing-companion-backend)）

## 使用方法（Chromeの場合）

1. [Releases](https://github.com/saitokento/dlsite-browsing-companion/releases)から使用するブラウザ用の拡張機能（`dlsite-browsing-companion-x.x.x-chrome.zip`）をダウンロード
2. ダウンロードしたzipファイルを展開する
3. 拡張機能の管理画面（`chrome://extensions/`）を開き、画面右上のデベロッパーモードをオンにして、「パッケージされていない拡張機能を読み込む」から展開したフォルダを選択してインストール
4. 拡張機能をツールバーに固定（任意）
5. 拡張機能のアイコンをクリックしてポップアップを開き、開きたいDLsiteのフロアのボタンをクリック
6. サイドパネルとDLsiteのトップページが開き、対応するページを開くとAIキャラクターがコメントをしてくれます

キャラクターやポップアップにボタンが表示されるフロア等は、拡張機能のアイコンを右クリックして「オプション」を開くことで設定可能です。

## 開発背景

- DLsiteで作品を探す・購入する体験そのものをエンタテインメント化したい
  - 違法アップロード対策にも繋がるかも？
- [DLsiteのエイプリルフール企画](https://note.com/vivion_design/n/n4bb584d3bd33)のような、購入履歴を使った遊び心のあるサービスが好き・作ってみたい
- AIを活用したプロダクトを作ってみたい

## 主な機能

- DLsiteの対応ページから作品情報などを抽出
- ページ内容に応じたAIキャラクターのコメントを生成
- 生成されたコメントをサイドパネルにストリーミング表示
- 各種設定
  - キャラクター切り替え
  - コメント履歴のリセット
  - ポップアップに表示するフロアの変更

### 対応ページ

| ページ               | 抽出する主な情報                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 各フロアトップページ | フロア名                                                                                                                                   |
| 作品ページ           | 作品名、サークル名、価格、クーポン利用価格、ジャンル、作品説明                                                                             |
| 購入履歴ページ       | 購入履歴（購入日、作品名、サークル名、作品形式、価格）                                                                                     |
| サークルページ       | 作品一覧（作品名、作品形式、クリエイター、価格）、<br>発売予告作品一覧（作品名、作品形式、クリエイター、発売予定時期、無料サンプルの有無） |
| カートページ         | カート内作品（作品名、サークル名、作品形式、価格）、小計、クーポン情報                                                                     |
| 購入後ページ         | 購入作品（作品名、サークル名、作品形式）                                                                                                   |

## 使用技術

- WXT
- TypeScript
- React
- @webext-core/messaging
- Turndown
- pnpm
- ESLint
- Prettier

## 工夫した点

- ストリーミングレスポンスに対応し、コメント生成の待ち時間を感じにくくした
- ページのHTMLをそのまま渡すのではなく、必要なデータを抽出し、Markdownに整形してAIに渡すようにした
- API呼び出しはバックエンドを通して行うようにした

### リポジトリ運用

個人開発ではありますが、チーム開発を想定してGitHub Flowに沿ったブランチとPull Requestの作成を行っています。Pull RequestではCodeRabbitを導入し、AIによるコードレビューも活用しています。

また、GitHub ActionsによるCI・自動リリースやdependabotによるパッケージの自動更新も行っています。

## 今後の展望

- 対応ページ・抽出する情報の追加
- ユーザーの操作（スクロール・マウスオーバー・滞在時間等）に応じたコメント
- パーソナライズやキャラクター作成・育成機能
- テキスト読み上げ・画像認識機能の実装
- 日本語以外の言語・円以外の通貨に対応
- UI・UXの改善
- APIキー以外での認証など、セキュリティ面の改善
- テストの追加

## 主な作成コード

- [background.ts](https://github.com/saitokento/dlsite-browsing-companion/blob/main/src/entrypoints/background.ts)
- [popup](https://github.com/saitokento/dlsite-browsing-companion/blob/main/src/entrypoints/popup/App.tsx)
- [sidepanel](https://github.com/saitokento/dlsite-browsing-companion/blob/main/src/entrypoints/sidepanel/App.tsx)
- [options](https://github.com/saitokento/dlsite-browsing-companion/blob/main/src/entrypoints/options/App.tsx)
- Content Scripts
  - [トップページ](https://github.com/saitokento/dlsite-browsing-companion/blob/main/src/entrypoints/home.content.ts)
  - [作品ページ](https://github.com/saitokento/dlsite-browsing-companion/blob/main/src/entrypoints/work.content.ts)
  - [サークルページ](https://github.com/saitokento/dlsite-browsing-companion/blob/main/src/entrypoints/circle.content.ts)
  - [購入履歴](https://github.com/saitokento/dlsite-browsing-companion/blob/main/src/entrypoints/userbuy.content.ts)
  - [カート](https://github.com/saitokento/dlsite-browsing-companion/blob/main/src/entrypoints/cart.content.ts)
  - [購入後ページ](https://github.com/saitokento/dlsite-browsing-companion/blob/main/src/entrypoints/download.content.ts)
- 共通コード
  - [utils/exports.ts](https://github.com/saitokento/dlsite-browsing-companion/blob/main/src/utils/exports.ts)（定数・関数）
  - [utils/types.ts](https://github.com/saitokento/dlsite-browsing-companion/blob/main/src/utils/types.ts)（型定義）
