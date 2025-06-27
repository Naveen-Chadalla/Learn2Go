/*
  # Fix lesson_id type mismatch

  1. Schema Changes
    - Change `lessons.id` from UUID to TEXT to support string IDs like "default-1"
    - Update `user_progress.lesson_id` from UUID to TEXT to match
    - Recreate foreign key constraint with new types
    - Update indexes to work with TEXT type

  2. Data Migration
    - Preserve any existing data during the type conversion
    - Ensure all constraints and indexes are properly recreated

  3. Security
    - Maintain existing RLS policies
    - Ensure foreign key relationships are preserved
*/

-- First, drop the unique constraint (this will also drop the underlying index)
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_username_lesson_id_key;

-- Drop the foreign key constraint
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_lesson_id_fkey;

-- Drop any remaining indexes that depend on the UUID type
DROP INDEX IF EXISTS idx_user_progress_lesson_id;

-- Change lessons.id from UUID to TEXT
ALTER TABLE lessons ALTER COLUMN id TYPE TEXT;

-- Change user_progress.lesson_id from UUID to TEXT  
ALTER TABLE user_progress ALTER COLUMN lesson_id TYPE TEXT;

-- Recreate the foreign key constraint
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_lesson_id_fkey 
FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

-- Recreate the index
CREATE INDEX idx_user_progress_lesson_id ON user_progress USING btree (lesson_id);

-- Recreate the unique constraint (this will create the index automatically)
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_username_lesson_id_key 
UNIQUE (username, lesson_id);