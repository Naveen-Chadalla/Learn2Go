/*
  # Fix lesson_id UUID type mismatch

  This migration changes the lesson_id from UUID to TEXT type to support string-based lesson IDs
  like "default-1", "generated_123", etc.

  ## Changes Made:
  1. Drop foreign key and unique constraints
  2. Change lessons.id from UUID to TEXT
  3. Change user_progress.lesson_id from UUID to TEXT
  4. Recreate all constraints and indexes
*/

-- First, drop all constraints that depend on the columns we're changing
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_lesson_id_fkey;
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_username_lesson_id_key;

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

-- Recreate the unique constraint
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_username_lesson_id_key 
UNIQUE (username, lesson_id);

-- Recreate the index
CREATE INDEX idx_user_progress_lesson_id ON user_progress USING btree (lesson_id);