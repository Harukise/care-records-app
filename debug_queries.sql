-- 1. 全ての介護記録を確認
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
    u.name as staff_name,
    cr.createdAt
FROM CareRecord cr
JOIN Resident r ON cr.residentId = r.id
JOIN User u ON cr.staffId = u.id
ORDER BY cr.createdAt DESC
LIMIT 10;

-- 2. 全ての入居者を確認
SELECT id, name, birthday, createdAt FROM Resident ORDER BY createdAt DESC;

-- 3. 最新の介護記録を確認（入居者ID指定なし）
SELECT 
    cr.id,
    cr.residentId,
    cr.staffId,
    cr.date,
    cr.meal,
    cr.bath,
    cr.toilet,
    cr.medicine,
    cr.vital,
    cr.note,
    cr.createdAt
FROM CareRecord cr
ORDER BY cr.createdAt DESC
LIMIT 5;

-- 4. 最新の介護記録を自動取得（入居者ID指定不要）
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

-- 5. 最新の入居者の最新記録を取得
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
WHERE r.id = (
    SELECT id FROM Resident 
    ORDER BY createdAt DESC 
    LIMIT 1
)
ORDER BY cr.createdAt DESC
LIMIT 1;

-- 5. テーブル構造の確認
DESCRIBE CareRecord;
DESCRIBE Resident;
DESCRIBE User;
