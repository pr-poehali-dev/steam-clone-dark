-- Create frames table for profile frames
CREATE TABLE IF NOT EXISTS frames (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_frames table for purchased frames
CREATE TABLE IF NOT EXISTS user_frames (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  frame_id INTEGER REFERENCES frames(id),
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, frame_id)
);

-- Add active frame to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_frame_id INTEGER REFERENCES frames(id);