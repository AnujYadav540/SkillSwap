-- Add location fields to users table
ALTER TABLE users 
ADD COLUMN city VARCHAR(100),
ADD COLUMN country VARCHAR(100),
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN location_type ENUM('auto', 'manual') DEFAULT 'manual';

-- Add index for location queries
CREATE INDEX idx_location ON users(latitude, longitude);
