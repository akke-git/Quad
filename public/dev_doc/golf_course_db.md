
```sql
-- 골프 스코어 관리 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS sveltt_golf;
USE sveltt_golf;

-- 골프 코스 테이블
CREATE TABLE golf_courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  address TEXT,
  holes INT NOT NULL DEFAULT 18,
  par INT NOT NULL DEFAULT 72,
  difficulty VARCHAR(50),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 홀 정보 테이블
CREATE TABLE course_holes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  hole_number INT NOT NULL,
  par INT NOT NULL,
  distance INT NOT NULL,
  handicap INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES golf_courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_hole (course_id, hole_number)
);

-- 사용자 테이블
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  handicap DECIMAL(4,1),
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 개인 라운드 기록 테이블
CREATE TABLE rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  play_date DATE NOT NULL,
  weather VARCHAR(50),
  total_score INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES golf_courses(id) ON DELETE CASCADE
);

-- 홀별 스코어 테이블
CREATE TABLE hole_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  round_id INT NOT NULL,
  hole_number INT NOT NULL,
  score INT NOT NULL,
  putts INT,
  fairway_hit BOOLEAN,
  green_in_regulation BOOLEAN,
  sand_save BOOLEAN,
  penalty_strokes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  UNIQUE KEY unique_hole_score (round_id, hole_number)
);

-- 팀 테이블
CREATE TABLE teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url VARCHAR(255),
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 팀 멤버 테이블
CREATE TABLE team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_membership (team_id, user_id)
);

-- 팀 경기 테이블
CREATE TABLE team_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  course_id INT NOT NULL,
  match_date DATE NOT NULL,
  format VARCHAR(50) NOT NULL,
  status ENUM('scheduled', 'in_progress', 'completed') DEFAULT 'scheduled',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES golf_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 팀 경기 참가 테이블
CREATE TABLE team_match_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id INT NOT NULL,
  team_id INT NOT NULL,
  total_score INT,
  result ENUM('win', 'loss', 'tie', 'pending') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES team_matches(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participation (match_id, team_id)
);

-- 팀 경기 개인 스코어 테이블
CREATE TABLE team_match_player_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id INT NOT NULL,
  user_id INT NOT NULL,
  team_id INT NOT NULL,
  total_score INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES team_matches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_player_score (match_id, user_id)
);

-- 샘플 데이터: 골프 코스
INSERT INTO golf_courses (name, location, address, holes, par, difficulty, image_url) VALUES
('파인힐스 CC', '경기도', '경기도 용인시 처인구 포곡읍 파인힐스로 399', 18, 72, '중급', '/images/golf/pinehills.jpg'),
('레이크사이드 CC', '충청남도', '충청남도 천안시 동남구 풍세면 호정로 191', 18, 72, '상급', '/images/golf/lakeside.jpg'),
('그린밸리 CC', '강원도', '강원도 원주시 지정면 신평리 1642', 18, 71, '초급', '/images/golf/greenvalley.jpg');

-- 샘플 데이터: 홀 정보 (파인힐스 CC의 처음 3홀만 예시)
INSERT INTO course_holes (course_id, hole_number, par, distance, handicap) VALUES
(1, 1, 4, 420, 5),
(1, 2, 3, 180, 17),
(1, 3, 5, 540, 7);

```
