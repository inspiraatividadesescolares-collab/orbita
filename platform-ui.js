/* Shared navigation and collection controls. Learning and reward rules stay in app.js. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const dashboardScreens = new Set(['student', 'teacher', 'admin']);
  const stableStudentViews = new Set(['home', 'path', 'explore', 'challenge', 'logbook', 'avatar', 'progress']);
  let previousRoute, restoring = false, session = 0, toastTimer, menuReturnFocus, modalTrigger;
  const modalReturnFocus = new WeakMap();

  function route() {
    const screen = state.screen;
    const active = $(`[data-screen="${screen}"]`);
    const view = screen === 'student' ? $('.student-view.is-active', active)?.dataset.studentSection
      : screen === 'teacher' ? $('.teacher-view.is-active', active)?.dataset.teacherSection
        : screen === 'admin' ? $('.admin-view.is-active', active)?.dataset.view : '';
    return {screen, view, intent: state.intent, role: state.role,
      mission: screen === 'student' && view === 'challenge' ? currentMissionIndex : null, session};
  }

  function closeMenus(restoreFocus = false) {
    $$('.menu-open').forEach(screen => screen.classList.remove('menu-open'));
    syncMenus();
    if (restoreFocus && menuReturnFocus?.isConnected) menuReturnFocus.focus();
  }

  function syncMenus() {
    $$('.student-screen, .admin-screen').forEach(screen => {
      const open = screen.classList.contains('menu-open') && matchMedia('(max-width: 950px)').matches;
      const main = $('.student-main, .admin-main', screen);
      const modalOpen = !screen.hidden && $$('.admin-modal', screen).some(modal => !modal.hidden);
      if (main) main.inert = open || modalOpen;
      const sidebar = $('aside', screen);
      if (sidebar) {
        const mobile = matchMedia('(max-width: 950px)').matches;
        sidebar.inert = modalOpen || (mobile && !open);
        if (mobile && !open) sidebar.setAttribute('aria-hidden', 'true');
        else sidebar.removeAttribute('aria-hidden');
      }
      const toggle = $('[data-student-menu], [data-teacher-menu], [data-admin-menu]', screen);
      toggle?.setAttribute('aria-expanded', String(open));
      const backdrop = $('.menu-backdrop', screen);
      if (backdrop) backdrop.hidden = !open;
      if (!open && screen.classList.contains('menu-open')) screen.classList.remove('menu-open');
    });
    document.body.classList.toggle('ui-overlay-open', Boolean($('.screen--active.menu-open, .screen--active .admin-modal:not([hidden])')));
  }

  function navigate() {
    const next = route();
    const changedScreen = previousRoute?.screen !== next.screen;
    if (changedScreen && (dashboardScreens.has(next.screen) || dashboardScreens.has(previousRoute?.screen))) session++;
    next.session = session;
    closeMenus();
    syncCurrent();
    const changed = !previousRoute || JSON.stringify(next) !== JSON.stringify(previousRoute);
    if (changed && !restoring) {
      const data = {orbitaRoute: next};
      if (!previousRoute) history.replaceState(data, '');
      else history.pushState(data, '');
    }
    previousRoute = next;
    if (changed) {
      window.scrollTo({top: 0, behavior: 'instant'});
      requestAnimationFrame(() => {
        const heading = $(`[data-screen="${state.screen}"] h1`);
        if (heading && !$('.admin-modal:not([hidden]), dialog[open]')) {
          heading.tabIndex = -1;
          heading.focus({preventScroll: true});
        }
      });
    }
  }

  function syncCurrent() {
    const current = route();
    $$('[data-student-view], [data-teacher-view], [data-admin-view]').forEach(button => {
      if (button.classList.contains('is-active')) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    $$('[data-ui-student-view]').forEach(button => {
      button.classList.toggle('is-active', button.dataset.uiStudentView === current.view);
      if (button.dataset.uiStudentView === current.view) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    const bottom = $('.student-bottom-nav');
    bottom.hidden = current.screen !== 'student' || !['home', 'path', 'explore', 'progress', 'avatar', 'logbook'].includes(current.view);
    const content = $(`[data-screen="${current.screen}"] .student-content, [data-screen="${current.screen}"] .admin-content, [data-screen="${current.screen}"] .auth-content__inner, [data-screen="${current.screen}"] .hero, [data-screen="${current.screen}"] .success-card`);
    $('#main-content')?.removeAttribute('id');
    if (content) { content.id = 'main-content'; content.tabIndex = -1; }
    document.title = `${$(`[data-screen="${current.screen}"] h1`)?.textContent.trim() || 'Sua jornada'} — Órbita`;
  }

  window.addEventListener('popstate', event => {
    let destination = event.state?.orbitaRoute;
    if (!destination) return;
    const protectedRoute = dashboardScreens.has(destination.screen);
    if (protectedRoute && (destination.session !== session || !dashboardScreens.has(state.screen)
      || (destination.screen === 'student' && !currentStudent))) destination = {screen: 'home', intent: 'login', role: 'student'};
    restoring = true;
    try {
      state.intent = destination.intent;
      state.role = destination.role;
      if (destination.screen === 'student') {
        if (destination.mission !== null) currentMissionIndex = destination.mission;
        setStudentView(stableStudentViews.has(destination.view) ? destination.view : 'home');
      } else if (destination.screen === 'teacher') setTeacherView(destination.view || 'overview');
      else if (destination.screen === 'admin') setAdminView(destination.view || 'approvals');
      showScreen(destination.screen);
    } finally { restoring = false; history.replaceState({orbitaRoute: route()}, ''); }
  });

  function toolbar(section, markup) {
    const element = document.createElement('div');
    element.className = 'ui-toolbar';
    element.innerHTML = markup;
    $('.student-section-intro, .section-intro', section).after(element);
    return element;
  }
  const pathSection = $('[data-student-section="path"]');
  toolbar(pathSection, `<label class="ui-search"><span>Buscar na trilha</span><input type="search" data-path-search placeholder="Ex.: divisão ou desafio 17" autocomplete="off"></label>
    <label class="ui-select"><span>Mostrar missões</span><select data-path-filter><option value="all">Todas as missões</option><option value="available">Disponíveis para fazer</option><option value="complete">Concluídas</option></select></label>
    <button type="button" class="ui-action" data-path-next>Ir à próxima missão ↓</button><p class="ui-filter-count" data-path-count role="status"></p>`);

  function plain(text) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function filterPath() {
    const query = plain($('[data-path-search]').value);
    const terms = query.split(/\s+/).filter(Boolean);
    const filter = $('[data-path-filter]').value;
    let count = 0, total = 0;
    const groups = $$('.challenge-path-group', pathSection);
    const parents = groups.length ? groups : [$('[data-mission-path]')];
    parents.forEach(group => {
      const header = $('header', group)?.textContent || '';
      let visible = 0;
      $$('.mission-node', group).forEach(card => {
        const button = $('button', card);
        const text = plain(`${header} ${card.textContent}`);
        const match = terms.every(term => text.includes(term)) && (filter === 'all'
          || (filter === 'complete' && card.classList.contains('is-complete'))
          || (filter === 'available' && !card.classList.contains('is-complete') && button && !button.disabled));
        card.hidden = !match; total++; if (match) { count++; visible++; }
      });
      if (group.classList.contains('challenge-path-group')) group.hidden = !visible;
    });
    $('[data-path-count]').textContent = count ? `${count} de ${total} missões` : 'Nenhuma missão encontrada. Tente outra busca ou filtro.';
  }

  const lists = [
    {section: '[data-teacher-section="students"]', target: '[data-student-list]', items: 'tr:has([data-delete-student])', kind: 'students', placeholder: 'Nome ou código de acesso'},
    {section: '[data-teacher-section="classes"]', target: '[data-teacher-class-list]', items: '.teacher-class-card', kind: 'classes', placeholder: 'Nome ou código da turma'},
    {section: '[data-teacher-section="progress"]', target: '[data-progress-list]', items: '.student-progress-card', kind: 'progress', placeholder: 'Nome do estudante'},
    {section: '[data-screen="admin"] [data-view="teachers"]', target: '[data-teacher-list]', items: 'tr', kind: 'teachers', placeholder: 'Nome, escola ou e-mail'}
  ];
  lists.forEach(list => {
    const section = $(list.section);
    list.bar = toolbar(section, `<label class="ui-search"><span>Buscar ${list.kind === 'classes' ? 'turmas' : list.kind === 'teachers' ? 'professores' : 'estudantes'}</span><input type="search" data-list-search="${list.kind}" placeholder="${list.placeholder}" autocomplete="off"></label>
      ${['students', 'progress'].includes(list.kind) ? `<label class="ui-select"><span>Filtrar por turma</span><select data-list-class="${list.kind}"><option value="">Todas as turmas</option></select></label>` : ''}
      <p class="ui-filter-count" data-list-count="${list.kind}" role="status"></p>`);
    list.empty = document.createElement('p');
    list.empty.className = 'ui-empty';
    list.empty.textContent = 'Nenhum resultado. Tente outro nome ou filtro.';
    list.empty.hidden = true;
    const emptyAnchor = $(list.target).closest('.admin-table-wrap') || $(list.target);
    emptyAnchor.after(list.empty);
    new MutationObserver(() => refreshList(list)).observe($(list.target), {childList: true});
  });

  function refreshList(list) {
    const target = $(list.target);
    const select = $('[data-list-class]', list.bar);
    if (select && teacherData) {
      const previous = select.value;
      const options = teacherData.classes.map(item => `<option value="${item.id}">${escapeHTML(item.name)}</option>`).join('');
      if (select.dataset.options !== options) {
        select.innerHTML = '<option value="">Todas as turmas</option>' + options;
        select.value = teacherData.classes.some(item => String(item.id) === previous) ? previous : '';
        select.dataset.options = options;
      }
    }
    const rows = $$(list.items, target);
    const query = plain($('[data-list-search]', list.bar).value);
    let count = 0;
    rows.forEach((row, index) => {
      let classId = '';
      if (list.kind === 'students') classId = teacherData?.students.find(item => String(item.id) === $('[data-delete-student]', row).dataset.deleteStudent)?.classId;
      if (list.kind === 'progress') classId = teacherData?.students[index]?.classId;
      row.hidden = !plain(row.textContent).includes(query) || Boolean(select?.value && String(classId) !== select.value);
      if (!row.hidden) count++;
      if (row.tagName === 'TR') {
        const headers = $$('th', row.closest('table'));
        $$('td', row).forEach((cell, i) => cell.dataset.label = headers[i]?.textContent.trim() || '');
      }
      const code = $('.access-code, .class-code strong', row);
      if (code && code.textContent !== '—' && !$('.copy-code', code.parentElement)) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'copy-code'; button.textContent = 'Copiar';
        button.dataset.copyCode = code.textContent.trim();
        button.setAttribute('aria-label', `Copiar código ${button.dataset.copyCode}`);
        code.after(button);
      }
      if (list.kind === 'classes' && !$('.class-students-link', row)) {
        const classroom = teacherData?.classes[index];
        if (classroom) row.insertAdjacentHTML('beforeend', `<button class="class-students-link" type="button" data-class-students="${classroom.id}">Ver estudantes →</button>`);
      }
    });
    $('[data-list-count]', list.bar).textContent = `${count} de ${rows.length} ${list.kind === 'classes' ? 'turmas' : list.kind === 'teachers' ? 'professores' : 'estudantes'}`;
    list.empty.hidden = count > 0 || rows.length === 0;
  }

  const avatarShop = $('[data-avatar-shop]');
  const avatarWrapper = document.createElement('div');
  avatarWrapper.className = 'avatar-controls-wrapper';
  avatarShop.before(avatarWrapper); avatarWrapper.append(avatarShop);
  avatarWrapper.insertAdjacentHTML('afterbegin', `<div class="avatar-category-bar"><label for="avatar-category">O que você quer mudar?</label><select id="avatar-category" data-avatar-category><option value="all">Todas as opções</option><option value="name">Nome do avatar</option><option value="body">Pele e rosto</option><option value="hair">Cabelo</option><option value="clothes">Roupas e calçados</option><option value="accessories">Acessórios</option></select></div>`);
  function filterAvatar() {
    const category = $('[data-avatar-category]').value;
    const categories = ['name', 'body', 'body', 'hair', 'hair', 'clothes', 'clothes', 'clothes', 'accessories', 'accessories', 'accessories', 'accessories'];
    $$('.avatar-control-group', avatarShop).forEach((group, i) => group.hidden = category !== 'all' && categories[i] !== category);
  }
  new MutationObserver(filterAvatar).observe(avatarShop, {childList: true});
  new MutationObserver(filterPath).observe($('[data-mission-path]'), {childList: true});

  function toast(message) {
    const element = $('.ui-toast'); element.textContent = message; element.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => element.hidden = true, 3500);
  }
  const help = document.createElement('dialog');
  help.className = 'ui-help-dialog';
  help.setAttribute('aria-labelledby', 'ui-help-title');
  help.innerHTML = `<header><h2 id="ui-help-title"></h2><button type="button" data-close-help aria-label="Fechar ajuda">×</button></header><div data-help-content></div><button class="ui-action" type="button" data-close-help>Entendi</button>`;
  document.body.append(help);
  document.body.insertAdjacentHTML('beforeend', '<div class="ui-toast" role="status" hidden></div>');
  const helpCopy = {
    recovery: {title: 'Recuperar o acesso', content: '<p>Para recuperar o acesso de professor, procure a administração responsável pela plataforma. Esta versão não envia mensagens de recuperação de senha por e-mail.</p><p>Para estudantes, o professor pode consultar o código na lista de estudantes ou redefinir o acesso pelo botão ↻.</p>'},
    access: {title: 'Como acessar a Órbita', content: '<h3>Sou estudante</h3><p>Toque em “Entrar”, escolha “Estudante” e informe seu nome e o código fornecido pelo professor. Se não conseguir entrar, confirme o nome e o código com ele.</p><h3>Sou professor</h3><p>Entre com e-mail e senha. Para começar, crie uma conta e aguarde a autorização da administração. Depois, cadastre uma turma e seus estudantes.</p><h3>Durante a aventura</h3><p>A trilha mostra as missões disponíveis e as concluídas. Complete uma missão para liberar a seguinte. Use “Minha trilha” para retornar e o menu para acessar seu avatar, diário e progresso.</p>'},
    data: {title: 'Sobre os dados desta plataforma', content: '<p>Esta versão guarda contas, turmas, progresso e personalizações no armazenamento deste navegador, neste dispositivo. As informações não são sincronizadas automaticamente entre dispositivos.</p><p>Apagar os dados do site ou usar outro navegador pode impedir o acesso aos cadastros e ao progresso salvo aqui. No painel do professor e da administração, use os relatórios disponíveis para consultar e exportar informações.</p><p>Para dúvidas sobre seu cadastro ou acesso, procure o professor ou a administração responsável pela plataforma.</p>'},
    registration: {title: 'Sobre o cadastro', content: '<p>O cadastro de professor passa pela autorização da administração. Após a autorização, você poderá criar turmas e cadastrar estudantes.</p><p>O estudante acessa com seu nome e o código fornecido pelo professor. Consulte “Sobre os dados” para entender como esta versão salva as informações.</p>'}
  };
  function showHelp(kind) {
    const copy = helpCopy[kind] || helpCopy.access;
    $('#ui-help-title').textContent = copy.title; $('[data-help-content]').innerHTML = copy.content;
    if (!help.open) help.showModal();
  }

  $$('[data-screen="profiles"] .auth-content__inner').forEach(inner => inner.insertAdjacentHTML('afterbegin', '<button type="button" class="auth-mobile-back" data-back="home">← Voltar ao início</button>'));
  $$('.checkbox-row a').forEach((link, i) => {
    link.removeAttribute('href'); link.setAttribute('role', 'button'); link.tabIndex = 0;
    link.dataset.uiHelp = i === 0 ? 'registration' : 'data';
  });
  $$('.student-screen, .admin-screen').forEach((screen, index) => {
    const sidebar = $('aside', screen);
    sidebar.id = `platform-menu-${index}`;
    sidebar.insertAdjacentHTML('afterbegin', '<button class="sidebar-close" type="button" data-close-menu aria-label="Fechar menu">×</button>');
    const toggle = $('[data-student-menu], [data-teacher-menu], [data-admin-menu]', screen);
    toggle.setAttribute('aria-controls', sidebar.id); toggle.setAttribute('aria-expanded', 'false');
    const logout = $('[data-student-logout], [data-teacher-logout], [data-admin-logout]', screen);
    logout?.insertAdjacentHTML('beforebegin', '<button class="sidebar-help" type="button" data-ui-help="access"><span aria-hidden="true">?</span> Ajuda e acesso</button>');
    screen.insertAdjacentHTML('beforeend', '<button class="menu-backdrop" type="button" data-close-menu aria-label="Fechar menu" tabindex="-1" hidden></button>');
    new MutationObserver(syncMenus).observe(screen, {attributes: true, attributeFilter: ['class']});
  });
  $('.student-main').insertAdjacentHTML('beforeend', '<nav class="student-bottom-nav" aria-label="Navegação rápida"><button type="button" data-ui-student-view="home"><span aria-hidden="true">⌂</span>Início</button><button type="button" data-ui-student-view="path"><span aria-hidden="true">◇</span>Minha trilha</button><button type="button" data-ui-student-view="explore"><span aria-hidden="true">◎</span>Explorar</button><button type="button" data-ui-student-view="progress"><span aria-hidden="true">★</span>Progresso</button></nav>');

  document.addEventListener('click', async event => {
    const element = event.target.closest('button, a');
    if (!element) return;
    if (element.matches('[data-shortcut-login]')) { state.intent = 'login'; showScreen('profiles'); }
    if (element.matches('[data-ui-student-view]')) setStudentView(element.dataset.uiStudentView);
    if (element.matches('[data-ui-help]')) { event.preventDefault(); showHelp(element.dataset.uiHelp); }
    if (element.matches('[data-close-help]')) help.close();
    if (element.matches('[data-close-menu]')) closeMenus(true);
    if (element.matches('[data-student-menu], [data-teacher-menu], [data-admin-menu]')) {
      menuReturnFocus = element; syncMenus();
      if (element.getAttribute('aria-expanded') === 'true') $('.sidebar-close', element.closest('.screen')).focus();
    }
    if (element.matches('[data-path-next]')) {
      $('[data-path-search]').value = ''; $('[data-path-filter]').value = 'all'; filterPath();
      const next = nextAvailableMissionIndex();
      const card = $(`[data-student-mission="${next}"]`, pathSection)?.closest('.mission-node');
      if (card) { card.scrollIntoView({block: 'center', behavior: 'smooth'}); $('button', card)?.focus({preventScroll: true}); }
      else toast('Todas as missões foram concluídas. Você pode jogar novamente!');
    }
    if (element.matches('[data-class-students]')) {
      $('[data-list-class="students"]').value = element.dataset.classStudents;
      $('[data-list-search="students"]').value = '';
      refreshList(lists[0]); setTeacherView('students');
    }
    if (element.matches('[data-copy-code]')) {
      try { await navigator.clipboard.writeText(element.dataset.copyCode); toast('Código copiado!'); }
      catch (_) { toast(`Código de acesso: ${element.dataset.copyCode}`); }
    }
    if (element.matches('[data-toggle-intent]')) { if (state.screen === 'profiles') renderIntent(); navigate(); }
  });
  document.addEventListener('input', event => {
    if (event.target.matches('[data-path-search]')) filterPath();
    const list = lists.find(item => event.target.dataset.listSearch === item.kind);
    if (list) refreshList(list);
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-path-filter]')) filterPath();
    if (event.target.matches('[data-avatar-category]')) filterAvatar();
    const list = lists.find(item => event.target.dataset.listClass === item.kind);
    if (list) refreshList(list);
  });

  function focusable(root) { return $$('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]', root).filter(element => element.getClientRects().length && !element.closest('[hidden]')); }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-add-class], [data-add-student], [data-add-teacher], [data-edit-teacher]')) modalTrigger = event.target.closest('button');
  }, true);
  $$('.admin-modal').forEach(modal => {
    new MutationObserver(() => {
      if (!modal.hidden) {
        modalReturnFocus.set(modal, modalTrigger || document.activeElement);
        requestAnimationFrame(() => ($('input:not([type="hidden"])', modal) || focusable(modal)[0])?.focus());
      } else { syncMenus(); modalReturnFocus.get(modal)?.focus(); }
      syncMenus();
    }).observe(modal, {attributes: true, attributeFilter: ['hidden']});
    modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });
  });
  document.addEventListener('keydown', event => {
    const modal = $('.screen--active .admin-modal:not([hidden])');
    const menu = $('.screen--active.menu-open aside');
    if (event.key === 'Escape') {
      if (modal) { event.preventDefault(); modal.hidden = true; }
      else if (menu) { event.preventDefault(); closeMenus(true); }
    }
    const root = modal || menu;
    if (event.key === 'Tab' && root) {
      const elements = focusable(root), first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    if (event.target.matches?.('a[data-ui-help]') && ['Enter', ' '].includes(event.key)) { event.preventDefault(); showHelp(event.target.dataset.uiHelp); }
  });
  $('.skip-link').addEventListener('click', event => { event.preventDefault(); $('#main-content')?.focus(); $('#main-content')?.scrollIntoView({block: 'start'}); });
  help.addEventListener('click', event => { if (event.target === help) { const bounds = help.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) help.close(); } });
  window.addEventListener('resize', syncMenus);
  window.platformUI = {navigate};
  lists.forEach(refreshList); filterPath(); filterAvatar(); navigate();
})();
