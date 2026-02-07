# Supabase MCP Prompt: 德语学习数据库表格设计

## 背景说明
我正在构建一个语言学习进度跟踪应用（ProgressPath），需要为德语学习功能创建相关的数据库表格。该应用已经有法语学习（french_learning）和图书进度跟踪（books）功能，现在需要添加德语学习的数据库支持。

## 需要创建的表格

### 1. 主表：`german_learning`
用于记录德语学习活动和进度。

**表结构要求：**

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT uuid_generate_v4() | 主键 |
| `user_id` | `uuid` | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | 用户ID（外键） |
| `activity_type` | `text` | NOT NULL | 活动类型：vocabulary, grammar, reading, listening, speaking, writing, exercise |
| `duration_minutes` | `integer` | NOT NULL | 学习时长（分钟） |
| `total_time` | `integer` | | 总时长（兼容字段） |
| `date` | `date` | NOT NULL | 学习日期 |
| `notes` | `text` | | 学习笔记 |
| `new_vocabulary` | `text[]` | | 新学词汇（数组格式） |
| `practice_sentences` | `text[]` | | 练习句子（数组格式） |
| `mood` | `text` | | 学习感受：good, neutral, difficult |
| `created_at` | `timestamptz` | DEFAULT now() | 创建时间 |
| `updated_at` | `timestamptz` | DEFAULT now() | 更新时间 |

**索引要求：**
- 在 `user_id` 上创建索引
- 在 `date` 上创建索引
- 在 `(user_id, date)` 上创建复合索引

**RLS（行级安全）策略：**
1. 启用 RLS：`ALTER TABLE german_learning ENABLE ROW LEVEL SECURITY;`
2. 用户只能查看自己的记录：
   ```sql
   CREATE POLICY "Users can view own german learning records"
   ON german_learning FOR SELECT
   USING (auth.uid() = user_id);
   ```
3. 用户只能插入自己的记录：
   ```sql
   CREATE POLICY "Users can insert own german learning records"
   ON german_learning FOR INSERT
   WITH CHECK (auth.uid() = user_id);
   ```
4. 用户只能更新自己的记录：
   ```sql
   CREATE POLICY "Users can update own german learning records"
   ON german_learning FOR UPDATE
   USING (auth.uid() = user_id);
   ```
5. 用户只能删除自己的记录：
   ```sql
   CREATE POLICY "Users can delete own german learning records"
   ON german_learning FOR DELETE
   USING (auth.uid() = user_id);
   ```

### 2. 扩展表（可选）：`german_vocabulary`
用于管理德语词汇库，支持更高级的词汇学习功能。

**表结构要求：**

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT uuid_generate_v4() | 主键 |
| `user_id` | `uuid` | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | 用户ID |
| `word` | `text` | NOT NULL | 德语单词 |
| `translation` | `text` | NOT NULL | 中文翻译 |
| `example_sentence` | `text` | | 例句 |
| `difficulty_level` | `text` | | 难度：A1, A2, B1, B2, C1, C2 |
| `category` | `text` | | 分类：noun, verb, adjective, etc. |
| `mastery_level` | `integer` | DEFAULT 0 | 掌握程度（0-5） |
| `last_reviewed` | `timestamptz` | | 上次复习时间 |
| `review_count` | `integer` | DEFAULT 0 | 复习次数 |
| `created_at` | `timestamptz` | DEFAULT now() | 创建时间 |
| `updated_at` | `timestamptz` | DEFAULT now() | 更新时间 |

**索引和RLS策略：**
- 类似 `german_learning` 表的设置
- 在 `word` 上创建索引以支持快速查找
- 在 `(user_id, mastery_level)` 上创建复合索引以支持按掌握程度筛选

## 执行指令

请使用 Supabase MCP 工具执行以下操作：

1. **创建 `german_learning` 表**，包含所有字段、索引和 RLS 策略
2. **创建 `german_vocabulary` 表**（可选），包含所有字段、索引和 RLS 策略
3. **验证表创建成功**，确认所有约束和策略都已正确应用
4. **测试 RLS 策略**，确保用户只能访问自己的数据

## 参考示例

如果需要参考现有表结构，可以查看：
- `french_learning` 表（法语学习表，结构应该与 `german_learning` 类似）
- `books` 表（图书进度表）

## 注意事项

1. 确保所有时间戳字段使用 `timestamptz` 类型（带时区）
2. 数组字段（`new_vocabulary`, `practice_sentences`）使用 `text[]` 类型
3. 所有外键都应设置 `ON DELETE CASCADE` 以确保数据一致性
4. RLS 策略必须正确配置，防止数据泄露
5. 索引设计要考虑查询性能，特别是按日期和用户ID的查询

## 预期结果

执行完成后，应该能够：
- ✅ 在 Supabase 中看到新创建的表
- ✅ 通过MCP和网页成功插入和查询德语学习记录
- ✅ RLS 策略正常工作，用户只能看到自己的数据
- ✅ 所有索引已创建，查询性能良好
