-- Create audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(255) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  old_values TEXT,
  new_values TEXT,
  changed_by VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_table_record (table_name, record_id),
  INDEX idx_changed_at (changed_at),
  INDEX idx_changed_by (changed_by)
);

-- Insert some test audit data
INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_by, changed_at) VALUES
('users', '1', 'INSERT', NULL, '{"name": "John Doe", "email": "john@example.com"}', 'admin@example.com', NOW() - INTERVAL 1 DAY),
('leave_requests', '1', 'INSERT', NULL, '{"type": "annual", "days": 5}', 'john@example.com', NOW() - INTERVAL 2 HOURS),
('leave_requests', '1', 'UPDATE', '{"status": "pending"}', '{"status": "approved"}', 'manager@example.com', NOW() - INTERVAL 1 HOUR);