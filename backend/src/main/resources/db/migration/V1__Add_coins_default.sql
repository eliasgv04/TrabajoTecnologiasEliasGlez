-- Add default value to coins column
ALTER TABLE users MODIFY COLUMN coins INT DEFAULT 0 NOT NULL;
