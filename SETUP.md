# 介護記録共有アプリ セットアップ手順

## 前提条件

- Node.js 18以上
- MySQL 8.0以上
- npm または yarn

## 1. プロジェクトのセットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp env.example .env.local
```

## 2. 環境変数の設定

`.env.local` ファイルを編集してください：

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/care_records_db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# JWT
JWT_SECRET="your-jwt-secret-key-here"

# File Upload
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=5242880
```

## 3. データベースのセットアップ

```bash
# MySQLデータベースの作成
mysql -u root -p
CREATE DATABASE care_records_db;
exit

# Prismaマイグレーションの実行
npm run db:migrate

# データベースのシード（初期データの投入）
npm run db:seed
```

## 4. アプリケーションの起動

```bash
# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 5. テストアカウント

以下のアカウントでログインできます：

### スタッフアカウント
- **メール**: tanaka@example.com
- **パスワード**: password123

### 家族アカウント
- **メール**: sato.family@example.com
- **パスワード**: password123

## 6. 機能確認

### スタッフ機能
- 入居者管理（追加・編集・削除）
- 介護記録入力
- 写真アップロード
- 家族とのメッセージ交換

### 家族機能
- 介護記録閲覧
- 写真閲覧
- スタッフとのメッセージ交換

## 7. トラブルシューティング

### データベース接続エラー
- MySQLが起動しているか確認
- 環境変数の`DATABASE_URL`が正しいか確認

### 認証エラー
- 環境変数の`NEXTAUTH_SECRET`が設定されているか確認
- データベースにユーザーデータが正しく投入されているか確認

### ファイルアップロードエラー
- `public/uploads`ディレクトリが存在するか確認
- ファイルサイズが5MB以下か確認

## 8. 本番環境へのデプロイ

### Vercel（推奨）
1. GitHubリポジトリにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定
4. データベース（PlanetScale等）を接続

### その他のプラットフォーム
- Railway
- Heroku
- AWS
- Google Cloud Platform

## 9. 開発コマンド

```bash
# データベースの管理
npm run db:studio    # Prisma Studioを開く
npm run db:generate  # Prismaクライアントを生成
npm run db:migrate   # マイグレーションを実行

# アプリケーション
npm run dev         # 開発サーバー起動
npm run build       # 本番用ビルド
npm run start       # 本番サーバー起動
npm run lint        # コードのリント
```
