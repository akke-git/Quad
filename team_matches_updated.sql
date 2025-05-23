-- 팀 테이블 생성
CREATE TABLE team (
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

-- 팀 매치 테이블 생성
CREATE TABLE team_match (
    team_match_id INT AUTO_INCREMENT PRIMARY KEY,
    team1_id INT NOT NULL,
    team2_id INT NOT NULL,
    course_id INT NOT NULL,
    match_date DATE NOT NULL,
    handicap_team INT,
    handicap_amount INT,
    match_status VARCHAR(20),
    winner INT,
    match_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    match_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team1_id) REFERENCES team(team_id),
    FOREIGN KEY (team2_id) REFERENCES team(team_id),
    FOREIGN KEY (course_id) REFERENCES golf_courses(id),
    FOREIGN KEY (winner) REFERENCES team(team_id)
);

-- 팀 매치 홀 테이블 생성 (수정됨)
CREATE TABLE team_match_hole (
    team_match_id INT NOT NULL,
    hole_number INT NOT NULL,
    winner_team INT, -- 1 또는 2의 값을 가짐 (팀 ID가 아니라 팀 번호)
    team_match_hole_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    team_match_hole_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (team_match_id, hole_number),
    FOREIGN KEY (team_match_id) REFERENCES team_match(team_match_id)
    -- winner_team에 대한 외래 키 제약 조건 제거됨
);
