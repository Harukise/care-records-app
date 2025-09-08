# 介護記録共有アプリ 機能要件テスト

## 概要
アプリケーション内で各機能をテストし、その都度MySQLコマンドラインでデータの変化を確認する包括的なテスト手順書です。

## 認証戦略について
このアプリケーションでは**JWT戦略**を採用しており、セッション情報はデータベースのSessionテーブルではなく、ブラウザのLocal StorageにJWTトークンとして保存されます。

### JWT戦略でのテスト時の注意点
- **Sessionテーブル**: 常に空のまま（正常な動作）
- **セッション確認**: ブラウザの開発者ツール → Application → Local Storage で `next-auth.session-token` を確認
- **認証成功の判定**: ユーザー情報がデータベースに存在することと、JWTトークンが保存されていることで確認

## テスト環境準備

### 1. アプリケーション起動
```bash
# PowerShellでアプリケーションを起動
cd "C:\Users\ユーザー\Desktop\MCP_Workspace\介護記録共有"
npm run dev
```

### 2. MySQL接続準備
```bash
# 別のコマンドプロンプトでMySQLに接続
mysql -u root -p
USE care_records_db;
```

### 3. テスト用データベースの初期化
```sql
-- テスト開始前のデータ確認
SELECT COUNT(*) as user_count FROM User;
SELECT COUNT(*) as resident_count FROM Resident;
SELECT COUNT(*) as care_record_count FROM CareRecord;
SELECT COUNT(*) as photo_count FROM Photo;
SELECT COUNT(*) as message_count FROM Message;
SELECT COUNT(*) as resident_family_count FROM ResidentFamily;
```

## テストケース一覧

### テストケース1: 家族承認システム

#### 機能概要
スタッフが入居者と家族情報を一括で登録し、家族がアプリに登録する際の承認システムをテストします。このシステムにより、データの整合性を保ちながら現実的な運用フローを実現します。

#### 1.1 スタッフによる入居者・家族情報の一括登録

##### 前提条件
- スタッフユーザーでログインしている
- 入居者管理画面にアクセスしている

##### テスト手順
1. **入居者管理画面で「入居者を追加」ボタンをクリック**
2. **入居者情報を入力**:
   - 氏名: `テスト入居者3`
   - 生年月日: `1950年3月15日`
3. **家族情報を入力**:
   - 家族名: `テスト家族3`
   - メールアドレス: `test.family3@example.com`
   - 電話番号: `090-3333-3333`
   - 続柄: `子`
4. **「追加」ボタンをクリック**

##### 期待される結果
- 入居者と家族情報が正常に登録される
- 成功メッセージ「入居者と家族情報を追加しました」が表示される
- 入居者一覧に「テスト入居者3」が表示される
- データベースに以下が作成される:
  - 入居者レコード（テスト入居者3）
  - 家族ユーザーレコード（テスト家族3、未承認状態）
  - 紐づけレコード

**注意**: この段階では家族ユーザーは未承認状態（`isApproved = 0`）です。

##### データベース確認用SQLクエリ

**1. 入居者レコードの確認**
```sql
SELECT 
    id,
    name,
    birthday,
    createdAt,
    updatedAt
FROM Resident 
WHERE name = 'テスト入居者3';
```

**2. 家族ユーザーレコードの確認**
```sql
SELECT 
    id,
    name,
    email,
    role,
    isApproved,
    createdAt,
    updatedAt
FROM User 
WHERE name = 'テスト家族3' 
AND email = 'test.family3@example.com';
```

**3. 紐づけレコードの確認**
```sql
SELECT 
    rf.id,
    rf.residentId,
    rf.userId,
    rf.createdAt,
    r.name as resident_name,
    u.name as family_name,
    u.email as family_email,
    u.isApproved
FROM ResidentFamily rf
JOIN Resident r ON rf.residentId = r.id
JOIN User u ON rf.userId = u.id
WHERE r.name = 'テスト入居者3';
```

**4. 統合確認クエリ（推奨）**
```sql
SELECT 
    r.id as resident_id,
    r.name as resident_name,
    r.birthday,
    u.id as family_id,
    u.name as family_name,
    u.email as family_email,
    u.role,
    u.isApproved,
    rf.createdAt as relationship_created_at
FROM Resident r
JOIN ResidentFamily rf ON r.id = rf.residentId
JOIN User u ON rf.userId = u.id
WHERE r.name = 'テスト入居者3';
```

**5. 期待される結果の確認**
```sql
-- 期待される結果の確認
SELECT 
    CASE 
        WHEN r.name = 'テスト入居者3' THEN '✓ 入居者レコード作成済み'
        ELSE '✗ 入居者レコードが見つかりません'
    END as resident_check,
    CASE 
        WHEN u.name = 'テスト家族3' AND u.email = 'test.family3@example.com' THEN '✓ 家族ユーザーレコード作成済み'
        ELSE '✗ 家族ユーザーレコードが見つかりません'
    END as family_check,
    CASE 
        WHEN u.isApproved = 0 THEN '✓ 未承認状態（登録前）'
        WHEN u.isApproved = 1 THEN '✓ 承認済み状態（登録後）'
        ELSE '✗ 承認状態が正しくありません'
    END as approval_check,
    CASE 
        WHEN rf.id IS NOT NULL THEN '✓ 紐づけレコード作成済み'
        ELSE '✗ 紐づけレコードが見つかりません'
    END as relationship_check
FROM Resident r
LEFT JOIN ResidentFamily rf ON r.id = rf.residentId
LEFT JOIN User u ON rf.userId = u.id
WHERE r.name = 'テスト入居者3';
```

#### 1.2 家族の新規登録（正常ケース）

##### 前提条件
- 1.1のテストが完了している
- 家族承認システムが正常に動作している

##### テスト手順
1. **ログアウトして家族新規登録画面にアクセス**
2. **家族情報を入力**:
   - 家族名: `テスト家族3`
   - メールアドレス: `test.family3@example.com`
   - パスワード: `password123`
   - 入居者名: `テスト入居者3`
3. **「登録」ボタンをクリック**

##### 期待される結果
- 登録が正常に完了する
- 成功メッセージ「登録が完了しました。ログインしてください。」が表示される
- 家族ユーザーの承認状態が「承認済み」に更新される
- ログイン画面にリダイレクトされる

##### データベース確認用SQLクエリ（1.2用）

**家族新規登録後の状態確認**
```sql
-- 家族新規登録後の状態確認
SELECT 
    CASE 
        WHEN r.name = 'テスト入居者3' THEN '✓ 入居者レコード作成済み'
        ELSE '✗ 入居者レコードが見つかりません'
    END as resident_check,
    CASE 
        WHEN u.name = 'テスト家族3' AND u.email = 'test.family3@example.com' THEN '✓ 家族ユーザーレコード作成済み'
        ELSE '✗ 家族ユーザーレコードが見つかりません'
    END as family_check,
    CASE 
        WHEN u.isApproved = 0 THEN '✗ 未承認状態（登録が完了していません）'
        WHEN u.isApproved = 1 THEN '✓ 承認済み状態（登録完了）'
        ELSE '✗ 承認状態が正しくありません'
    END as approval_check,
    CASE 
        WHEN rf.id IS NOT NULL THEN '✓ 紐づけレコード作成済み'
        ELSE '✗ 紐づけレコードが見つかりません'
    END as relationship_check
FROM Resident r
LEFT JOIN ResidentFamily rf ON r.id = rf.residentId
LEFT JOIN User u ON rf.userId = u.id
WHERE r.name = 'テスト入居者3';
```

**期待される結果**: すべての項目が「✓」マークで表示されること←mysqlでは✔が正しく認識されず?で表示されます

#### 1.3 家族の新規登録（照合失敗ケース）

##### 前提条件
- 1.1のテストが完了している

##### テスト手順
1. **家族新規登録画面にアクセス**
2. **間違った家族情報を入力**:
   - 家族名: `間違った家族名`
   - メールアドレス: `wrong@example.com`
   - パスワード: `password123`
   - 入居者名: `テスト入居者3`
3. **「登録」ボタンをクリック**

##### 期待される結果
- エラーメッセージ「該当する家族情報が見つかりません。スタッフにご確認ください。」が表示される
- 登録が失敗する
- 家族ユーザーの承認状態は変更されない

#### 1.4 家族の新規登録（入居者名不一致ケース）

##### 前提条件
- 1.1のテストが完了している

##### テスト手順
1. **家族新規登録画面にアクセス**
2. **家族名は正しいが入居者名が間違っている情報を入力**:
   - 家族名: `テスト家族3`
   - メールアドレス: `test.family3@example.com`
   - パスワード: `password123`
   - 入居者名: `間違った入居者名`
3. **「登録」ボタンをクリック**

##### 期待される結果
- エラーメッセージ「指定された入居者名と家族情報が一致しません。」が表示される
- 登録が失敗する
- 家族ユーザーの承認状態は変更されない

#### 1.5 スタッフによる家族承認管理

##### 前提条件
- スタッフユーザーでログインしている
- 1.1のテストが完了している（未承認の家族ユーザーが存在）

##### テスト手順
1. **家族承認管理画面にアクセス**
2. **未承認家族の一覧を確認**:
   - 家族名: `テスト家族3`
   - メールアドレス: `test.family3@example.com`
   - 関連入居者: `テスト入居者3`
   - 登録日が表示される
3. **「承認」ボタンをクリック**

##### 期待される結果
- 家族ユーザーが承認される
- 成功メッセージ「家族ユーザーを承認しました」が表示される
- 未承認家族の一覧から該当ユーザーが削除される
- 家族ユーザーの承認状態が「承認済み」に更新される

#### 1.6 スタッフによる家族拒否

##### 前提条件
- スタッフユーザーでログインしている
- 未承認の家族ユーザーが存在する

##### テスト手順
1. **家族承認管理画面にアクセス**
2. **未承認家族の一覧を確認**
3. **「拒否」ボタンをクリック**
4. **確認ダイアログで「拒否」を選択**

##### 期待される結果
- 家族ユーザーが拒否される
- 成功メッセージ「家族ユーザーを拒否しました」が表示される
- 未承認家族の一覧から該当ユーザーが削除される
- データベースから家族ユーザーと関連データが削除される

#### 1.7 メッセージ機能との連携テスト

##### 前提条件
- 1.1〜1.2のテストが完了している（承認済みの家族ユーザーが存在）
- スタッフユーザーでログインしている

##### テスト手順
1. **メッセージ機能にアクセス**
2. **入居者選択で「テスト入居者3」を選択**
3. **メッセージ内容を入力**: `テスト入居者3の様子をお伝えします。本日は体調良好で、食事も順調に摂取できています。`
4. **「送信」ボタンをクリック**

##### 期待される結果
- メッセージが正常に送信される
- 家族ユーザー（テスト家族3）にメッセージが届く
- メッセージ履歴に送信したメッセージが表示される
- 家族ユーザーでログインした際にメッセージが受信できる

#### 1.8 データ整合性の確認

##### 前提条件
- 1.1〜1.2のテストが完了している

##### テスト手順
1. **データベースに直接アクセス**
2. **以下のクエリを実行**:
   ```sql
   SELECT r.name as resident_name, u.name as family_name, u.isApproved, rf.createdAt
   FROM Resident r
   JOIN ResidentFamily rf ON r.id = rf.residentId
   JOIN User u ON rf.userId = u.id
   WHERE r.name = 'テスト入居者3';
   ```

##### 期待される結果
- 入居者名: `テスト入居者3`
- 家族名: `テスト家族3`
- 承認状態: `true`（承認済み）
- 紐づけ作成日が表示される

### テストケース2: ユーザー認証機能

#### 2.1 ログイン前の状態確認
**MySQL確認:**
```sql
-- セッションテーブルの確認（ログイン前は空のはず）
SELECT * FROM Session;
SELECT * FROM Account;
```

**アプリケーション操作:**
1. ブラウザで `http://localhost:3000` にアクセス
2. ログインページが表示されることを確認
3. テスト用アカウント情報を確認
   - スタッフ: `tanaka@example.com` / `password123`
   - 家族: `sato.family@example.com` / `password123`

#### 2.2 スタッフユーザーでのログイン
**アプリケーション操作:**
1. メールアドレス: `tanaka@example.com`
2. パスワード: `password123`
3. ログインボタンをクリック

**MySQL確認:**
```sql
-- JWT戦略ではSessionテーブルは使用されないため、空のまま
SELECT * FROM Session;

-- ユーザー情報の確認（ログイン成功の確認）
SELECT id, name, email, role FROM User WHERE email = 'tanaka@example.com';

-- アカウント情報の確認（OAuthプロバイダーを使用しない場合は空）
SELECT * FROM Account WHERE userId = (
    SELECT id FROM User WHERE email = 'tanaka@example.com'
);
```

**期待される結果:**
- Sessionテーブルは空のまま（JWT戦略のため）
- ユーザー情報が正しく取得される
- ロールが `STAFF` であることを確認
- ブラウザの開発者ツールでJWTトークンが保存されていることを確認

#### 2.3 家族ユーザーでのログイン
**アプリケーション操作:**
1. ログアウト
2. メールアドレス: `sato.family@example.com`
3. パスワード: `password123`
4. ログインボタンをクリック

**MySQL確認:**
```sql
-- JWT戦略ではSessionテーブルは使用されないため、空のまま
SELECT * FROM Session;

-- 家族ユーザー情報の確認（ログイン成功の確認）
SELECT id, name, email, role FROM User WHERE email = 'sato.family@example.com';

-- アカウント情報の確認（OAuthプロバイダーを使用しない場合は空）
SELECT * FROM Account WHERE userId = (
    SELECT id FROM User WHERE email = 'sato.family@example.com'
);
```

**期待される結果:**
- Sessionテーブルは空のまま（JWT戦略のため）
- ユーザー情報が正しく取得される
✔ ユーザーロールが `FAMILY` であることを確認
- ブラウザの開発者ツールでJWTトークンが更新されていることを確認

### テストケース3: ダッシュボード表示機能

#### 3.1 スタッフダッシュボードの表示
**アプリケーション操作:**
1. スタッフユーザーでログイン
2. ダッシュボードが表示されることを確認
3. 統計情報（入居者数、今日の記録数など）を確認

**MySQL確認:**
```sql
-- ダッシュボードで表示されるデータの確認
-- 入居者数
SELECT COUNT(*) as total_residents FROM Resident;

-- 今日の介護記録数
SELECT COUNT(*) as today_records 
FROM CareRecord 
WHERE DATE(date) = CURDATE();

-- 写真投稿数
SELECT COUNT(*) as total_photos FROM Photo;

-- 未読メッセージ数（スタッフ宛）

```

#### 3.2 家族ダッシュボードの表示
**アプリケーション操作:**
1. 家族ユーザーでログイン
2. 家族ダッシュボードが表示されることを確認
3. 家族の情報が表示されることを確認

**MySQL確認:**
```sql
-- 家族に関連する入居者情報
SELECT 
    r.name as resident_name,
    r.birthday,
    rf.createdAt as family_relation_created
FROM Resident r
JOIN ResidentFamily rf ON r.id = rf.residentId
JOIN User u ON rf.userId = u.id
WHERE u.email = 'sato.family@example.com';
```

### テストケース4: 入居者管理機能

#### 4.1 入居者一覧の表示
**アプリケーション操作:**
1. スタッフユーザーでログイン
2. 「入居者管理」タブをクリック
3. 入居者一覧が表示されることを確認

**MySQL確認:**
```sql
-- 入居者一覧の確認
SELECT 
    id,
    name,
    birthday,
    YEAR(CURDATE()) - YEAR(birthday) as age,
    createdAt
FROM Resident
ORDER BY createdAt DESC;
```

#### 4.2 新しい入居者の追加
**アプリケーション操作:**
1. 「新規入居者追加」ボタンをクリック
2. 以下の情報を入力:
   - 名前: `テスト 入居者`
   - 生年月日: `1940-03-15`
3. 保存ボタンをクリック

**MySQL確認:**
```sql
-- 新しく追加された入居者を確認
SELECT 
    id,
    name,
    birthday,
    YEAR(CURDATE()) - YEAR(birthday) as age,
    createdAt
FROM Resident 
WHERE name = 'テスト 入居者2'
ORDER BY createdAt DESC
LIMIT 1;

-- 最新の入居者IDを記録（後続のテストで使用）
SET @new_resident_id = (SELECT id FROM Resident WHERE name = 'テスト 入居者' ORDER BY createdAt DESC LIMIT 1);
SELECT @new_resident_id as new_resident_id;
```

#### 4.3 入居者情報の編集
**アプリケーション操作:**
1. 追加した入居者の「編集」ボタンをクリック
2. 名前を `テスト 入居者（更新）` に変更
3. 保存ボタンをクリック

**MySQL確認:**
```sql
-- 更新された入居者情報を確認
SELECT 
    id,
    name,
    birthday,
    updatedAt
FROM Resident 
WHERE id = @new_resident_id;
```

### テストケース5: 介護記録機能

#### 5.1 介護記録の作成
**アプリケーション操作:**
1. 「介護記録」タブをクリック
2. 「新規記録作成」ボタンをクリック
3. 以下の情報を入力:
   - 入居者: 先ほど作成した入居者を選択
   - 日付: 今日の日付
   - 食事: `朝食：おかゆ完食、昼食：普通食8割摂取、夕食：普通食完食`
   - 入浴: `入浴済み（15:30-16:00）温度38℃`
   - トイレ: `排尿：正常、排便：1回（午前中）`
   - 服薬: `血圧薬服用済み（朝・夕）`
   - バイタル: `体温36.5℃、血圧128/80、脈拍72`
   - 備考: `お元気でよく笑顔を見せてくださいました。食欲も良好です。`
4. 保存ボタンをクリック

**MySQL確認:**
```sql
-- 新しく作成された介護記録を確認
SELECT 
    cr.id,
    cr.date,
    cr.meal,
    cr.bath,
    cr.toilet,
    cr.medicine,
    cr.vital,
    cr.note,
    r.name as resident_name,
    r.id as resident_id,
    u.name as staff_name,
    cr.createdAt
FROM CareRecord cr
JOIN Resident r ON cr.residentId = r.id
JOIN User u ON cr.staffId = u.id
ORDER BY cr.createdAt DESC
LIMIT 1;

-- 最新の介護記録IDを直接取得
SET @new_care_record_id = (
    SELECT cr.id 
    FROM CareRecord cr 
    ORDER BY cr.createdAt DESC 
    LIMIT 1
);
SELECT @new_care_record_id as new_care_record_id;

#### 5.2 介護記録の編集
**アプリケーション操作:**
1. 作成した介護記録の「編集」ボタンをクリック
2. 備考を `体調良好。レクリエーションにも積極的に参加されていました。` に変更
3. 保存ボタンをクリック

**MySQL確認:**
```sql
-- 更新された介護記録を確認
SELECT 
    id,
    note,
    updatedAt
FROM CareRecord 
WHERE id = @new_care_record_id;
```

#### 5.3 介護記録の検索・フィルタリング
**アプリケーション操作:**
1. 記録日で検索（例：9月7日をカレンダーで選択）
2. 入居者で絞り込み
3. 検索結果が正しく表示されることを確認

**MySQL確認:**
```sql
-- 指定日（例：2024-09-07）の介護記録を確認
SELECT 
    cr.date,
    r.name as resident_name,
    u.name as staff_name,
    cr.meal,
    cr.note
FROM CareRecord cr
JOIN Resident r ON cr.residentId = r.id
JOIN User u ON cr.staffId = u.id
WHERE DATE(cr.date) = '2025-09-07'
ORDER BY cr.date DESC;
```

### テストケース6: 写真管理機能

#### 6.1 写真のアップロード
**アプリケーション操作:**
1. 「写真」タブをクリック
2. 「写真アップロード」ボタンをクリック
3. 以下の情報を入力:
   - 入居者: 先ほど作成した入居者を選択
   - 写真ファイル: テスト用の画像ファイルを選択
   - キャプション: `レクリエーション活動の様子`
4. アップロードボタンをクリック

**MySQL確認:**
```sql
-- アップロードされた写真を確認
SELECT 
    p.id,
    p.url,
    p.caption,
    r.name as resident_name,
    u.name as uploaded_by,
    p.createdAt
FROM Photo p
JOIN Resident r ON p.residentId = r.id
JOIN User u ON p.userId = u.id
WHERE r.id = @new_resident_id
ORDER BY p.createdAt DESC
LIMIT 1;

-- 最新の写真IDを記録
SET @new_photo_id = (
    SELECT p.id 
    FROM Photo p 
    WHERE p.residentId = @new_resident_id 
    ORDER BY p.createdAt DESC 
    LIMIT 1
);
SELECT @new_photo_id as new_photo_id;
```

#### 6.2 写真の編集
**アプリケーション操作:**
1. アップロードした写真の「編集」ボタンをクリック
2. キャプションを `レクリエーション活動の様子（更新）` に変更
3. 保存ボタンをクリック

**MySQL確認:**
```sql
-- 更新された写真情報を確認
SELECT 
    id,
    caption,
    updatedAt
FROM Photo 
WHERE id = @new_photo_id;
```

### テストケース7: メッセージ機能

**機能概要:**
- スタッフが対象入居者を選択すると、その入居者に関連付けられた家族が自動的に受信者として決定される
- 入居者と家族の関係は事前に設定されており、一意に決定される仕組み
- スタッフから家族へのメッセージは、入居者の体調、食事、活動参加状況、その日の様子などを報告する内容が適切
- 家族は受信したメッセージを確認し、入居者の様子を把握
- メッセージは入居者ごとに管理され、家族とのコミュニケーションを促進

#### 7.1 スタッフから家族へのメッセージ送信
**目的:** スタッフが対象入居者を選択することで、その入居者に関連付けられた家族に自動的にメッセージを送信する

**アプリケーション操作:**
1. スタッフユーザー（田中花子）でログインしていることを確認
2. 「メッセージ」タブをクリック
3. 「新規メッセージ」ボタンをクリック
4. メッセージ作成フォームで以下の情報を入力:
   - **対象入居者**: テスト入居者3を選択（受信者は自動的にテスト入居者3家族に決定される）
   - **メッセージ内容**: `いつもお世話になっております。テスト入居者3さんの今日の様子をお伝えします。朝食は完食され、午前中はレクリエーション活動に参加されました。体調も良好で、笑顔で過ごされています。何かご質問がございましたらお気軽にお声かけください。`
5. 「送信」ボタンをクリック
6. 送信成功のメッセージが表示されることを確認

**MySQL確認:**
```sql
-- 送信されたメッセージを確認
SELECT 
    m.id,
    m.content,
    m.timestamp,
    sender.name as sender_name,
    receiver.name as receiver_name,
    r.name as resident_name
FROM Message m
JOIN User sender ON m.senderId = sender.id
JOIN User receiver ON m.receiverId = receiver.id
JOIN Resident r ON m.residentId = r.id
WHERE m.senderId = (SELECT id FROM User WHERE email = 'tanaka@example.com')
ORDER BY m.timestamp DESC
LIMIT 1;

-- 最新のメッセージIDを記録
SET @new_message_id = (
    SELECT m.id 
    FROM Message m 
    WHERE m.senderId = (SELECT id FROM User WHERE email = 'tanaka@example.com')
    ORDER BY m.timestamp DESC 
    LIMIT 1
);
SELECT @new_message_id as new_message_id;
```

#### 7.2 家族ユーザーでのメッセージ受信確認
**目的:** 家族ユーザーがスタッフから送信されたメッセージを受信・確認できることを検証する

**アプリケーション操作:**テスト試行回数:n=3
1. ログアウトして家族ユーザーテスト家族n(test.family(n)@example.com)でログイン
2. 「メッセージ」タブをクリック
3. 受信メッセージ一覧で以下を確認:
   - スタッフ（田中花子）から送信されたメッセージが表示される
   - 対象入居者（テスト入居者n）の情報が表示される
   - メッセージ内容が正しく表示される
   - 送信日時が表示される

**MySQL確認:**
```sql
-- 家族ユーザー宛のメッセージを確認
SELECT 
    m.id,
    m.content,
    m.timestamp,
    sender.name as sender_name,
    r.name as resident_name
FROM Message m
JOIN User sender ON m.senderId = sender.id
JOIN User receiver ON m.receiverId = receiver.id
JOIN Resident r ON m.residentId = r.id
WHERE m.receiverId = (SELECT id FROM User WHERE email = 'sato.family@example.com')
ORDER BY m.timestamp DESC;
```

**期待される結果:**
- 対象入居者（佐藤花江）を選択すると、受信者が自動的に佐藤家族に決定される
- メッセージが正常に送信される
- 家族ユーザーが受信メッセージを確認できる
- メッセージに送信者、受信者、対象入居者の情報が正しく記録される
- データベースにメッセージ情報が保存される

### テストケース8: 家族関係の設定

#### 8.1 入居者と家族の関係設定
**アプリケーション操作:**
1. スタッフユーザーでログイン
2. 「入居者管理」タブをクリック
3. 入居者の「編集」ボタンをクリック
4. 編集ダイアログの「家族関係設定」セクションで家族ユーザーを選択
5. 家族関係を更新

**MySQL確認:**
```sql
-- 入居者と家族の関係を確認
SELECT 
    rf.id,
    r.name as resident_name,
    u.name as family_name,
    u.email as family_email,
    rf.createdAt
FROM ResidentFamily rf
JOIN Resident r ON rf.residentId = r.id
JOIN User u ON rf.userId = u.id
ORDER BY rf.createdAt DESC;
```

**特定の入居者の家族関係を確認する場合:**
```sql
-- 例: テスト入居者3の家族関係を確認
SELECT 
    rf.id,
    r.name as resident_name,
    u.name as family_name,
    u.email as family_email,
    rf.createdAt
FROM ResidentFamily rf
JOIN Resident r ON rf.residentId = r.id
JOIN User u ON rf.userId = u.id
WHERE r.name = 'テスト入居者3';
```

### テストケース9: レポート参照機能

#### 9.1 介護レポートの参照
**アプリケーション操作:**
1. 家族ユーザーでログイン
2. 「介護レポート」タブをクリック
3. 期間を選択してレポートを表示
4. スタッフが記録した介護記録が正しく表示されることを確認

**MySQL確認:**
```sql
-- 家族ユーザーが参照可能な介護記録を確認
-- 家族ユーザーに関連付けられた入居者の介護記録のみが表示されることを確認
SELECT 
    cr.date,
    cr.meal,
    cr.bath,
    cr.toilet,
    cr.medicine,
    cr.vital,
    cr.note,
    u.name as staff_name,
    r.name as resident_name,
    family_user.name as family_name,
    family_user.email as family_email
FROM CareRecord cr
JOIN User u ON cr.staffId = u.id
JOIN Resident r ON cr.residentId = r.id
JOIN ResidentFamily rf ON r.id = rf.residentId
JOIN User family_user ON rf.userId = family_user.id
WHERE family_user.role = 'FAMILY'  -- 家族ユーザーのみ
  AND cr.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY family_user.name, cr.date DESC;
```

### テストケース10: ログアウト機能

#### 10.1 ログアウトの実行
**アプリケーション操作:**
1. ログアウトボタンをクリック
2. ログインページに戻ることを確認

**MySQL確認:**
```sql
-- JWT戦略ではSessionテーブルは使用されないため、空のまま
SELECT * FROM Session;

-- ユーザー情報は残っている（正常）
SELECT id, name, email, role FROM User WHERE email = 'tanaka@example.com';
```

**期待される結果:**
- Sessionテーブルは空のまま（JWT戦略のため）
- ユーザー情報はデータベースに残っている
- ブラウザのLocal StorageからJWTトークンが削除されていることを確認

## テストデータのクリーンアップ

### テスト終了後のデータ削除
```sql
-- テストで作成したデータを削除（外部キー制約を考慮した順序）

-- 1. メッセージを削除
DELETE FROM Message WHERE id = @new_message_id;

-- 2. 写真を削除
DELETE FROM Photo WHERE id = @new_photo_id;

-- 3. 介護記録を削除
DELETE FROM CareRecord WHERE id = @new_care_record_id;

-- 4. 入居者と家族の関係を削除
DELETE FROM ResidentFamily WHERE residentId = @new_resident_id;

-- 5. 入居者を削除
DELETE FROM Resident WHERE id = @new_resident_id;

-- 6. セッションを削除
DELETE FROM Session WHERE userId IN (
    SELECT id FROM User WHERE email IN ('tanaka@example.com', 'sato.family@example.com')
);

-- 7. アカウントを削除
DELETE FROM Account WHERE userId IN (
    SELECT id FROM User WHERE email IN ('tanaka@example.com', 'sato.family@example.com')
);

-- 8. テスト用家族ユーザーのみ削除（スタッフアカウントは保持）
DELETE FROM User WHERE email IN ('sato.family@example.com') AND role = 'FAMILY';
```

### スタッフアカウントの管理について

**本番運用でのスタッフアカウント作成フロー:**
1. 新入社員入社
2. 担当課がデータベースに直接スタッフ情報を登録
3. 新入社員にアプリ情報とログイン情報を提供
4. 新入社員は提供された情報でログイン

**テスト環境でのスタッフアカウント:**
- `yamada@example.com` / `password123` (STAFF)
- `test.staff@example.com` / `password123` (STAFF)

**注意**: テストデータクリーンアップ時はスタッフアカウントを削除しないでください。

## テスト結果の記録

### テスト結果テンプレート
```
テストケース: [テストケース名]
実行日時: [YYYY-MM-DD HH:MM:SS]
実行者: [名前]
結果: [PASS/FAIL]
備考: [問題点や改善点があれば記録]
```

### 各テストケースの確認ポイント
1. **アプリケーション側**: UIの表示、操作の実行、エラーメッセージの確認
2. **データベース側**: データの挿入、更新、削除の確認、整合性の確認
3. **認証・認可**: 適切なユーザーのみがアクセスできることの確認
4. **データ整合性**: 外部キー制約、ユニーク制約の確認


## 注意事項

1. **テストデータの管理**: テスト用データは必ず削除してください
2. **本番環境での実行禁止**: このテストは開発環境でのみ実行してください
3. **バックアップの取得**: 重要なデータがある場合は事前にバックアップを取得してください
4. **段階的な実行**: テストケースは順番に実行し、各段階で結果を確認してください
5. **エラーハンドリング**: エラーが発生した場合は、原因を特定してから次のテストに進んでください
6. **家族承認システムの依存関係**: テストケース1は順番に実行する必要があります
7. **データベースの状態確認**: 各テスト後にデータベースの状態を確認してください

