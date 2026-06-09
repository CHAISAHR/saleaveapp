-- Adds a dedicated contract_expiry_date column (distinct from contract_termination_date)
-- contract_expiry_date = end date of the current fixed-term contract (drives renewal reminders)
-- contract_termination_date = date employee actually leaves the organization (existing field, untouched)

ALTER TABLE users
  ADD COLUMN contract_expiry_date DATE NULL AFTER contract_termination_date;

ALTER TABLE leave_balances
  ADD COLUMN Contract_expiry_date DATE NULL AFTER Contract_termination_date;

-- Switch contract_renewals tracking from termination date to expiry date
ALTER TABLE contract_renewals
  ADD COLUMN contract_expiry_date DATE NULL AFTER contract_termination_date;

-- Backfill: existing rows were created against the termination date; copy it across so history is preserved
UPDATE contract_renewals SET contract_expiry_date = contract_termination_date WHERE contract_expiry_date IS NULL;

-- Make required and replace the old unique key
ALTER TABLE contract_renewals
  MODIFY COLUMN contract_expiry_date DATE NOT NULL,
  DROP INDEX uniq_user_termination,
  ADD UNIQUE KEY uniq_user_expiry (user_email, contract_expiry_date);
