-- Add unique index for missed feeding warnings to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_warning_type_catid_expectedtime
ON "public"."notifications" (
  type,
  ((metadata->>'catId')),
  ((metadata->>'expectedTime'))
)
WHERE type = 'warning'; 