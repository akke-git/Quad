# Next.js 애플리케이션 배포 가이드 (기존 인프라 활용)

이 문서는 Windows PC에서 개발한 Next.js React + MySQL 애플리케이션을 기존 Linux 서버의 Nginx 및 MySQL 컨테이너에 배포하는 방법을 설명합니다.

## Next.js 빌드 및 Nginx 배포 방법

### 1. Next.js 애플리케이션 빌드

Windows PC에서 Next.js 애플리케이션을 빌드합니다:

```bash
# Next.js 프로젝트 디렉토리에서
npm run build
```

빌드가 완료되면 `.next` 디렉토리에 빌드 결과물이 생성됩니다. 추가로 프로덕션 배포를 위해 필요한 파일들은:
- `.next` 디렉토리 (빌드된 파일들)
- `public` 디렉토리 (정적 파일들)
- `package.json` 및 `package-lock.json` (의존성 정보)
- `next.config.js` (Next.js 설정 파일)

### 2. 빌드 결과물 전송

Windows PC에서 빌드한 결과물을 Linux 서버로 전송하는 방법은 몇 가지가 있습니다:

1. **SCP를 사용한 전송**:
   ```bash
   # Windows PowerShell 또는 Git Bash에서
   scp -r ./.next package.json package-lock.json next.config.js public/ username@your-server-ip:/path/to/destination
   ```

2. **SFTP 클라이언트 사용**:
   - FileZilla 같은 GUI 클라이언트로 파일 전송

3. **Git 저장소 활용**:
   - 빌드 결과물을 Git에 포함시키고 서버에서 pull

### 3. Nginx 컨테이너 설정

기존 Nginx 컨테이너에 Next.js 애플리케이션을 호스팅하기 위한 설정:

1. **Nginx 설정 파일 수정**:

   기존 Nginx 컨테이너의 설정 파일 위치를 확인하고, 다음과 같이 설정을 추가합니다:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # 또는 서버 IP

       location / {
           # Next.js 애플리케이션 빌드 결과물 경로
           root /path/to/nextjs-app;
           
           # Next.js 정적 파일 처리
           location /_next/static/ {
               alias /path/to/nextjs-app/.next/static/;
               expires 365d;
               add_header Cache-Control "public, max-age=31536000, immutable";
           }
           
           # Next.js API 및 동적 라우트 처리
           location / {
               proxy_pass http://localhost:3000;  # Next.js 서버 포트
               proxy_http_version 1.1;
               proxy_set_header Upgrade $http_upgrade;
               proxy_set_header Connection 'upgrade';
               proxy_set_header Host $host;
               proxy_cache_bypass $http_upgrade;
           }
       }
   }
   ```

2. **Next.js 애플리케이션 실행**:

   빌드된 Next.js 애플리케이션을 실행하기 위해 서버에서:

   ```bash
   cd /path/to/nextjs-app
   npm install --production
   npm start  # 또는 NODE_ENV=production node server.js
   ```

   또는 PM2 같은 프로세스 관리자를 사용:

   ```bash
   npm install -g pm2
   pm2 start npm --name "next-app" -- start
   ```

### 4. MySQL 데이터베이스 설정

기존 MySQL 컨테이너를 활용하여:

1. **데이터베이스 및 테이블 생성**:
   ```bash
   # MySQL 컨테이너에 접속
   docker exec -it mysql_container_name mysql -u username -p
   
   # MySQL 프롬프트에서
   CREATE DATABASE IF NOT EXISTS your_database_name;
   USE your_database_name;
   
   # 테이블 생성 등 필요한 작업 수행
   CREATE TABLE your_table_name (...);
   ```

2. **데이터 업로드**:
   - SQL 파일이 있다면:
     ```bash
     docker exec -i mysql_container_name mysql -u username -p your_database_name < data.sql
     ```
   - 또는 MySQL 클라이언트로 직접 데이터 입력

## 고려해야 할 사항

### 1. Next.js 서버 실행 방식

1. **Node.js 프로세스 관리**:
   - PM2나 Supervisor 같은 프로세스 관리자 사용
   - 시스템 재부팅 시 자동 시작 설정

2. **독립 컨테이너 vs 호스트 실행**:
   - Next.js만을 위한 별도 컨테이너 생성 고려
   - 호스트 시스템에서 직접 실행 시 의존성 관리

### 2. 환경 변수 관리

1. **데이터베이스 연결 정보**:
   ```
   DB_HOST=mysql_container_name  # 또는 컨테이너 IP
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_database_name
   ```

2. **Next.js 환경 설정**:
   - `.env.production` 파일 생성하여 서버로 전송
   - 또는 시스템 환경 변수로 설정

### 3. 네트워크 설정

1. **컨테이너 간 통신**:
   - Docker 네트워크 확인 (Docker Compose로 생성된 네트워크)
   - MySQL 컨테이너가 Next.js에서 접근 가능한지 확인

2. **포트 포워딩**:
   - Next.js 서버 포트(기본 3000)가 외부에서 접근 가능한지 확인
   - Nginx가 해당 포트로 프록시 설정

### 4. 보안 고려사항

1. **환경 변수 보호**:
   - 중요 정보(DB 비밀번호 등)는 .env 파일이나 Docker secrets 사용

2. **HTTPS 설정**:
   - 기존 Nginx에 SSL 인증서 설정
   - Let's Encrypt 활용

### 5. 배포 자동화 고려

1. **CI/CD 파이프라인**:
   - GitHub Actions 또는 Jenkins를 활용한 자동 빌드 및 배포
   - 빌드 → 테스트 → 서버 전송 → 애플리케이션 재시작

2. **스크립트 자동화**:
   - 배포 프로세스를 쉘 스크립트로 자동화
