/*
  # Fix migration for changing lessons.id from UUID to TEXT

  1. Changes
    - Drop the unique constraint that depends on the index
    - Drop the foreign key constraint
    - Drop the indexes
    - Change lessons.id from UUID to TEXT
    - Change user_progress.lesson_id from UUID to TEXT
    - Recreate the foreign key constraint
    - Recreate the indexes
    - Recreate the unique constraint

  2. Security
    - Maintains all existing RLS policies
    - Preserves data integrity with foreign key constraints
*/

-- First, drop the unique constraint
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_username_lesson_id_key;

-- Drop the foreign key constraint
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_lesson_id_fkey;

-- Drop indexes that depend on the UUID type
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

-- Recreate the unique constraint
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_username_lesson_id_key 
UNIQUE (username, lesson_id);