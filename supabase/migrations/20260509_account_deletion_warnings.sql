-- Tracks which users have received an inactivity warning email.
-- Automatically removed when the user account is deleted.
CREATE TABLE IF NOT EXISTS account_deletion_warnings (
  user_id   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  warned_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_deletion_warnings ENABLE ROW LEVEL SECURITY;
-- No user-facing RLS policy needed: only service role accesses this table.
