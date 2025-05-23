fetch("https://www.npcc.co.kr/course/w01.asp")

위 사이트는 노스팜 cc의 코스 정보 페이지입니다. 이 골프장의 모든 코스에 대해 다음 정보를 추출해주세요:
1. 각 코스명
2. 각 홀 번호 (1-9 또는 1-18)
3. 각 홀 이름 : 없는 경우 null
4. 각 홀의 파 정보 (PAR)
5. 각 홀의 핸디캡 정보 (HDCP) : 없는 경우 null
6. 각 홀의 거리 정보 (White 티 기준, 야드 또는 미터) : 없는 경우 null

결과는 코스별로 표 형식으로 정리해주시고, 모든 정보를 CSV 형식으로도 제공해주세요.



## 소피아그린 cc (id : 787)

{
  "courses": [
    {
      "courseName": "세종",
      "holes": [
        {"holeNumber": 1, "holeName": "누리홀", "par": 4, "hdcp": 8},
        {"holeNumber": 2, "holeName": "다솜홀", "par": 5, "hdcp": 2},
        {"holeNumber": 3, "holeName": "더기홀", "par": 4, "hdcp": 5},
        {"holeNumber": 4, "holeName": "마루홀", "par": 3, "hdcp": 9},
        {"holeNumber": 5, "holeName": "송알홀", "par": 4, "hdcp": 3},
        {"holeNumber": 6, "holeName": "아람홀", "par": 4, "hdcp": 1},
        {"holeNumber": 7, "holeName": "우금홀", "par": 5, "hdcp": 7},
        {"holeNumber": 8, "holeName": "하늬홀", "par": 3, "hdcp": 6},
        {"holeNumber": 9, "holeName": "한울홀", "par": 4, "hdcp": 4}
      ]
    },
    {
      "courseName": "황학",
      "holes": [
        {"holeNumber": 1, "holeName": "서희홀", "par": 4, "hdcp": 9},
        {"holeNumber": 2, "holeName": "백운홀", "par": 4, "hdcp": 5},
        {"holeNumber": 3, "holeName": "목은홀", "par": 5, "hdcp": 3},
        {"holeNumber": 4, "holeName": "매죽홀", "par": 3, "hdcp": 4},
        {"holeNumber": 5, "holeName": "우암홀", "par": 4, "hdcp": 7},
        {"holeNumber": 6, "holeName": "반계홀", "par": 5, "hdcp": 6},
        {"holeNumber": 7, "holeName": "명성홀", "par": 3, "hdcp": 8},
        {"holeNumber": 8, "holeName": "창의홀", "par": 4, "hdcp": 2},
        {"holeNumber": 9, "holeName": "묵사홀", "par": 4, "hdcp": 1}
      ]
    }
  ]
}






## 노스팜 cc

Course,HoleNumber,Name,Par,HDCP,Black,Blue,White,Red
WEST,1,,5,,550,485,470,350
WEST,2,,4,,550,485,470,350
WEST,3,,3,,200,140,125,110
WEST,4,,4,,385,355,325,310
WEST,5,,5,,490,465,440,415
WEST,6,,3,,185,165,140,120
WEST,7,,4,,390,370,345,325
WEST,8,,4,,325,305,290,275
WEST,9,,4,,365,340,320,305
EAST,1,,4,,325,305,290,275
EAST,2,,5,,460,415,380,350
EAST,3,,4,,385,365,350,330
EAST,4,,4,,370,345,325,315
EAST,5,,3,,200,180,160,130
EAST,6,,4,,415,395,380,345
EAST,7,,4,,340,310,290,265
EAST,8,,3,,140,115,95,75
EAST,9,,5,,490,470,460,440