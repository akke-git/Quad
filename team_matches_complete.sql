-- 팀 테이블 (이미 존재한다면 건너뛰세요)
CREATE TABLE IF NOT EXISTS team (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    team_image VARCHAR(255),
    team_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    team_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id)
);

-- 팀 매치 테이블 (API 코드와 일치하도록 team_matches로 이름 변경)
CREATE TABLE IF NOT EXISTS team_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    match_date DATE NOT NULL,
    course_id INT NOT NULL,
    initial_handicap INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES golf_courses(id)
);

-- 팀 매치 팀 테이블
CREATE TABLE IF NOT EXISTS team_match_teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_match_id INT NOT NULL,
    team_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_match_id) REFERENCES team_matches(id)
);

-- 팀 매치 멤버 테이블
CREATE TABLE IF NOT EXISTS team_match_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES team_match_teams(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 팀 매치 홀 테이블
CREATE TABLE IF NOT EXISTS team_match_holes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_match_id INT NOT NULL,
    hole_number INT NOT NULL,
    winner_team INT, -- 1 또는 2의 값을 가짐 (팀 번호)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_match_id) REFERENCES team_matches(id),
    UNIQUE KEY (team_match_id, hole_number)
);
