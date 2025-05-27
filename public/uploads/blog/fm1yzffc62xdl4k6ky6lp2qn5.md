# 우분투 MySQL 완전 가이드

## 1. MySQL 설치

### 방법 1: APT 패키지 관리자 사용 (권장)
```bash
# 패키지 목록 업데이트
sudo apt update

# MySQL 서버 설치
sudo apt install mysql-server

# MySQL 클라이언트 (필요시)
sudo apt install mysql-client

# 설치 확인
mysql --version
sudo systemctl status mysql
```

### 방법 2: MySQL APT Repository 사용 (최신 버전)
```bash
# MySQL APT Repository 다운로드
wget https://dev.mysql.com/get/mysql-apt-config_0.8.29-1_all.deb

# 패키지 설치
sudo dpkg -i mysql-apt-config_0.8.29-1_all.deb

# 패키지 목록 업데이트
sudo apt update

# MySQL 설치
sudo apt install mysql-server
```

### 방법 3: Docker 사용 (컨테이너 환경)
```bash
# MySQL 컨테이너 실행
docker run -d \
  --name mysql-server \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  mysql:8.0

# 컨테이너에 접속
docker exec -it mysql-server mysql -u root -p
```

## 2. 초기 보안 설정

### MySQL 보안 스크립트 실행
```bash
sudo mysql_secure_installation
```

**설정 단계:**
1. VALIDATE PASSWORD PLUGIN 설정 (Y/n)
2. root 비밀번호 변경 (Y/n)
3. 익명 사용자 제거 (Y)
4. root 원격 로그인 금지 (Y)
5. test 데이터베이스 제거 (Y)
6. 권한 테이블 다시 로드 (Y)

### 수동 보안 설정
```sql
-- MySQL에 root로 접속
sudo mysql

-- root 비밀번호 설정 (MySQL 8.0)
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';

-- 권한 적용
FLUSH PRIVILEGES;

-- 익명 사용자 제거
DELETE FROM mysql.user WHERE User='';

-- test 데이터베이스 제거
DROP DATABASE IF EXISTS test;

-- 원격 root 접속 제한
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

FLUSH PRIVILEGES;
```

## 3. 사용자 관리 및 권한 설정

### 사용자 생성
```sql
-- 로컬 사용자 생성
CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';

-- 원격 사용자 생성
CREATE USER 'username'@'%' IDENTIFIED BY 'password';

-- 특정 IP에서만 접속 가능한 사용자
CREATE USER 'username'@'192.168.1.100' IDENTIFIED BY 'password';

-- 사용자 목록 확인
SELECT User, Host FROM mysql.user;
```

### 권한 부여
```sql
-- 전체 권한 부여
GRANT ALL PRIVILEGES ON *.* TO 'username'@'localhost';

-- 특정 데이터베이스 권한
GRANT ALL PRIVILEGES ON database_name.* TO 'username'@'localhost';

-- 읽기 전용 권한
GRANT SELECT ON database_name.* TO 'username'@'localhost';

-- 특정 테이블 권한
GRANT SELECT, INSERT, UPDATE ON database_name.table_name TO 'username'@'localhost';

-- DBA 권한 (백업, 복원 등)
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON *.* TO 'backup_user'@'localhost';

-- 권한 적용
FLUSH PRIVILEGES;

-- 사용자 권한 확인
SHOW GRANTS FOR 'username'@'localhost';
```

### 사용자 삭제 및 수정
```sql
-- 사용자 비밀번호 변경
ALTER USER 'username'@'localhost' IDENTIFIED BY 'new_password';

-- 권한 제거
REVOKE ALL PRIVILEGES ON database_name.* FROM 'username'@'localhost';

-- 사용자 삭제
DROP USER 'username'@'localhost';
```

## 4. 데이터베이스 관리

### 데이터베이스 생성 및 관리
```sql
-- 데이터베이스 생성
CREATE DATABASE database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 목록
SHOW DATABASES;

-- 데이터베이스 선택
USE database_name;

-- 테이블 목록
SHOW TABLES;

-- 테이블 구조 확인
DESCRIBE table_name;

-- 데이터베이스 삭제
DROP DATABASE database_name;
```

## 5. 백업 및 복원

### mysqldump를 이용한 백업
```bash
# 전체 데이터베이스 백업
mysqldump -u root -p --all-databases > all_databases_backup.sql

# 특정 데이터베이스 백업
mysqldump -u root -p database_name > database_backup.sql

# 구조만 백업 (데이터 제외)
mysqldump -u root -p --no-data database_name > structure_only.sql

# 데이터만 백업 (구조 제외)
mysqldump -u root -p --no-create-info database_name > data_only.sql

# 특정 테이블만 백업
mysqldump -u root -p database_name table1 table2 > tables_backup.sql

# 압축 백업
mysqldump -u root -p database_name | gzip > database_backup.sql.gz

# 원격 서버 백업
mysqldump -h remote_host -u username -p database_name > remote_backup.sql
```

### 고급 백업 옵션
```bash
# 트랜잭션과 일관성을 보장하는 백업 (InnoDB)
mysqldump -u root -p --single-transaction --routines --triggers database_name > backup.sql

# 바이너리 로그 위치 포함 (마스터-슬레이브 복제용)
mysqldump -u root -p --master-data=2 --single-transaction database_name > backup.sql

# 대용량 데이터베이스 백업 (확장 삽입 사용)
mysqldump -u root -p --extended-insert --quick database_name > backup.sql
```

### 백업 복원
```bash
# 전체 복원
mysql -u root -p < all_databases_backup.sql

# 특정 데이터베이스 복원
mysql -u root -p database_name < database_backup.sql

# 압축 파일 복원
gunzip < database_backup.sql.gz | mysql -u root -p database_name

# 새 데이터베이스로 복원
mysql -u root -p -e "CREATE DATABASE new_database_name;"
mysql -u root -p new_database_name < database_backup.sql
```

### mysqlpump 사용 (MySQL 5.7+)
```bash
# 병렬 백업 (성능 향상)
mysqlpump -u root -p --default-parallelism=4 database_name > backup.sql

# 특정 객체 제외
mysqlpump -u root -p --exclude-tables=log_table database_name > backup.sql
```

## 6. 자동 백업 스크립트

### 백업 스크립트 예제
```bash
#!/bin/bash
# /home/username/scripts/mysql_backup.sh

# 설정
DB_USER="backup_user"
DB_PASS="backup_password"
BACKUP_DIR="/home/username/mysql_backups"
DATE=$(date +%Y%m%d_%H%M%S)
DATABASES=("database1" "database2" "database3")

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

# 각 데이터베이스 백업
for DB in "${DATABASES[@]}"; do
    echo "Backing up database: $DB"
    mysqldump -u $DB_USER -p$DB_PASS --single-transaction $DB > $BACKUP_DIR/${DB}_${DATE}.sql
    
    # 압축
    gzip $BACKUP_DIR/${DB}_${DATE}.sql
    
    echo "Backup completed: ${DB}_${DATE}.sql.gz"
done

# 7일 이상 된 백업 파일 삭제
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup process completed!"
```

### 크론탭 설정
```bash
# 크론탭 편집
crontab -e

# 매일 오전 3시 백업
0 3 * * * /home/username/scripts/mysql_backup.sh >> /home/username/logs/backup.log 2>&1

# 매주 일요일 오전 2시 전체 백업
0 2 * * 0 mysqldump -u root -p'password' --all-databases | gzip > /home/username/mysql_backups/full_backup_$(date +\%Y\%m\%d).sql.gz
```

## 7. MySQL 설정 최적화

### 설정 파일 위치
```bash
# 주요 설정 파일
/etc/mysql/mysql.conf.d/mysqld.cnf

# 설정 파일 편집
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

### 기본 최적화 설정
```ini
[mysqld]
# 기본 설정
bind-address = 127.0.0.1
port = 3306
datadir = /var/lib/mysql

# 문자셋 설정
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 성능 최적화
innodb_buffer_pool_size = 1G  # 전체 메모리의 70-80%
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_file_per_table = 1

# 연결 설정
max_connections = 100
connect_timeout = 10
wait_timeout = 600

# 쿼리 캐시
query_cache_type = 1
query_cache_size = 128M

# 로그 설정
general_log = 0
log_error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2

# 바이너리 로그 (복제용)
log-bin = mysql-bin
expire_logs_days = 7
```

### 원격 접속 허용
```bash
# 바인드 주소 변경
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# bind-address 주석 처리 또는 변경
# bind-address = 127.0.0.1
bind-address = 0.0.0.0

# 방화벽 포트 허용
sudo ufw allow 3306

# MySQL 재시작
sudo systemctl restart mysql
```

## 8. 서비스 관리

### 시스템 서비스 명령어
```bash
# 서비스 시작/중지/재시작
sudo systemctl start mysql
sudo systemctl stop mysql
sudo systemctl restart mysql

# 서비스 상태 확인
sudo systemctl status mysql

# 부팅시 자동 시작 설정
sudo systemctl enable mysql
sudo systemctl disable mysql

# 실시간 로그 확인
sudo tail -f /var/log/mysql/error.log
```

## 9. 모니터링 및 유지보수

### 성능 모니터링 쿼리
```sql
-- 현재 연결 상태
SHOW PROCESSLIST;

-- 데이터베이스 크기 확인
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
GROUP BY table_schema;

-- 슬로우 쿼리 확인
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- InnoDB 상태 확인
SHOW ENGINE INNODB STATUS;

-- 변수 확인
SHOW VARIABLES LIKE '%innodb%';
SHOW STATUS LIKE '%innodb%';
```

### 테이블 최적화
```sql
-- 테이블 체크
CHECK TABLE table_name;

-- 테이블 복구
REPAIR TABLE table_name;

-- 테이블 최적화
OPTIMIZE TABLE table_name;

-- 테이블 분석
ANALYZE TABLE table_name;
```

## 10. 보안 강화

### SSL 설정
```bash
# SSL 인증서 확인
mysql -u root -p -e "SHOW VARIABLES LIKE '%ssl%';"

# SSL 강제 사용자 생성
mysql -u root -p -e "CREATE USER 'secure_user'@'%' IDENTIFIED BY 'password' REQUIRE SSL;"
```

### 추가 보안 설정
```sql
-- 비밀번호 정책 설정
INSTALL COMPONENT 'file://component_validate_password';

-- 계정 잠금 정책
ALTER USER 'username'@'localhost' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 2;

-- 비밀번호 만료 설정
ALTER USER 'username'@'localhost' PASSWORD EXPIRE INTERVAL 90 DAY;
```

## 11. 문제 해결

### 일반적인 문제 해결
```bash
# MySQL 서비스가 시작되지 않을 때
sudo systemctl status mysql
sudo journalctl -u mysql.service
sudo tail -f /var/log/mysql/error.log

# 권한 문제 해결
sudo chown -R mysql:mysql /var/lib/mysql
sudo chmod -R 755 /var/lib/mysql

# root 비밀번호 재설정
sudo systemctl stop mysql
sudo mysqld_safe --skip-grant-tables &
mysql -u root
# 비밀번호 변경 후
sudo systemctl restart mysql
```

### 데이터 복구
```bash
# InnoDB 복구 모드
# /etc/mysql/mysql.conf.d/mysqld.cnf에 추가
innodb_force_recovery = 1  # 1-6 단계별 복구

# 복구 후 설정 제거하고 재시작
sudo systemctl restart mysql
```

## 12. Docker Compose를 이용한 MySQL 설정

### docker-compose.yml 예제
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: mysql-server
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: app_database
      MYSQL_USER: app_user
      MYSQL_PASSWORD: app_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/conf.d:/etc/mysql/conf.d
      - ./mysql/init:/docker-entrypoint-initdb.d
    command: --default-authentication-plugin=mysql_native_password

volumes:
  mysql_data:
```

이제 우분투에서 MySQL을 완전히 관리할 수 있는 모든 방법을 익혔습니다. 홈서버 환경에서도 안정적으로 운영하실 수 있을 것입니다!