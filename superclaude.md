# SuperClaude Framework 활용 가이드

이 프로젝트에서 SuperClaude 프레임워크를 활용할 수 있는 다양한 방법들을 소개합니다.

## 🚀 Development Commands

### `/build` - 프로젝트 빌드 최적화
```bash
/build --focus frontend
/build --api --focus performance
```
- Next.js 빌드 최적화
- 번들 크기 분석 및 개선
- API 성능 최적화

### `/implement` - 새 기능 구현
```bash
/implement --type component "음악 스트리밍 플레이어"
/implement --type api "실시간 알림 시스템"
/implement --framework nextjs "다국어 지원"
```
- 자동 프레임워크 패턴 감지
- 기존 코드 스타일 유지
- TypeScript/React 컨벤션 준수

## 🔍 Analysis Commands

### `/analyze` - 시스템 분석
```bash
/analyze --scope project --focus security
/analyze --scope module pages/api --focus performance
/analyze @components/ --focus quality
```
- 코드베이스 전체 분석
- 보안 취약점 검사
- 성능 병목 지점 식별

### `/troubleshoot` - 문제 해결
```bash
/troubleshoot "MySQL 연결 오류"
/troubleshoot "빌드 실패" --focus dependencies
```
- 체계적인 문제 진단
- 근본 원인 분석
- 해결책 제시

## ⚡ Quality & Improvement Commands

### `/improve` - 코드 개선
```bash
/improve --focus performance @pages/api/
/improve --focus security --scope project
/improve --focus accessibility @components/
```
- 성능 최적화
- 보안 강화
- 접근성 개선
- 코드 품질 향상

### `/cleanup` - 기술 부채 정리
```bash
/cleanup --focus "unused dependencies"
/cleanup @components/ --focus "duplicate code"
```
- 미사용 코드 제거
- 중복 코드 정리
- 의존성 최적화

## 📝 Documentation Commands

### `/document` - 문서화
```bash
/document --type api "블로그 API 가이드"
/document --type component @components/ServiceCard.js
/document --type guide "환경 설정 가이드"
```
- API 문서 자동 생성
- 컴포넌트 문서화
- 설정 가이드 작성

## 🧪 Testing Commands

### `/test` - 테스트 생성
```bash
/test --type unit @pages/api/blog/
/test --type e2e "골프 점수 입력 플로우"
/test --type integration "MySQL 연결"
```
- 단위 테스트 생성
- E2E 테스트 시나리오
- 통합 테스트 작성

## 🎨 Design Commands

### `/design` - UI/UX 개선
```bash
/design --focus responsive @components/
/design --focus accessibility "다크 테마 개선"
/design --type component "모던 대시보드"
```
- 반응형 디자인 최적화
- 접근성 개선
- 모던 UI 컴포넌트 생성

## 🔧 Advanced Features

### Wave Mode (복합 작업)
```bash
/improve --wave-mode --scope project
/analyze --wave-mode --comprehensive
```
- 대규모 프로젝트 개선
- 다단계 최적화
- 시스템 전반 분석

### Multi-Agent Delegation
```bash
/analyze --delegate --parallel-focus
/improve --delegate folders --concurrency 5
```
- 병렬 처리로 속도 향상
- 전문 영역별 분석
- 효율적인 작업 분배

### Loop Mode (반복 개선)
```bash
/improve --loop --iterations 3
/cleanup --loop --interactive
```
- 점진적 개선
- 반복적 최적화
- 대화형 개선 과정

## 🎯 프로젝트별 활용 예시

### 1. 블로그 시스템 개선
```bash
/analyze @pages/blog/ --focus performance
/implement --type feature "마크다운 실시간 프리뷰"
/improve @pages/api/blog/ --focus security
```

### 2. 골프 관리 시스템 최적화
```bash
/analyze @pages/golf/ --focus quality
/improve @pages/api/golf/ --focus performance
/design --focus UX "점수 입력 개선"
```

### 3. 대시보드 현대화
```bash
/design @components/ServiceCard.js --focus modern
/implement --type component "실시간 서비스 상태"
/improve @pages/index.js --focus performance
```

### 4. 보안 강화
```bash
/analyze --scope project --focus security
/improve --focus security @pages/api/
/document --type guide "보안 가이드라인"
```

## 💡 활용 팁

### 자동 감지 기능
- 프로젝트 구조 자동 인식 (Next.js, Tailwind CSS)
- 기존 코드 패턴 학습 및 적용
- 데이터베이스 연결 방식 자동 감지

### 품질 보장
- ESLint 규칙 자동 준수
- TypeScript 타입 안전성 유지
- 기존 스타일 가이드 따름

### 성능 최적화
- 병렬 작업 처리
- 캐싱 및 최적화
- 토큰 효율성 관리

이러한 명령어들을 통해 프로젝트의 품질, 성능, 보안을 체계적으로 개선할 수 있습니다. 각 명령어는 프로젝트의 기존 패턴과 컨벤션을 자동으로 인식하여 일관성 있는 결과를 제공합니다.