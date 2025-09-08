# MySQL データベーステストケース

## 概要
介護記録共有アプリケーションのMySQLデータベースに対して、コマンドラインから直接テストを実行するためのテストケース集です。

## 前提条件

### 1. MySQL接続設定
```bash
# 環境変数の確認
DATABASE_URL="mysql://root:password@localhost:3306/care_records_db"
```

### 2. MySQLコマンドライン接続
```bash
# MySQLに接続
mysql -u root -p

# データベースを選択
USE care_records_db;
```

## テストケース一覧

### 1. テーブル構造の確認テスト

#### 1.1 全テーブルの存在確認
```sql
-- データベース内の全テーブルを表示
SHOW TABLES;

-- 期待される結果:
-- Account
-- CareRecord
-- Message
-- Photo
-- Resident
-- ResidentFamily
-- Session
-- User
-- VerificationToken
```

#### 1.2 各テーブルの構造確認
```sql
-- Userテーブルの構造確認
DESCRIBE User;

-- Residentテーブルの構造確認
DESCRIBE Resident;

-- CareRecordテーブルの構造確認
DESCRIBE CareRecord;

-- Photoテーブルの構造確認
DESCRIBE Photo;

-- Messageテーブルの構造確認
DESCRIBE Message;

-- ResidentFamilyテーブルの構造確認
DESCRIBE ResidentFamily;
```

### 2. データ挿入テスト

#### 2.1 ユーザーデータの挿入テスト
```sql
-- スタッフユーザーの挿入
INSERT INTO User (id, name, email, password, role, createdAt, updatedAt) 
VALUES (
    'test_staff_001',
    'テスト スタッフ',
    'test.staff@example.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'STAFF',
    NOW(),
    NOW()
);

-- 家族ユーザーの挿入
INSERT INTO User (id, name, email, password, role, createdAt, updatedAt) 
VALUES (
    'test_family_001',
    'テスト 家族',
    'test.family@example.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'FAMILY',
    NOW(),
    NOW()
);

-- 挿入確認
SELECT * FROM User WHERE id IN ('test_staff_001', 'test_family_001');
```

#### 2.2 入居者データの挿入テスト
```sql
-- 入居者データの挿入
INSERT INTO Resident (id, name, birthday, createdAt, updatedAt) 
VALUES (
    'test_resident_001',
    'テスト 入居者',
    '1935-05-15',
    NOW(),
    NOW()
);

-- 挿入確認
SELECT * FROM Resident WHERE id = 'test_resident_001';
```

#### 2.3 入居者と家族の関係データ挿入テスト
```sql
-- 入居者と家族の関係を設定
INSERT INTO ResidentFamily (id, residentId, userId, createdAt, updatedAt) 
VALUES (
    'test_family_rel_001',
    'test_resident_001',
    'test_family_001',
    NOW(),
    NOW()
);

-- 挿入確認
SELECT * FROM ResidentFamily WHERE id = 'test_family_rel_001';
```

#### 2.4 介護記録データの挿入テスト
```sql
-- 介護記録の挿入
INSERT INTO CareRecord (
    id, 
    residentId, 
    staffId, 
    date, 
    meal, 
    bath, 
    toilet, 
    medicine, 
    vital, 
    note, 
    createdAt, 
    updatedAt
) VALUES (
    'test_care_001',
    'test_resident_001',
    'test_staff_001',
    CURDATE(),
    '朝食：おかゆ完食、昼食：普通食8割摂取、夕食：普通食完食',
    '入浴済み（15:30-16:00）温度38℃',
    '排尿：正常、排便：1回（午前中）',
    '血圧薬服用済み（朝・夕）',
    '体温36.5℃、血圧128/80、脈拍72',
    'お元気でよく笑顔を見せてくださいました。食欲も良好です。',
    NOW(),
    NOW()
);

-- 挿入確認
SELECT * FROM CareRecord WHERE id = 'test_care_001';
```

#### 2.5 写真データの挿入テスト
```sql
-- 写真データの挿入
INSERT INTO Photo (id, residentId, userId, url, caption, createdAt, updatedAt) 
VALUES (
    'test_photo_001',
    'test_resident_001',
    'test_staff_001',
    '/uploads/test_resident_001_activity.jpg',
    'レクリエーション活動の様子',
    NOW(),
    NOW()
);

-- 挿入確認
SELECT * FROM Photo WHERE id = 'test_photo_001';
```

#### 2.6 メッセージデータの挿入テスト
```sql
-- メッセージデータの挿入
INSERT INTO Message (
    id, 
    senderId, 
    receiverId, 
    residentId, 
    content, 
    timestamp, 
    createdAt, 
    updatedAt
) VALUES (
    'test_message_001',
    'test_family_001',
    'test_staff_001',
    'test_resident_001',
    'いつもお世話になっております。今日の様子はいかがでしたでしょうか？',
    NOW(),
    NOW(),
    NOW()
);

-- 挿入確認
SELECT * FROM Message WHERE id = 'test_message_001';
```

### 3. データ検索・結合テスト

#### 3.1 入居者と家族の関係確認
```sql
-- 入居者とその家族の情報を取得
SELECT 
    r.name AS resident_name,
    r.birthday,
    u.name AS family_name,
    u.email AS family_email
FROM Resident r
JOIN ResidentFamily rf ON r.id = rf.residentId
JOIN User u ON rf.userId = u.id
WHERE r.id = 'test_resident_001';
```

#### 3.2 入居者の介護記録一覧
```sql
-- 特定の入居者の介護記録を取得
SELECT 
    cr.date,
    cr.meal,
    cr.bath,
    cr.toilet,
    cr.medicine,
    cr.vital,
    cr.note,
    u.name AS staff_name
FROM CareRecord cr
JOIN User u ON cr.staffId = u.id
WHERE cr.residentId = 'test_resident_001'
ORDER BY cr.date DESC;
```

#### 3.3 入居者の写真一覧
```sql
-- 特定の入居者の写真を取得
SELECT 
    p.url,
    p.caption,
    p.createdAt,
    u.name AS uploaded_by
FROM Photo p
JOIN User u ON p.userId = u.id
WHERE p.residentId = 'test_resident_001'
ORDER BY p.createdAt DESC;
```

#### 3.4 入居者に関連するメッセージ一覧
```sql
-- 特定の入居者に関連するメッセージを取得
SELECT 
    m.content,
    m.timestamp,
    sender.name AS sender_name,
    receiver.name AS receiver_name
FROM Message m
JOIN User sender ON m.senderId = sender.id
JOIN User receiver ON m.receiverId = receiver.id
WHERE m.residentId = 'test_resident_001'
ORDER BY m.timestamp DESC;
```

### 4. データ更新テスト

#### 4.1 介護記録の更新
```sql
-- 介護記録の更新
UPDATE CareRecord 
SET 
    meal = '朝食：普通食完食、昼食：普通食完食、夕食：普通食9割摂取',
    note = '体調良好。食欲も旺盛で、レクリエーションにも積極的に参加されていました。',
    updatedAt = NOW()
WHERE id = 'test_care_001';

-- 更新確認
SELECT * FROM CareRecord WHERE id = 'test_care_001';
```

#### 4.2 写真のキャプション更新
```sql
-- 写真のキャプション更新
UPDATE Photo 
SET 
    caption = 'レクリエーション活動の様子（更新）',
    updatedAt = NOW()
WHERE id = 'test_photo_001';

-- 更新確認
SELECT * FROM Photo WHERE id = 'test_photo_001';
```

### 5. データ削除テスト

#### 5.1 テストデータの削除（外部キー制約を考慮した順序）
```sql
-- 1. メッセージを削除
DELETE FROM Message WHERE id = 'test_message_001';

-- 2. 写真を削除
DELETE FROM Photo WHERE id = 'test_photo_001';

-- 3. 介護記録を削除
DELETE FROM CareRecord WHERE id = 'test_care_001';

-- 4. 入居者と家族の関係を削除
DELETE FROM ResidentFamily WHERE id = 'test_family_rel_001';

-- 5. 入居者を削除
DELETE FROM Resident WHERE id = 'test_resident_001';

-- 6. ユーザーを削除
DELETE FROM User WHERE id IN ('test_staff_001', 'test_family_001');
```

### 6. 制約テスト

#### 6.1 外部キー制約テスト
```sql
-- 存在しないresidentIdで介護記録を作成しようとする（エラーになるはず）
INSERT INTO CareRecord (
    id, 
    residentId, 
    staffId, 
    date, 
    createdAt, 
    updatedAt
) VALUES (
    'test_care_invalid',
    'non_existent_resident',
    'test_staff_001',
    CURDATE(),
    NOW(),
    NOW()
);
-- エラー: Cannot add or update a child row: a foreign key constraint fails
```

#### 6.2 ユニーク制約テスト
```sql
-- 同じemailでユーザーを作成しようとする（エラーになるはず）
INSERT INTO User (id, name, email, password, role, createdAt, updatedAt) 
VALUES (
    'test_duplicate_email',
    '重複テスト',
    'test.staff@example.com', -- 既存のemail
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'STAFF',
    NOW(),
    NOW()
);
-- エラー: Duplicate entry 'test.staff@example.com' for key 'User.email'
```

### 7. パフォーマンステスト

#### 7.1 大量データ挿入テスト
```sql
-- 大量の介護記録を挿入（パフォーマンステスト用）
DELIMITER //
CREATE PROCEDURE InsertBulkCareRecords()
BEGIN
    DECLARE i INT DEFAULT 1;
    WHILE i <= 1000 DO
        INSERT INTO CareRecord (
            id, 
            residentId, 
            staffId, 
            date, 
            meal, 
            bath, 
            toilet, 
            medicine, 
            vital, 
            note, 
            createdAt, 
            updatedAt
        ) VALUES (
            CONCAT('bulk_care_', i),
            'test_resident_001',
            'test_staff_001',
            DATE_ADD(CURDATE(), INTERVAL -i DAY),
            CONCAT('テスト記録', i),
            CONCAT('入浴記録', i),
            CONCAT('トイレ記録', i),
            CONCAT('服薬記録', i),
            CONCAT('バイタル記録', i),
            CONCAT('備考', i),
            NOW(),
            NOW()
        );
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- プロシージャを実行
CALL InsertBulkCareRecords();

-- 結果確認
SELECT COUNT(*) as total_records FROM CareRecord WHERE id LIKE 'bulk_care_%';

-- プロシージャを削除
DROP PROCEDURE InsertBulkCareRecords;
```

### 8. データ整合性テスト

#### 8.1 カスケード削除テスト
```sql
-- 入居者を削除すると、関連する介護記録、写真、メッセージも削除されることを確認
-- （PrismaスキーマでonDelete: Cascadeが設定されているため）

-- 削除前の件数確認
SELECT 
    (SELECT COUNT(*) FROM CareRecord WHERE residentId = 'test_resident_001') as care_records,
    (SELECT COUNT(*) FROM Photo WHERE residentId = 'test_resident_001') as photos,
    (SELECT COUNT(*) FROM Message WHERE residentId = 'test_resident_001') as messages;

-- 入居者を削除
DELETE FROM Resident WHERE id = 'test_resident_001';

-- 削除後の件数確認（すべて0になるはず）
SELECT 
    (SELECT COUNT(*) FROM CareRecord WHERE residentId = 'test_resident_001') as care_records,
    (SELECT COUNT(*) FROM Photo WHERE residentId = 'test_resident_001') as photos,
    (SELECT COUNT(*) FROM Message WHERE residentId = 'test_resident_001') as messages;
```

## テスト実行手順

### 1. 事前準備
```bash
# 1. MySQLに接続
mysql -u root -p

# 2. データベースを選択
USE care_records_db;

# 3. 現在のテーブル状況を確認
SHOW TABLES;
```

### 2. テスト実行
1. **構造確認テスト** (テストケース1) を実行
2. **データ挿入テスト** (テストケース2) を実行
3. **データ検索テスト** (テストケース3) を実行
4. **データ更新テスト** (テストケース4) を実行
5. **制約テスト** (テストケース6) を実行
6. **データ削除テスト** (テストケース5) を実行

### 3. 結果確認
各テストケースの実行結果を確認し、期待される結果と一致することを確認してください。

## 注意事項

1. **テストデータの管理**: テスト用のデータは必ず削除してください
2. **本番環境での実行禁止**: このテストは開発環境でのみ実行してください
3. **バックアップの取得**: 重要なデータがある場合は事前にバックアップを取得してください
4. **外部キー制約**: データの削除は外部キー制約を考慮した順序で行ってください

## トラブルシューティング

### よくあるエラーと対処法

1. **接続エラー**
   ```bash
   # 接続情報を確認
   mysql -u root -p -h localhost -P 3306
   ```

2. **データベースが存在しない**
   ```sql
   CREATE DATABASE care_records_db;
   ```

3. **テーブルが存在しない**
   ```bash
   # Prismaマイグレーションを実行
   npx prisma migrate dev
   ```

4. **権限エラー**
   ```sql
   -- ユーザーに権限を付与
   GRANT ALL PRIVILEGES ON care_records_db.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```




