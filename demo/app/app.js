(() => {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const toast = (text) => {
    let t = $('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add('on');
    clearTimeout(t.timer);
    t.timer = setTimeout(() => t.classList.remove('on'), 2200);
  };
  const styleOn = () => localStorage.getItem('demo-style-opinion') !== 'off';
  const page = document.body.dataset.page;

  $$('.side a').forEach((a) => {
    if (a.dataset.page === page) a.classList.add('on');
  });

  $$('[data-open]').forEach((b) => b.addEventListener('click', () => {
    const dim = document.getElementById(b.dataset.open);
    if (b.dataset.student) $('[data-slot="student"]', dim).textContent = b.dataset.student;
    dim.classList.add('on');
    if (page === 'reports') {
      $('[data-slot="draft-btn"]', dim).hidden = !styleOn();
      $('[data-slot="badge"]', dim).textContent = '기록으로 자동 작성';
      $('[data-slot="badge"]', dim).className = 'badge b-gray';
      $('[data-slot="note"]', dim).textContent = '';
      $('textarea', dim).value = `${b.dataset.student || '학생'} 학생은 이번 주 분수의 덧셈 단원을 마쳤습니다. 숙제 4회 중 4회를 냈습니다.`;
      $('details', dim).open = false;
    }
  }));
  $$('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('.dim').classList.remove('on')));

  if (page === 'reports') {
    const rows = $$('tbody tr');
    const count = $('[data-slot="count"]');
    $$('[data-filter]').forEach((chip) => chip.addEventListener('click', () => {
      $$('[data-filter]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      const unread = chip.dataset.filter === 'unread';
      let shown = 0;
      rows.forEach((r) => {
        const hide = unread && r.dataset.read !== 'no';
        r.hidden = hide;
        if (!hide) shown += 1;
      });
      count.textContent = `리포트 ${shown}건`;
    }));
    const dim = $('#send');
    $('[data-slot="draft-btn"]', dim).addEventListener('click', (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '초안 쓰는 중…';
      setTimeout(() => {
        $('textarea', dim).value = '어머니, 이번 주 하늘이는 분수의 덧셈을 끝까지 차분하게 풀어냈어요. 숙제도 네 번 모두 챙겨 왔습니다. 다음 주에는 통분을 조금 더 연습해 볼게요.';
        $('[data-slot="badge"]', dim).textContent = '선생님 말투 초안';
        $('[data-slot="badge"]', dim).className = 'badge b-blue';
        $('[data-slot="note"]', dim).textContent = '지난 소견 3개의 말투를 참고한 초안입니다';
        btn.disabled = false;
        btn.textContent = '선생님 말투로 초안 쓰기';
      }, 900);
    });
    $('[data-slot="save"]', dim).addEventListener('click', () => toast('소견을 저장했습니다 (예시라 실제로는 저장되지 않아요)'));
  }

  if (page === 'students') {
    const dim = $('#excel');
    $('[data-slot="read"]', dim).addEventListener('click', () => {
      const text = $('textarea', dim).value.trim();
      if (!text) {
        toast('붙여 넣은 표가 없어요');
        return;
      }
      $('[data-slot="result"]', dim).hidden = false;
      const lines = text.split(/\r?\n/).filter(Boolean).length - 1;
      $('[data-slot="register"]', dim).textContent = `학생 ${Math.max(lines, 0)}명 등록`;
    });
    $('[data-slot="again"]', dim).addEventListener('click', () => {
      $('[data-slot="result"]', dim).hidden = true;
      $('textarea', dim).value = '';
    });
  }

  if (page === 'settings') {
    const box = $('#style-opinion');
    box.checked = styleOn();
    $('[data-slot="save"]').addEventListener('click', () => {
      localStorage.setItem('demo-style-opinion', box.checked ? 'on' : 'off');
      toast('설정을 저장했습니다');
    });
  }
})();
