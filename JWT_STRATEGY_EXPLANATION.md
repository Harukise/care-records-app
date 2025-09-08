# JWT戦略とデータベース戦略の違いについて

## 概要

このアプリケーションでは、NextAuth.jsの認証戦略として**JWT戦略**を採用しています。これにより、セッション情報がデータベースのSessionテーブルに保存されない仕組みになっています。

## 認証戦略の比較

### JWT戦略（現在の設定）

#### 特徴
- セッション情報はJWTトークンとしてブラウザのLocal Storageに保存
- データベースのSessionテーブルは使用されない
- サーバーサイドでのセッション管理が不要
- スケーラブルで軽量

#### データベースの状態
```sql
-- Sessionテーブルは常に空
SELECT * FROM Session;
-- 結果: Empty set (0.00 sec)

-- ユーザー情報は正常に存在
SELECT id, name, email, role FROM User WHERE email = 'tanaka@example.com';
-- 結果: ユーザー情報が表示される
```

#### セッション情報の保存場所
- **ブラウザ**: Local Storage の `next-auth.session-token`
- **データベース**: Sessionテーブルは使用されない

### データベース戦略（代替案）

#### 特徴
- セッション情報がデータベースのSessionテーブルに保存
- サーバーサイドでのセッション管理が必要
- より詳細なセッション制御が可能
- データベースへの負荷が高い

#### データベースの状態
```sql
-- ログイン後、Sessionテーブルにレコードが作成される
SELECT 
    s.id,
    s.sessionToken,
    s.userId,
    s.expires,
    u.name,
    u.email,
    u.role
FROM Session s
JOIN User u ON s.userId = u.id
WHERE u.email = 'tanaka@example.com';
-- 結果: セッション情報が表示される
```

## なぜJWT戦略を採用しているのか

### 1. パフォーマンス
- データベースへのアクセスが不要
- セッション検証が高速
- サーバーリソースの使用量が少ない

### 2. スケーラビリティ
- 複数のサーバーインスタンス間でのセッション共有が不要
- ロードバランサーでの負荷分散が容易
- データベースの負荷を軽減

### 3. シンプルさ
- セッション管理の複雑さを排除
- デプロイメントが簡単
- メンテナンスが容易

### 4. セキュリティ
- JWTトークンは暗号化されている
- トークンの有効期限管理が可能
- クライアントサイドでの検証が可能

## テストケースでの注意点

### JWT戦略での正しいテスト方法

#### 1. ログイン前の確認
```sql
-- Sessionテーブルは空（正常）
SELECT * FROM Session;
-- 期待結果: Empty set (0.00 sec)
```

#### 2. ログイン後の確認
```sql
-- Sessionテーブルは空のまま（正常）
SELECT * FROM Session;
-- 期待結果: Empty set (0.00 sec)

-- ユーザー情報は存在（正常）
SELECT id, name, email, role FROM User WHERE email = 'tanaka@example.com';
-- 期待結果: ユーザー情報が表示される
```

#### 3. セッション確認方法
- **ブラウザの開発者ツール** → **Application**タブ → **Local Storage**
- `next-auth.session-token` キーでJWTトークンを確認
- トークンが存在すればログイン成功

## データベース戦略に変更する場合

もしデータベース戦略を使用したい場合は、以下の設定変更が必要です：

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  // ... 他の設定
  session: {
    strategy: "database", // JWTからdatabaseに変更
  },
  // ... 他の設定
};
```

ただし、この変更には以下の注意点があります：

1. **PrismaAdapterの設定確認**
2. **データベース接続の安定性**
3. **セッション管理の複雑さの増加**
4. **パフォーマンスの低下**

## 結論

現在のJWT戦略は、このアプリケーションの要件に適しており、以下の理由で推奨されます：

- ✅ パフォーマンスが良い
- ✅ スケーラブル
- ✅ シンプルで保守しやすい
- ✅ セキュリティが確保されている

Sessionテーブルが空であることは、JWT戦略では正常な動作であり、問題ではありません。



