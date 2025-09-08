# Prisma + MySQL データベース構築ガイド

## 目次
1. [Prismaとは](#prismaとは)
2. [Prismaのメリット](#prismaのメリット)
3. [セットアップ手順](#セットアップ手順)
4. [データベース設計](#データベース設計)
5. [マイグレーション](#マイグレーション)
6. [データ操作](#データ操作)
7. [トラブルシューティング](#トラブルシューティング)
8. [ベストプラクティス](#ベストプラクティス)

## Prismaとは

Prismaは、データベースアクセスを簡素化するモダンなORM（Object-Relational Mapping）ツールです。TypeScriptとJavaScriptで使用でき、型安全なデータベース操作を提供します。

### 主要コンポーネント
- **Prisma Client**: データベース操作のための型安全なクライアント
- **Prisma Migrate**: データベーススキーマの変更管理
- **Prisma Studio**: データベースの可視化ツール

## Prismaのメリット

### 1. 型安全性
```typescript
// コンパイル時に型チェックが行われる
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" }
});
// userは自動的に型推論される
```

### 2. 直感的なAPI
```typescript
// 複雑なクエリも直感的に記述可能
const usersWithPosts = await prisma.user.findMany({
  include: {
    posts: {
      where: { published: true }
    }
  }
});
```

### 3. 自動マイグレーション
```bash
# スキーマ変更を自動でデータベースに反映
npx prisma migrate dev --name add_new_field
```

### 4. データベース非依存
- MySQL、PostgreSQL、SQLite、MongoDBなどに対応
- データベースを変更してもコードは最小限の修正で済む

### 5. 開発効率の向上
- 自動補完とドキュメント生成
- データベーススキーマの可視化
- 型安全なクエリビルダー

## セットアップ手順

### 1. プロジェクトの初期化

```bash
# プロジェクトディレクトリの作成
mkdir my-project
cd my-project

# package.jsonの初期化
npm init -y

# Prismaのインストール
npm install prisma @prisma/client
npm install -D prisma
```

### 2. Prismaの初期化

```bash
# Prismaの初期化
npx prisma init
```

これにより以下のファイルが作成されます：
- `prisma/schema.prisma` - データベーススキーマ定義
- `.env` - 環境変数ファイル

### 3. データベース接続の設定

`.env`ファイルを編集：
```env
DATABASE_URL="mysql://root:password@localhost:3306/my_database"
```

### 4. スキーマの定義

`prisma/schema.prisma`を編集：
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## データベース設計

### 1. モデル定義の基本

```prisma
model ModelName {
  // フィールド定義
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. リレーションの定義

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[] // 1対多の関係
}

model Post {
  id       Int  @id @default(autoincrement())
  author   User @relation(fields: [authorId], references: [id])
  authorId Int
}
```

### 3. インデックスと制約

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String
  
  @@index([email])
  @@unique([email, name])
}
```

## マイグレーション

### 1. 初回マイグレーション

```bash
# データベースの作成とマイグレーション
npx prisma migrate dev --name init
```

### 2. スキーマ変更のマイグレーション

```bash
# スキーマを変更後
npx prisma migrate dev --name add_new_field
```

### 3. 本番環境でのマイグレーション

```bash
# 本番環境用のマイグレーション
npx prisma migrate deploy
```

## データ操作

### 1. Prisma Clientの生成

```bash
npx prisma generate
```

### 2. 基本的なCRUD操作

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 作成
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe'
  }
});

// 読み取り
const users = await prisma.user.findMany();
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});

// 更新
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Jane Doe' }
});

// 削除
await prisma.user.delete({
  where: { id: 1 }
});
```

### 3. 複雑なクエリ

```typescript
// リレーションを含むクエリ
const usersWithPosts = await prisma.user.findMany({
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    }
  }
});

// 条件付きクエリ
const publishedPosts = await prisma.post.findMany({
  where: {
    published: true,
    author: {
      name: {
        contains: 'John'
      }
    }
  },
  include: {
    author: true
  }
});
```

## トラブルシューティング

### 1. よくあるエラー

#### DATABASE_URL not found
```bash
# .envファイルが存在するか確認
ls -la .env

# 環境変数の読み込み確認
npx prisma db pull
```

#### マイグレーションエラー
```bash
# マイグレーション状態のリセット
npx prisma migrate reset

# データベースの状態確認
npx prisma db pull
```

### 2. デバッグ方法

```bash
# Prisma Studioでデータベースを可視化
npx prisma studio

# スキーマの検証
npx prisma validate

# データベースの状態確認
npx prisma db pull
```

## ベストプラクティス

### 1. スキーマ設計

```prisma
// 良い例：明確な命名と適切な型
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  firstName String
  lastName  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("users") // テーブル名の明示
}
```

### 2. マイグレーション管理

```bash
# 意味のあるマイグレーション名
npx prisma migrate dev --name add_user_authentication
npx prisma migrate dev --name create_post_categories
```

### 3. 環境管理

```env
# 開発環境
DATABASE_URL="mysql://root:password@localhost:3306/dev_database"

# 本番環境
DATABASE_URL="mysql://user:password@prod-server:3306/prod_database"
```

### 4. エラーハンドリング

```typescript
try {
  const user = await prisma.user.create({
    data: userData
  });
} catch (error) {
  if (error.code === 'P2002') {
    // ユニーク制約エラー
    console.error('Email already exists');
  } else {
    console.error('Database error:', error);
  }
}
```

## まとめ

Prismaを使用することで、以下のメリットが得られます：

1. **開発効率の向上**: 型安全なクエリと自動補完
2. **保守性の向上**: スキーマの一元管理とマイグレーション
3. **エラー削減**: コンパイル時の型チェック
4. **可読性の向上**: 直感的なAPI設計
5. **スケーラビリティ**: データベース非依存の設計

Prismaは、モダンなWebアプリケーション開発において、データベース操作を簡素化し、開発者の生産性を大幅に向上させる強力なツールです。
