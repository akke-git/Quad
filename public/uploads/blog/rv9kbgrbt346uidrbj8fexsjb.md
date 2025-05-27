### 사용자 sudo 그룹 추가 

```bash
# sudo 그룹에 추가 (더 안전)
sudo usermod -a -G sudo juu

# 확인
groups juu

# Docker 사용 권한
sudo usermod -a -G docker juu

# 웹서버 그룹
sudo usermod -a -G www-data juu

# 개발 디렉토리 소유권 변경
sudo chown -R juu:juu /project
sudo chmod -R 755 /project


# MySQL 그룹 추가
sudo usermod -a -G mysql juu
```


### WSL 환경에서의 특별한 점
WSL 기본 사용자는 자동으로 sudo 그룹 포함
bash# WSL 설치 시 생성되는 기본 사용자

```bash
groups $USER
# 결과: juu adm dialout cdrom floppy sudo audio dip video plugdev netdev
```
추가 사용자는 수동으로 권한 부여 필요
```bash
sudo usermod -a -G sudo newuser
bash# 새로 생성한 사용자는 sudo 그룹에 포함되지 않음
sudo useradd -m newuser
groups newuser
# 결과: newuser (sudo 그룹 없음)

# 수동으로 추가 필요
sudo usermod -a -G sudo newuser
```