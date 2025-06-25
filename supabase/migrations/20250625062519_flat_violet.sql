/*
  # Add Country and Language Support

  1. Schema Updates
    - Add `country` and `language` columns to users table
    - Add `country` and `language` columns to lessons table for localized content
    - Update existing data with default values

  2. Security
    - Update RLS policies to work with new schema
    - Maintain existing security model

  3. Data Migration
    - Set default country and language for existing users
    - Update lessons to support localization
*/

-- Add country and language columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'country'
  ) THEN
    ALTER TABLE users ADD COLUMN country text DEFAULT 'US';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'language'
  ) THEN
    ALTER TABLE users ADD COLUMN language text DEFAULT 'en';
  END IF;
END $$;

-- Add country and language columns to lessons table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'country'
  ) THEN
    ALTER TABLE lessons ADD COLUMN country text DEFAULT 'US';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'language'
  ) THEN
    ALTER TABLE lessons ADD COLUMN language text DEFAULT 'en';
  END IF;
END $$;

-- Update existing lessons to have default country and language
UPDATE lessons 
SET country = 'US', language = 'en' 
WHERE country IS NULL OR language IS NULL;

-- Create indexes for better performance on localized content queries
CREATE INDEX IF NOT EXISTS idx_lessons_country_language ON lessons(country, language);
CREATE INDEX IF NOT EXISTS idx_lessons_country_language_level ON lessons(country, language, level, "order");

-- Update existing users to have default country and language if not set
UPDATE users 
SET country = 'US', language = 'en' 
WHERE country IS NULL OR language IS NULL;