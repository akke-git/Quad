# MySQL DB 간단히 로컬에서 서버로 복제하기

프로토타입 개발에 적합한 가장 간단한 방법을 알려드리겠습니다. 아래 단계를 따라하시면 로컬 DB를 서버에 그대로 복제할 수 있습니다.

## 단계별 절차

### 1. 로컬 MySQL DB 덤프 생성

```bash
# 윈도우 명령 프롬프트에서
mysqldump -u 사용자명 -p 데이터베이스명 > db백업.sql

# 비밀번호 입력하라는 프롬프트가 표시됩니다
```

#### 모든 데이터베이스 백업이 필요하다면:
```bash
mysqldump -u 사용자명 -p --all-databases > 모든db백업.sql
```

### 2. 백업 파일을 서버로 전송

#### (방법 1) SCP 사용
```bash
scp db백업.sql 서버사용자명@서버IP:/원하는/저장/경로/
```

#### (방법 2) FTP/SFTP 클라이언트 사용
FileZilla 같은 프로그램으로 `db백업.sql` 파일을 서버에 업로드

### 3. 서버에서 DB 복원

```bash
# 서버 SSH 접속 후
mysql -u 사용자명 -p < /백업파일/경로/db백업.sql
```

#### 만약 DB가 아직 없다면 먼저 생성:
```bash
# MySQL에 접속
mysql -u 사용자명 -p

# MySQL 콘솔에서
CREATE DATABASE 데이터베이스명;
exit;

# 그리고 다시 복원 명령어 실행
mysql -u 사용자명 -p 데이터베이스명 < /백업파일/경로/db백업.sql
```

## 한 번에 하는 방법 (로컬에서 직접 서버로)

SSH가 설정되어 있다면 아래와 같이 한 명령어로도 가능합니다:

```bash
# 로컬 명령 프롬프트에서
mysqldump -u 로컬사용자 -p 데이터베이스명 | ssh 서버사용자@서버IP "mysql -u 서버DB사용자 -p 데이터베이스명"

# 로컬 MySQL 비밀번호와 서버 MySQL 비밀번호를 차례로 입력합니다
```

## Docker 환경에서의 적용 (Nginx 서버 환경)

```bash
# 1. 로컬에서 덤프 생성
mysqldump -u 로컬사용자 -p 데이터베이스명 > db백업.sql

# 2. 파일을 서버로 전송
scp db백업.sql 서버사용자@서버IP:/tmp/

# 3. 서버의 MySQL 컨테이너에 복원
# 컨테이너 이름 또는 ID 확인
docker ps | grep mysql

# 백업 파일을 컨테이너 내부로 복사
docker cp /tmp/db백업.sql mysql컨테이너ID:/tmp/

# 컨테이너 내에서 DB 복원
docker exec -i mysql컨테이너ID mysql -u root -p 데이터베이스명 < /tmp/db백업.sql
# 또는
docker exec -i mysql컨테이너ID bash -c "mysql -u root -p데이터베이스비밀번호 데이터베이스명 < /tmp/db백업.sql"
```

이 방법으로 로컬 개발 환경의 DB를 서버에 신속하게 그대로 복제할 수 있습니다. 프로토타입 개발에는 이 방법이 가장 간단하고 효율적입니다.