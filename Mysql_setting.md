-- 데이터베이스 생성
CREATE DATABASE sveltt_blog;
USE sveltt_blog;

-- 블로그 포스트 테이블 생성
```bash
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content LONGTEXT NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(100),
  source VARCHAR(255),
  thumbnail VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

-- 이미지 테이블 생성 (블로그 포스트에 포함된 이미지 저장)
```bash
CREATE TABLE images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT,
  url VARCHAR(255) NOT NULL,
  local_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

-- 테스트 데이터 추가

```bash
INSERT INTO posts (title, excerpt, content, date, category, source, thumbnail) VALUES 
('리눅스 서버 보안 강화하기', 
 '리눅스 서버의 보안을 강화하기 위한 10가지 필수 설정을 알아봅니다.',
 '# 리눅스 서버 보안 강화하기\n\n리눅스 서버의 보안을 강화하기 위한 10가지 필수 설정을 알아봅니다.\n\n## 1. SSH 설정 강화\n\n기본 SSH 포트(22)를 변경하고, 루트 로그인을 비활성화합니다.\n\n```bash\n# /etc/ssh/sshd_config 파일 수정\nPort 2222\nPermitRootLogin no\nPasswordAuthentication no\n```\n\n## 2. 방화벽 설정\n\nUFW(Uncomplicated Firewall)를 사용하여 필요한 포트만 개방합니다.\n\n```bash\nsudo ufw allow 2222/tcp\nsudo ufw allow 80/tcp\nsudo ufw allow 443/tcp\nsudo ufw enable\n```\n\n## 3. 자동 업데이트 설정\n\n보안 업데이트를 자동으로 설치하도록 설정합니다.\n\n```bash\nsudo apt install unattended-upgrades\nsudo dpkg-reconfigure -plow unattended-upgrades\n```\n\n## 4. Fail2Ban 설치\n\n무차별 로그인 시도를 차단합니다.\n\n```bash\nsudo apt install fail2ban\nsudo systemctl enable fail2ban\nsudo systemctl start fail2ban\n```\n\n## 5. 불필요한 서비스 비활성화\n\n사용하지 않는 서비스를 비활성화하여 공격 표면을 줄입니다.\n\n```bash\nsudo systemctl disable <service-name>\nsudo systemctl stop <service-name>\n```\n\n## 6. 사용자 계정 관리\n\nsudo 권한이 있는 일반 사용자 계정을 사용하고, 강력한 암호 정책을 적용합니다.\n\n## 7. 파일 시스템 보안\n\n중요 파일 및 디렉토리의 권한을 적절하게 설정합니다.\n\n## 8. 로깅 및 모니터링\n\n로그를 정기적으로 검토하고 모니터링 도구를 설치합니다.\n\n## 9. 백업 설정\n\n정기적인 백업을 설정하여 데이터 손실을 방지합니다.\n\n## 10. 보안 감사 도구 사용\n\nLynis와 같은 보안 감사 도구를 사용하여 정기적으로 시스템을 점검합니다.\n\n```bash\nsudo apt install lynis\nsudo lynis audit system\n```',
 '2025-04-20', 
 '서버 관리', 
 'https://example.com/linux-security', 
 '/images/blog/linux-security.jpg'),

('Docker 컨테이너 최적화 방법', 
 'Docker 컨테이너의 성능을 최적화하고 리소스 사용을 줄이는 방법을 알아봅니다.',
 '# Docker 컨테이너 최적화 방법\n\nDocker 컨테이너의 성능을 최적화하고 리소스 사용을 줄이는 방법을 알아봅니다.\n\n## 1. 경량 베이스 이미지 사용\n\nAlpine Linux와 같은 경량 이미지를 사용하여 이미지 크기를 줄입니다.\n\n```dockerfile\nFROM alpine:3.14\n# 대신에\n# FROM ubuntu:20.04\n```\n\n## 2. 다단계 빌드 사용\n\n빌드 도구와 종속성을 최종 이미지에 포함시키지 않습니다.\n\n```dockerfile\n# 빌드 단계\nFROM node:14 AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nRUN npm run build\n\n# 실행 단계\nFROM node:14-alpine\nWORKDIR /app\nCOPY --from=build /app/dist ./dist\nCOPY --from=build /app/node_modules ./node_modules\nEXPOSE 3000\nCMD ["node", "dist/index.js"]\n```\n\n## 3. 레이어 최소화\n\nRUN, COPY, ADD 명령을 결합하여 레이어 수를 줄입니다.\n\n## 4. .dockerignore 파일 사용\n\n불필요한 파일이 이미지에 포함되지 않도록 합니다.\n\n## 5. 리소스 제한 설정\n\n컨테이너의 CPU 및 메모리 사용량을 제한합니다.\n\n```bash\ndocker run --memory="512m" --cpus="1.0" my-container\n```\n\n## 6. 캐시 최적화\n\n빌드 캐시를 효율적으로 사용하여 빌드 시간을 단축합니다.\n\n## 7. 불필요한 서비스 제거\n\n컨테이너 내에서 필요하지 않은 서비스와 패키지를 제거합니다.\n\n## 8. 적절한 로깅 설정\n\n로그 드라이버를 최적화하여 디스크 I/O를 줄입니다.\n\n## 9. 네트워크 최적화\n\n적절한 네트워크 모드를 선택하고 불필요한 포트 노출을 피합니다.\n\n## 10. 정기적인 이미지 정리\n\n사용하지 않는 이미지, 컨테이너, 볼륨을 정기적으로 정리합니다.\n\n```bash\ndocker system prune -a\n```',
 '2025-04-15', 
 'Docker', 
 'https://example.com/docker-optimization', 
 '/images/blog/docker-optimization.jpg'),

('Next.js와 Tailwind CSS로 반응형 웹 만들기', 
 'Next.js와 Tailwind CSS를 활용하여 모바일 친화적인 반응형 웹사이트를 구축하는 방법을 알아봅니다.',
 '# Next.js와 Tailwind CSS로 반응형 웹 만들기\n\nNext.js와 Tailwind CSS를 활용하여 모바일 친화적인 반응형 웹사이트를 구축하는 방법을 알아봅니다.\n\n## 1. 프로젝트 설정\n\nNext.js와 Tailwind CSS를 설치합니다.\n\n```bash\nnpx create-next-app my-project\ncd my-project\nnpm install -D tailwindcss postcss autoprefixer\nnpx tailwindcss init -p\n```\n\n## 2. Tailwind 설정\n\ntailwind.config.js 파일을 구성합니다.\n\n```javascript\nmodule.exports = {\n  content: [\n    "./pages/**/*.{js,ts,jsx,tsx}",\n    "./components/**/*.{js,ts,jsx,tsx}",\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}\n```\n\n## 3. 글로벌 스타일 설정\n\nglobals.css 파일에 Tailwind 지시어를 추가합니다.\n\n```css\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n```\n\n## 4. 반응형 디자인 구현\n\nTailwind의 반응형 접두사를 사용하여 모바일 우선 디자인을 구현합니다.\n\n```jsx\n<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">\n  {/* 내용 */}\n</div>\n```\n\n## 5. 다크 모드 지원\n\nTailwind의 다크 모드 기능을 활용합니다.\n\n```jsx\n<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">\n  {/* 내용 */}\n</div>\n```',
 '2025-04-10', 
 '웹 개발', 
 'https://example.com/nextjs-tailwind', 
 '/images/blog/nextjs-tailwind.jpg');
```