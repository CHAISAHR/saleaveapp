-- Contract Renewals tracking table
CREATE TABLE IF NOT EXISTS contract_renewals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_email VARCHAR(255) NOT NULL,
  manager_email VARCHAR(255) NULL,
  contract_termination_date DATE NOT NULL,
  status ENUM('Initiated','Sent to HR','Completed') NOT NULL DEFAULT 'Initiated',
  initiated_by VARCHAR(255) NULL,
  initiated_at TIMESTAMP NULL,
  sent_to_hr_by VARCHAR(255) NULL,
  sent_to_hr_at TIMESTAMP NULL,
  completed_by VARCHAR(255) NULL,
  completed_at TIMESTAMP NULL,
  last_reminder_sent_at TIMESTAMP NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_termination (user_email, contract_termination_date),
  INDEX idx_user (user_email),
  INDEX idx_manager (manager_email),
  INDEX idx_status (status)
);
