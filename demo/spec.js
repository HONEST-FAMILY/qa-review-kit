window.DEMO_SPEC = (base) => {
  const at = (path) => new URL(path, base).href;
  return {
    id: 'demo-academy',
    round: 1,
    title: '가상 학원 관리 · 예시 검수',
    site: base,
    hide: [],
    summary: '리포트 열람 확인, 엑셀 명단 자동 맞춤, 선생님 말투 초안을 넣었어요. 예시 화면이라 무엇을 눌러도 진짜 데이터는 바뀌지 않아요.',
    original: [
      { no: '1', who: '대표', when: '11월 12일 09:41', text: '학부모가 리포트를 열어 봤는지 리포트센터에서 보이게 해 주세요.\n안 읽은 사람만 골라서 다시 보내고 싶어요.' },
      { no: '2', who: '대표', when: '11월 12일 09:54', text: '학생 명부도 엑셀로 다운받으면 자동으로 입력완료가 되면 좋겠습니다.\n학원마다 엑셀 양식이 다 달라요.' },
      { no: '3', who: '대표', when: '11월 12일 10:10', text: '선생님이 평소 쓰던 말투로 소견 초안이 나오면 좋겠어요.\n마지막엔 선생님이 꼭 읽고 고쳐서 보내게요.' },
    ],
    actions: [
      { no: '1', title: '리포트 열람 확인', items: ["리포트센터 목록의 '열람' 칸에 읽은 날짜나 '안 읽음'이 보여요.", '[안 읽음만 보기]로 안 읽은 리포트만 모아 볼 수 있어요.'], refs: ['view', 'unread'] },
      { no: '2', title: '엑셀 명단 자동 맞춤', items: ["칸 이름이 달라도 '아이 이름 → 학생 이름'처럼 알아서 맞춰요.", '미리보기로 먼저 보여 주고, 등록은 원장님이 눌러야 돼요.'], refs: ['excel'] },
      { no: '3', title: '선생님 말투 소견 초안', items: ['발송 창의 [선생님 말투로 초안 쓰기]를 누르면 지난 소견 말투로 초안이 나와요.', '설정에서 끄면 단추가 사라져요.'], refs: ['draft', 'off'] },
      { title: '안 건드린 것', items: ['학생·리포트 데이터와 문자 발송 방식은 그대로예요.'] },
      { title: '되돌리는 법', items: ['예시라 되돌릴 것이 없어요. 실제 검수판에는 되돌리는 명령과 화면을 여기에 적어요.'] },
    ],
    prep: [
      `예시 사이트 주소는 \`${at('demo/app/index.html')}\` 이에요.`,
      '검수 계정은 원장 (예시)예요. 로그인 없이 열려요.',
    ],
    items: [
      {
        id: 'view',
        title: '리포트센터에 학부모 열람 여부가 보이는지',
        url: at('demo/app/reports.html'),
        env: '예시 사이트',
        account: '원장 (예시)',
        situation: '원장으로 로그인한 상태에서 리포트센터를 연다.',
        steps: [
          { text: "목록의 '열람' 칸에 '읽음 11월 12일'처럼 읽은 날짜가 보인다.", mark: { selector: 'td.read', text: '읽음 11월 12일' } },
          { text: "아직 안 읽은 리포트는 '안 읽음'으로 보인다.", mark: { selector: 'td.read', text: '안 읽음' } },
        ],
        ai: { result: '일치', at: '11월 12일 15:10', lines: ["1 '읽음 11월 12일' 보임: 일치", "2 '안 읽음' 2줄 보임: 일치", '휴대폰 폭 390px: 열람 칸이 잘리지 않음'] },
      },
      {
        id: 'unread',
        title: '[안 읽음만 보기]를 누르면 안 읽은 리포트만 남는지',
        url: at('demo/app/reports.html'),
        env: '예시 사이트',
        account: '원장 (예시)',
        steps: [
          { text: "[안 읽음만 보기]를 누르면 '리포트 2건'으로 줄고 '안 읽음' 줄만 남는다.", mark: [{ selector: 'button.chip', text: '안 읽음만 보기', label: '누르기' }, { selector: '[data-slot="count"]', label: '확인' }] },
          { text: "[전체]를 누르면 다시 '리포트 4건'이 된다.", mark: { selector: 'button.chip', text: '전체' } },
        ],
        ai: { result: '일치', at: '11월 12일 15:11', lines: ["1 '리포트 2건': 일치", "2 '리포트 4건': 일치"] },
      },
      {
        id: 'draft',
        title: '발송 창에서 선생님 말투 초안이 나오는지',
        url: at('demo/app/reports.html'),
        env: '예시 사이트',
        account: '원장 (예시)',
        steps: [
          { text: "첫 줄 가상하늘의 [발송하기]를 누르면 '리포트 발송 · 가상하늘' 창이 열린다.", mark: { selector: 'button.send', label: '누르기' } },
          { text: "'선생님 소견 확인 · 고치기'를 눌러 펼친다.", mark: { selector: '#send summary' } },
          { text: "[선생님 말투로 초안 쓰기]를 누르면 1초쯤 뒤 '선생님 말투 초안' 배지와 '지난 소견 3개의 말투를 참고한 초안입니다'가 보인다.", mark: [{ selector: '#send [data-slot="draft-btn"]', label: '누르기' }, { selector: '#send [data-slot="badge"]', label: '확인' }] },
          { text: '[소견 저장]은 누르지 않고 [닫기]로 창을 닫는다.', mark: { selector: '#send [data-close]' } },
        ],
        ai: { result: '일치', at: '11월 12일 15:13', lines: ["3 '선생님 말투 초안' 배지: 일치", "3 '지난 소견 3개의 말투를 참고한 초안입니다': 일치"] },
      },
      {
        id: 'excel',
        title: '낯선 칸 이름의 엑셀 명단을 자동으로 맞추는지',
        url: at('demo/app/students.html'),
        env: '예시 사이트',
        account: '원장 (예시)',
        steps: [
          { text: "[엑셀 명단으로 한 번에 등록]을 누르면 '엑셀 명단으로 학생 한 번에 등록' 창이 열린다.", mark: { selector: 'button', text: '엑셀 명단으로 한 번에 등록', label: '누르기' } },
          { text: "'또는 엑셀에서 표를 복사해 붙여 넣기' 칸에 아래 표를 붙여 넣는다.", mark: { selector: '#paste-box' }, copy: '번호,아이 이름,엄마 폰,본인 폰,수강 클래스\n1,가상하늘,010-1111-2222,010-3333-4444,월수 심화반\n2,가상바다,010-5555-6666,,화목 기본반' },
          { text: "[붙여 넣은 표 읽기]를 누르면 '붙여넣기 · 낯선 칸 이름도 자동으로 맞췄어요'가 보이고, 아이 이름은 학생 이름, 엄마 폰은 학부모 연락처로 잡힌다.", mark: [{ selector: '[data-slot="read"]', label: '누르기' }, { selector: '.ok-line', label: '확인' }] },
          { text: '[학생 2명 등록]은 누르지 않고 [다른 명단 올리기]를 누른다.', mark: { selector: '[data-slot="again"]' } },
        ],
        ai: { result: '일치', at: '11월 12일 15:16', lines: ['3 칸 연결 5개: 일치', '등록 단추는 누르지 않음'] },
      },
      {
        id: 'off',
        title: '설정에서 말투 초안을 끄면 단추가 사라지는지 (실패 경로)',
        url: at('demo/app/settings.html'),
        env: '예시 사이트',
        account: '원장 (예시)',
        steps: [
          { text: "'선생님 말투로 소견 초안 쓰기' 체크를 끄고 [운영·리포트 기준 저장]을 누르면 '설정을 저장했습니다' 알림이 뜬다.", mark: [{ selector: '#style-opinion', label: '끄기' }, { selector: '[data-slot="save"]', label: '누르기' }] },
          { text: `리포트센터 \`${at('demo/app/reports.html')}\` 로 가서 [발송하기] 창의 '선생님 소견 확인 · 고치기'를 펼치면 [선생님 말투로 초안 쓰기]가 없다.`, mark: { selector: 'button.send', label: '누르기' } },
          { text: '설정으로 돌아가 체크를 다시 켜고 저장한다.' },
        ],
        ai: { result: '일치', at: '11월 12일 15:18', lines: ['2 단추 없음: 일치', '3 다시 켬'] },
      },
    ],
    // 3.0 — 고객 요청 하나가 박스 한 장. 요청마다 묶인 검수항목(items)이 그 장의 '이렇게 확인하세요'가 된다
    log: {
      product: '가상 학원 관리',
      title: '업데이트 일지',
      version: 'v1.2.0',
      date: '2026.11.12',
      entries: [
        { id: 'read', title: '학부모가 리포트를 열어 봤는지 보이게', lines: ["리포트센터 목록에 '읽음 11월 12일'이나 '안 읽음'이 보입니다.", '[안 읽음만 보기]로 안 읽은 분만 골라 다시 보낼 수 있습니다.'], links: [{ label: '리포트센터 열기', url: at('demo/app/reports.html') }], items: ['view', 'unread'] },
        { id: 'excel', title: '학생 명부를 엑셀로 올리면 자동으로 입력되게', lines: ["학원마다 칸 이름이 달라도 '아이 이름 → 학생 이름'처럼 알아서 맞춥니다.", '등록 전에 미리보기로 먼저 보여 드립니다.'], links: [{ label: '학생 관리 열기', url: at('demo/app/students.html') }], items: ['excel'] },
        { id: 'tone', title: '선생님이 쓰던 말투로 소견 초안이 나오게', lines: ['발송 창에서 [선생님 말투로 초안 쓰기]를 누르면 지난 소견 말투로 초안이 나옵니다.', '설정에서 끌 수 있습니다.'], items: ['draft', 'off'] },
      ],
      remain: [{ id: 'push', ask: '학부모 앱으로도 알림이 가게 해 주세요', why: '앱 알림은 앱 심사를 통과해야 켤 수 있어요.', say: '학부모 앱 알림은 앱 심사가 끝나면 바로 켜겠습니다.' }],
    },
    message: '원장님, 요청하신 내용 반영했습니다.\n아래 링크에서 바뀐 내용을 한 번에 보실 수 있습니다.',
    offscreen: ['예시라 화면 밖에서 볼 것은 없어요. 실제 검수판에는 DB 기록, 문자 발송 내역, 결제사 화면처럼 사람이 따로 볼 곳을 적어요.'],
    regression: ['리포트 목록 부품을 쓰는 2곳(리포트센터, 학생 상세의 리포트 칸)을 열어 바뀐 칸을 그대로 받는지 대조했다 (예시 문장).'],
  };
};
