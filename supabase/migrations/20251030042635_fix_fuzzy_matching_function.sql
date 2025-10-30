/*
  # Fix Fuzzy Matching Function

  Replace the custom Levenshtein distance function with PostgreSQL's built-in
  fuzzystrmatch extension which provides a more reliable implementation.

  ## Changes
  1. Enable fuzzystrmatch extension
  2. Replace levenshtein_distance function with built-in version
  3. Update category_similarity to use the built-in function
*/

-- Enable fuzzystrmatch extension for built-in levenshtein function
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Drop old custom function
DROP FUNCTION IF EXISTS levenshtein_distance(text, text);

-- Update category_similarity to use built-in levenshtein function
CREATE OR REPLACE FUNCTION category_similarity(cat1 text, cat2 text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  norm1 text := normalize_category(cat1);
  norm2 text := normalize_category(cat2);
  max_len integer;
  distance integer;
BEGIN
  -- Exact match after normalization
  IF norm1 = norm2 THEN
    RETURN 1.0;
  END IF;
  
  max_len := GREATEST(length(norm1), length(norm2));
  IF max_len = 0 THEN
    RETURN 0.0;
  END IF;
  
  -- Use built-in levenshtein function from fuzzystrmatch extension
  distance := levenshtein(norm1, norm2);
  
  -- Return similarity score (1 - distance/max_length)
  RETURN ROUND(1.0 - (distance::numeric / max_len::numeric), 2);
END;
$$;