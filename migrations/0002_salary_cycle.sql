-- Add salary_day (day of month when salary is received and new budget month begins, default 28 for KSA)
ALTER TABLE users ADD COLUMN salary_day INTEGER NOT NULL DEFAULT 28;
