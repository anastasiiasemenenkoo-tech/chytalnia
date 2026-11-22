-- The rows written so far hold UTC instants (the session time zone is GMT),
-- so that is what they are reinterpreted as. Nothing outside this table's own
-- counters depends on them.
ALTER TABLE "RateLimit"
  ALTER COLUMN "windowEnd" TYPE TIMESTAMPTZ(3)
  USING "windowEnd" AT TIME ZONE 'UTC';
