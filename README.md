
# 介護記録共有アプリ

介護施設での記録管理と家族との情報共有を目的としたWebアプリケーションです。

## 概要

このアプリケーションは、介護施設のスタッフが利用者の記録を効率的に管理し、家族とリアルタイムで情報を共有できるプラットフォームです。

## 主な機能

- 利用者情報の管理
- 介護記録の作成・編集・共有
- 家族への通知システム
- 写真・動画のアップロード機能
- リアルタイムでの情報更新
- セキュアな認証システム

## 技術スタック

- **フロントエンド**: Next.js 14, React 18, TypeScript
- **スタイリング**: Tailwind CSS, Radix UI
- **バックエンド**: Next.js API Routes
- **データベース**: MySQL (Prisma ORM)
- **認証**: NextAuth.js
- **画像処理**: Multer

## セットアップ

### 前提条件

- Node.js 18以上
- MySQL 8.0以上
- npm または yarn

### インストール手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd 介護記録共有
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数の設定
```bash
cp env.example .env.local
```

`.env.local`ファイルを編集し、必要な環境変数を設定してください：
- データベース接続情報
- NextAuth.jsの設定
- その他のAPIキー

4. データベースのセットアップ
```bash
# Prismaクライアントの生成
npm run db:generate

# データベースマイグレーション
npm run db:migrate

# シードデータの投入（オプション）
npm run db:seed
```

5. 開発サーバーの起動
```bash
npm run dev
```

アプリケーションは `http://localhost:3000` でアクセスできます。

## 利用可能なスクリプト

- `npm run dev` - 開発サーバーの起動
- `npm run build` - プロダクションビルド
- `npm run start` - プロダクションサーバーの起動
- `npm run lint` - ESLintによるコードチェック
- `npm run db:migrate` - データベースマイグレーション
- `npm run db:generate` - Prismaクライアントの生成
- `npm run db:studio` - Prisma Studioの起動
- `npm run db:seed` - シードデータの投入

## プロジェクト構造

```
src/
├── app/                 # Next.js App Router
├── components/          # 再利用可能なコンポーネント
├── lib/                # ユーティリティ関数
├── types/              # TypeScript型定義
└── styles/             # スタイルファイル

prisma/
├── schema.prisma       # データベーススキーマ
└── seed.ts            # シードデータ

public/                 # 静的ファイル
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

プルリクエストやイシューの報告を歓迎します。貢献する前に、まずイシューを作成して変更内容について議論してください。

## ドキュメント

- [ドキュメント画像管理](DOCUMENTATION_IMAGES.md) - アプリケーションのスクリーンショットとデモ画像の管理

## サポート

質問やサポートが必要な場合は、GitHubのイシューを作成してください。
  