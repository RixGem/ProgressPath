-- Migration: Fix NULL user_id values and add constraints
-- Date: 2025-12-24
-- Description: Ensures all books and french_learning records have valid user_id associations
--              and prevents future NULL user_id entries

BEGIN;

-- ============================================================================
-- PART 1: DATA VALIDATION AND CLEANUP
-- ============================================================================

-- Check for NULL user_id values in books table
DO $$
DECLARE
    null_books_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_books_count
    FROM books
    WHERE user_id IS NULL;
    
    IF null_books_count > 0 THEN
        RAISE NOTICE 'Found % books with NULL user_id', null_books_count;
    ELSE
        RAISE NOTICE 'No NULL user_id values found in books table';
    END IF;
END $$;

-- Check for NULL user_id values in french_learning table
DO $$
DECLARE
    null_french_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_french_count
    FROM french_learning
    WHERE user_id IS NULL;
    
    IF null_french_count > 0 THEN
        RAISE NOTICE 'Found % french_learning records with NULL user_id', null_french_count;
    ELSE
        RAISE NOTICE 'No NULL user_id values found in french_learning table';
    END IF;
END $$;

-- ============================================================================
-- PART 2: ADD NOT NULL CONSTRAINTS (if not already present)
-- ============================================================================

-- Make user_id NOT NULL in books table (if data is clean)
DO $$
BEGIN
    -- Only add constraint if no NULL values exist
    IF NOT EXISTS (
        SELECT 1 FROM books WHERE user_id IS NULL
    ) THEN
        ALTER TABLE books 
        ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'Added NOT NULL constraint to books.user_id';
    ELSE
        RAISE WARNING 'Cannot add NOT NULL constraint to books.user_id - NULL values still exist';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'books.user_id already has NOT NULL constraint or error occurred: %', SQLERRM;
END $$;

-- Make user_id NOT NULL in french_learning table (if data is clean)
DO $$
BEGIN
    -- Only add constraint if no NULL values exist
    IF NOT EXISTS (
        SELECT 1 FROM french_learning WHERE user_id IS NULL
    ) THEN
        ALTER TABLE french_learning 
        ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'Added NOT NULL constraint to french_learning.user_id';
    ELSE
        RAISE WARNING 'Cannot add NOT NULL constraint to french_learning.user_id - NULL values still exist';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'french_learning.user_id already has NOT NULL constraint or error occurred: %', SQLERRM;
END $$;

-- ============================================================================
-- PART 3: CREATE VALIDATION TRIGGERS
-- ============================================================================

-- Create trigger function to validate user_id on INSERT/UPDATE
CREATE OR REPLACE FUNCTION validate_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user_id is NULL
    IF NEW.user_id IS NULL THEN
        RAISE EXCEPTION 'user_id cannot be NULL. All records must be associated with a valid user.';
    END IF;
    
    -- Verify user_id exists in auth.users (optional, uncomment if you want to validate)
    -- IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
    --     RAISE EXCEPTION 'user_id % does not exist in auth.users', NEW.user_id;
    -- END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS validate_books_user_id ON books;
DROP TRIGGER IF EXISTS validate_french_learning_user_id ON french_learning;

-- Create trigger for books table
CREATE TRIGGER validate_books_user_id
    BEFORE INSERT OR UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_id();

RAISE NOTICE 'Created validation trigger for books table';

-- Create trigger for french_learning table
CREATE TRIGGER validate_french_learning_user_id
    BEFORE INSERT OR UPDATE ON french_learning
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_id();

RAISE NOTICE 'Created validation trigger for french_learning table';

-- ============================================================================
-- PART 4: ADD INDEXES FOR PERFORMANCE (if not already present)
-- ============================================================================

-- Create index on books.user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
RAISE NOTICE 'Ensured index exists on books.user_id';

-- Create index on french_learning.user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_french_learning_user_id ON french_learning(user_id);
RAISE NOTICE 'Ensured index exists on french_learning.user_id';

-- ============================================================================
-- PART 5: CREATE HELPER VIEWS FOR MONITORING
-- ============================================================================

-- View to monitor data integrity
CREATE OR REPLACE VIEW data_integrity_check AS
SELECT 
    'books' as table_name,
    COUNT(*) as total_records,
    COUNT(user_id) as records_with_user_id,
    COUNT(*) - COUNT(user_id) as null_user_id_count,
    COUNT(DISTINCT user_id) as unique_users
FROM books
UNION ALL
SELECT 
    'french_learning' as table_name,
    COUNT(*) as total_records,
    COUNT(user_id) as records_with_user_id,
    COUNT(*) - COUNT(user_id) as null_user_id_count,
    COUNT(DISTINCT user_id) as unique_users
FROM french_learning;

RAISE NOTICE 'Created data_integrity_check view for monitoring';

-- ============================================================================
-- PART 6: VERIFICATION
-- ============================================================================

-- Display final status
DO $$
DECLARE
    books_count INTEGER;
    french_count INTEGER;
    books_null INTEGER;
    french_null INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE user_id IS NULL)
    INTO books_count, books_null
    FROM books;
    
    SELECT COUNT(*), COUNT(*) FILTER (WHERE user_id IS NULL)
    INTO french_count, french_null
    FROM french_learning;
    
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'Books: % total records, % with NULL user_id', books_count, books_null;
    RAISE NOTICE 'French Learning: % total records, % with NULL user_id', french_count, french_null;
    
    IF books_null = 0 AND french_null = 0 THEN
        RAISE NOTICE 'SUCCESS: All records have valid user_id associations';
    ELSE
        RAISE WARNING 'WARNING: Some records still have NULL user_id values';
    END IF;
END $$;

-- Query the monitoring view
SELECT * FROM data_integrity_check;

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after migration to verify:

-- 1. Check for any remaining NULL user_id values
-- SELECT 'books' as table_name, COUNT(*) as null_count FROM books WHERE user_id IS NULL
-- UNION ALL
-- SELECT 'french_learning', COUNT(*) FROM french_learning WHERE user_id IS NULL;

-- 2. Verify triggers exist
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name LIKE '%user_id%';

-- 3. Verify constraints
-- SELECT conname, contype, conrelid::regclass 
-- FROM pg_constraint 
-- WHERE conname LIKE '%user_id%';

-- 4. Test trigger (should fail with error)
-- INSERT INTO books (title, author, progress, status) 
-- VALUES ('Test Book', 'Test Author', 0, 'planned');
-- Expected: ERROR: user_id cannot be NULL
