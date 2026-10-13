const state = { screen: 'home', intent: 'register', role: 'student' };

const audioTracks = {
  correct: new Audio('assets/sons/acerto.mp3'),
  error: new Audio('assets/sons/erro.mp3'),
  reward: new Audio('assets/sons/recompensas.mp3'),
  ui: new Audio('assets/sons/ui.mp3')
};
audioTracks.correct.volume = .62;
audioTracks.error.volume = .58;
audioTracks.reward.volume = .55;
audioTracks.ui.volume = .24;
let soundEnabled = (() => {
  try { return localStorage.getItem('orbita-sound-enabled') !== 'false'; } catch (_) { return true; }
})();

function playSound(name) {
  const audio = audioTracks[name];
  if (!soundEnabled || !audio) return Promise.resolve();
  audio.pause(); audio.currentTime = 0;
  return audio.play().catch(() => {});
}

function playAnswerSound(correct,hasReward=true) {
  const correctAudio = audioTracks.correct;
  correctAudio.onended = null;
  correctAudio.pause(); correctAudio.currentTime = 0;
  audioTracks.reward.pause(); audioTracks.reward.currentTime = 0;
  if (!correct) { playSound('error'); return; }
  correctAudio.onended = () => { correctAudio.onended = null; if (hasReward) playSound('reward'); };
  playSound('correct');
}

function updateSoundButtons() {
  document.querySelectorAll('.sound-button').forEach(button => {
    button.classList.toggle('is-muted',!soundEnabled);
    button.setAttribute('aria-pressed',String(soundEnabled));
    button.setAttribute('aria-label',soundEnabled ? 'Desativar sons' : 'Ativar sons');
  });
}

function updateFullscreenButton() {
  const active = Boolean(document.fullscreenElement);
  document.querySelectorAll('[data-fullscreen]').forEach(button => {
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-label',active ? 'Sair da tela cheia' : 'Ativar tela cheia');
    const label = button.querySelector('[data-fullscreen-label]');
    if (label) label.textContent = active ? 'Sair da tela cheia' : 'Tela cheia';
  });
}

async function toggleFullscreen(trigger) {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else {
      const target = trigger?.closest('.screen') || document.querySelector('.screen--active:not([hidden])') || document.documentElement;
      await target.requestFullscreen();
    }
  } catch (_) {
    window.alert('Não foi possível ativar a tela cheia neste navegador.');
  }
}

function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  try { localStorage.setItem('orbita-sound-enabled',String(enabled)); } catch (_) {}
  if (!enabled) {
    Object.values(audioTracks).forEach(audio => { audio.pause(); audio.currentTime = 0; });
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }
  updateSoundButtons();
}

const roleData = {
  student: {
    label: 'Estudante', icon: 'estudante.png', kicker: 'ÁREA DO ESTUDANTE',
    title: 'Pronto para a próxima missão?', copy: 'Use o código da sua turma e comece a aprender no seu ritmo.'
  },
  teacher: {
    label: 'Professor', icon: 'professor.png', kicker: 'ÁREA DO PROFESSOR',
    title: 'Transforme aulas em jornadas.', copy: 'Crie turmas e acompanhe as descobertas de cada estudante.'
  },
  admin: {
    label: 'Administrador', icon: 'administrador.png', kicker: 'ÁREA ADMINISTRATIVA',
    title: 'Todo o universo em suas mãos.', copy: 'Organize professores, turmas e o acesso à plataforma.'
  }
};

const ADMIN_EMAIL = 'gomesedneiaangelica@gmail.com';
const ADMIN_PASSWORD_HASH = 'a9efeeb2b1fb4d42795f3bb13c6724e06030fd8e271c45815703c0bace7cb7e9';
const adminTitles = {
  approvals: 'Autorizar cadastros', teachers: 'Gerenciar professores',
  classes: 'Visualizar turmas', tracks: 'Visualizar trilhas', reports: 'Relatórios de uso'
};

const seedAdminData = {
  pending: [
    {id: 101, name: 'Mariana Costa', email: 'mariana.costa@escola.com', school: 'E.M. Monteiro Lobato'},
    {id: 102, name: 'Lucas Ferreira', email: 'lucas.ferreira@colegio.com', school: 'Colégio Caminhos'}
  ],
  teachers: [
    {id: 1, name: 'Ana Martins', email: 'ana.martins@escola.com', school: 'E.M. Paulo Freire', classes: 1},
    {id: 2, name: 'Carlos Lima', email: 'carlos.lima@escola.com', school: 'E.M. Cecília Meireles', classes: 1},
    {id: 3, name: 'Juliana Alves', email: 'juliana.alves@colegio.com', school: 'Colégio Horizonte', classes: 1},
    {id: 4, name: 'Rafael Souza', email: 'rafael.souza@escola.com', school: 'E.M. Vila Nova', classes: 1}
  ]
};

function getAdminData() {
  try {
    const saved = localStorage.getItem('orbita-admin-data');
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return JSON.parse(JSON.stringify(seedAdminData));
}

let adminData = getAdminData();
const saveAdminData = () => {
  try { localStorage.setItem('orbita-admin-data', JSON.stringify(adminData)); } catch (_) {}
};
const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const initials = name => name.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();

const DEMO_TEACHER_PASSWORD_HASH = '3305eb905f6f9b3de77b72b216cfb3441949668ff121b52b23a5ac780f371caa';
const demoTeacherAccounts = [
  {id:1,name:'Ana Martins',email:'ana.martins@escola.com',passwordHash:DEMO_TEACHER_PASSWORD_HASH,status:'active'},
  {id:2,name:'Carlos Lima',email:'carlos.lima@escola.com',passwordHash:DEMO_TEACHER_PASSWORD_HASH,status:'active'},
  {id:3,name:'Juliana Alves',email:'juliana.alves@colegio.com',passwordHash:DEMO_TEACHER_PASSWORD_HASH,status:'active'}
];

function getTeacherAccounts() {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('orbita-teacher-accounts') || '[]'); } catch (_) {}
  demoTeacherAccounts.forEach(account => {
    const existing = saved.find(item => item.email === account.email);
    if (existing) Object.assign(existing, account);
    else saved.push({...account});
  });
  return saved;
}
let teacherAccounts = getTeacherAccounts();
const saveTeacherAccounts = () => {
  try { localStorage.setItem('orbita-teacher-accounts', JSON.stringify(teacherAccounts)); } catch (_) {}
};
const teacherStorageKey = email => `orbita-teacher-data:${email.toLowerCase()}`;
const trackName = grade => `${grade}º ano do Ensino Fundamental`;
const generateCode = grade => `ORB${grade}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

function defaultTeacherData() {
  return {
    classes: [
      {id: 201, name:'Exploradores da Matemática', grade:3, code:'ORB3-A7K2'},
      {id: 202, name:'Pequenos Astronautas', grade:2, code:'ORB2-B4M8'}
    ],
    students: [
      {id:301,name:'Alice Fernandes',classId:201,track:3,progress:84,errors:['Multiplicação','Valor posicional'],lastAccess:'Hoje, 10:32'},
      {id:302,name:'Bruno Oliveira',classId:201,track:3,progress:62,errors:['Subtração','Multiplicação','Subtração'],lastAccess:'Hoje, 09:18'},
      {id:303,name:'Clara Santos',classId:201,track:3,progress:91,errors:['Sistema monetário'],lastAccess:'Ontem, 16:40'},
      {id:304,name:'Davi Rocha',classId:202,track:2,progress:47,errors:['Adição','Subtração','Adição'],lastAccess:'Ontem, 14:05'},
      {id:305,name:'Elisa Moura',classId:202,track:2,progress:76,errors:['Sequências numéricas'],lastAccess:'20/07, 11:22'}
    ]
  };
}

const demoTeacherWorkspaces = {
  'ana.martins@escola.com': {
    classes:[{id:1101,name:'Exploradores do 3º ano',grade:3,code:'ORB3-TESTE'}],
    students:[
      {id:1201,name:'Sofia Almeida',classId:1101,track:3,progress:35,errors:['Multiplicação'],lastAccess:'Ainda não acessou'},
      {id:1202,name:'Pedro Henrique',classId:1101,track:3,progress:18,errors:[],lastAccess:'Ainda não acessou'}
    ]
  },
  'carlos.lima@escola.com': {
    classes:[{id:2101,name:'Pequenos Astronautas',grade:2,code:'ORB2-TESTE'}],
    students:[
      {id:2201,name:'Lucas Rocha',classId:2101,track:2,progress:42,errors:['Adição'],lastAccess:'Ainda não acessou'},
      {id:2202,name:'Marina Costa',classId:2101,track:2,progress:25,errors:['Sequências numéricas'],lastAccess:'Ainda não acessou'}
    ]
  },
  'juliana.alves@colegio.com': {
    classes:[{id:3101,name:'Missão Matemática',grade:4,code:'ORB4-TESTE'}],
    students:[
      {id:3201,name:'Gabriel Souza',classId:3101,track:4,progress:58,errors:['Frações'],lastAccess:'Ainda não acessou'},
      {id:3202,name:'Helena Martins',classId:3101,track:4,progress:67,errors:['Área e perímetro'],lastAccess:'Ainda não acessou'}
    ]
  }
};

function seedDemoAccess() {
  saveTeacherAccounts();
  try {
    Object.entries(demoTeacherWorkspaces).forEach(([email,data]) => {
      const key = teacherStorageKey(email);
      const existing = JSON.parse(localStorage.getItem(key) || '{"classes":[],"students":[]}');
      data.classes.forEach(classroom => {
        if (!existing.classes.some(item => item.code === classroom.code)) existing.classes.push({...classroom});
      });
      data.students.forEach(student => {
        if (!existing.students.some(item => item.name === student.name)) existing.students.push({...student});
      });
      localStorage.setItem(key, JSON.stringify(existing));
    });
  } catch (_) {}
}
seedDemoAccess();

let teacherData = null;
function loadTeacherData(email) {
  try {
    const saved = localStorage.getItem(teacherStorageKey(email));
    teacherData = saved ? JSON.parse(saved) : defaultTeacherData();
  } catch (_) { teacherData = defaultTeacherData(); }
  saveTeacherData();
}
function saveTeacherData() {
  if (!state.teacherEmail || !teacherData) return;
  try { localStorage.setItem(teacherStorageKey(state.teacherEmail), JSON.stringify(teacherData)); } catch (_) {}
}

function findStudentAccess(name, code) {
  const normalizedName = name.trim().toLocaleLowerCase('pt-BR');
  const normalizedCode = code.trim().toUpperCase();
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith('orbita-teacher-data:')) continue;
      const data = JSON.parse(localStorage.getItem(key));
      const student = data.students.find(item => item.name.trim().toLocaleLowerCase('pt-BR') === normalizedName);
      if (!student) continue;
      const classroom = data.classes.find(item => item.id === student.classId);
      if ((student.accessCode || classroom?.code) === normalizedCode) return {student, data, key};
    }
  } catch (_) {}
  return null;
}

const studentViewTitles = {home:'Início',path:'Minha trilha',explore:'Explorar',challenge:'Desafios',result:'Resultado',bonus:'Sorte ou Revés',roulette:'Sorte ou Revés',constellation:'Sorte ou Revés',meteor:'Sorte ou Revés',puzzle:'Sorte ou Revés','rocky-memory':'Sorte ou Revés',logbook:'Diário de bordo',avatar:'Meu avatar',progress:'Meu progresso'};
const luckBonusTypes = ['memory','roulette','constellation','meteor','puzzle','rocky-memory'];
const missionNames = {
  1:['Números no cotidiano','Contagem até 20','Ordem dos números','Adição como juntar','Subtração como retirar','Dezenas e unidades','Formas geométricas','Sequências','Medidas de tempo','Sistema monetário','Tabelas e gráficos','Missão final'],
  2:['Números até 100','Centenas','Adição e subtração','Cálculo mental','Sequências','Dobro e metade','Formas espaciais','Comprimento','Tempo e calendário','Dinheiro','Gráficos','Missão final'],
  3:['Números e quantidades','Valor posicional','Adição e subtração','Multiplicação','Divisão','Sistema monetário','Geometria','Medidas','Frações iniciais','Tabelas e gráficos','Problemas','Missão final'],
  4:['Números naturais','Operações','Multiplicação e divisão','Frações','Números decimais','Geometria','Área e perímetro','Medidas','Probabilidade','Gráficos','Problemas','Missão final'],
  5:['Sistema decimal','Operações avançadas','Frações equivalentes','Números decimais','Porcentagem','Geometria','Plano cartesiano','Volume','Probabilidade','Estatística','Problemas','Missão final']
};
const challengeBank = {
  1:[{q:'Quanto é 5 + 3?',options:['6','7','8','9'],answer:'8',tip:'Cinco mais três é igual a oito.'},{q:'Qual número vem depois do 19?',options:['18','20','21','29'],answer:'20',tip:'Depois do 19, contamos 20.'}],
  2:[{q:'Quanto é 24 + 17?',options:['31','40','41','42'],answer:'41',tip:'Some 20 + 10 e depois 4 + 7.'},{q:'Qual é o dobro de 8?',options:['10','14','16','18'],answer:'16',tip:'O dobro é 8 + 8.'}],
  3:[{q:'Quanto é 6 × 7?',options:['36','42','48','56'],answer:'42',tip:'Seis grupos com sete formam 42.'},{q:'Qual é a metade de 50?',options:['20','25','30','35'],answer:'25',tip:'Duas partes de 25 formam 50.'}],
  4:[{q:'Quanto é 125 + 378?',options:['493','503','513','523'],answer:'503',tip:'Some unidades, dezenas e centenas.'},{q:'Qual fração representa a metade?',options:['1/3','1/2','2/3','3/4'],answer:'1/2',tip:'Uma de duas partes iguais é a metade.'}],
  5:[{q:'Quanto é 3/4 de 20?',options:['5','10','15','18'],answer:'15',tip:'Divida 20 por 4 e multiplique por 3.'},{q:'Quanto é 25% de 100?',options:['20','25','40','50'],answer:'25',tip:'25% representa um quarto de 100.'}]
};

const d1Image = (mission,question) => `assets/imagens/questoes/3-ano/desafio-1/missao-${mission}/quiz-d1-m${mission}-q${question}.png`;
const quizQuestion = (id,text,options,answer,correct,incorrect,image='') => ({id,type:'quiz',variant:image ? 'qt1' : 'qt3',text,options,answer,correct,incorrect,image});
const inputQuestion = (id,text,answer,correct,incorrect) => ({id,type:'input',text,answer:String(answer),correct,incorrect});
const columnAdditionQuestion = (id,top,bottomTemplate,result,answer,correct) => ({
  id,
  type:'column-addition',
  text:'Que número eu tenho que colocar no quadradinho, para que a operação fique correta?',
  top:String(top),
  bottomTemplate:String(bottomTemplate),
  result:String(result),
  answer:String(answer),
  correct
});
// Formatos reutilizáveis: drag/at1, drag/at2, click, input e quiz/qt1..qt4.
// Nos quizzes qt2 e qt4, cada alternativa usa {value, image, alt}; no at2,
// os itens arrastáveis usam {value, image, alt} para representar moedas e cédulas.
const challengeOne = {
  title:'Desafio 1 — Os números',
  missions:[
    {
      title:'Leitura e escrita de números', video:'assets/videos/desafio-1/missao-1/vd-explica-d1-m1.mp4',
      questions:[
        quizQuestion('d1m1q1','Qual é o número representado na figura?',['369','364','264','624'],'364','Você identificou corretamente as centenas, as dezenas e as unidades!','TENTE NOVAMENTE! Há 3 placas de centena, 6 barrinhas de dezena e 4 cubinhos de unidade.',d1Image(1,1)),
        quizQuestion('d1m1q2','Qual é o número representado na figura?',['348','458','484','448'],'448','EXCELENTE! Você contou as peças do material dourado com muita atenção!','OBSERVE NOVAMENTE! A figura representa 4 centenas, 4 dezenas e 8 unidades.',d1Image(1,2)),
        quizQuestion('d1m1q3','Qual é o número representado na figura?',['807','870','817','708'],'807','ACERTOU! Você percebeu corretamente que o zero ocupa a ordem das dezenas!','TENTE MAIS UMA VEZ! Há 8 centenas, nenhuma dezena e 7 unidades.',d1Image(1,3)),
        quizQuestion('d1m1q4','Qual é o número representado na figura?',['389','390','309','319'],'390','PARABÉNS! Você reconheceu que a ausência de unidades deve ser representada pelo zero!','PRESTE ATENÇÃO! São 3 centenas e 9 dezenas. Sem unidades, o último algarismo é zero.',d1Image(1,4)),
        quizQuestion('d1m1q5','Qual é o número representado na figura?',['3.432','2.324','3.234','3.243'],'3.234','ÓTIMO TRABALHO! Você identificou corretamente todas as ordens do número!','OBSERVE COM CUIDADO! A figura mostra 3 unidades de milhar, 2 centenas, 3 dezenas e 4 unidades.',d1Image(1,5)),
        quizQuestion('d1m1q6','Marque a alternativa em que aparece o número indicado na imagem.',['345','435','543','354'],'354','Você relacionou corretamente a escrita por extenso com a escrita em algarismos.','TENTE NOVAMENTE! Observe a ordem indicada: 3 centenas, 5 dezenas e 4 unidades.',d1Image(1,6)),
        quizQuestion('d1m1q7','Marque a alternativa em que aparece o número indicado na imagem.',['1.409','1.490','1000.400.9','1499'],'1.409','EXCELENTE! Você escreveu corretamente um número que possui zero na ordem das dezenas.','NÃO É ESSA A RESPOSTA! Procure 1 unidade de milhar, 4 centenas, nenhuma dezena e 9 unidades.',d1Image(1,7)),
        quizQuestion('d1m1q8','Marque a alternativa em que aparece a forma como se lê o número.',['TREZENTOS E NOVE','TREZENTOS E NOVENTA','TRÊS MIL E NOVE','TRÊS MIL E NOVENTA'],'TRÊS MIL E NOVE','RESPOSTA CERTA! Você fez a leitura correta de um número com unidades de milhar!','OBSERVE NOVAMENTE! Verifique qual algarismo ocupa a unidade de milhar e as ordens representadas por zero.',d1Image(1,8)),
        quizQuestion('d1m1q9','A decomposição apresentada corresponde ao número:',['1.325','1.235','1.532','1.352'],'1.235','VOCÊ CONSEGUIU! A recomposição das ordens está correta.','PENSE MELHOR! Compare cada unidade de milhar, centena, dezena e unidade com a imagem.',d1Image(1,9)),
        quizQuestion('d1m1q10','A decomposição apresentada corresponde ao número:',['1.390','1.903','1.309','1.930'],'1.903','PERFEITO! Você recompôs corretamente o número e respeitou a posição de cada algarismo.','ANALISE MAIS UMA VEZ! Observe em quais ordens há zero e não troque a posição dos algarismos.',d1Image(1,10))
      ]
    },
    {
      title:'Comparação entre números', video:'assets/videos/desafio-1/missao-2/vd-explica-d1-m2.mp4',
      questions:[
        quizQuestion('d1m2q1','Qual é o sucessor de 399?',['3100','400','398','401'],'400','BRILHANTE! Você já sabe encontrar o sucessor!','TENTE NOVAMENTE! Sucessor é o número que vem depois.'),
        quizQuestion('d1m2q2','Qual é o antecessor de 500?',['501','400','499','490'],'499','PARABÉNS! Você já sabe encontrar o antecessor!','NÃO É ISSO! Antecessor é o número que vem antes.'),
        quizQuestion('d1m2q3','Qual é o número que está entre 698 e 700?',['699','697','701','670'],'699','RESPOSTA CERTA! Você brilhou!','TENTE NOVAMENTE! Encontre o número que vem depois de 698 e antes de 700.'),
        {id:'d1m2q4',type:'drag',variant:'at1',text:'Coloque os números em ordem CRESCENTE.',items:['1.500','1.460','1.399','1.461'],answer:['1.399','1.460','1.461','1.500'],correct:'BRILHANTE! Você já sabe ordenar os números.',incorrect:'RESPOSTA ERRADA! Ordem crescente é do menor para o maior.'},
        {id:'d1m2q5',type:'drag',variant:'at1',text:'Coloque os números em ordem DECRESCENTE.',items:['1.950','978','1.101','2.000'],answer:['2.000','1.950','1.101','978'],correct:'RESPOSTA CERTA! Você já sabe ordenar os números.',incorrect:'TENTE OUTRA VEZ! Ordem decrescente é do maior para o menor.'},
        quizQuestion('d1m2q6','Qual é o maior?',['20 DEZENAS','3 CENTENAS','1 UNIDADE DE MILHAR','20 CENTENAS'],'20 CENTENAS','RESPOSTA CERTA! 20 centenas é igual a 2.000, o maior número.','Converta cada opção em unidades antes de comparar.'),
        quizQuestion('d1m2q7','Qual é o sinal que completa a expressão?',['>','<','=','%'],'=','VOCÊ ACERTOU! 5 + 4 e 3 + 6 são iguais a 9.','VOCÊ ERROU! Refaça as operações e compare os resultados.',d1Image(2,7)),
        quizQuestion('d1m2q8','Qual é o sinal que completa a expressão?',['>','<','=','@'],'>','VOCÊ É DEMAIS! 200 é maior do que 100!','TENTE NOVAMENTE! Faça as contas e compare os resultados.',d1Image(2,8)),
        quizQuestion('d1m2q9','Qual é o sinal que completa a operação?',['%','=','>','<'],'=','ISSO MESMO! 500 + 500 e 1.500 − 500 são iguais a 1.000.','TENTE NOVAMENTE! Realize as operações antes de comparar.',d1Image(2,9)),
        quizQuestion('d1m2q10','Qual é o sinal que completa a operação?',['>','<','=','+'],'>','EXCELENTE! 3.000 é maior que 1.000!','TENTE NOVAMENTE! Compare 1.500 + 1.500 com 2.000 − 1.000.',d1Image(2,10))
      ]
    },
    {
      title:'Valor posicional', video:'assets/videos/desafio-1/missao-3/vd-explica-d1-m3.mp4',
      questions:[
        quizQuestion('d1m3q1','No número 6.345, qual algarismo está na casa das dezenas?',['4','5','3','6'],'4','ISSO MESMO! O 4 está na casa das dezenas!','NÃO É ISSO! Observe o quadro posicional.'),
        quizQuestion('d1m3q2','No número 1.672, qual é o valor do algarismo 6?',['6','60','600','6.000'],'600','MUITO BOM! O 6 vale 600!','O valor do algarismo depende da posição que ele ocupa.'),
        quizQuestion('d1m3q3','No número 7.180, qual é o valor do algarismo 7?',['7','70','700','7.000'],'7.000','MUITO BOM! O 7 vale 7.000!','O valor do algarismo depende da posição que ele ocupa.'),
        quizQuestion('d1m3q4','No número 4.521, qual algarismo está na casa das unidades?',['1','2','5','7'],'1','ESSA FOI FÁCIL! O 1 vale uma unidade!','Observe a posição ocupada por cada algarismo.'),
        quizQuestion('d1m3q5','No número 1.381, o 3 representa:',['3 UNIDADES','3 CENTENAS','3 DEZENAS','3 UNIDADES DE MILHAR'],'3 CENTENAS','BRILHANTE! O 3 está na casa das centenas!','Observe em qual casa o algarismo 3 está.'),
        quizQuestion('d1m3q6','O que vale mais?',['70 UNIDADES','7 CENTENAS','70 DEZENAS','7 UNIDADES DE MILHAR'],'7 UNIDADES DE MILHAR','ISSO MESMO! Você é demais!','Descubra primeiro o número que cada opção representa.'),
        quizQuestion('d1m3q7','Qual número tem 0 na casa das centenas?',['1.520','2.026','3.602','7.980'],'2.026','PERFEITO! O zero está na casa das centenas em 2.026.','NÃO É ISSO! Lembre-se do quadro posicional.'),
        quizQuestion('d1m3q8','Se acrescentar 1 centena ao número 3.846, obtenho:',['4.846','3.847','3.946','3.856'],'3.946','VIVA! 800 + 100 é igual a 900!','Tente realizar a operação no quadro posicional.'),
        quizQuestion('d1m3q9','Se acrescentar 2 dezenas ao número 5.127, obtenho:',['7.127','5.327','5.147','5.129'],'5.147','ISSO MESMO! Você é demais!','Acrescente duas dezenas apenas na ordem das dezenas.'),
        quizQuestion('d1m3q10','Se acrescentar 1 centena ao número 6.900, obtenho:',['7.000','6.910','7.900','6.901'],'7.000','PARABÉNS! 6.900 + 100 é igual a 7.000!','Tente realizar a operação no quadro posicional.')
      ]
    }
  ]
};
const challengeTwo = {
  title:'Desafio 2 — Adição e subtração até 20',
  missions:[
    {
      title:'Adição até resultado 20', video:'assets/videos/desafio-2/missao-1/vd-explica-d2-m1.mp4',
      questions:[
        inputQuestion('d2m1q1','Quanto é 7 + 5?',12,'MUITO BEM! 7 + 5 é igual a 12.','TENTE NOVAMENTE! Guarde o 7 na memória e conte mais 5: 8, 9, 10, 11, 12.'),
        inputQuestion('d2m1q2','Quanto é 9 + 4?',13,'PARABÉNS! Você descobriu que 9 + 4 é igual a 13.','QUASE LÁ! Primeiro, some 1 ao 9 para chegar ao 10. Depois, acrescente mais 3.'),
        inputQuestion('d2m1q3','Quanto é 8 + 6?',14,'ISSO MESMO! A soma de 8 e 6 é 14.','VAMOS TENTAR DE NOVO! Comece no 8 e avance 6 números na sequência numérica.'),
        inputQuestion('d2m1q4','Quanto é 10 + 7?',17,'EXCELENTE! 10 + 7 é igual a 17.','PENSE MAIS UM POUCO! Ao acrescentar 7 ao 10, formamos uma dezena e 7 unidades.'),
        inputQuestion('d2m1q5','Quanto é 6 + 6?',12,'ÓTIMO TRABALHO! O dobro de 6 é 12.','TENTE OUTRA VEZ! Você pode contar 6 elementos e acrescentar outros 6.'),
        inputQuestion('d2m1q6','Quanto é 13 + 4?',17,'RESPOSTA CERTA! 13 + 4 é igual a 17.','NÃO FOI DESSA VEZ! Parta do 13 e avance quatro números: 14, 15, 16, 17.'),
        inputQuestion('d2m1q7','Quanto é 15 + 5?',20,'PERFEITO! 15 + 5 completa 20.','VOCÊ ESTÁ QUASE LÁ! Conte cinco números depois do 15 até completar duas dezenas.'),
        inputQuestion('d2m1q8','Quanto é 6 + 5?',11,'MUITO BOM! Você calculou corretamente: 6 + 5 = 11.','VAMOS REVER! Comece no 6 e acrescente 5 unidades, uma de cada vez.'),
        inputQuestion('d2m1q9','Quanto é 11 + 7?',18,'MANDOU BEM! A soma de 11 e 7 é 18.','TENTE MAIS UMA VEZ! A partir do 11, conte mais sete números para encontrar a resposta.'),
        quizQuestion('d2m1q10','Qual adição tem resultado 18?',['9 + 7','10 + 8','12 + 5','11 + 6'],'10 + 8','ACERTOU! A adição 10 + 8 tem resultado 18.','AINDA NÃO! Calcule o resultado de cada alternativa e procure a soma que forma 18.')
      ]
    },
    {
      title:'Subtração até 20', video:'assets/videos/desafio-2/missao-2/vd-explica-d2-m2.mp4',
      questions:[
        inputQuestion('d2m2q1','Quanto é 12 - 5?',7,'MUITO BEM! Ao retirar 5 de 12, restam 7.','TENTE NOVAMENTE! Comece no 12 e conte cinco números para trás.'),
        inputQuestion('d2m2q2','Quanto é 15 - 7?',8,'PARABÉNS! Você calculou corretamente: 15 - 7 = 8.','PENSE COM CALMA! Descubra quantas unidades precisamos acrescentar ao 7 para chegar ao 15.'),
        inputQuestion('d2m2q3','Quanto é 20 - 10?',10,'ISSO MESMO! Ao retirar 10 de 20, resta 10.','VAMOS TENTAR DE NOVO! O número 20 possui duas dezenas. Se retirarmos uma dezena, quanto resta?'),
        inputQuestion('d2m2q4','Quanto é 14 - 6?',8,'ÓTIMO! A diferença entre 14 e 6 é 8.','QUASE LÁ! Parta do 14 e volte seis números na sequência numérica.'),
        inputQuestion('d2m2q5','Quanto é 14 - 4?',10,'RESPOSTA CERTA! Ao tirar 4 de 14, chegamos ao 10.','OBSERVE COM ATENÇÃO! Retire as quatro unidades do número 14. Quantas dezenas restam?'),
        inputQuestion('d2m2q6','Quanto é 11 - 3?',8,'EXCELENTE! Você descobriu que 11 - 3 é igual a 8.','NÃO FOI DESSA VEZ! Conte três números para trás a partir do 11: 10, 9, 8.'),
        inputQuestion('d2m2q7','Quanto é 16 - 9?',7,'PERFEITO! A diferença entre 16 e 9 é 7.','TENTE OUTRA ESTRATÉGIA! Conte do 9 até o 16 e descubra quantos números foram acrescentados.'),
        inputQuestion('d2m2q8','Quanto é 14 - 7?',7,'MUITO BOM! A metade de 14 é 7.','VAMOS PENSAR! O número 14 pode ser dividido em duas partes iguais. Quanto vale cada parte?'),
        inputQuestion('d2m2q9','Quanto é 15 - 9?',6,'MARAVILHA! Você acertou: 15 - 9 = 6.','TENTE MAIS UMA VEZ! Descubra quanto falta para o 9 chegar ao 15.'),
        quizQuestion('d2m2q10','Qual subtração tem resultado 5?',['12 - 9','13 - 6','11 - 6','17 - 7'],'11 - 6','PARABÉNS! Você identificou que 11 - 6 é igual a 5.','AINDA NÃO! Resolva cada alternativa e procure a subtração cujo resultado seja 5.')
      ]
    },
    {
      title:'Probleminhas até 20', video:'assets/videos/desafio-2/missao-3/vd-explica-d2-m3.mp4',
      questions:[
        inputQuestion('d2m3q1','Lia tinha 8 moedas e ganhou mais 5. Com quantas moedas ela ficou?',13,'RESPOSTA CERTA! Lia ficou com 13 moedas, pois 8 + 5 = 13.','TENTE NOVAMENTE! Como Lia ganhou mais 5 moedas, a quantidade aumentou. Faça a adição 8 + 5.'),
        inputQuestion('d2m3q2','No foguete havia 15 lugares. 6 já foram ocupados. Quantos lugares ainda estão livres?',9,'MUITO BEM! Ainda estão livres 9 lugares, pois 15 - 6 = 9.','OBSERVE COM ATENÇÃO! Dos 15 lugares do foguete, 6 já foram ocupados. Para descobrir quantos ainda estão livres, calcule 15 - 6.'),
        inputQuestion('d2m3q3','Um estudante comprou 7 cadernos e depois comprou mais 9. Quantos cadernos ele comprou ao todo?',16,'ISSO MESMO! O estudante comprou 16 cadernos ao todo, pois 7 + 9 = 16.','PENSE NOVAMENTE! A expressão “ao todo” indica que devemos juntar as duas quantidades. Faça a adição 7 + 9.'),
        inputQuestion('d2m3q4','Havia 13 pessoas esperando transporte. 5 já embarcaram. Quantas pessoas ficaram esperando?',8,'PARABÉNS! Ficaram 8 pessoas esperando, pois 13 - 5 = 8.','TENTE MAIS UMA VEZ! Quando 5 pessoas embarcaram, elas saíram do grupo que estava esperando. Calcule 13 - 5.'),
        inputQuestion('d2m3q5','Bia tinha 10 estrelas e ganhou 4 em uma missão. Quantas estrelas ela tem agora?',14,'EXCELENTE! Bia tem agora 14 estrelas, pois 10 + 4 = 14.','PRESTE ATENÇÃO! Bia ganhou 4 estrelas, por isso devemos acrescentar essa quantidade às 10 estrelas que ela já tinha. Calcule 10 + 4.'),
        inputQuestion('d2m3q6','Um robô tinha 13 peças. Ele usou 8 peças para consertar uma ponte. Quantas peças sobraram?',5,'ÓTIMO TRABALHO! Sobraram 5 peças, pois 13 - 8 = 5.','ANALISE NOVAMENTE! As 8 peças usadas devem ser retiradas das 13 peças que o robô tinha. Faça a subtração 13 - 8.'),
        inputQuestion('d2m3q7','No jardim havia 6 flores. Depois nasceram mais 6. Quantas flores há no jardim?',12,'PERFEITO! Agora há 12 flores no jardim, pois 6 + 6 = 12.','TENTE NOVAMENTE! Como nasceram mais 6 flores, devemos juntar essa quantidade às 6 flores que já estavam no jardim. Calcule 6 + 6.'),
        inputQuestion('d2m3q8','Lucas tinha 18 figurinhas e perdeu 9 no jogo. Com quantas figurinhas ele ficou?',9,'VOCÊ ACERTOU! Lucas ficou com 9 figurinhas, pois 18 - 9 = 9.','PENSE UM POUCO MAIS! Quando Lucas perdeu 9 figurinhas, sua quantidade diminuiu. Retire 9 de 18 fazendo a operação 18 - 9.'),
        inputQuestion('d2m3q9','Laura tinha 15 reais e gastou 7 para comprar um lanche. Quanto sobrou?',8,'MUITO BEM! Sobraram 8 reais, pois 15 - 7 = 8.','OBSERVE A SITUAÇÃO! Como Laura gastou 7 reais, esse valor deve ser retirado dos 15 reais que ela tinha. Calcule 15 - 7.'),
        inputQuestion('d2m3q10','Uma turma tinha 17 estudantes. 7 foram para a biblioteca. Quantos continuaram na sala?',10,'ACERTOU EM CHEIO! Continuaram 10 estudantes na sala, pois 17 - 7 = 10.','TENTE MAIS UMA VEZ! Os 7 estudantes que foram para a biblioteca saíram da sala. Para descobrir quantos permaneceram, faça 17 - 7.')
      ]
    }
  ]
};
const d5Image = (mission,question) => `assets/imagens/questoes/3-ano/desafio-5/missao-${mission}/d5-m${mission}-q${question}.png`;
const spaceTimeQuestion = (mission,number,text,options,answer,correct,incorrect,imageAlt) => ({
  ...quizQuestion(`d5m${mission}q${number}`,text,options,answer,correct,incorrect,d5Image(mission,number)),
  imageAlt
});
const challengeFive = {
  title:'Desafio 5 — O espaço e o tempo',
  missions:[
    {
      title:'Localização e movimentação no espaço',
      video:'assets/videos/desafio-5/missao-1/vd-explica-d5-m1.mp4',
      intro:'Observe os pontos de referência e as posições nas imagens. Nas malhas, siga as setas e conte as casas para descobrir a posição ou o caminho. Escolha uma alternativa em cada uma das 10 questões.',
      questions:[
        spaceTimeQuestion(1,1,'Tomando a praça como ponto de referência, podemos dizer que a farmácia está…',['À DIREITA','À ESQUERDA','ACIMA','ABAIXO'],'À DIREITA','MUITO BOM! A farmácia está à direita da praça.','PENSE MELHOR! Você tem mais uma chance.','Mapa de um bairro com casas, parque, escola, supermercado, praça e farmácia.'),
        spaceTimeQuestion(1,2,'O que está acima da praça?',['ESCOLA','SUPERMERCADO','FARMÁCIA','PARQUE'],'PARQUE','ISSO MESMO! O parque está acima da praça.','NÃO É ISSO! Tente novamente.','Mapa de um bairro com casas, parque, escola, supermercado, praça e farmácia.'),
        spaceTimeQuestion(1,3,'Qual é o nome da segunda criança (da esquerda para a direita)?',['BIA','RAFA','TÉO','DAVI'],'TÉO','EXCELENTE! Você sabe tudo.','OBSERVE MELHOR! E preste atenção na referência.','Cinco crianças sentadas lado a lado na floresta, com seus nomes escritos abaixo.'),
        // A imagem mostra Bia no centro; o roteiro trazia Davi e um feedback de outra questão.
        spaceTimeQuestion(1,4,'Qual é o nome da criança que está exatamente no meio?',['LUIZA','DAVI','BIA','RAFA'],'BIA','ISSO MESMO! Bia está exatamente no meio.','NÃO É ISSO! Tente novamente.','Cinco crianças sentadas lado a lado na praia, com seus nomes escritos abaixo.'),
        spaceTimeQuestion(1,5,'Qual é a posição do cachorrinho?',['D3','D4','C3','C4'],'C3','PARABÉNS! Você acertou.','VOCÊ ERROU! Volte e conte as casas novamente.','Malha com colunas de A a E e linhas de 1 a 5, com um cachorrinho.'),
        spaceTimeQuestion(1,6,'Se o cachorrinho andar 2 casas para a esquerda (←) e 3 casas para baixo (↓), ele vai ficar na mesma posição…',['do osso','da casinha','do menino','da ração'],'da casinha','VOCÊ BRILHOU! Esta é a resposta certa.','NÃO ESTÁ CERTO! Tente novamente.','Malha com um cachorrinho, um osso, uma casinha e ração.'),
        spaceTimeQuestion(1,7,'Se o coelhinho andar 3 casas para a direita (→) e 2 casas para baixo (↓), ele vai ficar na mesma posição…',['do buraco','da cenoura','da flor','da árvore'],'do buraco','RESPOSTA CERTA! Você é demais.','RESPOSTA ERRADA! Volte e conte as casas com atenção.','Malha com um coelhinho, um buraco, uma cenoura, uma flor e uma árvore.'),
        spaceTimeQuestion(1,8,'Se a borboleta voar 3 casas para cima (↑) e 3 casas para a esquerda (←), ela vai ficar na mesma posição…',['da flor vermelha','da flor azul','do cogumelo','do arco-íris'],'do arco-íris','PARABÉNS! Você sabe tudo.','ESSA NÃO É A RESPOSTA CERTA! Tente mais uma vez.','Malha com uma borboleta, flores vermelha e azul, um cogumelo e um arco-íris.'),
        spaceTimeQuestion(1,9,'Se a joaninha voar 4 casas para cima (↑), em que posição ela vai ficar?',['B2','C2','D1','C1'],'C1','PARABÉNS! Você sabe tudo.','ESSA NÃO É A RESPOSTA CERTA! Tente mais uma vez.','Malha com colunas de A a E e linhas de 1 a 5, com uma joaninha.'),
        spaceTimeQuestion(1,10,'Qual das rotas abaixo leva a formiga ao formigueiro?',['3 (↓) e 2 (→)','2 (↑) e 3 (→)','2 (↑) e 3 (←)','3 (↑) e 2 (→)'],'2 (↑) e 3 (→)','SENSACIONAL! Você conseguiu.','PENSE BEM! Essa não é a rota correta.','Malha com uma formiga e um formigueiro.')
      ]
    },
    {
      title:'Medidas de tempo: o calendário',
      video:'assets/videos/desafio-5/missao-2/vd-explica-d5-m2.mp4',
      intro:'Use os calendários para observar os dias da semana e os meses do ano. Leia cada pergunta com atenção e escolha uma alternativa em cada uma das 10 questões.',
      questions:[
        spaceTimeQuestion(2,1,'Quantos dias tem uma semana?',['10','20','7','5'],'7','ISSO MESMO! Você acertou.','TENTE DE NOVO! Conte os dias da semana na imagem.','Calendário de junho de 2026, organizado de domingo a sábado.'),
        spaceTimeQuestion(2,2,'Se hoje é segunda-feira, depois de amanhã será…',['DOMINGO','TERÇA-FEIRA','QUARTA-FEIRA','SEXTA-FEIRA'],'QUARTA-FEIRA','ISSO MESMO! Você acertou.','RESPOSTA ERRADA! Observe o calendário e tente novamente.','Calendário de junho de 2026, organizado de domingo a sábado.'),
        spaceTimeQuestion(2,3,'Um ano tem quantos meses?',['20','10','15','12'],'12','VOCÊ ACERTOU! Parabéns!','NÃO É ISSO. Conte os meses na imagem.','Calendário de 2026 com os meses de janeiro a dezembro.'),
        spaceTimeQuestion(2,4,'Qual é o mês que vem antes de outubro?',['SETEMBRO','NOVEMBRO','DEZEMBRO','AGOSTO'],'SETEMBRO','BRILHANTE! Você acertou.','PENSE BEM. Observe melhor a imagem.','Calendário de 2026 com os meses de janeiro a dezembro.'),
        spaceTimeQuestion(2,5,'Qual é o mês que tem menos dias?',['JANEIRO','FEVEREIRO','MARÇO','ABRIL'],'FEVEREIRO','ISSO MESMO! Você é demais.','NÃO ESTÁ CERTO! Observe melhor o calendário.','Calendário de 2026 com os meses de janeiro a dezembro.'),
        spaceTimeQuestion(2,6,'Qual é o último mês do ano?',['JANEIRO','SETEMBRO','NOVEMBRO','DEZEMBRO'],'DEZEMBRO','PARABÉNS! Você acertou.','RESPOSTA ERRADA! Observe melhor o calendário.','Calendário de 2026 com os meses de janeiro a dezembro.'),
        spaceTimeQuestion(2,7,'Em que dia da semana caiu o dia 15 de julho de 2026?',['SEGUNDA','TERÇA','QUARTA','QUINTA'],'QUARTA','ISSO MESMO! Resposta correta.','NÃO É ISSO! Olhe no calendário.','Calendário de julho de 2026, organizado de domingo a sábado.'),
        spaceTimeQuestion(2,8,'O Dia das Crianças é comemorado em 12 de outubro. Em que dia da semana cai o Dia das Crianças em 2026?',['SEGUNDA','TERÇA','QUARTA','QUINTA'],'SEGUNDA','SENSACIONAL! O Dia das Crianças de 2026 cai na segunda-feira.','OPS, TENTE DE NOVO! Olhe no calendário.','Calendário de outubro de 2026, organizado de domingo a sábado.'),
        spaceTimeQuestion(2,9,'Quantos sábados tem o mês de agosto de 2026?',['6','5','4','3'],'5','ISSO MESMO! O mês de agosto/2026 tem 5 sábados.','TENTE NOVAMENTE! Olhe no calendário.','Calendário de agosto de 2026, organizado de domingo a sábado.'),
        spaceTimeQuestion(2,10,'Se o dia 31 de agosto de 2026 cai numa segunda-feira, em que dia da semana cai o dia 1º de setembro?',['SEGUNDA','TERÇA','QUARTA','QUINTA'],'TERÇA','LEGAL! Você acertou.','NÃO ESTÁ CERTO! Pense melhor.','Calendário de agosto de 2026, organizado de domingo a sábado.')
      ]
    },
    {
      title:'Medidas de tempo: o relógio',
      video:'assets/videos/desafio-5/missao-3/vd-explica-d5-m3.mp4',
      intro:'Observe os ponteiros e compare os relógios analógicos e digitais. Pense também nas medidas de tempo do dia a dia. Nas duas últimas questões, as letras A, B, C e D identificam os relógios da imagem.',
      questions:[
        spaceTimeQuestion(3,1,'No relógio abaixo, qual é a cor do ponteiro que marca as horas?',['VERMELHO','AZUL','AMARELO','VERDE'],'VERMELHO','RESPOSTA CORRETA! Parabéns!','RESPOSTA INCORRETA.','Relógio analógico com ponteiros vermelho, azul e amarelo.'),
        spaceTimeQuestion(3,2,'O que o ponteiro amarelo marca?',['MÊS','HORA','MINUTOS','SEGUNDOS'],'SEGUNDOS','VOCÊ ACERTOU.','NÃO É ISSO! Você errou.','Relógio analógico com ponteiros vermelho, azul e amarelo.'),
        spaceTimeQuestion(3,3,'Que horas este relógio está marcando?',['3 HORAS E 2 MINUTOS','3 HORAS E 10 MINUTOS','2 HORAS E 30 MINUTOS','2 HORAS E 15 MINUTOS'],'3 HORAS E 10 MINUTOS','MUITO BOM! Você acertou.','TENTE NOVAMENTE.','Relógio analógico com ponteiros vermelho e azul.'),
        spaceTimeQuestion(3,4,'Quantos minutos tem 1 hora?',['50','100','60','10'],'60','PARABÉNS! Resposta correta.','RESPOSTA ERRADA.','Relógio analógico com ponteiros vermelho e azul.'),
        spaceTimeQuestion(3,5,'Quantas horas tem um dia?',['24','100','50','10'],'24','SENSACIONAL! Você respondeu certo.','ESTA RESPOSTA ESTÁ ERRADA!','Criança em quatro momentos do dia: acordando, estudando, comendo e dormindo.'),
        spaceTimeQuestion(3,6,'Qual é a medida de tempo apropriada para medir coisas rápidas como uma piscada?',['DIAS','HORAS','MINUTOS','SEGUNDOS'],'SEGUNDOS','VOCÊ É DEMAIS! Acertou.','TENTE OUTRA VEZ!','Menina piscando um olho.'),
        // Correções pedagógicas aprovadas: horas na escola e 9 horas entre 22h e 7h.
        spaceTimeQuestion(3,7,'Qual é a medida de tempo apropriada para medir o tempo que você passa na escola?',['DIAS','HORAS','MINUTOS','SEGUNDOS'],'HORAS','VOCÊ BRILHOU! Medimos o tempo na escola em horas.','ATENÇÃO! Pense outra vez.','Duas crianças estudando em uma sala de aula.'),
        spaceTimeQuestion(3,8,'Luiza vai se deitar às 10 horas da noite e acorda às 7 horas da manhã. Quanto tempo ela passa na cama?',['6 HORAS','7 HORAS','8 HORAS','9 HORAS'],'9 HORAS','VOCÊ BRILHOU! Das 22h às 7h se passam 9 horas.','ATENÇÃO! Pense outra vez.','Luiza dormindo na cama à noite.'),
        spaceTimeQuestion(3,9,'A qual dos relógios analógicos corresponde o horário marcado no relógio digital?',['RELÓGIO A','RELÓGIO B','RELÓGIO C','RELÓGIO D'],'RELÓGIO A','UHUUUL! Você é campeão.','OBSERVE MELHOR OS RELÓGIOS!','Relógio digital e quatro relógios analógicos identificados pelas letras A, B, C e D.'),
        spaceTimeQuestion(3,10,'A qual dos relógios digitais corresponde o horário marcado no relógio analógico?',['17:00','16:00','15:00','14:00'],'15:00','PARABÉNS! Você acertou.','NÃO É ISSO! Tente outra vez.','Relógio analógico e quatro relógios digitais identificados pelas letras A, B, C e D.')
      ]
    }
  ]
};
const thirdGradeChallenges = [
  {id:'desafio-1',number:1,...challengeOne},
  {id:'desafio-2',number:2,...challengeTwo},
  {id:'desafio-3',number:3,...additionPuzzles.challenge},
  {id:'desafio-4',number:4,...subtractionCards.challenge},
  {id:'desafio-5',number:5,...challengeFive},
  {id:'desafio-6',number:6,...columnArithmetic.challenge},
  {id:'desafio-7',number:7,...regroupArithmetic.challenge},
  {id:'desafio-8',number:8,...moneyMissions.challenge},
  {id:'desafio-9',number:9,...arithmeticEnigmas.challenge},
  {id:'desafio-10',number:10,...geometryMissions.challenge},
  {id:'desafio-11',number:11,...mentalCalculations.challenge},
  {id:'desafio-12',number:12,...multiplicationMissions.challenge},
  {id:'desafio-13',number:13,...measurementMissions.challenge},
  {id:'desafio-14',number:14,title:'Desafio 14 — Desafios de medidas',missions:[...jarMissions.challenge.missions,tapeMissions.mission,weightMissions.mission]},
  {id:'desafio-15',number:15,...crossOperations.challenge},
  {id:'desafio-16',number:16,...orderMultiplication.challenge},
  {id:'desafio-17',number:17,...divisionMissions.challenge,missions:[divisionMissions.mission,divisionConcepts.mission,divisionProblems.mission]}
];
const thirdGradeMissions = thirdGradeChallenges.flatMap(challenge =>
  challenge.missions.map((mission,index) => ({
    ...mission,
    challengeId:challenge.id,
    challengeNumber:challenge.number,
    challengeTitle:challenge.title,
    missionNumber:index + 1,
    missionId:`${challenge.id}-missao-${index + 1}`
  }))
);
const memoryBonusCards = [
  {id:'terra1-imagem',pair:'terra',kind:'image',label:'Terra',image:'assets/imagens/figurinhas/terra1.png'},
  {id:'terra-nome',pair:'terra',kind:'word',label:'Terra'},
  {id:'sol-imagem',pair:'sol',kind:'image',label:'Sol',image:'assets/imagens/figurinhas/sol.png'},
  {id:'sol-nome',pair:'sol',kind:'word',label:'Sol'},
  {id:'lua-imagem',pair:'lua',kind:'image',label:'Lua',image:'assets/imagens/figurinhas/lua.png'},
  {id:'lua-nome',pair:'lua',kind:'word',label:'Lua'}
];
const rockyMemoryBonusCards = [
  {id:'mercurio-imagem',pair:'mercurio',kind:'image',label:'Mercúrio',image:'assets/imagens/figurinhas/mercurio-mem.png'},
  {id:'mercurio-nome',pair:'mercurio',kind:'word',label:'Mercúrio'},
  {id:'venus-imagem',pair:'venus',kind:'image',label:'Vênus',image:'assets/imagens/figurinhas/venus-mem.png'},
  {id:'venus-nome',pair:'venus',kind:'word',label:'Vênus'},
  {id:'terra-imagem',pair:'terra',kind:'image',label:'Terra',image:'assets/imagens/figurinhas/Terra-mem.png'},
  {id:'terra-nome',pair:'terra',kind:'word',label:'Terra'},
  {id:'marte-imagem',pair:'marte',kind:'image',label:'Marte',image:'assets/imagens/figurinhas/marte-mem.png'},
  {id:'marte-nome',pair:'marte',kind:'word',label:'Marte'}
];
const planetRouletteOptions = [
  {id:'netuno',name:'Netuno',stars:-3,image:'assets/imagens/figurinhas/netuno.png'},
  {id:'urano',name:'Urano',stars:-1,image:'assets/imagens/figurinhas/urano.png'},
  {id:'saturno',name:'Saturno',stars:2,image:'assets/imagens/figurinhas/saturno.png'},
  {id:'jupiter',name:'Júpiter',stars:3,image:'assets/imagens/figurinhas/jupiter.png'},
  {id:'marte',name:'Marte',stars:4,image:'assets/imagens/figurinhas/marte.png'},
  {id:'terra',name:'Terra',stars:5,image:'assets/imagens/figurinhas/terra.png'}
];
const constellationBonusOptions = [
  {id:'leao',name:'Leão',stars:-2,image:'assets/imagens/figurinhas/leao.png'},
  {id:'cruzeiro-do-sul',name:'Cruzeiro do Sul',stars:-1,image:'assets/imagens/figurinhas/cruzeiro-do-sul.png'},
  {id:'cavalo-pequeno',name:'Cavalo Pequeno',stars:2,image:'assets/imagens/figurinhas/pequeno-cavalo.png'},
  {id:'tres-marias',name:'Três Marias',stars:3,image:'assets/imagens/figurinhas/tres-marias.png'},
  {id:'alpha-centauri',name:'Alpha Centauri',stars:4,image:'assets/imagens/figurinhas/alpha-centauri.png'},
  {id:'sirius',name:'Sírius',stars:5,image:'assets/imagens/figurinhas/sirius.png'}
];
const spaceItems = [
  {id:'sol',emoji:'☀️',name:'O Sol',price:120,curiosity:'O Sol é uma estrela e concentra quase toda a massa do Sistema Solar.'},
  {id:'lua',emoji:'🌙',name:'A Lua',price:90,curiosity:'A Lua leva cerca de 27 dias para completar uma volta ao redor da Terra.'},
  {id:'terra',emoji:'🌍',name:'Planeta Terra',price:150,curiosity:'A Terra é o único planeta conhecido com água líquida em abundância.'},
  {id:'saturno',emoji:'🪐',name:'Saturno',price:180,curiosity:'Os anéis de Saturno são formados por gelo, poeira e pequenos fragmentos.'},
  {id:'cometa',emoji:'☄️',name:'Cometa',price:100,curiosity:'Cometas formam caudas brilhantes quando se aproximam do Sol.'},
  {id:'galaxia',emoji:'🌌',name:'Galáxia',price:220,curiosity:'A Via Láctea possui centenas de bilhões de estrelas.'}
];
const avatarAssetRoot = 'assets/imagens/avatar';
const avatarSkinTones = [
  {name:'Cor 1',color:'#FFD8C2',path:`${avatarAssetRoot}/avatar-bases/01-porcelana.png`},
  {name:'Cor 2',color:'#F3C09B',path:`${avatarAssetRoot}/avatar-bases/02-pessego.png`},
  {name:'Cor 3',color:'#DEA578',path:`${avatarAssetRoot}/avatar-bases/03-dourada.png`},
  {name:'Cor 4',color:'#C7875E',path:`${avatarAssetRoot}/avatar-bases/04-caramelo.png`},
  {name:'Cor 5',color:'#A96848',path:`${avatarAssetRoot}/avatar-bases/05-canela.png`},
  {name:'Cor 6',color:'#85503A',path:`${avatarAssetRoot}/avatar-bases/06-cacau.png`},
  {name:'Cor 7',color:'#61392C',path:`${avatarAssetRoot}/avatar-bases/07-ebano.png`},
  {name:'Cor 8',color:'#3E261F',path:`${avatarAssetRoot}/avatar-bases/08-noite.png`}
];
const avatarHairColors = [
  {name:'Loiro',slug:'loiro',color:'#D6A33A'},
  {name:'Ruivo',slug:'ruivo',color:'#B9562D'},
  {name:'Castanho',slug:'castanho',color:'#70402A'},
  {name:'Preto',slug:'preto',color:'#262020'}
];
const avatarHairStyles = [
  {name:'Cacheado curto',file:'cacheado-curto'},
  {name:'Crespo curto',file:'crespo-curto'},
  {name:'Crespos',file:'crespos'},
  {name:'Liso curto',file:'liso-curto'},
  {name:'Liso',file:'liso'},
  {name:'Maria-chiquinha',file:'maria-chiquinha'},
  {name:'Ondulado',file:'ondulado'},
  {name:'Topete',file:'topete'}
];
const avatarFaces = [
  {name:'Rosto alegre',path:`${avatarAssetRoot}/avatar-rostos/1.png`},
  {name:'Rosto divertido',path:`${avatarAssetRoot}/avatar-rostos/2.png`}
];
const avatarTops = [
  {name:'Branca e azul',path:`${avatarAssetRoot}/avatar-roupas/blusa-branca-azul.png`},
  {name:'Branca e vermelha',path:`${avatarAssetRoot}/avatar-roupas/blusa-branca-vermelha.png`},
  {name:'Creme',path:`${avatarAssetRoot}/avatar-roupas/blusa-creme.png`},
  {name:'Jeans',path:`${avatarAssetRoot}/avatar-roupas/blusa-jeans.png`},
  {name:'Moletom azul',path:`${avatarAssetRoot}/avatar-roupas/blusa-moleton-azul.png`},
  {name:'Rosa',path:`${avatarAssetRoot}/avatar-roupas/blusa-rosa.png`},
  {name:'Verde',path:`${avatarAssetRoot}/avatar-roupas/blusa-verde.png`},
  {name:'Vermelha e amarela',path:`${avatarAssetRoot}/avatar-roupas/blusa-vermelho-amarela.png`},
  {name:'Camisa xadrez',path:`${avatarAssetRoot}/avatar-roupas/camisa-xadrez.png`}
];
const avatarBottoms = [
  {name:'Bermuda azul',path:`${avatarAssetRoot}/avatar-roupas/bermuda-azul-claro-escuro.png`},
  {name:'Bermuda jeans curta',path:`${avatarAssetRoot}/avatar-roupas/bermuda-jeans-curta.png`},
  {name:'Bermuda jeans',path:`${avatarAssetRoot}/avatar-roupas/bermuda-jeans.png`},
  {name:'Bermuda ocre',path:`${avatarAssetRoot}/avatar-roupas/bermuda-ocre.png`},
  {name:'Bermuda verde',path:`${avatarAssetRoot}/avatar-roupas/bermuda-verde.png`},
  {name:'Saia amarela',path:`${avatarAssetRoot}/avatar-roupas/saia-amarela.png`},
  {name:'Saia azul',path:`${avatarAssetRoot}/avatar-roupas/saia-azul.png`},
  {name:'Saia rosa xadrez',path:`${avatarAssetRoot}/avatar-roupas/saia-rosa-xadrez.png`},
  {name:'Saia vermelha',path:`${avatarAssetRoot}/avatar-roupas/saia-vermelha.png`}
];
const avatarShoes = [
  {name:'Sem calçado',path:''},
  {name:'Bota marrom',path:`${avatarAssetRoot}/avatar-sapatos/bota-marrom.png`},
  {name:'Bota marrom clara',path:`${avatarAssetRoot}/avatar-sapatos/bota-marrom (2).png`},
  {name:'Sapato vermelho',path:`${avatarAssetRoot}/avatar-sapatos/sapato-vermelho.png`},
  {name:'Tênis azul',path:`${avatarAssetRoot}/avatar-sapatos/tenis-azul.png`},
  {name:'Tênis rosa',path:`${avatarAssetRoot}/avatar-sapatos/tenis-rosa.png`},
  {name:'Tênis verde',path:`${avatarAssetRoot}/avatar-sapatos/tenis-verde.png`},
  {name:'Tênis vermelho',path:`${avatarAssetRoot}/avatar-sapatos/tenis-vermelho.png`}
];
const avatarHairAccessories = [
  {name:'Sem acessório de cabelo',path:''},
  {name:'Boné azul',path:`${avatarAssetRoot}/avatar-acessorios/bone-azul.png`},
  {name:'Boné verde',path:`${avatarAssetRoot}/avatar-acessorios/bone-verde.png`},
  {name:'Boné vermelho',path:`${avatarAssetRoot}/avatar-acessorios/bone-vermelho.png`},
  {name:'Boné para trás',path:`${avatarAssetRoot}/avatar-acessorios/bone-virado-tras.png`},
  {name:'Presilha borboleta',path:`${avatarAssetRoot}/avatar-acessorios/presilha-borboleta.png`},
  {name:'Presilha coração',path:`${avatarAssetRoot}/avatar-acessorios/presilha-coracao.png`},
  {name:'Presilha estrela',path:`${avatarAssetRoot}/avatar-acessorios/presilha-estrela-amarela.png`},
  {name:'Presilha flor',path:`${avatarAssetRoot}/avatar-acessorios/presilha-flor.png`}
];
const avatarGlasses = [
  {name:'Sem óculos',path:''},
  {name:'Óculos escuros',path:`${avatarAssetRoot}/avatar-acessorios/oculos-escuros.png`},
  {name:'Óculos hexagonal',path:`${avatarAssetRoot}/avatar-acessorios/oculos-hexa-vermelho.png`},
  {name:'Óculos oval verde',path:`${avatarAssetRoot}/avatar-acessorios/oculos-oval-verde.png`},
  {name:'Óculos quadrado azul',path:`${avatarAssetRoot}/avatar-acessorios/oculos-quadrado-azul.png`},
  {name:'Óculos redondo laranja',path:`${avatarAssetRoot}/avatar-acessorios/oculos-redondo-laranja.png`},
  {name:'Óculos redondo laranja 2',path:`${avatarAssetRoot}/avatar-acessorios/oculos-redondo-laranja (2).png`},
  {name:'Óculos retangular azul',path:`${avatarAssetRoot}/avatar-acessorios/oculos-retangulo-azul.png`}
];
const avatarBags = [
  {name:'Sem bolsa',path:''},
  {name:'Bolsa amarela',path:`${avatarAssetRoot}/avatar-acessorios/bolsa-amarela.png`},
  {name:'Pochete coração',path:`${avatarAssetRoot}/avatar-acessorios/pochete-coracao.png`}
];
const avatarEarrings = [
  {name:'Sem brincos',path:''},
  {name:'Vermelho',path:`${avatarAssetRoot}/avatar-acessorios/brincos-cores/brincos-vermelho.png`},
  {name:'Rosa',path:`${avatarAssetRoot}/avatar-acessorios/brincos-cores/brincos-rosa.png`},
  {name:'Roxo',path:`${avatarAssetRoot}/avatar-acessorios/brincos-cores/brincos-roxo.png`},
  {name:'Branco',path:`${avatarAssetRoot}/avatar-acessorios/brincos-cores/brincos-branco.png`}
];
let studentWorkspace = null;
let currentStudent = null;
let currentChallengeIndex = 0;
let currentMissionIndex = 0;
let draggedChallengeCard = null;
let currentQuestionAttempt = 0;
let dailyRewardGranted = false;
let dailyRewardPending = false;
let missionSession = null;
let rewardNotice = null;
let missionResultState = null;
let bonusResultState = null;
let challengeStage = 'intro';
let memoryBonusState = null;
let memoryFlipTimer = null;
let rockyMemoryBonusState = null;
let rockyMemoryFlipTimer = null;
let planetRouletteState = null;
let planetRouletteTimer = null;
let constellationBonusState = null;
let constellationPreviewTimer = null;
let constellationShuffleTimer = null;
let constellationResultTimer = null;
let meteorBonusState = null;
let meteorRevealTimer = null;
let meteorShuffleTimer = null;
let meteorResultTimer = null;
let solarPuzzleState = null;
let solarPuzzleResultTimer = null;
let solarPuzzlePointerDrag = null;
let suppressSolarPuzzleClick = false;

function normalizeStudentProfile(student) {
  student.coins ??= 350; student.stars ??= 3; student.correctAnswers ??= 0;
  student.challengesAttempted ??= 0; student.journal ??= [];
  student.unlockedWorldIds ??= [];
  // Preserve access when a saved collection already contains discoveries from a world.
  worldDiscoveries.forEach(world => {
    if (!student.unlockedWorldIds.includes(world.id) && worldJournalItems.some(item => item.worldId === world.id && student.journal.includes(item.id))) student.unlockedWorldIds.push(world.id);
  });
  student.progress ??= 0;
  student.completedQuestionIds ??= []; student.completedMissionIds ??= [];
  student.completedChallengeIds ??= []; student.lastDailyReward ??= '';
  student.luckRounds ??= [];
  // O desafio 3 foi substituído: o progresso da atividade antiga não libera as novas missões.
  if (student.additionPuzzleVersion !== 1) {
    student.completedMissionIds = student.completedMissionIds.filter(id => !/^desafio-3-missao-/.test(id));
    student.completedQuestionIds = student.completedQuestionIds.filter(id => !/^d3m1q\d+$/.test(id));
    student.completedChallengeIds = student.completedChallengeIds.filter(id => id !== 'desafio-3');
    student.additionPuzzleVersion = 1;
  }
  student.bonusMemoryPlayed ??= false; student.bonusMemoryResult ??= null;
  student.bonusMemoryAttemptsUsed ??= 0; student.bonusMemoryPair ??= '';
  if (student.bonusMemoryPlayed && student.bonusMemoryPair !== 'todos os pares') {
    student.stars -= Number(student.bonusMemoryResult) || 0;
    student.bonusMemoryPlayed = false; student.bonusMemoryResult = null;
    student.bonusMemoryAttemptsUsed = 0; student.bonusMemoryPair = '';
  }
  student.planetRoulettePlayed ??= false;
  student.planetRouletteResult ??= '';
  student.planetRouletteStars ??= 0;
  student.constellationBonusPlayed ??= false;
  student.constellationBonusResult ??= '';
  student.constellationBonusStars ??= 0;
  student.meteorBonusPlayed ??= false;
  student.meteorBonusResult ??= '';
  student.meteorBonusStars ??= 0;
  student.solarPuzzlePlayed ??= false;
  student.solarPuzzleResult ??= '';
  student.solarPuzzleStars ??= 0;
  student.rockyMemoryPlayed ??= false;
  student.rockyMemoryResult ??= null;
  student.rockyMemoryAttemptsUsed ??= 0;
  student.errors ??= [];
  student.avatarName = typeof student.avatarName === 'string' ? student.avatarName.slice(0,24) : '';
  const previousAvatarConfig = student.avatarConfig && typeof student.avatarConfig === 'object' ? student.avatarConfig : {};
  const legacyAccessory = Number.isInteger(previousAvatarConfig.accessory) ? previousAvatarConfig.accessory : 0;
  student.avatarConfig = {
    skin:2,
    face:0,
    hairStyle:0,
    hairColor:3,
    top:0,
    bottom:0,
    shoes:4,
    hairAccessory:legacyAccessory >= 2 && legacyAccessory <= 5 ? legacyAccessory - 1 : legacyAccessory >= 15 && legacyAccessory <= 18 ? legacyAccessory - 10 : 0,
    glasses:legacyAccessory >= 7 && legacyAccessory <= 13 ? legacyAccessory - 6 : 0,
    bag:legacyAccessory === 1 ? 1 : legacyAccessory === 14 ? 2 : 0,
    earrings:legacyAccessory === 6 ? 1 : 0,
    ...previousAvatarConfig
  };
  ['skin','face','hairStyle','hairColor','top','bottom','shoes','hairAccessory','glasses','bag','earrings'].forEach(key => {
    const limit = {
      skin:avatarSkinTones.length,
      face:avatarFaces.length,
      hairStyle:avatarHairStyles.length,
      hairColor:avatarHairColors.length,
      top:avatarTops.length,
      bottom:avatarBottoms.length,
      shoes:avatarShoes.length,
      hairAccessory:avatarHairAccessories.length,
      glasses:avatarGlasses.length,
      bag:avatarBags.length,
      earrings:avatarEarrings.length
    }[key];
    if (!Number.isInteger(student.avatarConfig[key]) || student.avatarConfig[key] < 0 || student.avatarConfig[key] >= limit) student.avatarConfig[key] = 0;
  });
  thirdGradeMissions.forEach(mission => {
    if (!student.completedMissionIds.includes(mission.missionId)) {
      const incompleteIds = new Set(mission.questions.map(item => item.id));
      student.completedQuestionIds = student.completedQuestionIds.filter(id => !incompleteIds.has(id));
    }
  });
}
function saveStudentWorkspace() {
  if (!studentWorkspace || !state.studentStorageKey) return;
  try { localStorage.setItem(state.studentStorageKey, JSON.stringify(studentWorkspace)); } catch (_) {}
}

function localDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

function grantDailyReward() {
  dailyRewardGranted = false;
  dailyRewardPending = currentStudent.lastDailyReward !== localDateKey();
}

function speakText(text) {
  if (!soundEnabled || !('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = 'pt-BR'; speech.rate = .9; speech.pitch = 1.05;
  const voice = window.speechSynthesis.getVoices().find(item => item.lang?.toLowerCase().startsWith('pt-br'));
  if (voice) speech.voice = voice;
  window.speechSynthesis.speak(speech);
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

const field = ({name, label, type='text', placeholder='', full=false, icon='', autocomplete='', forgot=false}) => `
  <label class="field ${full ? 'field--full' : ''}" data-field="${name}">
    <span class="field__label"><span>${label}</span>${forgot ? '<button type="button" data-ui-help="recovery">Esqueceu a senha?</button>' : ''}</span>
    <span class="input-wrap ${icon ? 'input-wrap--icon' : ''}">
      ${icon ? `<img src="assets/imagens/design/${icon}" alt="" />` : ''}
      <input name="${name}" type="${type}" placeholder="${placeholder}" autocomplete="${autocomplete}" required ${name === 'code' ? 'maxlength="12"' : ''} />
      ${type === 'password' ? '<button class="password-toggle" type="button" aria-label="Mostrar senha">Mostrar</button>' : ''}
    </span>
    <span class="field__error">Preencha este campo corretamente.</span>
  </label>`;

function fieldsFor(role, intent) {
  if (role === 'student') {
    if (intent === 'login') return [
      field({name:'name', label:'Seu nome completo', placeholder:'Digite seu nome completo', full:true, autocomplete:'name'}),
      field({name:'code', label:'Código da turma', placeholder:'Ex.: ORBITA-123', full:true})
    ].join('');
    return [
      field({name:'name', label:'Nome completo', placeholder:'Digite seu nome', full:true, autocomplete:'name'}),
      field({name:'code', label:'Código da turma', placeholder:'Ex.: ORBITA-123', full:true})
    ].join('');
  }
  if (intent === 'login') return [
    field({name:'email', label:'E-mail', type:'email', placeholder:'voce@escola.com', full:true, icon:'email.png', autocomplete:'email'}),
    field({name:'password', label:'Senha', type:'password', placeholder:'Digite sua senha', full:true, icon:'senha.png', autocomplete:'current-password', forgot:true})
  ].join('');
  return [
    field({name:'name', label:'Nome e sobrenome', placeholder:'Digite seu nome', full:true, autocomplete:'name'}),
    field({name:'email', label:'E-mail', type:'email', placeholder:'voce@escola.com', full:true, icon:'email.png', autocomplete:'email'}),
    field({name:'password', label:'Senha', type:'password', placeholder:'Mínimo de 8 caracteres', icon:'senha.png', autocomplete:'new-password'}),
    field({name:'confirm', label:'Repetir senha', type:'password', placeholder:'Digite novamente', icon:'senha.png', autocomplete:'new-password'})
  ].join('');
}

function showScreen(name) {
  if (state.screen === 'student' && name !== 'student') {
    abandonMissionSession();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  document.querySelectorAll('.screen').forEach(screen => {
    const active = screen.dataset.screen === name;
    screen.hidden = !active;
    screen.classList.toggle('screen--active', active);
  });
  state.screen = name;
  window.scrollTo({top:0, behavior:'smooth'});
  if (name === 'profiles') renderIntent();
  if (name === 'form') renderForm();
  if (name === 'admin') renderAdminDashboard();
  if (name === 'teacher') renderTeacherDashboard();
  if (name === 'student') renderStudentDashboard();
  window.platformUI?.navigate();
}

function renderIntent() {
  const registering = state.intent === 'register';
  document.querySelector('#profiles-title').textContent = registering ? 'Comece com sua turma' : 'Como você quer entrar?';
  const studentCard = document.querySelector('[data-role="student"]');
  const adminCard = document.querySelector('[data-role="admin"]');
  studentCard.hidden = registering;
  adminCard.hidden = registering;
  document.querySelector('[data-profile-lead]').textContent = registering
    ? 'Crie sua conta de professor para começar.'
    : 'Escolha seu perfil para continuar sua jornada.';
  document.querySelector('[data-intent-switch]').innerHTML = registering
    ? 'Já possui uma conta? <button type="button" data-toggle-intent>Entrar</button>'
    : 'Ainda não possui uma conta? <button type="button" data-toggle-intent>Cadastrar</button>';
}

function renderForm() {
  if (state.role === 'student') state.intent = 'login';
  const data = roleData[state.role];
  const registering = state.intent === 'register';
  document.querySelector('#auth-form').classList.toggle('student-access', state.role === 'student');
  const noun = data.label.toLowerCase();
  document.querySelector('[data-aside-kicker]').textContent = data.kicker;
  document.querySelector('[data-aside-title]').textContent = data.title;
  document.querySelector('[data-aside-copy]').textContent = data.copy;
  document.querySelector('[data-role-icon]').src = `assets/imagens/design/${data.icon}`;
  document.querySelector('[data-role-name]').textContent = data.label;
  document.querySelector('#form-title').textContent = `${registering ? 'Cadastro' : 'Entrada'} de ${noun}`;
  document.querySelector('[data-form-step]').textContent = registering ? 'PASSO 2 DE 2' : `ACESSO DE ${data.label.toUpperCase()}`;
  document.querySelector('[data-form-lead]').textContent = registering ? 'Preencha os dados abaixo para começar.' : 'Que bom ter você de volta!';
  document.querySelector('[data-form-fields]').innerHTML = fieldsFor(state.role, state.intent);
  if (!registering) {
    const accessField = document.querySelector(
      state.role === 'student' ? '#auth-form [name="code"]' : '#auth-form [name="password"]'
    );
    accessField?.setAttribute('enterkeyhint', 'go');
  }
  document.querySelector('[data-google-wrap]').hidden = true;
  document.querySelector('[data-terms]').hidden = !registering;
  document.querySelector('[data-submit-label]').textContent = registering ? 'Criar conta' : 'Entrar';
  document.querySelector('[data-form-switch]').innerHTML = state.role === 'student'
    ? 'Seu acesso é criado pelo professor responsável pela turma.'
    : state.role === 'admin'
      ? 'Acesso reservado à administração da plataforma.'
    : registering
      ? 'Já possui uma conta? <button type="button" data-toggle-intent>Entrar</button>'
      : 'Ainda não possui uma conta? <button type="button" data-toggle-intent>Cadastrar</button>';
}

function renderAdminDashboard() {
  document.querySelector('[data-current-date]').textContent = new Intl.DateTimeFormat('pt-BR', {day:'2-digit', month:'long', year:'numeric'}).format(new Date());
  renderApprovals();
  renderTeachers();
}

function renderApprovals() {
  const list = document.querySelector('[data-approval-list]');
  document.querySelector('[data-pending-badge]').textContent = adminData.pending.length;
  list.innerHTML = adminData.pending.length ? adminData.pending.map(item => `
    <article class="approval-card">
      <span class="approval-card__avatar"><img src="assets/imagens/design/professor.png" alt="" /></span>
      <div><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.email)} • ${escapeHTML(item.school)}</small></div>
      <div class="approval-card__actions"><button type="button" data-reject="${item.id}">Recusar</button><button type="button" data-approve="${item.id}">Autorizar</button></div>
    </article>`).join('') : '<div class="empty-state"><strong>Nenhuma solicitação pendente</strong>Todos os pedidos de cadastro foram analisados.</div>';
}

function renderTeachers() {
  const list = document.querySelector('[data-teacher-list]');
  document.querySelector('[data-teacher-metric]').textContent = adminData.teachers.length;
  list.innerHTML = adminData.teachers.map(teacher => `
    <tr><td><div class="teacher-name"><i>${escapeHTML(initials(teacher.name))}</i><span><strong>${escapeHTML(teacher.name)}</strong><small>${escapeHTML(teacher.email)}</small></span></div></td>
    <td>${escapeHTML(teacher.school)}</td><td>${teacher.classes || 0}</td><td><span class="status-active">Ativo</span></td>
    <td><div class="table-actions"><button type="button" data-edit-teacher="${teacher.id}" aria-label="Editar ${escapeHTML(teacher.name)}">✎</button><button type="button" data-delete-teacher="${teacher.id}" aria-label="Excluir ${escapeHTML(teacher.name)}">×</button></div></td></tr>`).join('');
}

function setAdminView(view) {
  document.querySelectorAll('[data-admin-view]').forEach(button => button.classList.toggle('is-active', button.dataset.adminView === view));
  document.querySelectorAll('.admin-view').forEach(section => {
    const active = section.dataset.view === view;
    section.hidden = !active;
    section.classList.toggle('is-active', active);
  });
  document.querySelector('[data-admin-title]').textContent = adminTitles[view];
  document.querySelector('.admin-screen').classList.remove('menu-open');
  if (state.screen === 'admin') window.platformUI?.navigate();
}

function openTeacherModal(teacher = null) {
  const modal = document.querySelector('[data-teacher-modal]');
  const form = document.querySelector('#teacher-form');
  form.reset();
  form.elements.id.value = teacher?.id || '';
  form.elements.name.value = teacher?.name || '';
  form.elements.email.value = teacher?.email || '';
  form.elements.school.value = teacher?.school || '';
  form.elements.password.value = '';
  form.elements.password.required = !teacher;
  document.querySelector('[data-admin-teacher-password]').hidden = Boolean(teacher);
  document.querySelector('[data-modal-title]').textContent = teacher ? 'Editar professor' : 'Cadastrar professor';
  modal.hidden = false;
  form.elements.name.focus();
}

const teacherViewTitles = {overview:'Visão geral',classes:'Minhas turmas',students:'Estudantes',progress:'Progresso',errors:'Erros frequentes',reports:'Relatórios'};

function renderTeacherDashboard() {
  if (!teacherData) loadTeacherData(state.teacherEmail);
  const account = teacherAccounts.find(item => item.email === state.teacherEmail);
  const firstName = account?.name?.split(' ')[0] || 'Professor(a)';
  document.querySelector('[data-teacher-profile-name]').textContent = account?.name || 'Professor(a)';
  document.querySelector('[data-teacher-welcome]').textContent = `Olá, ${firstName}!`;
  document.querySelector('[data-teacher-date]').textContent = new Intl.DateTimeFormat('pt-BR', {day:'2-digit',month:'long',year:'numeric'}).format(new Date());
  renderTeacherClasses(); renderTeacherStudents(); renderTeacherOverview(); renderTeacherProgress(); renderTeacherErrors(); renderTeacherReport();
}

function setTeacherView(view) {
  document.querySelectorAll('[data-teacher-view]').forEach(button => button.classList.toggle('is-active', button.dataset.teacherView === view));
  document.querySelectorAll('.teacher-view').forEach(section => {
    const active = section.dataset.teacherSection === view;
    section.hidden = !active; section.classList.toggle('is-active', active);
  });
  document.querySelector('[data-teacher-title]').textContent = teacherViewTitles[view];
  document.querySelector('.teacher-screen').classList.remove('menu-open');
  if (view === 'reports') renderTeacherReport();
  if (state.screen === 'teacher') window.platformUI?.navigate();
}

function renderTeacherOverview() {
  const students = teacherData.students;
  const average = students.length ? Math.round(students.reduce((sum,item) => sum + item.progress, 0) / students.length) : 0;
  document.querySelector('[data-class-count]').textContent = teacherData.classes.length;
  document.querySelector('[data-student-count]').textContent = students.length;
  document.querySelector('[data-average-progress]').textContent = `${average}%`;
  document.querySelector('[data-attention-count]').textContent = students.filter(item => item.progress < 50).length;
  document.querySelector('[data-class-progress]').innerHTML = teacherData.classes.length ? teacherData.classes.map(classroom => {
    const members = students.filter(item => item.classId === classroom.id);
    const progress = members.length ? Math.round(members.reduce((sum,item) => sum + item.progress, 0) / members.length) : 0;
    return `<div class="class-progress-row"><span>${escapeHTML(classroom.name)}</span><i style="--progress:${progress}%"></i><b>${progress}%</b></div>`;
  }).join('') : '<div class="empty-state">Cadastre uma turma para começar.</div>';
  document.querySelector('[data-recent-students]').innerHTML = students.length ? students.slice(0,4).map(student => `<div class="recent-student"><i>${escapeHTML(initials(student.name))}</i><span><strong>${escapeHTML(student.name)}</strong><small>${escapeHTML(student.lastAccess || 'Ainda não acessou')}</small></span><b>${student.progress}%</b></div>`).join('') : '<div class="empty-state">Nenhum estudante cadastrado.</div>';
}

function renderTeacherClasses() {
  const container = document.querySelector('[data-teacher-class-list]');
  container.innerHTML = teacherData.classes.length ? teacherData.classes.map(classroom => {
    const members = teacherData.students.filter(item => item.classId === classroom.id);
    const progress = members.length ? Math.round(members.reduce((sum,item) => sum + item.progress,0) / members.length) : 0;
    return `<article class="teacher-class-card"><div class="teacher-class-card__top"><span class="teacher-class-card__grade">${classroom.grade}º</span><button class="teacher-class-card__delete" type="button" data-delete-class="${classroom.id}" aria-label="Excluir ${escapeHTML(classroom.name)}">×</button></div><h3>${escapeHTML(classroom.name)}</h3><p>${trackName(classroom.grade)}</p><div class="class-code"><span>CÓDIGO DE ACESSO</span><strong>${escapeHTML(classroom.code)}</strong></div><footer><span>${members.length} estudantes</span><b>${progress}% de progresso</b></footer></article>`;
  }).join('') : '<div class="empty-card"><strong>Nenhuma turma cadastrada</strong>Crie sua primeira turma para cadastrar estudantes.</div>';
  const classSelect = document.querySelector('[data-student-class]');
  classSelect.innerHTML = teacherData.classes.map(item => `<option value="${item.id}">${escapeHTML(item.name)} — ${item.grade}º ano</option>`).join('');
}

function renderTeacherStudents() {
  const body = document.querySelector('[data-student-list]');
  body.innerHTML = teacherData.students.length ? teacherData.students.map(student => {
    const classroom = teacherData.classes.find(item => item.id === student.classId);
    const code = student.accessCode || classroom?.code || '—';
    return `<tr><td><div class="teacher-name"><i>${escapeHTML(initials(student.name))}</i><span><strong>${escapeHTML(student.name)}</strong><small>Login do estudante</small></span></div></td><td>${escapeHTML(classroom?.name || 'Sem turma')}</td><td><span class="track-badge">${student.track}º ano</span></td><td><span class="access-code">${escapeHTML(code)}</span></td><td><div class="table-actions"><button type="button" data-reset-student="${student.id}" aria-label="Redefinir acesso de ${escapeHTML(student.name)}">↻</button><button type="button" data-delete-student="${student.id}" aria-label="Excluir ${escapeHTML(student.name)}">×</button></div></td></tr>`;
  }).join('') : '<tr><td colspan="5"><div class="empty-state"><strong>Nenhum estudante cadastrado</strong>Use o botão acima para cadastrar.</div></td></tr>';
}

function renderTeacherProgress() {
  document.querySelector('[data-progress-total]').textContent = `${teacherData.students.length} estudantes`;
  document.querySelector('[data-progress-list]').innerHTML = teacherData.students.length ? teacherData.students.map(student => {
    const classroom = teacherData.classes.find(item => item.id === student.classId);
    return `<article class="student-progress-card"><div><strong>${escapeHTML(student.name)}</strong><small>${escapeHTML(classroom?.name || 'Sem turma')} • Trilha do ${student.track}º ano</small></div><div class="progress-bar"><i style="--progress:${student.progress}%"></i></div><b>${student.progress}%</b><span>${student.progress < 50 ? 'Precisa de atenção' : 'Bom andamento'}</span></article>`;
  }).join('') : '<div class="empty-state">Nenhum progresso disponível.</div>';
}

function errorTotals() {
  const totals = {};
  teacherData.students.forEach(student => (student.errors || []).forEach(error => totals[error] = (totals[error] || 0) + 1));
  return Object.entries(totals).sort((a,b) => b[1] - a[1]);
}

function renderTeacherErrors() {
  const errors = errorTotals();
  const max = errors[0]?.[1] || 1;
  document.querySelector('[data-error-chart]').innerHTML = errors.length ? errors.map(([name,count]) => `<div class="error-row"><span>${escapeHTML(name)}</span><i style="--error:${Math.round(count/max*100)}%"></i><b>${count}</b></div>`).join('') : '<div class="empty-state">Ainda não há erros registrados.</div>';
  document.querySelector('[data-error-recommendations]').innerHTML = errors.length ? errors.slice(0,3).map(([name,count]) => `<div class="recommendation"><strong>Retomar: ${escapeHTML(name)}</strong><small>${count} ocorrências. Proponha uma atividade de revisão na próxima aula.</small></div>`).join('') : '<div class="recommendation"><strong>Tudo certo por enquanto</strong><small>As recomendações aparecerão conforme as atividades forem realizadas.</small></div>';
}

function renderTeacherReport() {
  const type = document.querySelector('[data-report-type]').value;
  const studentWrap = document.querySelector('[data-report-student-wrap]');
  const studentSelect = document.querySelector('[data-report-student]');
  const previousStudent = studentSelect.value;
  studentSelect.innerHTML = teacherData.students.map(item => `<option value="${item.id}">${escapeHTML(item.name)}</option>`).join('');
  if (previousStudent && teacherData.students.some(item => String(item.id) === previousStudent)) studentSelect.value = previousStudent;
  studentWrap.hidden = type !== 'individual';
  const output = document.querySelector('[data-teacher-report]');
  if (type === 'individual' && teacherData.students.length) {
    const student = teacherData.students.find(item => item.id === Number(studentSelect.value)) || teacherData.students[0];
    const classroom = teacherData.classes.find(item => item.id === student.classId);
    output.innerHTML = `<div class="report-summary"><article><span>PROGRESSO</span><strong>${student.progress}%</strong><small>Trilha do ${student.track}º ano</small></article><article><span>ERROS REGISTRADOS</span><strong>${student.errors.length}</strong><small>${escapeHTML(student.errors[0] || 'Nenhuma dificuldade')}</small></article><article><span>TURMA</span><strong>${classroom?.grade || '—'}º</strong><small>${escapeHTML(classroom?.name || 'Sem turma')}</small></article></div><div class="report-note"><strong>${escapeHTML(student.name)}</strong> está com ${student.progress < 50 ? 'necessidade de acompanhamento mais próximo' : 'bom desenvolvimento na trilha selecionada'}. ${student.errors.length ? `Recomenda-se revisar ${escapeHTML(student.errors[0])}.` : 'Nenhuma dificuldade recorrente foi identificada.'}</div>`;
  } else {
    const total = teacherData.students.length;
    const average = total ? Math.round(teacherData.students.reduce((sum,item) => sum + item.progress,0)/total) : 0;
    output.innerHTML = `<div class="report-summary"><article><span>ESTUDANTES</span><strong>${total}</strong><small>Em ${teacherData.classes.length} turmas</small></article><article><span>PROGRESSO MÉDIO</span><strong>${average}%</strong><small>Resultado coletivo</small></article><article><span>ATENÇÃO PEDAGÓGICA</span><strong>${teacherData.students.filter(item => item.progress < 50).length}</strong><small>Abaixo de 50%</small></article></div><div class="report-note">O relatório coletivo reúne o progresso de todas as turmas. Use a opção “Individual” para consultar um estudante específico.</div>`;
  }
}

function renderStudentDashboard() {
  normalizeStudentProfile(currentStudent);
  document.querySelector('[data-student-profile-name]').textContent = currentStudent.name;
  document.querySelector('[data-student-profile-track]').textContent = `Trilha do ${currentStudent.track}º ano`;
  document.querySelector('[data-student-welcome]').textContent = `Olá, ${currentStudent.name.split(' ')[0]}!`;
  document.querySelector('[data-student-coins]').textContent = currentStudent.coins;
  document.querySelector('[data-student-stars]').textContent = currentStudent.stars;
  const completedMissionCount = currentStudent.track === 3
    ? thirdGradeMissions.filter(mission => currentStudent.completedMissionIds.includes(mission.missionId)).length
    : Math.min(12, Math.floor(currentStudent.progress / 8.34));
  const displayedProgress = currentStudent.track === 3
    ? Math.round(completedMissionCount / thirdGradeMissions.length * 100)
    : currentStudent.progress;
  document.querySelector('[data-student-progress-home]').textContent = `${displayedProgress}%`;
  document.querySelector('[data-student-progress-bar]').style.width = `${displayedProgress}%`;
  document.querySelector('[data-student-missions]').textContent = completedMissionCount;
  document.querySelector('[data-student-mission-total]').textContent = `de ${currentStudent.track === 3 ? thirdGradeMissions.length : 12} missões`;
  document.querySelector('[data-student-correct]').textContent = currentStudent.correctAnswers;
  document.querySelector('[data-next-mission-track]').textContent = `Trilha do ${currentStudent.track}º ano`;
  const nextMissionIndex = nextAvailableMissionIndex();
  if (!missionSession && nextMissionIndex >= 0) currentMissionIndex = nextMissionIndex;
  const nextThirdGradeMission = currentStudent.track === 3 && nextMissionIndex >= 0 ? thirdGradeMissions[nextMissionIndex] : null;
  const nextMissionLabel = currentStudent.track === 3
    ? (nextThirdGradeMission ? `Desafio ${nextThirdGradeMission.challengeNumber} • Missão ${nextThirdGradeMission.missionNumber} — ${nextThirdGradeMission.title}` : 'Todas as missões disponíveis foram concluídas!')
    : missionNames[currentStudent.track][nextMissionIndex];
  document.querySelector('[data-next-mission-title]').textContent = nextMissionLabel;
  document.querySelector('[data-student-welcome-copy]').textContent = nextMissionIndex >= 0
    ? `Sua próxima missão é: ${nextMissionLabel}.`
    : 'Você concluiu todas as missões disponíveis. Parabéns!';
  renderMissionPath(); renderMemoryBonusCard(); renderMemoryBonus(); renderPlanetRouletteCard(); renderConstellationBonusCard(); renderMeteorBonusCard(); renderSolarPuzzleCard(); renderRockyMemoryBonusCard(); renderRockyMemoryBonus(); renderStudentBonusList(); renderPlanetRoulette(); renderConstellationBonus(); renderMeteorBonus(); renderSolarPuzzle(); renderAvatarShop(); renderAvatarInstances(); renderStudentProgress(); renderMiniCollection(); renderChallenge(); renderJourneyResult();
  window.worldExplorer?.refresh();
}

function setStudentView(view) {
  if (view !== 'challenge' && missionSession) abandonMissionSession();
  if (view !== 'constellation' && constellationBonusState && constellationBonusState.phase !== 'selected') {
    clearConstellationTimers();
    constellationBonusState = null;
  }
  if (view !== 'meteor' && meteorBonusState) {
    clearMeteorTimers();
    meteorBonusState = null;
  }
  if (view !== 'puzzle' && solarPuzzleState) {
    clearSolarPuzzleState();
  }
  if (view === 'challenge' && !missionSession) beginMissionSession(currentMissionIndex);
  document.querySelectorAll('[data-student-view]').forEach(button => button.classList.toggle('is-active', button.dataset.studentView === view));
  document.querySelectorAll('.student-view').forEach(section => {
    const active = section.dataset.studentSection === view;
    section.hidden = !active; section.classList.toggle('is-active', active);
  });
  document.querySelector('[data-student-title]').textContent = studentViewTitles[view];
  document.querySelector('.student-screen').classList.remove('menu-open');
  if (view === 'challenge') renderChallenge();
  if (state.screen === 'student') window.platformUI?.navigate();
}

function signedReward(value) {
  const amount = Number(value) || 0;
  return amount > 0 ? `+${amount}` : amount < 0 ? `−${Math.abs(amount)}` : '0';
}

function missionLabelAt(index) {
  if (index < 0) return '';
  if (currentStudent.track !== 3) return missionNames[currentStudent.track][index];
  const mission = thirdGradeMissions[index];
  return `Desafio ${mission.challengeNumber} • Missão ${mission.missionNumber} — ${mission.title}`;
}

function renderJourneyResult() {
  const card = document.querySelector('.journey-result-card');
  if (!card) return;
  const state = bonusResultState || missionResultState;
  if (!state) return;

  const isBonus = state.type === 'bonus';
  const nextMissionIndex = nextAvailableMissionIndex();
  const hasNextMission = nextMissionIndex >= 0;
  const hasBonus = !isBonus && Boolean(state.bonusType);
  card.classList.toggle('is-bonus',isBonus);
  card.classList.toggle('is-negative',isBonus && state.stars < 0);
  document.querySelector('[data-journey-result-kicker]').textContent = isBonus ? 'SORTE OU REVÉS CONCLUÍDO' : state.challengeCompleted ? 'DESAFIO CONCLUÍDO' : 'MISSÃO CONCLUÍDA';
  const starCount = Math.abs(state.stars || 0);
  const starLabel = `estrela${starCount === 1 ? '' : 's'}`;
  document.querySelector('[data-journey-result-title]').textContent = isBonus
    ? (state.stars > 0 ? `Você ganhou ${starCount} ${starLabel}!` : state.stars < 0 ? `Você perdeu ${starCount} ${starLabel}.` : 'Seu saldo de estrelas não mudou.')
    : state.challengeCompleted ? 'Parabéns! Desafio concluído!' : 'Parabéns! Missão cumprida!';
  document.querySelector('[data-journey-result-copy]').textContent = isBonus
    ? (state.resultCopy
        ? state.resultCopy
        : state.choice
        ? (state.scoreApplied
            ? `Você escolheu ${state.choice}. Este foi o resultado registrado na sua pontuação.`
            : `Você escolheu ${state.choice} novamente. Esta partida não alterou suas estrelas.`)
        : state.scoreApplied
          ? 'Este foi o resultado registrado na sua pontuação.'
          : 'Você jogou novamente para praticar; sua pontuação já havia sido registrada.')
    : 'Estas recompensas foram adicionadas à sua carteira.';
  document.querySelector('[data-journey-result-coins-value]').textContent = signedReward(state.coins);
  document.querySelector('[data-journey-result-stars-value]').textContent = signedReward(state.stars);
  document.querySelector('[data-journey-result-stars] small').textContent = isBonus
    ? (state.stars < 0 ? 'ESTRELAS PERDIDAS' : state.stars > 0 ? 'ESTRELAS GANHAS' : 'VARIAÇÃO DE ESTRELAS')
    : 'ESTRELAS CONQUISTADAS';

  const invitationKicker = document.querySelector('[data-journey-invitation-kicker]');
  const invitationTitle = document.querySelector('[data-journey-invitation-title]');
  const invitationCopy = document.querySelector('[data-journey-invitation-copy]');
  const bonusButton = document.querySelector('[data-start-result-bonus]');
  const nextButton = document.querySelector('[data-result-next-mission]');
  const pathButton = document.querySelector('[data-result-path]');
  const exploreButton = document.querySelector('[data-result-explore]');

  bonusButton.hidden = !hasBonus;
  nextButton.hidden = isBonus || hasBonus;
  pathButton.hidden = !isBonus;
  exploreButton.hidden = !isBonus;
  if (isBonus) {
    invitationKicker.textContent = 'SUA PRÓXIMA AVENTURA';
    invitationTitle.textContent = 'Para onde vamos agora?';
    invitationCopy.textContent = 'Continue na sua trilha ou explore novos mundos.';
    return;
  }
  if (hasBonus) {
    const memory = state.bonusType === 'memory';
    const roulette = state.bonusType === 'roulette';
    const constellation = state.bonusType === 'constellation';
    const meteor = state.bonusType === 'meteor';
    const rockyMemory = state.bonusType === 'rocky-memory';
    invitationKicker.textContent = 'SORTE OU REVÉS LIBERADO';
    invitationTitle.textContent = 'Uma rodada antes de seguir a aventura!';
    invitationCopy.textContent = memory
      ? 'Encontre todos os pares no Jogo da memória espacial.'
      : roulette
        ? 'Gire a Roleta dos planetas e descubra sua pontuação.'
        : constellation
          ? 'Memorize as cartas e escolha a constelação de maior valor.'
          : meteor
            ? 'Acompanhe o copo que esconde o meteoro e tente encontrá-lo.'
            : rockyMemory
              ? 'Encontre todos os pares na Memória dos planetas rochosos.'
              : 'Arraste as seis peças e monte a imagem do Sistema Solar.';
    bonusButton.textContent = 'Jogar Sorte ou Revés →';
  } else {
    invitationKicker.textContent = hasNextMission ? 'PRÓXIMA MISSÃO' : 'JORNADA CONCLUÍDA';
    invitationTitle.textContent = hasNextMission ? 'Pronto para começar a próxima missão?' : 'Você concluiu as missões disponíveis!';
    invitationCopy.textContent = hasNextMission
      ? missionLabelAt(nextMissionIndex)
      : 'Continue acompanhando sua trilha para descobrir as próximas aventuras.';
    nextButton.textContent = hasNextMission ? 'Começar próxima missão →' : 'Voltar ao início';
  }
}

function pendingLuckRound(bonusType='') {
  return currentStudent?.luckRounds?.find(round => !round.completed && (!bonusType || round.bonusType === bonusType));
}

function startLuckRound(challengeId=missionResultState?.luckRoundId) {
  const round = currentStudent?.luckRounds?.find(item => item.challengeId === challengeId);
  if (!round) return;
  if (round.completed) {
    bonusResultState = {type:'bonus',bonusType:round.bonusType,stars:round.stars,scoreApplied:true};
    missionResultState = null;
    renderJourneyResult();
    setStudentView('result');
    return;
  }
  const starters = {memory:startMemoryBonus,roulette:startPlanetRoulette,constellation:startConstellationBonus,meteor:startMeteorBonus,puzzle:startSolarPuzzle,'rocky-memory':startRockyMemoryBonus};
  starters[round.bonusType](round.challengeId);
}

function applyBonusStars(bonusType,stars,challengeId,previouslyPlayed) {
  if (challengeId) {
    const round = currentStudent.luckRounds.find(item => item.challengeId === challengeId && item.bonusType === bonusType);
    if (!round || round.completed) return false;
    round.completed = true;
    round.stars = stars;
  } else if (previouslyPlayed) return false;
  currentStudent.stars += stars;
  return true;
}

function luckBonusUnlocked(bonusType) {
  if (!currentStudent) return false;
  if (currentStudent.luckRounds?.some(round => round.bonusType === bonusType)) return true;
  if (currentStudent.track === 3) {
    return thirdGradeChallenges.some(challenge => luckBonusTypes[(challenge.number - 1) % luckBonusTypes.length] === bonusType
      && (currentStudent.completedChallengeIds.includes(challenge.id)
        || thirdGradeMissions.filter(mission => mission.challengeId === challenge.id).every(mission => currentStudent.completedMissionIds.includes(mission.missionId))));
  }
  return currentStudent.completedMissionIds.some(id => {
    const match = new RegExp(`^trilha-${currentStudent.track}-missao-(\\d+)$`).exec(id);
    return match && luckBonusTypes[(Number(match[1]) - 1) % luckBonusTypes.length] === bonusType;
  });
}

function renderMissionPath() {
  const completed = Math.min(12, Math.floor(currentStudent.progress / 8.34));
  document.querySelector('[data-path-kicker]').textContent = `TRILHA DO ${currentStudent.track}º ANO`;
  const container = document.querySelector('[data-mission-path]');
  if (currentStudent.track === 3) {
    const completedCount = thirdGradeMissions.filter(mission => currentStudent.completedMissionIds.includes(mission.missionId)).length;
    document.querySelector('[data-path-progress]').textContent = `${Math.round(completedCount / thirdGradeMissions.length * 100)}%`;
    container.classList.add('has-challenges');
    container.innerHTML = thirdGradeChallenges.map(challenge => {
      const challengeMissions = thirdGradeMissions.filter(mission => mission.challengeId === challenge.id);
      const cards = challengeMissions.map(mission => {
        const index = thirdGradeMissions.findIndex(item => item.missionId === mission.missionId);
        const complete = currentStudent.completedMissionIds.includes(mission.missionId);
        const unlocked = index === 0 || currentStudent.completedMissionIds.includes(thirdGradeMissions[index - 1].missionId);
        return `<article class="mission-node ${complete ? 'is-complete' : ''} ${!unlocked ? 'is-locked' : ''}"><span>${complete ? '✓' : String(mission.missionNumber).padStart(2,'0')}</span>${complete ? '<b class="mission-status">Concluída</b>' : ''}<h3>${escapeHTML(mission.title)}</h3><p>${complete ? 'Missão cumprida! Continue explorando.' : unlocked ? 'Uma nova descoberta está esperando.' : 'Conclua a missão anterior para desbloquear.'}</p><button type="button" ${unlocked ? `data-start-challenge data-student-mission="${index}"` : 'disabled'}>${complete ? 'Jogar novamente' : unlocked ? 'Começar missão' : '🔒 Bloqueada'}</button></article>`;
      }).join('');
      const challengeComplete = challengeMissions.every(mission => currentStudent.completedMissionIds.includes(mission.missionId));
      return `<section class="challenge-path-group"><header><div><span>DESAFIO ${challenge.number}</span><h3>${escapeHTML(challenge.title.replace(/^Desafio \d+\s*[—-]\s*/i,''))}</h3></div><b>${challengeComplete ? 'Concluído ✓' : `${challengeMissions.filter(mission => currentStudent.completedMissionIds.includes(mission.missionId)).length}/${challengeMissions.length} missões`}</b></header><div>${cards}</div></section>`;
    }).join('');
    return;
  }
  document.querySelector('[data-path-progress]').textContent = `${currentStudent.progress}%`;
  container.classList.remove('has-challenges');
  container.innerHTML = missionNames[currentStudent.track].map((name,index) => {
    const complete = index < completed;
    const unlocked = index <= completed;
    return `<article class="mission-node ${complete ? 'is-complete' : ''} ${!unlocked ? 'is-locked' : ''}"><span>${complete ? '✓' : String(index+1).padStart(2,'0')}</span>${complete ? '<b class="mission-status">Concluída</b>' : ''}<h3>${escapeHTML(name)}</h3><p>${complete ? 'Missão cumprida! Continue explorando.' : unlocked ? 'Uma nova descoberta está esperando.' : 'Conclua a missão anterior para desbloquear.'}</p><button type="button" ${unlocked ? `data-start-challenge data-student-mission="${index}"` : 'disabled'}>${complete ? 'Jogar novamente' : unlocked ? 'Começar missão' : '🔒 Bloqueada'}</button></article>`;
  }).join('');
}

function memoryBonusUnlocked() {
  return luckBonusUnlocked('memory');
}

function planetRouletteUnlocked() {
  return luckBonusUnlocked('roulette');
}

function constellationBonusUnlocked() {
  return luckBonusUnlocked('constellation');
}

function meteorBonusUnlocked() {
  return luckBonusUnlocked('meteor');
}

function solarPuzzleUnlocked() {
  return luckBonusUnlocked('puzzle');
}

function rockyMemoryBonusUnlocked() {
  return luckBonusUnlocked('rocky-memory');
}

function shuffledMemoryCards() {
  const cards = memoryBonusCards.map(card => ({...card}));
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cards[index],cards[swapIndex]] = [cards[swapIndex],cards[index]];
  }
  return cards;
}

function shuffledRockyMemoryCards() {
  const cards = rockyMemoryBonusCards.map(card => ({...card}));
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cards[index],cards[swapIndex]] = [cards[swapIndex],cards[index]];
  }
  return cards;
}

function renderMemoryBonusCard() {
  const card = document.querySelector('[data-memory-bonus-card]');
  const unlocked = memoryBonusUnlocked();
  card.hidden = false;
  card.classList.toggle('is-locked',!unlocked);
  const button = card.querySelector('[data-open-memory-bonus]');
  const icon = card.querySelector('.bonus-unlock-card__icon');
  button.disabled = !unlocked;
  icon.textContent = unlocked ? '★' : '🔒';
  if (!unlocked) {
    card.classList.remove('is-complete');
    button.textContent = 'Bloqueada';
    document.querySelector('[data-memory-bonus-card-copy]').textContent = 'Conclua o Desafio 1 para liberar o Jogo da memória espacial.';
    return;
  }
  const scored = currentStudent.bonusMemoryPlayed;
  const roundActive = memoryBonusState && !memoryBonusState.finished;
  card.classList.toggle('is-complete',scored);
  button.textContent = roundActive ? 'Continuar Sorte ou Revés →' : scored ? 'Jogar novamente →' : 'Jogar Sorte ou Revés →';
  document.querySelector('[data-memory-bonus-card-copy]').textContent = scored
    ? 'Sua pontuação já foi registrada, mas o jogo continua disponível para você praticar quantas vezes quiser.'
    : 'Encontre os 3 pares antes de esgotar suas chances e conquiste estrelas.';
}

function renderStudentBonusList() {
  const list = document.querySelector('.student-bonus-list');
  list.hidden = false;
  const pending = pendingLuckRound();
  document.querySelector('[data-luck-round-card]').hidden = !pending;
  if (pending) document.querySelector('[data-luck-round-card-copy]').textContent = `Você concluiu o Desafio ${pending.challengeNumber}. Sua rodada de Sorte ou Revés está disponível.`;
}

function renderMeteorBonusCard() {
  const card = document.querySelector('[data-meteor-bonus-card]');
  if (!card) return;
  const availableForTrack = Boolean(currentStudent);
  card.hidden = !availableForTrack;
  if (!availableForTrack) return;
  const unlocked = meteorBonusUnlocked();
  card.classList.toggle('is-locked',!unlocked);
  const button = card.querySelector('[data-open-meteor-bonus]');
  const icon = card.querySelector('.bonus-unlock-card__icon');
  button.disabled = !unlocked;
  icon.textContent = unlocked ? '☄' : '🔒';
  if (!unlocked) {
    card.classList.remove('is-complete');
    button.textContent = 'Bloqueada';
    document.querySelector('[data-meteor-bonus-card-copy]').textContent = 'Conclua o Desafio 4 para liberar o jogo Encontre o meteoro.';
    return;
  }
  const played = currentStudent.meteorBonusPlayed;
  card.classList.toggle('is-complete',played);
  button.textContent = played ? 'Jogar novamente →' : 'Começar atividade →';
  document.querySelector('[data-meteor-bonus-card-copy]').textContent = played
    ? 'Sua pontuação já foi registrada, mas você pode acompanhar os copos novamente sem alterar suas estrelas.'
    : 'Descubra o copo que esconde o meteoro. Você terá duas tentativas.';
}

function renderSolarPuzzleCard() {
  const card = document.querySelector('[data-solar-puzzle-card]');
  if (!card) return;
  const availableForTrack = Boolean(currentStudent);
  card.hidden = !availableForTrack;
  if (!availableForTrack) return;
  const unlocked = solarPuzzleUnlocked();
  card.classList.toggle('is-locked',!unlocked);
  const button = card.querySelector('[data-open-solar-puzzle]');
  const icon = card.querySelector('.bonus-unlock-card__icon');
  button.disabled = !unlocked;
  icon.textContent = unlocked ? '▦' : '🔒';
  if (!unlocked) {
    card.classList.remove('is-complete');
    button.textContent = 'Bloqueada';
    document.querySelector('[data-solar-puzzle-card-copy]').textContent = 'Conclua o Desafio 5 para liberar o quebra-cabeça.';
    return;
  }
  const played = currentStudent.solarPuzzlePlayed;
  card.classList.toggle('is-complete',played);
  button.textContent = played ? 'Montar novamente →' : 'Começar atividade →';
  document.querySelector('[data-solar-puzzle-card-copy]').textContent = played
    ? 'Sua pontuação já foi registrada, mas o quebra-cabeça continua disponível para você praticar.'
    : 'Arraste as seis peças e reconstrua a imagem do Sistema Solar em até duas tentativas.';
}

function renderRockyMemoryBonusCard() {
  const card = document.querySelector('[data-rocky-memory-bonus-card]');
  if (!card) return;
  const availableForTrack = Boolean(currentStudent);
  card.hidden = !availableForTrack;
  if (!availableForTrack) return;
  const unlocked = rockyMemoryBonusUnlocked();
  card.classList.toggle('is-locked',!unlocked);
  const button = card.querySelector('[data-open-rocky-memory-bonus]');
  const icon = card.querySelector('.bonus-unlock-card__icon');
  button.disabled = !unlocked;
  icon.textContent = unlocked ? '★' : '🔒';
  if (!unlocked) {
    card.classList.remove('is-complete');
    button.textContent = 'Bloqueada';
    document.querySelector('[data-rocky-memory-bonus-card-copy]').textContent = 'Conclua o Desafio 6 para liberar a Memória dos planetas rochosos.';
    return;
  }
  const scored = currentStudent.rockyMemoryPlayed;
  const roundActive = rockyMemoryBonusState && !rockyMemoryBonusState.finished;
  card.classList.toggle('is-complete',scored);
  button.textContent = roundActive ? 'Continuar Sorte ou Revés →' : scored ? 'Jogar novamente →' : 'Jogar Sorte ou Revés →';
  document.querySelector('[data-rocky-memory-bonus-card-copy]').textContent = scored
    ? 'Sua pontuação já foi registrada, mas o jogo continua disponível para você praticar quantas vezes quiser.'
    : 'Encontre os 4 pares antes de esgotar suas chances e conquiste estrelas.';
}

function ensureMemoryBonusState() {
  if (memoryBonusState) return;
  memoryBonusState = {
    luckRoundId:'',
    cards:shuffledMemoryCards(),
    open:[],
    mismatches:0,
    matchedPairs:[],
    locked:false,
    finished:false,
    result:null,
    scoreApplied:false
  };
}

function memoryCardMarkup(card,index,flipped,disabled,attribute='data-memory-card') {
  const front = card.kind === 'image'
    ? `<img src="${card.image}" alt="Figurinha: ${escapeHTML(card.label)}">`
    : `<strong>${escapeHTML(card.label)}</strong>`;
  return `<button class="memory-card ${flipped ? 'is-flipped' : ''}" type="button" ${attribute}="${index}" ${disabled ? 'disabled' : ''} aria-label="${flipped ? escapeHTML(card.label) : `Carta ${index + 1}, fechada`}"><span class="memory-card__inner"><span class="memory-card__back" aria-hidden="true"><b>?</b><i>ÓRBITA</i></span><span class="memory-card__front">${front}</span></span></button>`;
}

function renderMemoryBonus() {
  if (!currentStudent || !memoryBonusUnlocked() || !memoryBonusState) return;
  const currentAttempt = Math.min(3,memoryBonusState.mismatches + 1);
  document.querySelector('[data-memory-attempt]').textContent = `${currentAttempt} de 3`;
  document.querySelector('[data-memory-pairs]').textContent = memoryBonusState.matchedPairs.length;
  document.querySelectorAll('[data-memory-score]').forEach(item => {
    const scoreAttempt = Number(item.dataset.memoryScore);
    const active = memoryBonusState.finished
      ? (memoryBonusState.result < 0 ? scoreAttempt === 0 : scoreAttempt === currentAttempt)
      : scoreAttempt === currentAttempt;
    item.classList.toggle('is-active',active);
  });
  document.querySelector('[data-memory-board]').innerHTML = memoryBonusState.cards.map((card,index) => {
    const matched = memoryBonusState.matchedPairs.includes(card.pair);
    const flipped = memoryBonusState.finished || matched || memoryBonusState.open.includes(index);
    return memoryCardMarkup(card,index,flipped,memoryBonusState.finished || memoryBonusState.locked || matched);
  }).join('');
  const result = document.querySelector('[data-memory-result]');
  result.hidden = !memoryBonusState.finished;
  if (!memoryBonusState.finished) return;
  const won = memoryBonusState.result > 0;
  result.classList.toggle('is-error',!won);
  document.querySelector('[data-memory-result-icon]').textContent = won ? '★' : '×';
  document.querySelector('[data-memory-result-title]').textContent = won ? 'Todos os pares encontrados!' : 'Não foi desta vez';
  document.querySelector('[data-memory-result-copy]').textContent = memoryBonusState.scoreApplied
    ? won
      ? `Você completou o jogo na ${currentAttempt}ª tentativa e ganhou ${memoryBonusState.result} estrela${memoryBonusState.result === 1 ? '' : 's'}.`
      : 'As 3 chances terminaram antes de você encontrar todos os pares. Foram descontadas 3 estrelas.'
    : won
      ? 'Você encontrou todos os pares novamente! A pontuação de Sorte ou Revés já havia sido registrada, então seu saldo não mudou.'
      : 'Esta rodada terminou, mas nenhuma estrela foi descontada porque a pontuação de Sorte ou Revés já havia sido registrada.';
}

function startMemoryBonus(luckRoundId=pendingLuckRound('memory')?.challengeId || '') {
  if (!memoryBonusUnlocked()) return;
  if (!memoryBonusState || memoryBonusState.finished || memoryBonusState.luckRoundId !== luckRoundId) {
    if (memoryFlipTimer) { clearTimeout(memoryFlipTimer); memoryFlipTimer = null; }
    memoryBonusState = null;
    if (currentStudent.bonusMemoryPlayed) rewardNotice = null;
  }
  ensureMemoryBonusState();
  memoryBonusState.luckRoundId = luckRoundId;
  renderMemoryBonus();
  setStudentView('bonus');
}

function restartMemoryBonus() {
  const luckRoundId = memoryBonusState?.luckRoundId || '';
  if (memoryFlipTimer) { clearTimeout(memoryFlipTimer); memoryFlipTimer = null; }
  rewardNotice = null;
  memoryBonusState = null;
  ensureMemoryBonusState();
  memoryBonusState.luckRoundId = luckRoundId;
  renderMemoryBonus();
  setStudentView('bonus');
}

function finishMemoryBonus(score) {
  if (memoryBonusState.finished) return;
  const scoreApplied = applyBonusStars('memory',score,memoryBonusState.luckRoundId,currentStudent.bonusMemoryPlayed);
  memoryBonusState.finished = true;
  memoryBonusState.result = score;
  memoryBonusState.scoreApplied = scoreApplied;
  memoryBonusState.locked = true;
  if (scoreApplied) {
    currentStudent.bonusMemoryPlayed = true;
    currentStudent.bonusMemoryResult = score;
    currentStudent.bonusMemoryAttemptsUsed = memoryBonusState.mismatches + 1;
    currentStudent.bonusMemoryPair = 'todos os pares';
    saveStudentWorkspace();
  }
  bonusResultState = {type:'bonus',bonusType:'memory',stars:scoreApplied ? score : 0,scoreApplied};
  missionResultState = null;
  rewardNotice = null;
  renderStudentDashboard();
  setStudentView('result');
  playSound(score > 0 ? (scoreApplied ? 'reward' : 'correct') : 'error');
}

function chooseMemoryCard(button) {
  if (!memoryBonusState || memoryBonusState.locked || memoryBonusState.finished) return;
  const index = Number(button.dataset.memoryCard);
  const selectedCard = memoryBonusState.cards[index];
  if (!Number.isInteger(index) || !selectedCard || memoryBonusState.open.includes(index) || memoryBonusState.matchedPairs.includes(selectedCard.pair)) return;
  memoryBonusState.open.push(index);
  renderMemoryBonus();
  if (memoryBonusState.open.length < 2) return;
  memoryBonusState.locked = true;
  renderMemoryBonus();
  const [firstIndex,secondIndex] = memoryBonusState.open;
  const first = memoryBonusState.cards[firstIndex];
  const second = memoryBonusState.cards[secondIndex];
  if (first.pair === second.pair) {
    if (memoryBonusState.matchedPairs.length < 2) playSound('correct');
    memoryFlipTimer = setTimeout(() => {
      memoryFlipTimer = null;
      memoryBonusState.matchedPairs.push(first.pair);
      memoryBonusState.open = [];
      memoryBonusState.locked = false;
      if (memoryBonusState.matchedPairs.length === 3) {
        finishMemoryBonus([6,3,1][memoryBonusState.mismatches]);
      } else {
        renderMemoryBonus();
      }
    },450);
    return;
  }
  memoryBonusState.mismatches += 1;
  if (memoryBonusState.mismatches >= 3) {
    memoryFlipTimer = setTimeout(() => {
      memoryFlipTimer = null;
      finishMemoryBonus(-3);
    },700);
    return;
  }
  playSound('error');
  memoryFlipTimer = setTimeout(() => {
    memoryFlipTimer = null;
    memoryBonusState.open = [];
    memoryBonusState.locked = false;
    renderMemoryBonus();
  },700);
}

function ensureRockyMemoryBonusState() {
  if (rockyMemoryBonusState) return;
  rockyMemoryBonusState = {
    luckRoundId:'',
    cards:shuffledRockyMemoryCards(),
    open:[],
    mismatches:0,
    matchedPairs:[],
    locked:false,
    finished:false,
    result:null,
    scoreApplied:false
  };
}

function renderRockyMemoryBonus() {
  if (!currentStudent || !rockyMemoryBonusUnlocked() || !rockyMemoryBonusState) return;
  const currentAttempt = Math.min(3,rockyMemoryBonusState.mismatches + 1);
  document.querySelector('[data-rocky-memory-attempt]').textContent = `${currentAttempt} de 3`;
  document.querySelector('[data-rocky-memory-pairs]').textContent = rockyMemoryBonusState.matchedPairs.length;
  document.querySelectorAll('[data-rocky-memory-score]').forEach(item => {
    const scoreAttempt = Number(item.dataset.rockyMemoryScore);
    const active = rockyMemoryBonusState.finished
      ? (rockyMemoryBonusState.result < 0 ? scoreAttempt === 0 : scoreAttempt === currentAttempt)
      : scoreAttempt === currentAttempt;
    item.classList.toggle('is-active',active);
  });
  document.querySelector('[data-rocky-memory-board]').innerHTML = rockyMemoryBonusState.cards.map((card,index) => {
    const matched = rockyMemoryBonusState.matchedPairs.includes(card.pair);
    const flipped = rockyMemoryBonusState.finished || matched || rockyMemoryBonusState.open.includes(index);
    return memoryCardMarkup(card,index,flipped,rockyMemoryBonusState.finished || rockyMemoryBonusState.locked || matched,'data-rocky-memory-card');
  }).join('');
  const result = document.querySelector('[data-rocky-memory-result]');
  result.hidden = !rockyMemoryBonusState.finished;
  if (!rockyMemoryBonusState.finished) return;
  const won = rockyMemoryBonusState.result > 0;
  result.classList.toggle('is-error',!won);
  document.querySelector('[data-rocky-memory-result-icon]').textContent = won ? '★' : '×';
  document.querySelector('[data-rocky-memory-result-title]').textContent = won ? 'Todos os pares encontrados!' : 'Não foi desta vez';
  document.querySelector('[data-rocky-memory-result-copy]').textContent = rockyMemoryBonusState.scoreApplied
    ? won
      ? `Você completou o jogo na ${currentAttempt}ª tentativa e ganhou ${rockyMemoryBonusState.result} estrela${rockyMemoryBonusState.result === 1 ? '' : 's'}.`
      : 'As 3 chances terminaram antes de você encontrar todos os pares. Foram descontadas 3 estrelas.'
    : won
      ? 'Você encontrou todos os pares novamente! A pontuação de Sorte ou Revés já havia sido registrada, então seu saldo não mudou.'
      : 'Esta rodada terminou, mas nenhuma estrela foi descontada porque a pontuação de Sorte ou Revés já havia sido registrada.';
}

function startRockyMemoryBonus(luckRoundId=pendingLuckRound('rocky-memory')?.challengeId || '') {
  if (!rockyMemoryBonusUnlocked()) return;
  if (!rockyMemoryBonusState || rockyMemoryBonusState.finished || rockyMemoryBonusState.luckRoundId !== luckRoundId) {
    if (rockyMemoryFlipTimer) { clearTimeout(rockyMemoryFlipTimer); rockyMemoryFlipTimer = null; }
    rockyMemoryBonusState = null;
    if (currentStudent.rockyMemoryPlayed) rewardNotice = null;
  }
  ensureRockyMemoryBonusState();
  rockyMemoryBonusState.luckRoundId = luckRoundId;
  renderRockyMemoryBonus();
  setStudentView('rocky-memory');
}

function restartRockyMemoryBonus() {
  const luckRoundId = rockyMemoryBonusState?.luckRoundId || '';
  if (rockyMemoryFlipTimer) { clearTimeout(rockyMemoryFlipTimer); rockyMemoryFlipTimer = null; }
  rewardNotice = null;
  rockyMemoryBonusState = null;
  ensureRockyMemoryBonusState();
  rockyMemoryBonusState.luckRoundId = luckRoundId;
  renderRockyMemoryBonus();
  setStudentView('rocky-memory');
}

function finishRockyMemoryBonus(score) {
  if (rockyMemoryBonusState.finished) return;
  const scoreApplied = applyBonusStars('rocky-memory',score,rockyMemoryBonusState.luckRoundId,currentStudent.rockyMemoryPlayed);
  rockyMemoryBonusState.finished = true;
  rockyMemoryBonusState.result = score;
  rockyMemoryBonusState.scoreApplied = scoreApplied;
  rockyMemoryBonusState.locked = true;
  if (scoreApplied) {
    currentStudent.rockyMemoryPlayed = true;
    currentStudent.rockyMemoryResult = score;
    currentStudent.rockyMemoryAttemptsUsed = rockyMemoryBonusState.mismatches + 1;
    saveStudentWorkspace();
  }
  bonusResultState = {type:'bonus',bonusType:'rocky-memory',stars:scoreApplied ? score : 0,scoreApplied};
  missionResultState = null;
  rewardNotice = null;
  renderStudentDashboard();
  setStudentView('result');
  playSound(score > 0 ? (scoreApplied ? 'reward' : 'correct') : 'error');
}

function chooseRockyMemoryCard(button) {
  if (!rockyMemoryBonusState || rockyMemoryBonusState.locked || rockyMemoryBonusState.finished) return;
  const index = Number(button.dataset.rockyMemoryCard);
  const selectedCard = rockyMemoryBonusState.cards[index];
  if (!Number.isInteger(index) || !selectedCard || rockyMemoryBonusState.open.includes(index) || rockyMemoryBonusState.matchedPairs.includes(selectedCard.pair)) return;
  rockyMemoryBonusState.open.push(index);
  renderRockyMemoryBonus();
  if (rockyMemoryBonusState.open.length < 2) return;
  rockyMemoryBonusState.locked = true;
  renderRockyMemoryBonus();
  const [firstIndex,secondIndex] = rockyMemoryBonusState.open;
  const first = rockyMemoryBonusState.cards[firstIndex];
  const second = rockyMemoryBonusState.cards[secondIndex];
  if (first.pair === second.pair) {
    if (rockyMemoryBonusState.matchedPairs.length < 3) playSound('correct');
    rockyMemoryFlipTimer = setTimeout(() => {
      rockyMemoryFlipTimer = null;
      rockyMemoryBonusState.matchedPairs.push(first.pair);
      rockyMemoryBonusState.open = [];
      rockyMemoryBonusState.locked = false;
      if (rockyMemoryBonusState.matchedPairs.length === 4) {
        finishRockyMemoryBonus([6,3,1][rockyMemoryBonusState.mismatches]);
      } else {
        renderRockyMemoryBonus();
      }
    },450);
    return;
  }
  rockyMemoryBonusState.mismatches += 1;
  if (rockyMemoryBonusState.mismatches >= 3) {
    rockyMemoryFlipTimer = setTimeout(() => {
      rockyMemoryFlipTimer = null;
      finishRockyMemoryBonus(-3);
    },700);
    return;
  }
  playSound('error');
  rockyMemoryFlipTimer = setTimeout(() => {
    rockyMemoryFlipTimer = null;
    rockyMemoryBonusState.open = [];
    rockyMemoryBonusState.locked = false;
    renderRockyMemoryBonus();
  },700);
}

function ensurePlanetRouletteState() {
  if (planetRouletteState) return;
  planetRouletteState = {
    luckRoundId:'',
    spinning:false,
    finished:false,
    scoreApplied:false,
    result:null,
    rotation:0
  };
}

function renderPlanetRouletteCard() {
  const card = document.querySelector('[data-planet-roulette-card]');
  const unlocked = planetRouletteUnlocked();
  card.hidden = false;
  card.classList.toggle('is-locked',!unlocked);
  const button = card.querySelector('[data-open-planet-roulette]');
  const icon = card.querySelector('.bonus-unlock-card__icon');
  button.disabled = !unlocked;
  icon.textContent = unlocked ? '↻' : '🔒';
  if (!unlocked) {
    card.classList.remove('is-complete');
    button.textContent = 'Bloqueada';
    document.querySelector('[data-planet-roulette-card-copy]').textContent = 'Conclua o Desafio 2 para liberar a Roleta dos planetas.';
    return;
  }
  const played = currentStudent.planetRoulettePlayed;
  card.classList.toggle('is-complete',played);
  button.textContent = played ? 'Jogar novamente →' : 'Girar a roleta →';
  document.querySelector('[data-planet-roulette-card-copy]').textContent = played
    ? 'Sua pontuação já foi registrada, mas você pode girar novamente quantas vezes quiser, sem ganhar ou perder mais estrelas.'
    : 'Gire uma vez e descubra quantas estrelas o planeta sorteado vale.';
}

function renderPlanetRoulette() {
  if (!currentStudent || !planetRouletteUnlocked() || !planetRouletteState) return;
  const wheel = document.querySelector('[data-planet-wheel]');
  wheel.classList.toggle('is-spinning',planetRouletteState.spinning);
  wheel.style.transform = `rotate(${planetRouletteState.rotation}deg)`;
  const spinButton = document.querySelector('[data-spin-planet-roulette]');
  spinButton.disabled = planetRouletteState.spinning || planetRouletteState.finished;
  spinButton.textContent = planetRouletteState.spinning ? 'Girando...' : planetRouletteState.finished ? 'Giro realizado' : 'Girar roleta';
  document.querySelector('[data-planet-roulette-note]').textContent = !planetRouletteState.luckRoundId && currentStudent.planetRoulettePlayed && !planetRouletteState.scoreApplied
    ? 'Esta nova partida é apenas para diversão e não altera suas estrelas.'
    : 'Você tem um giro nesta rodada de Sorte ou Revés.';
  const resultWrap = document.querySelector('[data-planet-roulette-result]');
  const result = planetRouletteState.result;
  resultWrap.hidden = !planetRouletteState.finished || planetRouletteState.spinning || !result;
  if (!result || resultWrap.hidden) return;
  resultWrap.classList.toggle('is-error',result.stars < 0);
  const resultImage = document.querySelector('[data-planet-result-image]');
  resultImage.src = result.image;
  resultImage.alt = `Planeta ${result.name}`;
  document.querySelector('[data-planet-result-title]').textContent = `${result.name}!`;
  document.querySelector('[data-planet-result-copy]').textContent = planetRouletteState.scoreApplied
    ? result.stars > 0
      ? `Você ganhou ${result.stars} estrelas neste giro.`
      : `Foram descontadas ${Math.abs(result.stars)} estrela${Math.abs(result.stars) === 1 ? '' : 's'} neste giro.`
    : 'Você girou novamente para se divertir; seu saldo de estrelas não mudou.';
}

function startPlanetRoulette(luckRoundId=pendingLuckRound('roulette')?.challengeId || '') {
  if (!planetRouletteUnlocked()) return;
  if (planetRouletteState?.finished || planetRouletteState?.luckRoundId !== luckRoundId) {
    if (planetRouletteTimer) { clearTimeout(planetRouletteTimer); planetRouletteTimer = null; }
    planetRouletteState = null;
  }
  ensurePlanetRouletteState();
  planetRouletteState.luckRoundId = luckRoundId;
  renderPlanetRoulette();
  setStudentView('roulette');
}

function spinPlanetRoulette() {
  if (!planetRouletteState || planetRouletteState.spinning || planetRouletteState.finished) return;
  const resultIndex = Math.floor(Math.random() * planetRouletteOptions.length);
  const result = planetRouletteOptions[resultIndex];
  const scoreApplied = applyBonusStars('roulette',result.stars,planetRouletteState.luckRoundId,currentStudent.planetRoulettePlayed);
  planetRouletteState.result = result;
  planetRouletteState.spinning = true;
  planetRouletteState.scoreApplied = scoreApplied;
  planetRouletteState.rotation = 5 * 360 + ((360 - resultIndex * 60) % 360);
  if (scoreApplied) {
    currentStudent.planetRoulettePlayed = true;
    currentStudent.planetRouletteResult = result.id;
    currentStudent.planetRouletteStars = result.stars;
    saveStudentWorkspace();
  }
  renderPlanetRoulette();
  setStudentView('roulette');
  planetRouletteTimer = setTimeout(() => {
    planetRouletteTimer = null;
    planetRouletteState.spinning = false;
    planetRouletteState.finished = true;
    const rouletteVisible = !document.querySelector('[data-student-section="roulette"]').hidden;
    bonusResultState = {type:'bonus',bonusType:'roulette',stars:scoreApplied ? result.stars : 0,scoreApplied,choice:result.name};
    missionResultState = null;
    rewardNotice = null;
    renderStudentDashboard();
    if (rouletteVisible) setStudentView('result');
    playSound(result.stars > 0 ? (scoreApplied ? 'reward' : 'correct') : 'error');
  },4300);
}

function shuffledConstellationCards(cards=constellationBonusOptions) {
  const result = cards.map(card => ({...card}));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index],result[swapIndex]] = [result[swapIndex],result[index]];
  }
  return result;
}

function nextConstellationCardOrder(cards) {
  if (cards.length < 2) return [...cards];
  const distance = 1 + Math.floor(Math.random() * (cards.length - 1));
  const moved = cards.map((_,index) => cards[(index + distance) % cards.length]);
  return Math.random() > .5 ? moved.reverse() : moved;
}

function animateConstellationShuffleStep() {
  if (!constellationBonusState || constellationBonusState.phase !== 'shuffling') return;
  const board = document.querySelector('[data-constellation-board]');
  const previousPositions = new Map(
    [...board.querySelectorAll('[data-constellation-id]')].map(card => [
      card.dataset.constellationId,
      card.getBoundingClientRect()
    ])
  );

  constellationBonusState.cards = nextConstellationCardOrder(constellationBonusState.cards);
  constellationBonusState.movesLeft -= 1;
  renderConstellationBonus();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  board.querySelectorAll('[data-constellation-id]').forEach(card => {
    const previous = previousPositions.get(card.dataset.constellationId);
    if (!previous) return;
    const current = card.getBoundingClientRect();
    card.animate([
      {
        transform:`translate(${previous.left - current.left}px, ${previous.top - current.top}px) rotate(-2deg) scale(.98)`,
        zIndex:2
      },
      {transform:'translate(0, 0) rotate(0) scale(1)',zIndex:1}
    ],{
      duration:reducedMotion ? 1 : 680,
      easing:'cubic-bezier(.22,.8,.24,1)',
      fill:'both'
    });
  });

  if (constellationBonusState.movesLeft > 0) {
    constellationShuffleTimer = setTimeout(animateConstellationShuffleStep,reducedMotion ? 80 : 760);
    return;
  }
  constellationShuffleTimer = setTimeout(() => {
    constellationShuffleTimer = null;
    if (!constellationBonusState || constellationBonusState.phase !== 'shuffling') return;
    constellationBonusState.phase = 'choose';
    renderConstellationBonus();
  },reducedMotion ? 80 : 780);
}

function clearConstellationTimers() {
  if (constellationPreviewTimer) { clearInterval(constellationPreviewTimer); constellationPreviewTimer = null; }
  if (constellationShuffleTimer) { clearTimeout(constellationShuffleTimer); constellationShuffleTimer = null; }
  if (constellationResultTimer) { clearTimeout(constellationResultTimer); constellationResultTimer = null; }
}

function renderConstellationBonusCard() {
  const card = document.querySelector('[data-constellation-bonus-card]');
  const unlocked = constellationBonusUnlocked();
  card.hidden = false;
  card.classList.toggle('is-locked',!unlocked);
  const button = card.querySelector('[data-open-constellation-bonus]');
  const icon = card.querySelector('.bonus-unlock-card__icon');
  button.disabled = !unlocked;
  icon.textContent = unlocked ? '✦' : '🔒';
  if (!unlocked) {
    card.classList.remove('is-complete');
    button.textContent = 'Bloqueada';
    document.querySelector('[data-constellation-bonus-card-copy]').textContent = 'Conclua o Desafio 3 para liberar a escolha da constelação.';
    return;
  }
  const played = currentStudent.constellationBonusPlayed;
  card.classList.toggle('is-complete',played);
  button.textContent = played ? 'Jogar novamente →' : 'Começar atividade →';
  document.querySelector('[data-constellation-bonus-card-copy]').textContent = played
    ? 'Sua pontuação já foi registrada, mas você pode jogar novamente quantas vezes quiser, sem ganhar ou perder mais estrelas.'
    : 'Você terá 3 segundos para encontrar a carta de maior valor e depois deverá acompanhar seus movimentos.';
}

function constellationCardMarkup(card,index) {
  const phase = constellationBonusState.phase;
  const faceUp = phase === 'preview' || (phase === 'selected' && constellationBonusState.selectedIndex === index);
  const enabled = phase === 'choose';
  const selected = constellationBonusState.selectedIndex === index;
  const score = signedReward(card.stars);
  return `<button class="constellation-card ${faceUp ? 'is-face-up' : ''} ${selected ? 'is-selected' : ''}" type="button" data-constellation-card="${index}" data-constellation-id="${escapeHTML(card.id)}" ${enabled ? '' : 'disabled'} aria-label="${faceUp ? `${escapeHTML(card.name)}, ${score} estrelas` : `Carta fechada ${index + 1}`}"><span class="constellation-card__inner"><span class="constellation-card__back" aria-hidden="true"><b>✦</b><small>ÓRBITA</small></span><span class="constellation-card__front"><img src="${card.image}" alt="${escapeHTML(card.name)}"><strong>${escapeHTML(card.name)}</strong><small>${score} ★</small></span></span></button>`;
}

function renderConstellationBonus() {
  if (!currentStudent || !constellationBonusUnlocked() || !constellationBonusState) return;
  const phase = constellationBonusState.phase;
  const board = document.querySelector('[data-constellation-board]');
  const status = document.querySelector('[data-constellation-status]');
  const countdown = document.querySelector('[data-constellation-countdown]');
  const countdownLabel = countdown.nextElementSibling;
  board.classList.toggle('is-shuffling',phase === 'shuffling');
  board.innerHTML = constellationBonusState.cards.map(constellationCardMarkup).join('');
  if (phase === 'preview') {
    status.textContent = 'Memorize a posição da constelação de maior valor';
    countdown.textContent = constellationBonusState.seconds;
    countdownLabel.textContent = 'segundos';
  } else if (phase === 'shuffling') {
    status.textContent = 'Acompanhe a carta de maior valor!';
    countdown.textContent = constellationBonusState.movesLeft;
    countdownLabel.textContent = 'movimentos';
  } else if (phase === 'choose') {
    status.textContent = 'Escolha uma carta!';
    countdown.textContent = '✓';
    countdownLabel.textContent = 'agora';
  } else {
    const selected = constellationBonusState.cards[constellationBonusState.selectedIndex];
    status.textContent = constellationBonusState.scoreApplied
      ? `Você escolheu ${selected.name}`
      : `Você escolheu ${selected.name} — esta partida não altera suas estrelas`;
    countdown.textContent = constellationBonusState.scoreApplied ? signedReward(selected.stars) : '0';
    countdownLabel.textContent = constellationBonusState.scoreApplied ? 'estrelas' : 'novas estrelas';
  }
}

function startConstellationBonus(luckRoundId=pendingLuckRound('constellation')?.challengeId || '') {
  if (!constellationBonusUnlocked()) return;
  clearConstellationTimers();
  constellationBonusState = {
    luckRoundId,
    phase:'preview',
    cards:shuffledConstellationCards(),
    seconds:3,
    movesLeft:6,
    selectedIndex:-1
  };
  renderConstellationBonus();
  setStudentView('constellation');
  constellationPreviewTimer = setInterval(() => {
    constellationBonusState.seconds -= 1;
    if (constellationBonusState.seconds > 0) {
      renderConstellationBonus();
      return;
    }
    clearInterval(constellationPreviewTimer);
    constellationPreviewTimer = null;
    constellationBonusState.phase = 'shuffling';
    renderConstellationBonus();
    constellationShuffleTimer = setTimeout(() => {
      constellationShuffleTimer = null;
      animateConstellationShuffleStep();
    },500);
  },1000);
}

function chooseConstellationCard(button) {
  if (!constellationBonusState || constellationBonusState.phase !== 'choose') return;
  const index = Number(button.dataset.constellationCard);
  const selected = constellationBonusState.cards[index];
  if (!selected) return;
  const scoreApplied = applyBonusStars('constellation',selected.stars,constellationBonusState.luckRoundId,currentStudent.constellationBonusPlayed);
  constellationBonusState.phase = 'selected';
  constellationBonusState.selectedIndex = index;
  constellationBonusState.scoreApplied = scoreApplied;
  if (scoreApplied) {
    currentStudent.constellationBonusPlayed = true;
    currentStudent.constellationBonusResult = selected.id;
    currentStudent.constellationBonusStars = selected.stars;
    saveStudentWorkspace();
  }
  renderConstellationBonus();
  playSound(selected.stars > 0 ? (scoreApplied ? 'reward' : 'correct') : 'error');
  constellationResultTimer = setTimeout(() => {
    constellationResultTimer = null;
    bonusResultState = {type:'bonus',bonusType:'constellation',stars:scoreApplied ? selected.stars : 0,scoreApplied,choice:selected.name};
    missionResultState = null;
    constellationBonusState = null;
    renderStudentDashboard();
    setStudentView('result');
  },1100);
}

function closeConstellationBonus() {
  clearConstellationTimers();
  constellationBonusState = null;
  renderStudentDashboard();
  setStudentView('home');
}

function clearMeteorTimers() {
  if (meteorRevealTimer) { clearTimeout(meteorRevealTimer); meteorRevealTimer = null; }
  if (meteorShuffleTimer) { clearTimeout(meteorShuffleTimer); meteorShuffleTimer = null; }
  if (meteorResultTimer) { clearTimeout(meteorResultTimer); meteorResultTimer = null; }
}

function nextMeteorCupOrder(order) {
  if (order.length < 2) return [...order];
  const distance = Math.random() > .5 ? 1 : order.length - 1;
  return order.map((_,index) => order[(index + distance) % order.length]);
}

function meteorCupMarkup(cupId,index) {
  const phase = meteorBonusState.phase;
  const lastWrongCup = meteorBonusState.wrongCupIds[meteorBonusState.wrongCupIds.length - 1];
  const isMeteorCup = cupId === meteorBonusState.meteorCupId;
  const isWrongCup = meteorBonusState.wrongCupIds.includes(cupId);
  const lifted = phase === 'revealing'
    || (phase === 'wrong' && cupId === lastWrongCup)
    || (phase === 'finished' && (isMeteorCup || cupId === meteorBonusState.selectedCupId));
  const meteorVisible = lifted && isMeteorCup;
  const enabled = phase === 'choose' && !isWrongCup;
  const numberVisible = ['choose','wrong','finished'].includes(phase);
  const label = phase === 'revealing' && isMeteorCup
    ? `Copo ${index + 1}, com o meteoro`
    : `Copo ${index + 1}${isWrongCup ? ', já escolhido' : ''}`;
  return `<button class="meteor-cup ${lifted ? 'is-lifted' : ''} ${isWrongCup ? 'is-wrong' : ''} ${meteorVisible ? 'has-meteor' : ''}" type="button" data-meteor-cup="${cupId}" data-meteor-cup-id="${cupId}" ${enabled ? '' : 'disabled'} aria-label="${label}"><span class="meteor-object" aria-hidden="true"><img src="assets/imagens/jogo-bonus/encontre-o-meteoro/meteoro.png" alt=""></span><img class="meteor-cup__image" src="assets/imagens/jogo-bonus/encontre-o-meteoro/copo.png" alt="" aria-hidden="true"><span class="meteor-cup__number ${numberVisible ? 'is-visible' : ''}">${index + 1}</span></button>`;
}

function renderMeteorBonus() {
  if (!currentStudent || !meteorBonusUnlocked() || !meteorBonusState) return;
  const board = document.querySelector('[data-meteor-board]');
  if (!board) return;
  const phase = meteorBonusState.phase;
  const status = document.querySelector('[data-meteor-status]');
  const attempt = document.querySelector('[data-meteor-attempt]');
  const feedback = document.querySelector('[data-meteor-feedback]');
  board.classList.toggle('is-shuffling',phase === 'shuffling');
  board.classList.toggle('is-revealing',phase === 'revealing');
  board.innerHTML = meteorBonusState.order.map(meteorCupMarkup).join('');
  attempt.textContent = `${Math.min(2,meteorBonusState.attempts + 1)} de 2`;
  document.querySelectorAll('[data-meteor-score]').forEach(item => {
    const scoreAttempt = Number(item.dataset.meteorScore);
    const activeScore = phase === 'finished'
      ? (meteorBonusState.resultStars < 0 ? scoreAttempt === 0 : scoreAttempt === meteorBonusState.attempts)
      : scoreAttempt === Math.min(2,meteorBonusState.attempts + 1);
    item.classList.toggle('is-active',activeScore);
  });

  feedback.hidden = !['wrong','finished'].includes(phase);
  feedback.classList.toggle('is-error',phase === 'wrong' || meteorBonusState.resultStars < 0);
  if (phase === 'revealing') {
    status.textContent = 'Veja qual copo está escondendo o meteoro!';
  } else if (phase === 'covering') {
    status.textContent = 'Os copos vão descer. Prepare-se!';
  } else if (phase === 'shuffling') {
    status.textContent = `Acompanhe o copo com o meteoro — ${meteorBonusState.movesLeft} movimentos`;
  } else if (phase === 'choose') {
    status.textContent = meteorBonusState.attempts === 0 ? 'Onde está o meteoro?' : 'Última tentativa: escolha outro copo!';
  } else if (phase === 'wrong') {
    status.textContent = 'O meteoro não está nesse copo.';
    feedback.querySelector('strong').textContent = 'Tente mais uma vez!';
    feedback.querySelector('p').textContent = 'Observe os dois copos restantes e faça sua última escolha.';
  } else {
    const found = meteorBonusState.resultStars > 0;
    status.textContent = found ? 'Você encontrou o meteoro!' : 'O meteoro estava neste copo.';
    feedback.querySelector('strong').textContent = found ? 'Meteoro encontrado!' : 'Não foi dessa vez.';
    feedback.querySelector('p').textContent = meteorBonusState.scoreApplied
      ? `${signedReward(meteorBonusState.resultStars)} estrelas serão registradas.`
      : 'Esta partida foi apenas para praticar; suas estrelas não serão alteradas.';
  }
}

function animateMeteorShuffleStep() {
  if (!meteorBonusState || meteorBonusState.phase !== 'shuffling') return;
  const board = document.querySelector('[data-meteor-board]');
  const previousPositions = new Map(
    [...board.querySelectorAll('[data-meteor-cup-id]')].map(cup => [
      cup.dataset.meteorCupId,
      cup.getBoundingClientRect()
    ])
  );
  meteorBonusState.order = nextMeteorCupOrder(meteorBonusState.order);
  meteorBonusState.movesLeft -= 1;
  renderMeteorBonus();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  board.querySelectorAll('[data-meteor-cup-id]').forEach(cup => {
    const previous = previousPositions.get(cup.dataset.meteorCupId);
    if (!previous) return;
    const current = cup.getBoundingClientRect();
    cup.animate([
      {transform:`translate(${previous.left - current.left}px, ${previous.top - current.top}px) scale(.97)`,zIndex:3},
      {transform:'translate(0, 0) scale(1)',zIndex:1}
    ],{
      duration:reducedMotion ? 1 : 680,
      easing:'cubic-bezier(.22,.8,.24,1)',
      fill:'both'
    });
  });
  if (meteorBonusState.movesLeft > 0) {
    meteorShuffleTimer = setTimeout(animateMeteorShuffleStep,reducedMotion ? 80 : 760);
    return;
  }
  meteorShuffleTimer = setTimeout(() => {
    meteorShuffleTimer = null;
    if (!meteorBonusState || meteorBonusState.phase !== 'shuffling') return;
    meteorBonusState.phase = 'choose';
    renderMeteorBonus();
  },reducedMotion ? 80 : 780);
}

function startMeteorBonus(luckRoundId=pendingLuckRound('meteor')?.challengeId || '') {
  if (!meteorBonusUnlocked()) return;
  clearMeteorTimers();
  meteorBonusState = {
    luckRoundId,
    phase:'revealing',
    order:[0,1,2],
    meteorCupId:Math.floor(Math.random() * 3),
    selectedCupId:-1,
    wrongCupIds:[],
    attempts:0,
    movesLeft:6,
    resultStars:0,
    scoreApplied:false
  };
  renderMeteorBonus();
  setStudentView('meteor');
  meteorRevealTimer = setTimeout(() => {
    meteorRevealTimer = null;
    if (!meteorBonusState) return;
    meteorBonusState.phase = 'covering';
    renderMeteorBonus();
    meteorRevealTimer = setTimeout(() => {
      meteorRevealTimer = null;
      if (!meteorBonusState) return;
      meteorBonusState.phase = 'shuffling';
      renderMeteorBonus();
      meteorShuffleTimer = setTimeout(() => {
        meteorShuffleTimer = null;
        animateMeteorShuffleStep();
      },450);
    },650);
  },2500);
}

function finishMeteorBonus(found) {
  const score = found ? (meteorBonusState.attempts === 1 ? 6 : 2) : -3;
  const scoreApplied = applyBonusStars('meteor',score,meteorBonusState.luckRoundId,currentStudent.meteorBonusPlayed);
  meteorBonusState.phase = 'finished';
  meteorBonusState.resultStars = score;
  meteorBonusState.scoreApplied = scoreApplied;
  if (scoreApplied) {
    currentStudent.meteorBonusPlayed = true;
    currentStudent.meteorBonusResult = found ? `encontrado-${meteorBonusState.attempts}` : 'nao-encontrado';
    currentStudent.meteorBonusStars = score;
    saveStudentWorkspace();
  }
  renderMeteorBonus();
  playSound(found ? (scoreApplied ? 'reward' : 'correct') : 'error');
  meteorResultTimer = setTimeout(() => {
    meteorResultTimer = null;
    bonusResultState = {
      type:'bonus',
      bonusType:'meteor',
      stars:scoreApplied ? score : 0,
      scoreApplied,
      choice:found ? 'o copo com o meteoro' : 'dois copos sem o meteoro'
    };
    missionResultState = null;
    meteorBonusState = null;
    renderStudentDashboard();
    setStudentView('result');
  },1600);
}

function chooseMeteorCup(button) {
  if (!meteorBonusState || meteorBonusState.phase !== 'choose') return;
  const cupId = Number(button.dataset.meteorCup);
  if (meteorBonusState.wrongCupIds.includes(cupId)) return;
  meteorBonusState.selectedCupId = cupId;
  meteorBonusState.attempts += 1;
  if (cupId === meteorBonusState.meteorCupId) {
    finishMeteorBonus(true);
    return;
  }
  meteorBonusState.wrongCupIds.push(cupId);
  if (meteorBonusState.attempts >= 2) {
    finishMeteorBonus(false);
    return;
  }
  meteorBonusState.phase = 'wrong';
  renderMeteorBonus();
  playSound('error');
  meteorRevealTimer = setTimeout(() => {
    meteorRevealTimer = null;
    if (!meteorBonusState || meteorBonusState.phase !== 'wrong') return;
    meteorBonusState.phase = 'choose';
    renderMeteorBonus();
  },1200);
}

function closeMeteorBonus() {
  clearMeteorTimers();
  meteorBonusState = null;
  renderStudentDashboard();
  setStudentView('home');
}

function shuffledSolarPuzzlePieces() {
  const pieces = [0,1,2,3,4,5];
  for (let index = pieces.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pieces[index],pieces[swapIndex]] = [pieces[swapIndex],pieces[index]];
  }
  if (pieces.every((piece,index) => piece === index)) {
    [pieces[0],pieces[1]] = [pieces[1],pieces[0]];
  }
  return pieces;
}

function clearSolarPuzzleState() {
  if (solarPuzzleResultTimer) { clearTimeout(solarPuzzleResultTimer); solarPuzzleResultTimer = null; }
  solarPuzzlePointerDrag = null;
  solarPuzzleState = null;
}

function solarPuzzlePieceMarkup(pieceId) {
  const column = pieceId % 3;
  const row = Math.floor(pieceId / 3);
  const x = ['0%','50%','100%'][column];
  const y = row === 0 ? '0%' : '100%';
  const selected = solarPuzzleState.selectedPieceId === pieceId;
  return `<button class="solar-puzzle-piece ${selected ? 'is-selected' : ''}" style="--piece-x:${x};--piece-y:${y}" type="button" data-puzzle-piece="${pieceId}" aria-label="Peça do quebra-cabeça" aria-pressed="${selected}"></button>`;
}

function renderSolarPuzzle() {
  if (!currentStudent || !solarPuzzleUnlocked() || !solarPuzzleState) return;
  const board = document.querySelector('[data-solar-puzzle-board]');
  const tray = document.querySelector('[data-solar-puzzle-tray]');
  if (!board || !tray) return;
  const placedPieces = new Set(solarPuzzleState.placements.filter(piece => piece !== null));
  const remaining = solarPuzzleState.pieceOrder.filter(piece => !placedPieces.has(piece));
  board.innerHTML = solarPuzzleState.placements.map((piece,slot) => `
    <div class="solar-puzzle-slot ${piece !== null ? 'has-piece' : ''}" data-puzzle-slot="${slot}" role="button" tabindex="0" aria-label="Espaço do quebra-cabeça${piece !== null ? ', ocupado' : ', vazio'}">
      ${piece !== null ? solarPuzzlePieceMarkup(piece) : ''}
    </div>`).join('');
  tray.innerHTML = remaining.length
    ? remaining.map(solarPuzzlePieceMarkup).join('')
    : '<p>Todas as peças estão no tabuleiro.</p>';

  const placedCount = placedPieces.size;
  document.querySelector('[data-solar-puzzle-progress]').textContent = `${placedCount} de 6 peças`;
  document.querySelector('[data-solar-puzzle-attempt]').textContent = `${Math.min(2,solarPuzzleState.attempts + 1)} de 2`;
  const checkButton = document.querySelector('[data-check-solar-puzzle]');
  checkButton.disabled = placedCount !== 6 || solarPuzzleState.phase === 'finished';
  checkButton.textContent = solarPuzzleState.phase === 'finished' ? 'Montagem concluída' : 'Conferir montagem';

  const feedback = document.querySelector('[data-solar-puzzle-feedback]');
  feedback.hidden = !solarPuzzleState.feedback;
  feedback.classList.toggle('is-error',solarPuzzleState.feedbackType === 'error');
  if (solarPuzzleState.feedback) {
    feedback.querySelector('strong').textContent = solarPuzzleState.feedbackTitle;
    feedback.querySelector('p').textContent = solarPuzzleState.feedback;
  }
  document.querySelectorAll('[data-solar-puzzle-score]').forEach(item => {
    const scoreAttempt = Number(item.dataset.solarPuzzleScore);
    const active = solarPuzzleState.phase === 'finished'
      ? (solarPuzzleState.resultStars < 0 ? scoreAttempt === 0 : scoreAttempt === solarPuzzleState.attempts)
      : scoreAttempt === Math.min(2,solarPuzzleState.attempts + 1);
    item.classList.toggle('is-active',active);
  });
}

function startSolarPuzzle(luckRoundId=pendingLuckRound('puzzle')?.challengeId || '') {
  if (!solarPuzzleUnlocked()) return;
  clearSolarPuzzleState();
  solarPuzzleState = {
    luckRoundId,
    phase:'playing',
    placements:[null,null,null,null,null,null],
    pieceOrder:shuffledSolarPuzzlePieces(),
    selectedPieceId:null,
    attempts:0,
    resultStars:0,
    scoreApplied:false,
    feedback:'',
    feedbackTitle:'',
    feedbackType:''
  };
  renderSolarPuzzle();
  setStudentView('puzzle');
}

function placeSolarPuzzlePiece(pieceId,slotIndex) {
  if (!solarPuzzleState || solarPuzzleState.phase !== 'playing') return;
  if (!Number.isInteger(pieceId) || !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 5) return;
  const previousSlot = solarPuzzleState.placements.indexOf(pieceId);
  if (previousSlot >= 0) solarPuzzleState.placements[previousSlot] = null;
  solarPuzzleState.placements[slotIndex] = pieceId;
  solarPuzzleState.selectedPieceId = null;
  solarPuzzleState.feedback = '';
  renderSolarPuzzle();
}

function selectSolarPuzzlePiece(pieceId) {
  if (!solarPuzzleState || solarPuzzleState.phase !== 'playing') return;
  solarPuzzleState.selectedPieceId = solarPuzzleState.selectedPieceId === pieceId ? null : pieceId;
  renderSolarPuzzle();
}

function activateSolarPuzzleSlot(slotIndex) {
  if (!solarPuzzleState || solarPuzzleState.phase !== 'playing') return;
  if (solarPuzzleState.selectedPieceId !== null) {
    placeSolarPuzzlePiece(solarPuzzleState.selectedPieceId,slotIndex);
    return;
  }
  const pieceId = solarPuzzleState.placements[slotIndex];
  if (pieceId !== null) selectSolarPuzzlePiece(pieceId);
}

function finishSolarPuzzle(success) {
  const score = success ? (solarPuzzleState.attempts === 1 ? 6 : 2) : -3;
  const scoreApplied = applyBonusStars('puzzle',score,solarPuzzleState.luckRoundId,currentStudent.solarPuzzlePlayed);
  solarPuzzleState.phase = 'finished';
  solarPuzzleState.resultStars = score;
  solarPuzzleState.scoreApplied = scoreApplied;
  solarPuzzleState.selectedPieceId = null;
  if (!success) solarPuzzleState.placements = [0,1,2,3,4,5];
  solarPuzzleState.feedbackType = success ? 'success' : 'error';
  solarPuzzleState.feedbackTitle = success ? 'Imagem montada!' : 'Confira a imagem completa.';
  solarPuzzleState.feedback = scoreApplied
    ? `${signedReward(score)} estrelas serão registradas.`
    : 'Esta montagem foi apenas para praticar; suas estrelas não serão alteradas.';
  if (scoreApplied) {
    currentStudent.solarPuzzlePlayed = true;
    currentStudent.solarPuzzleResult = success ? `concluido-${solarPuzzleState.attempts}` : 'nao-concluido';
    currentStudent.solarPuzzleStars = score;
    saveStudentWorkspace();
  }
  renderSolarPuzzle();
  playSound(success ? (scoreApplied ? 'reward' : 'correct') : 'error');
  solarPuzzleResultTimer = setTimeout(() => {
    solarPuzzleResultTimer = null;
    bonusResultState = {
      type:'bonus',
      bonusType:'puzzle',
      stars:scoreApplied ? score : 0,
      scoreApplied,
      resultCopy:success
        ? (scoreApplied ? 'Você montou corretamente o quebra-cabeça do Sistema Solar.' : 'Você montou o quebra-cabeça novamente para praticar; sua pontuação não foi alterada.')
        : (scoreApplied ? 'As peças não ficaram na posição correta após as duas tentativas.' : 'Esta nova tentativa não alterou sua pontuação já registrada.')
    };
    missionResultState = null;
    solarPuzzleState = null;
    renderStudentDashboard();
    setStudentView('result');
  },1700);
}

function checkSolarPuzzle() {
  if (!solarPuzzleState || solarPuzzleState.phase !== 'playing') return;
  if (solarPuzzleState.placements.some(piece => piece === null)) return;
  solarPuzzleState.attempts += 1;
  const correct = solarPuzzleState.placements.every((piece,index) => piece === index);
  if (correct) {
    finishSolarPuzzle(true);
    return;
  }
  if (solarPuzzleState.attempts >= 2) {
    finishSolarPuzzle(false);
    return;
  }
  solarPuzzleState.placements = [null,null,null,null,null,null];
  solarPuzzleState.pieceOrder = shuffledSolarPuzzlePieces();
  solarPuzzleState.selectedPieceId = null;
  solarPuzzleState.feedbackType = 'error';
  solarPuzzleState.feedbackTitle = 'A imagem ainda não está completa.';
  solarPuzzleState.feedback = 'As peças foram embaralhadas novamente. Você tem mais uma tentativa.';
  renderSolarPuzzle();
  playSound('error');
}

function closeSolarPuzzle() {
  clearSolarPuzzleState();
  renderStudentDashboard();
  setStudentView('home');
}

function nextAvailableMissionIndex() {
  if (currentStudent.track !== 3) return Math.min(11,Math.floor(currentStudent.progress / 8.34));
  return thirdGradeMissions.findIndex(mission => !currentStudent.completedMissionIds.includes(mission.missionId));
}

function activeQuestionSet() {
  if (currentStudent.track === 3) return thirdGradeMissions[currentMissionIndex].questions;
  return challengeBank[currentStudent.track];
}

function beginMissionSession(missionIndex=currentMissionIndex) {
  currentMissionIndex = Math.min(currentStudent.track === 3 ? thirdGradeMissions.length - 1 : 11,Math.max(0,missionIndex));
  currentChallengeIndex = 0; currentQuestionAttempt = 0; rewardNotice = null;
  missionResultState = null; bonusResultState = null;
  challengeStage = currentStudent.track === 3 ? 'intro' : 'questions';
  missionSession = {missionIndex:currentMissionIndex,coins:0,correctAnswers:0,attempts:0,errors:[],questionIds:new Set()};
}

function abandonMissionSession() {
  missionSession = null; currentChallengeIndex = 0; currentQuestionAttempt = 0; draggedChallengeCard = null;
  subtractionCards.clear();
  columnArithmetic.clear();
  regroupArithmetic.clear();
  moneyMissions.clear();
  arithmeticEnigmas.clear();
  jarMissions.clear();
  tapeMissions.clear();
  weightMissions.clear();
  crossOperations.clear();
  orderMultiplication.clear();
  multiplicationGroups.clear();
  divisionMissions.clear();
  divisionCalculation.clear();
  challengeStage = 'intro';
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function finishMissionSession() {
  if (!missionSession) return;
  const session = missionSession;
  let coins = session.coins;
  let stars = 0;
  session.questionIds.forEach(id => {
    if (!currentStudent.completedQuestionIds.includes(id)) currentStudent.completedQuestionIds.push(id);
  });
  currentStudent.correctAnswers += session.correctAnswers;
  currentStudent.challengesAttempted += session.attempts;
  currentStudent.errors.push(...session.errors);
  currentStudent.progress = Math.min(100,currentStudent.progress + session.correctAnswers * 3);

  const activeThirdGradeMission = currentStudent.track === 3 ? thirdGradeMissions[session.missionIndex] : null;
  const missionId = activeThirdGradeMission?.missionId || `trilha-${currentStudent.track}-missao-${session.missionIndex + 1}`;
  let challengeCompleted = false;
  let luckRound = null;
  if (!currentStudent.completedMissionIds.includes(missionId)) {
    currentStudent.completedMissionIds.push(missionId); coins += 100;
  }
  if (currentStudent.track === 3) {
    const activeChallengeMissions = thirdGradeMissions.filter(mission => mission.challengeId === activeThirdGradeMission.challengeId);
    challengeCompleted = activeChallengeMissions.every(mission => currentStudent.completedMissionIds.includes(mission.missionId));
    if (challengeCompleted && !currentStudent.completedChallengeIds.includes(activeThirdGradeMission.challengeId)) {
      currentStudent.completedChallengeIds.push(activeThirdGradeMission.challengeId); coins += 250; stars += 3;
    }
    const completedCount = thirdGradeMissions.filter(mission => currentStudent.completedMissionIds.includes(mission.missionId)).length;
    currentStudent.progress = Math.round(completedCount / thirdGradeMissions.length * 100);
  } else {
    challengeCompleted = true;
  }
  if (challengeCompleted) {
    const challengeId = activeThirdGradeMission?.challengeId || `trilha-${currentStudent.track}-desafio-${session.missionIndex + 1}`;
    const challengeNumber = activeThirdGradeMission?.challengeNumber || session.missionIndex + 1;
    luckRound = currentStudent.luckRounds.find(round => round.challengeId === challengeId);
    if (!luckRound) {
      luckRound = {challengeId,challengeNumber,bonusType:luckBonusTypes[(challengeNumber - 1) % luckBonusTypes.length],completed:false,stars:0};
      currentStudent.luckRounds.push(luckRound);
    }
  }
  if (dailyRewardPending) {
    currentStudent.lastDailyReward = localDateKey(); dailyRewardPending = false; dailyRewardGranted = true;
    coins += 100; stars += 2;
  }
  currentStudent.coins += coins; currentStudent.stars += stars;
  const bonusType = luckRound && !luckRound.completed ? luckRound.bonusType : '';
  missionResultState = {type:'mission',coins,stars,missionIndex:session.missionIndex,challengeCompleted,bonusType,luckRoundId:luckRound?.challengeId};
  bonusResultState = null;
  rewardNotice = null;
  missionSession = null; saveStudentWorkspace();
  if (coins > 0 || stars > 0) playSound('reward');
  return missionResultState;
}

function optionMarkup(option,index,attribute='data-challenge-answer') {
  const value = typeof option === 'object' ? option.value : option;
  const content = typeof option === 'object' && option.image
    ? `<img src="${option.image}" alt="${escapeHTML(option.alt || `Alternativa ${index + 1}`)}"><span>${escapeHTML(option.label || '')}</span>`
    : escapeHTML(value);
  return `<button type="button" ${attribute}="${escapeHTML(value)}"><b>${String.fromCharCode(65+index)})</b>${content}</button>`;
}

function columnAdditionDigits(value,columns) {
  return String(value).padStart(columns,' ').split('');
}

function columnAdditionRow(value,columns,rowClass) {
  return columnAdditionDigits(value,columns).map((digit,index) => {
    const place = columns - index - 1;
    if (digit === ' ') return '<span aria-hidden="true"></span>';
    if (digit === '_') {
      return `<input type="text" inputmode="numeric" enterkeyhint="done" maxlength="1" pattern="[0-9]" aria-label="Número que falta na operação" data-challenge-input data-addition-place="${place}" autocomplete="off">`;
    }
    return `<span class="${rowClass}" data-addition-place="${place}">${digit}</span>`;
  }).join('');
}

function columnAdditionMarkup(question) {
  const columns = Math.max(question.top.length,question.bottomTemplate.length,question.result.length);
  const carryCells = Array.from({length:columns},(_,index) =>
    `<span data-carry-place="${columns - index - 1}" aria-hidden="true"></span>`
  ).join('');
  return `
    <div class="column-addition-card" style="--addition-columns:${columns}" data-column-addition>
      <div class="column-addition-label"><span aria-hidden="true">✦</span><p>Complete o quadradinho e confira a conta armada.</p></div>
      <div class="column-addition-operation" aria-label="${question.top} mais um número incompleto é igual a ${question.result}">
        <div class="column-addition-row column-addition-carries">${carryCells}</div>
        <div class="column-addition-row column-addition-top">${columnAdditionRow(question.top,columns,'addition-digit')}</div>
        <div class="column-addition-row column-addition-bottom">${columnAdditionRow(question.bottomTemplate,columns,'addition-digit')}</div>
        <span class="column-addition-sign" aria-hidden="true">+</span>
        <div class="column-addition-line" aria-hidden="true"></div>
        <strong class="column-addition-result" data-operation-result>${columnAdditionRow(question.result,columns,'addition-result-digit')}</strong>
      </div>
      <div class="column-addition-regroup" data-regroup-explanation role="status" aria-live="polite" hidden>
        <span aria-hidden="true">↗</span><p></p>
      </div>
    </div>`;
}

function calculateColumnAddition(question,digit) {
  const bottomText = question.bottomTemplate.replace('_',digit);
  const top = Number(question.top);
  const bottom = Number(bottomText);
  const result = top + bottom;
  const places = Math.max(question.top.length,bottomText.length,String(result).length);
  const steps = [];
  let incomingCarry = 0;
  for (let place = 0; place < places; place += 1) {
    const topDigit = Math.floor(top / (10 ** place)) % 10;
    const bottomDigit = Math.floor(bottom / (10 ** place)) % 10;
    const total = topDigit + bottomDigit + incomingCarry;
    const carryOut = Math.floor(total / 10);
    steps.push({place,topDigit,bottomDigit,incomingCarry,total,carryOut});
    incomingCarry = carryOut;
  }
  return {bottomText,result,steps};
}

function showColumnAdditionAttempt(question,digit,correct) {
  const work = calculateColumnAddition(question,digit);
  const operation = document.querySelector('[data-column-addition]');
  if (!operation) return work;
  const result = operation.querySelector('[data-operation-result]');
  const columns = Number.parseInt(getComputedStyle(operation).getPropertyValue('--addition-columns'),10);
  result.innerHTML = columnAdditionRow(work.result,columns,'addition-result-digit');
  result.classList.toggle('is-wrong',!correct);
  result.classList.toggle('is-correct',correct);
  operation.querySelectorAll('[data-carry-place]').forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('is-active');
    cell.style.removeProperty('--carry-order');
  });
  operation.querySelectorAll('[data-addition-place]').forEach(cell => cell.classList.remove('is-regroup-source'));

  const regroupedSteps = work.steps.filter(step => step.carryOut);
  regroupedSteps.forEach((step,index) => {
    const carryCell = operation.querySelector(`[data-carry-place="${step.place + 1}"]`);
    if (carryCell) {
      carryCell.textContent = String(step.carryOut);
      carryCell.style.setProperty('--carry-order',index);
      carryCell.classList.add('is-active');
    }
    operation.querySelectorAll(`[data-addition-place="${step.place}"]`).forEach(cell => cell.classList.add('is-regroup-source'));
  });

  const explanation = operation.querySelector('[data-regroup-explanation]');
  explanation.hidden = regroupedSteps.length === 0;
  if (regroupedSteps.length) {
    const calculations = regroupedSteps.map(step =>
      `${step.topDigit} + ${step.bottomDigit}${step.incomingCarry ? ` + ${step.incomingCarry}` : ''} = ${step.total}`
    );
    explanation.querySelector('p').textContent = `É preciso reagrupar: ${calculations.join('; ')}. O 1 sobe para a próxima ordem.`;
  }
  return work;
}

function resetColumnAdditionAttempt(question) {
  if (question.type !== 'column-addition') return;
  delete question.lastAttempt;
  const operation = document.querySelector('[data-column-addition]');
  const input = operation?.querySelector('[data-challenge-input]');
  const result = operation?.querySelector('[data-operation-result]');
  const columns = operation
    ? Number.parseInt(getComputedStyle(operation).getPropertyValue('--addition-columns'),10)
    : 0;
  if (input) {
    input.value = '';
    input.disabled = false;
    input.classList.remove('is-correct','is-wrong','is-regroup-source');
  }
  if (result && columns) {
    result.innerHTML = columnAdditionRow(question.result,columns,'addition-result-digit');
    result.classList.remove('is-correct','is-wrong');
  }
  operation?.querySelectorAll('[data-carry-place]').forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('is-active');
    cell.style.removeProperty('--carry-order');
  });
  operation?.querySelectorAll('[data-addition-place]').forEach(cell => cell.classList.remove('is-regroup-source'));
  const explanation = operation?.querySelector('[data-regroup-explanation]');
  if (explanation) {
    explanation.hidden = true;
    explanation.querySelector('p').textContent = '';
  }
  const feedback = document.querySelector('[data-challenge-feedback]');
  feedback.hidden = true;
  feedback.classList.remove('is-error');
  document.querySelector('[data-retry-challenge]').hidden = true;
  document.querySelector('[data-next-challenge]').hidden = true;
  document.querySelector('[data-check-challenge]').hidden = false;
  input?.focus();
}

function challengeIncorrectFeedback(question,selectedElement=null) {
  if (multiplicationGroups.isType(question)) return multiplicationGroups.feedback;
  if (divisionCalculation.isType(question) && !question.options) return divisionCalculation.feedback;
  if (divisionMissions.isType(question)) return divisionMissions.feedback;
  if (orderMultiplication.isType(question)) return orderMultiplication.feedback;
  if (crossOperations.isType(question)) return crossOperations.feedback;
  if (weightMissions.isType(question)) return weightMissions.feedback;
  if (tapeMissions.isType(question)) return tapeMissions.feedback;
  if (jarMissions.isType(question)) return jarMissions.feedback;
  if (arithmeticEnigmas.isType(question)) return arithmeticEnigmas.feedback;
  if (moneyMissions.isType(question)) return moneyMissions.feedback;
  if (regroupArithmetic.isType(question)) return regroupArithmetic.feedback;
  if (columnArithmetic.isType(question)) return columnArithmetic.feedback;
  if (additionPuzzles.isType(question)) return additionPuzzles.feedback;
  if (subtractionCards.isType(question) && question.type !== 'subtract-review') return subtractionCards.feedback;
  if (question.type === 'column-addition' && question.lastAttempt) {
    const {digit,bottomText,result} = question.lastAttempt;
    return `Com o número ${digit} no quadradinho, a conta fica ${question.top} + ${bottomText} = ${result}, e não ${question.result}. Tente outro número.`;
  }
  return question.feedbackByAnswer?.[selectedElement?.dataset.challengeAnswer] || question.incorrect || question.tip || 'Observe novamente e tente outra vez.';
}

function renderChallenge() {
  currentQuestionAttempt = 0;
  subtractionCards.clear();
  columnArithmetic.clear();
  regroupArithmetic.clear();
  moneyMissions.clear();
  arithmeticEnigmas.clear();
  jarMissions.clear();
  tapeMissions.clear();
  weightMissions.clear();
  crossOperations.clear();
  orderMultiplication.clear();
  multiplicationGroups.clear();
  divisionMissions.clear();
  divisionCalculation.clear();
  const isThirdGrade = currentStudent.track === 3;
  const mission = isThirdGrade ? thirdGradeMissions[currentMissionIndex] : null;
  const questions = activeQuestionSet();
  const question = questions[currentChallengeIndex % questions.length];
  document.querySelector('[data-challenge-label]').textContent = isThirdGrade ? mission.challengeTitle.toUpperCase() : 'DESAFIO DA TRILHA';
  document.querySelector('[data-challenge-track]').textContent = mission ? `Desafio ${mission.challengeNumber} • Missão ${mission.missionNumber} — ${mission.title}` : `${currentStudent.track}º ano do Ensino Fundamental`;
  const showingIntro = isThirdGrade && challengeStage === 'intro';
  const spaceTime = mission?.challengeId === 'desafio-5';
  const geometry = mission?.challengeId === 'desafio-10';
  const mentalCalculation = mission?.challengeId === 'desafio-11';
  const multiplication = mission?.challengeId === 'desafio-12';
  const measurements = mission?.challengeId === 'desafio-13';
  const illustratedQuiz = divisionConcepts.isVisual(question) || spaceTime || geometry || ((multiplication || measurements) && Boolean(question.image));
  document.querySelector('.challenge-shell').classList.toggle('division-concepts-challenge',!showingIntro && mission?.challengeId === 'desafio-17' && mission.missionNumber === 2);
  document.querySelector('.challenge-shell').classList.toggle('division-problems-challenge',!showingIntro && mission?.challengeId === 'desafio-17' && mission.missionNumber === 3);
  document.querySelector('.challenge-shell').classList.toggle('compact-challenge',!showingIntro && (divisionCalculation.isType(question) || divisionMissions.isType(question) || orderMultiplication.isType(question) || crossOperations.isType(question) || weightMissions.isType(question) || tapeMissions.isType(question) || jarMissions.isType(question) || additionPuzzles.isType(question) || subtractionCards.isType(question) || columnArithmetic.isType(question) || regroupArithmetic.isType(question) || moneyMissions.isType(question) || arithmeticEnigmas.isType(question) || illustratedQuiz || mentalCalculation || multiplication));
  document.querySelector('.challenge-shell').classList.toggle('division-challenge',!showingIntro && divisionMissions.isType(question));
  document.querySelector('.challenge-shell').classList.toggle('order-multiplication-challenge',!showingIntro && orderMultiplication.isType(question));
  document.querySelector('.challenge-shell').classList.toggle('multiplication-groups-challenge',!showingIntro && multiplicationGroups.isType(question));
  document.querySelector('.challenge-shell').classList.toggle('cross-challenge',!showingIntro && crossOperations.isType(question));
  document.querySelector('.challenge-shell').classList.toggle('weight-challenge',!showingIntro && weightMissions.isType(question));
  document.querySelector('.challenge-shell').classList.toggle('tape-challenge',!showingIntro && tapeMissions.isType(question));
  document.querySelector('.challenge-shell').classList.toggle('jar-challenge',!showingIntro && jarMissions.isType(question));
  document.querySelector('.challenge-shell').classList.toggle('money-challenge',!showingIntro && moneyMissions.isType(question));
  document.querySelector('.challenge-shell').classList.toggle('space-time-challenge',!showingIntro && spaceTime);
  document.querySelector('.challenge-shell').classList.toggle('illustrated-quiz-challenge',!showingIntro && illustratedQuiz);
  document.querySelector('.challenge-shell').classList.toggle('geometry-challenge',!showingIntro && geometry);
  document.querySelector('.challenge-shell').classList.toggle('mental-calculation-challenge',!showingIntro && mentalCalculation);
  document.querySelector('[data-mission-intro]').hidden = !showingIntro;
  document.querySelector('[data-question-screen]').hidden = showingIntro;
  const tabs = document.querySelector('[data-mission-tabs]');
  tabs.hidden = !isThirdGrade || !showingIntro;
  const challengeMissions = mission ? thirdGradeMissions.filter(item => item.challengeId === mission.challengeId) : [];
  tabs.innerHTML = isThirdGrade ? challengeMissions.map(item => {
    const index = thirdGradeMissions.findIndex(candidate => candidate.missionId === item.missionId);
    const unlocked = index === 0 || currentStudent.completedMissionIds.includes(thirdGradeMissions[index - 1].missionId);
    return `<button type="button" data-select-mission="${index}" class="${index === currentMissionIndex ? 'is-active' : ''}" ${unlocked ? '' : 'disabled'}><span>MISSÃO ${item.missionNumber}</span>${escapeHTML(item.title)}${unlocked ? '' : ' 🔒'}</button>`;
  }).join('') : '';
  const videoWrap = document.querySelector('[data-lesson-video]');
  videoWrap.hidden = !mission?.video || !showingIntro;
  if (mission?.video) {
    const player = document.querySelector('[data-lesson-video-player]');
    if (player.getAttribute('src') !== mission.video) player.src = mission.video;
    document.querySelector('[data-lesson-video-title]').textContent = mission.title;
  }
  const brief = document.querySelector('[data-mission-brief]');
  brief.hidden = !mission?.intro || !showingIntro;
  if (mission?.intro) {
    brief.querySelector(':scope > span').textContent = mission.kicker || 'COMO JOGAR';
    brief.querySelector('h3').textContent = mission.title;
    brief.querySelector('p').textContent = mission.intro;
  }
  const example = document.querySelector('[data-mission-example]');
  example.hidden = !mission?.example || !showingIntro;
  example.innerHTML = mission?.example && showingIntro
    ? `<h4>Exemplo: ${escapeHTML(mission.example.operation)}</h4><div>${mission.example.steps.map(step => `<p>${escapeHTML(step)}</p>`).join('')}</div>` : '';
  document.querySelector('[data-challenge-counter]').textContent = `QUESTÃO ${(currentChallengeIndex % questions.length) + 1} DE ${questions.length}`;
  document.querySelector('[data-challenge-question]').textContent = question.text || question.q;
  const media = document.querySelector('[data-question-media]');
  media.hidden = !question.image;
  media.classList.toggle('question-media--ruler',question.imageLayout === 'ruler');
  media.classList.toggle('division-concept-illustration',divisionConcepts.isVisual(question));
  media.innerHTML = question.image ? `<img src="${question.image}" alt="${escapeHTML(question.imageAlt || 'Ilustração da questão')}">${illustratedQuiz ? `<a class="question-image-zoom" href="${question.image}" target="_blank" rel="noopener" aria-label="Ampliar imagem da questão em uma nova aba">Ampliar imagem ↗</a>` : ''}` : '';
  if (divisionConcepts.isVisual(question)) divisionConcepts.renderMedia(question,media);
  const options = document.querySelector('[data-challenge-options]');
  const check = document.querySelector('[data-check-challenge]');
  check.hidden = true;
  check.disabled = false;
  check.textContent = 'Conferir resposta';
  options.className = 'challenge-options';
  if (multiplicationGroups.isType(question)) {
    check.hidden = false;
    multiplicationGroups.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; },
      onSubmit:() => { submitCurrentChallengeAnswer(); }
    });
  } else if (divisionCalculation.isType(question)) {
    check.hidden = Boolean(question.options);
    divisionCalculation.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; },
      onSubmit:() => { submitCurrentChallengeAnswer(); }
    });
  } else if (divisionMissions.isType(question)) {
    check.hidden = Boolean(question.options);
    divisionMissions.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; },
      onSubmit:() => { submitCurrentChallengeAnswer(); }
    });
  } else if (orderMultiplication.isType(question)) {
    check.hidden = false;
    orderMultiplication.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; },
      onSubmit:() => { submitCurrentChallengeAnswer(); }
    });
  } else if (crossOperations.isType(question)) {
    check.hidden = false;
    check.textContent = 'Conferir cruzadinha';
    crossOperations.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; }
    });
  } else if (weightMissions.isType(question)) {
    check.hidden = false;
    weightMissions.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; },
      onSubmit:() => { submitCurrentChallengeAnswer(); }
    });
  } else if (tapeMissions.isType(question)) {
    check.hidden = false;
    check.textContent = 'Conferir medida';
    tapeMissions.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; }
    });
  } else if (jarMissions.isType(question)) {
    check.hidden = false;
    check.textContent = 'Pronto! Confirmar';
    jarMissions.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; }
    });
  } else if (arithmeticEnigmas.isType(question)) {
    check.hidden = false;
    arithmeticEnigmas.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; }
    });
  } else if (moneyMissions.isType(question)) {
    check.hidden = false;
    check.textContent = 'Confirmar';
    moneyMissions.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; }
    });
  } else if (regroupArithmetic.isType(question)) {
    check.hidden = false;
    regroupArithmetic.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; }
    });
  } else if (columnArithmetic.isType(question)) {
    check.hidden = false;
    columnArithmetic.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; }
    });
  } else if (subtractionCards.isType(question)) {
    check.hidden = question.type === 'subtract-review';
    check.textContent = 'CONFIRMAR';
    subtractionCards.render(question,options,{
      onChange:() => { document.querySelector('[data-challenge-feedback]').hidden = true; },
      onReady:ready => { check.disabled = !ready; },
      onVerdict:correct => { playAnswerSound(correct,false); },
      onComplete:result => { completeChallengeAnswer(result.correct,null,result); }
    });
  } else if (additionPuzzles.isType(question)) {
    additionPuzzles.render(question,options,() => {
      document.querySelector('[data-challenge-feedback]').hidden = true;
    });
    check.hidden = false;
  } else if (question.type === 'drag') {
    options.classList.add('drag-activity');
    options.innerHTML = `<p>Arraste ou toque nas cartas para montar a resposta:</p><div class="drag-source" data-drag-source>${question.items.map((item,index) => `<button type="button" draggable="true" data-drag-value="${escapeHTML(typeof item === 'object' ? item.value : item)}">${typeof item === 'object' && item.image ? `<img src="${item.image}" alt="${escapeHTML(item.alt || '')}">` : escapeHTML(item)}</button>`).join('')}</div><div class="drag-target" data-drag-answer><span>Solte as cartas aqui na ordem correta</span></div>`;
    check.hidden = false;
  } else if (question.type === 'column-addition') {
    delete question.lastAttempt;
    options.classList.add('column-addition-activity');
    options.innerHTML = columnAdditionMarkup(question);
    check.hidden = false;
  } else if (question.type === 'input') {
    options.classList.add('input-activity');
    options.innerHTML = `<label>Digite sua resposta<input type="text" inputmode="numeric" enterkeyhint="done" data-challenge-input autocomplete="off"></label>`;
    check.hidden = false;
  } else if (question.type === 'click') {
    options.innerHTML = question.options.map((option,index) => optionMarkup(option,index,'data-click-answer')).join('');
  } else {
    options.innerHTML = question.options.map((option,index) => optionMarkup(option,index)).join('');
    if (question.options.some(option => typeof option === 'object' && option.image)) options.classList.add('image-options');
  }
  document.querySelector('[data-challenge-feedback]').hidden = true;
  document.querySelector('[data-challenge-feedback]').classList.remove('is-error');
  document.querySelector('[data-retry-challenge]').hidden = true;
  document.querySelector('[data-next-challenge]').hidden = true;
  document.querySelector('[data-next-challenge]').textContent = 'Próxima questão →';
}

function completeChallengeAnswer(correct,selectedElement=null,reviewResult=null) {
  if (!missionSession) beginMissionSession(currentMissionIndex);
  const questions = activeQuestionSet();
  const question = questions[currentChallengeIndex % questions.length];
  const questionId = question.id || `trilha-${currentStudent.track}-questao-${currentChallengeIndex}`;
  if (reviewResult) currentQuestionAttempt = reviewResult.retried ? 1 : 0;
  const firstError = !correct && currentQuestionAttempt === 0 && !reviewResult;
  missionSession.attempts += reviewResult ? reviewResult.attempts : 1;
  if (reviewResult) {
    for (let error = 0; error < reviewResult.errors; error++) missionSession.errors.push(thirdGradeMissions[currentMissionIndex].title);
  }
  const feedback = document.querySelector('[data-challenge-feedback]'); feedback.hidden = Boolean(reviewResult); feedback.classList.toggle('is-error', !correct);
  document.querySelector('[data-feedback-icon]').textContent = correct ? '✓' : '×';
  if (selectedElement) {
    selectedElement.classList.remove(correct ? 'is-wrong' : 'is-correct');
    selectedElement.classList.add(correct ? 'is-correct' : 'is-wrong');
  }

  if (firstError) {
    currentQuestionAttempt = 1;
    if (selectedElement?.matches('[data-challenge-answer],[data-click-answer]')) selectedElement.disabled = true;
    const input = document.querySelector('[data-challenge-input]');
    if (question.type === 'column-addition') {
      if (input) input.disabled = true;
      document.querySelector('[data-check-challenge]').hidden = true;
      document.querySelector('[data-retry-challenge]').hidden = false;
    } else if (input) {
      input.value = '';
      input.focus();
    }
    document.querySelector('[data-feedback-copy]').textContent = challengeIncorrectFeedback(question,selectedElement);
    missionSession.errors.push(currentStudent.track === 3 ? thirdGradeMissions[currentMissionIndex].title : missionNames[currentStudent.track][Math.min(11,Math.floor(currentStudent.progress/8.34))]);
    playAnswerSound(false);
    return;
  }

  document.querySelectorAll('[data-challenge-answer],[data-click-answer],[data-drag-value]').forEach(option => option.disabled = true);
  const challengeInput = document.querySelector('[data-challenge-input]');
  if (challengeInput) challengeInput.disabled = true;
  if (additionPuzzles.isType(question)) additionPuzzles.lock();
  if (subtractionCards.isType(question)) subtractionCards.lock();
  if (columnArithmetic.isType(question)) columnArithmetic.lock();
  if (regroupArithmetic.isType(question)) regroupArithmetic.lock();
  if (moneyMissions.isType(question)) moneyMissions.lock();
  if (arithmeticEnigmas.isType(question)) arithmeticEnigmas.lock();
  if (jarMissions.isType(question)) jarMissions.lock();
  if (tapeMissions.isType(question)) tapeMissions.lock();
  if (weightMissions.isType(question)) weightMissions.lock();
  if (crossOperations.isType(question)) crossOperations.lock();
  if (orderMultiplication.isType(question)) orderMultiplication.lock();
  if (multiplicationGroups.isType(question)) multiplicationGroups.lock();
  if (divisionMissions.isType(question)) divisionMissions.lock();
  if (divisionCalculation.isType(question)) divisionCalculation.lock();
  document.querySelector('[data-retry-challenge]').hidden = true;
  document.querySelector('[data-check-challenge]').hidden = true;
  let questionReward = 0;
  if (correct && !currentStudent.completedQuestionIds.includes(questionId) && !missionSession.questionIds.has(questionId)) {
    questionReward = currentQuestionAttempt === 0 ? 50 : 25;
    missionSession.questionIds.add(questionId); missionSession.coins += questionReward; missionSession.correctAnswers += 1;
  }
  if (!correct && !reviewResult) {
    missionSession.errors.push(currentStudent.track === 3 ? thirdGradeMissions[currentMissionIndex].title : missionNames[currentStudent.track][Math.min(11,Math.floor(currentStudent.progress/8.34))]);
  }
  document.querySelector('[data-feedback-copy]').textContent = correct
    ? (arithmeticEnigmas.isType(question) ? arithmeticEnigmas.feedback : question.correct || 'Resposta certa!')
    : challengeIncorrectFeedback(question,selectedElement);
  if (!reviewResult) playAnswerSound(correct,false);
  const next = document.querySelector('[data-next-challenge]');
  next.hidden = false; next.textContent = currentChallengeIndex + 1 >= questions.length ? 'Concluir missão ✓' : 'Próxima questão →';
}

function answerChallenge(button) {
  const question = activeQuestionSet()[currentChallengeIndex % activeQuestionSet().length];
  const correct = button.dataset.challengeAnswer === question.answer;
  completeChallengeAnswer(correct,button);
}

function submitCurrentChallengeAnswer() {
  const question = activeQuestionSet()[currentChallengeIndex % activeQuestionSet().length];
  if (multiplicationGroups.isType(question)) {
    const result = multiplicationGroups.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (divisionCalculation.isType(question)) {
    const result = divisionCalculation.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (divisionMissions.isType(question)) {
    const result = divisionMissions.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (orderMultiplication.isType(question)) {
    const result = orderMultiplication.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (crossOperations.isType(question)) {
    const result = crossOperations.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (weightMissions.isType(question)) {
    const result = weightMissions.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (tapeMissions.isType(question)) {
    const result = tapeMissions.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (jarMissions.isType(question)) {
    const result = jarMissions.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (arithmeticEnigmas.isType(question)) {
    const result = arithmeticEnigmas.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (moneyMissions.isType(question)) {
    const result = moneyMissions.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (regroupArithmetic.isType(question)) {
    const result = regroupArithmetic.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (columnArithmetic.isType(question)) {
    const result = columnArithmetic.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (subtractionCards.isType(question)) {
    const result = subtractionCards.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (additionPuzzles.isType(question)) {
    const result = additionPuzzles.submit();
    if (!result?.complete) return false;
    completeChallengeAnswer(result.correct);
    return true;
  }
  if (question.type === 'column-addition') {
    const input = document.querySelector('[data-challenge-input]');
    const digit = input?.value.trim() || '';
    if (!/^\d$/.test(digit)) {
      input?.focus();
      return false;
    }
    const correct = digit === question.answer;
    const work = showColumnAdditionAttempt(question,digit,correct);
    question.lastAttempt = {digit,bottomText:work.bottomText,result:work.result};
    completeChallengeAnswer(correct,input);
    return true;
  }
  if (question.type === 'input') {
    const input = document.querySelector('[data-challenge-input]');
    if (!input?.value.trim()) {
      input?.focus();
      return false;
    }
    completeChallengeAnswer(
      input.value.trim().toLocaleLowerCase('pt-BR') === String(question.answer).toLocaleLowerCase('pt-BR'),
      input
    );
    return true;
  }
  if (question.type === 'drag') {
    const values = [...document.querySelectorAll('[data-drag-answer] [data-drag-value]')].map(item => item.dataset.dragValue);
    if (values.length !== question.answer.length) {
      window.alert('Coloque todas as cartas na área de resposta.');
      return false;
    }
    completeChallengeAnswer(
      values.every((value,index) => value === String(question.answer[index])),
      document.querySelector('[data-drag-answer]')
    );
    return true;
  }
  return false;
}

function advanceCurrentChallenge() {
  const questions = activeQuestionSet();
  if (currentChallengeIndex + 1 >= questions.length) {
    finishMissionSession();
    renderStudentDashboard();
    setStudentView('result');
  } else {
    currentChallengeIndex += 1;
    renderChallenge();
  }
}

function renderMiniCollection() {
  const owned = currentStudent.journal.map(id => spaceItems.find(item => item.id === id) || worldJournalItems.find(item => item.id === id)).filter(Boolean);
  document.querySelector('[data-mini-collection]').innerHTML = owned.length ? owned.slice(-4).map(item => `<span title="${escapeHTML(item.name || item.title)}">${item.image ? `<img src="${item.image}" alt="${escapeHTML(item.title)}" />` : item.emoji}</span>`).join('') : '<em>Seu diário ainda está vazio.</em>';
}

function isWorldUnlocked(world,student=currentStudent) {
  return Boolean(student && world && (!world.unlockStars || student.unlockedWorldIds?.includes(world.id)));
}

function unlockWorld(id) {
  const world = worldAccessDestinations.find(entry => entry.id === id);
  if (!currentStudent || !world) return {status:'unavailable'};
  if (isWorldUnlocked(world)) return {status:'owned',world};
  const missing = Math.max(0,world.unlockStars - currentStudent.stars);
  if (missing) return {status:'insufficient',world,missing};
  currentStudent.stars -= world.unlockStars;
  currentStudent.unlockedWorldIds.push(world.id);
  saveStudentWorkspace();
  renderStudentDashboard();
  playSound('reward');
  return {status:'purchased',world};
}

function getJournalProgress(student=currentStudent) {
  const completedWorldIds = student ? worldDiscoveries.filter(world => {
    const items = worldJournalItems.filter(item => item.worldId === world.id);
    return items.length && items.every(item => student.journal.includes(item.id));
  }).map(world => world.id) : [];
  const level = Math.min(worldJournalRanks.length,completedWorldIds.length + 1);
  return {xp:completedWorldIds.length,level,title:worldJournalRanks[level - 1],completedWorldIds};
}

function purchaseWorldDiscovery(id) {
  const item = worldJournalItems.find(entry => entry.id === id);
  if (!currentStudent || !item) return {status:'unavailable'};
  if (currentStudent.journal.includes(item.id)) return {status:'owned',item};
  const world = worldDiscoveries.find(entry => entry.id === item.worldId);
  if (!isWorldUnlocked(world)) return {status:'world-locked',item,world};
  if (currentStudent.coins < item.price) return {status:'insufficient',item,missing:item.price - currentStudent.coins};
  currentStudent.coins -= item.price;
  currentStudent.journal.push(item.id);
  saveStudentWorkspace();
  renderStudentDashboard();
  playSound('reward');
  return {status:'purchased',item};
}

function avatarHairPath(config=currentStudent.avatarConfig) {
  const style = avatarHairStyles[config.hairStyle] || avatarHairStyles[0];
  const color = avatarHairColors[config.hairColor] || avatarHairColors[0];
  return `${avatarAssetRoot}/avatar-cabelos-cores/${style.file}-${color.slug}.png`;
}

function avatarLayer(path) {
  return path ? `<img class="orbita-avatar__layer" src="${escapeHTML(path)}" alt="">` : '';
}

function avatarComposite(config=currentStudent.avatarConfig) {
  const skin = avatarSkinTones[config.skin] || avatarSkinTones[0];
  const face = avatarFaces[config.face] || avatarFaces[0];
  const top = avatarTops[config.top] || avatarTops[0];
  const bottom = avatarBottoms[config.bottom] || avatarBottoms[0];
  const shoes = avatarShoes[config.shoes] || avatarShoes[0];
  const hairAccessory = avatarHairAccessories[config.hairAccessory] || avatarHairAccessories[0];
  const glasses = avatarGlasses[config.glasses] || avatarGlasses[0];
  const bag = avatarBags[config.bag] || avatarBags[0];
  const earrings = avatarEarrings[config.earrings] || avatarEarrings[0];
  const layers = [
    skin.path,
    bottom.path,
    top.path,
    shoes.path,
    face.path,
    avatarHairPath(config),
    earrings.path,
    glasses.path,
    hairAccessory.path,
    bag.path
  ];
  return `<div class="orbita-avatar" aria-hidden="true">${layers.map(avatarLayer).join('')}</div>`;
}

function avatarDisplayName() {
  return currentStudent.avatarName.trim() || 'Meu avatar';
}

function renderAvatarName() {
  const displayName = avatarDisplayName();
  document.querySelector('[data-avatar-item-name]').textContent = displayName;
  document.querySelectorAll('[data-avatar]').forEach(container => {
    container.setAttribute('aria-label', `Avatar ${displayName}`);
  });
}

function renderAvatarInstances() {
  document.querySelectorAll('[data-avatar]').forEach(container => {
    container.innerHTML = avatarComposite();
  });
  renderAvatarName();
}

function avatarChoiceButton(group,index,label,visual) {
  const active = currentStudent.avatarConfig[group] === index;
  return `<button type="button" class="avatar-choice ${active ? 'is-active' : ''}" data-avatar-choice="${group}" data-avatar-value="${index}" aria-pressed="${active}" aria-label="${escapeHTML(label)}">${visual}<span>${escapeHTML(label)}</span></button>`;
}

function avatarPreviewPath(path) {
  const filename = path.split('/').pop();
  const folder = path.includes('/avatar-cabelos-cores/') ? 'cabelos'
    : path.includes('/avatar-rostos/') ? 'rostos'
      : path.includes('/avatar-roupas/') ? 'roupas'
        : path.includes('/avatar-sapatos/') ? 'sapatos'
          : path.includes('/avatar-acessorios/') ? 'acessorios'
            : '';
  return folder ? `${avatarAssetRoot}/avatar-previews/${folder}/${filename}` : path;
}

function avatarImageChoice(item,previewClass='') {
  return item.path
    ? `<i class="avatar-choice__art" aria-hidden="true"><img class="avatar-choice__image ${previewClass}" src="${escapeHTML(avatarPreviewPath(item.path))}" alt=""></i>`
    : '<i class="avatar-choice__art" aria-hidden="true"><b class="avatar-choice__none">×</b></i>';
}

function renderAvatarShop() {
  const config = currentStudent.avatarConfig;
  const selectedHairColor = avatarHairColors[config.hairColor] || avatarHairColors[0];
  document.querySelector('[data-avatar-shop]').innerHTML = `
    <section class="avatar-control-group avatar-name-control">
      <h3>Dê um nome ao seu avatar</h3>
      <form class="avatar-name-form" data-avatar-name-form>
        <label for="avatar-name">Nome do avatar</label>
        <div><input id="avatar-name" name="avatarName" maxlength="24" autocomplete="off" value="${escapeHTML(currentStudent.avatarName)}" placeholder="Ex.: Luna Estelar"><button type="submit">Salvar nome</button></div>
        <p data-avatar-name-feedback aria-live="polite">Até 24 caracteres.</p>
      </form>
    </section>
    <section class="avatar-control-group"><h3>Tom de pele</h3><div class="avatar-choice-grid skin-choices">${avatarSkinTones.map((item,index) => avatarChoiceButton('skin',index,item.name,`<i style="--choice-color:${item.color}"></i>`)).join('')}</div></section>
    <section class="avatar-control-group"><h3>Rosto</h3><div class="avatar-choice-grid">${avatarFaces.map((item,index) => avatarChoiceButton('face',index,item.name,avatarImageChoice(item,'avatar-choice__image--face'))).join('')}</div></section>
    <section class="avatar-control-group"><h3>Cor do cabelo</h3><div class="avatar-choice-grid hair-color-choices">${avatarHairColors.map((item,index) => avatarChoiceButton('hairColor',index,item.name,`<i style="--choice-color:${item.color}"></i>`)).join('')}</div></section>
    <section class="avatar-control-group"><h3>Estilo do cabelo</h3><div class="avatar-choice-grid">${avatarHairStyles.map((item,index) => avatarChoiceButton('hairStyle',index,item.name,avatarImageChoice({path:`${avatarAssetRoot}/avatar-cabelos-cores/${item.file}-${selectedHairColor.slug}.png`},'avatar-choice__image--hair'))).join('')}</div></section>
    <section class="avatar-control-group"><h3>Parte de cima</h3><div class="avatar-choice-grid">${avatarTops.map((item,index) => avatarChoiceButton('top',index,item.name,avatarImageChoice(item,'avatar-choice__image--top'))).join('')}</div></section>
    <section class="avatar-control-group"><h3>Parte de baixo</h3><div class="avatar-choice-grid">${avatarBottoms.map((item,index) => avatarChoiceButton('bottom',index,item.name,avatarImageChoice(item,'avatar-choice__image--bottom'))).join('')}</div></section>
    <section class="avatar-control-group"><h3>Calçados</h3><div class="avatar-choice-grid">${avatarShoes.map((item,index) => avatarChoiceButton('shoes',index,item.name,avatarImageChoice(item,'avatar-choice__image--shoes'))).join('')}</div></section>
    <section class="avatar-control-group"><h3>Acessórios de cabelo <small>Bonés e presilhas</small></h3><div class="avatar-choice-grid">${avatarHairAccessories.map((item,index) => avatarChoiceButton('hairAccessory',index,item.name,avatarImageChoice(item,'avatar-choice__image--hair-accessory'))).join('')}</div></section>
    <section class="avatar-control-group"><h3>Óculos</h3><div class="avatar-choice-grid">${avatarGlasses.map((item,index) => avatarChoiceButton('glasses',index,item.name,avatarImageChoice(item,'avatar-choice__image--glasses'))).join('')}</div></section>
    <section class="avatar-control-group"><h3>Bolsas</h3><div class="avatar-choice-grid">${avatarBags.map((item,index) => avatarChoiceButton('bag',index,item.name,avatarImageChoice(item,'avatar-choice__image--bag'))).join('')}</div></section>
    <section class="avatar-control-group"><h3>Brincos <small>4 cores</small></h3><div class="avatar-choice-grid">${avatarEarrings.map((item,index) => avatarChoiceButton('earrings',index,item.name,avatarImageChoice(item,'avatar-choice__image--earrings'))).join('')}</div></section>`;
  renderAvatarName();
}

function renderStudentProgress() {
  const completed = currentStudent.track === 3
    ? thirdGradeMissions.filter(mission => currentStudent.completedMissionIds.includes(mission.missionId)).length
    : Math.min(12,Math.floor(currentStudent.progress/8.34));
  const total = currentStudent.track === 3 ? thirdGradeMissions.length : 12;
  const progress = currentStudent.track === 3 ? Math.round(completed / total * 100) : currentStudent.progress;
  document.querySelector('[data-progress-ring]').style.setProperty('--progress',`${progress}%`);
  document.querySelector('[data-progress-ring-value]').textContent = `${progress}%`;
  document.querySelector('[data-progress-message]').textContent = progress >= 80 ? 'Você está brilhando!' : progress >= 40 ? 'Continue avançando!' : 'Sua aventura começou!';
  document.querySelector('[data-progress-description]').textContent = `Você concluiu ${completed} de ${total} missões da trilha do ${currentStudent.track}º ano.`;
  document.querySelector('[data-achievement-stars]').textContent = `${currentStudent.stars} estrelas`;
  document.querySelector('[data-achievement-coins]').textContent = `${currentStudent.coins} moedas`;
  document.querySelector('[data-achievement-missions]').textContent = `${completed} missões`;
  document.querySelector('[data-achievement-journal]').textContent = `${currentStudent.journal.length} descobertas`;
  const journalProgress = getJournalProgress();
  document.querySelector('[data-achievement-xp]').textContent = `${journalProgress.xp} XP · Nível ${journalProgress.level}`;
  document.querySelector('[data-achievement-rank]').textContent = journalProgress.title;
}

document.addEventListener('click', event => {
  const fullscreen = event.target.closest('[data-fullscreen]');
  if (fullscreen) { toggleFullscreen(fullscreen); return; }
  const go = event.target.closest('[data-go]');
  if (go) {
    if (go.dataset.intent) state.intent = go.dataset.intent;
    showScreen(go.dataset.go);
    return;
  }
  const back = event.target.closest('[data-back]');
  if (back) { showScreen(back.dataset.back); return; }
  const role = event.target.closest('[data-role]');
  if (role) { state.role = role.dataset.role; showScreen('form'); return; }
  if (event.target.closest('[data-toggle-intent]')) {
    state.intent = state.intent === 'register' ? 'login' : 'register';
    state.screen === 'form' ? renderForm() : renderIntent();
    return;
  }
  const toggle = event.target.closest('.password-toggle');
  if (toggle) {
    const input = toggle.parentElement.querySelector('input');
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    toggle.textContent = showing ? 'Mostrar' : 'Ocultar';
    toggle.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
  }
  const sound = event.target.closest('.sound-button');
  if (sound) {
    const enable = !soundEnabled;
    setSoundEnabled(enable);
    if (enable) playSound('ui');
    return;
  }
});

document.addEventListener('click', event => {
  const navButton = event.target.closest('[data-admin-view]');
  if (navButton) { setAdminView(navButton.dataset.adminView); return; }
  if (event.target.closest('[data-admin-menu]')) {
    document.querySelector('.admin-screen').classList.toggle('menu-open');
    return;
  }
  if (event.target.closest('[data-admin-logout]')) {
    state.intent = 'login'; state.role = 'student'; showScreen('home'); return;
  }
  if (event.target.closest('[data-add-teacher]')) { openTeacherModal(); return; }
  if (event.target.closest('[data-close-modal]')) {
    document.querySelector('[data-teacher-modal]').hidden = true; return;
  }

  const approve = event.target.closest('[data-approve]');
  if (approve) {
    const id = Number(approve.dataset.approve);
    const request = adminData.pending.find(item => item.id === id);
    if (request) {
      adminData.teachers.push({...request, id: Date.now(), classes: 0});
      adminData.pending = adminData.pending.filter(item => item.id !== id);
      const account = teacherAccounts.find(item => item.email === request.email);
      if (account) account.status = 'active';
      saveTeacherAccounts();
      saveAdminData(); renderApprovals(); renderTeachers();
    }
    return;
  }
  const reject = event.target.closest('[data-reject]');
  if (reject) {
    const id = Number(reject.dataset.reject);
    const request = adminData.pending.find(item => item.id === id);
    const account = teacherAccounts.find(item => item.email === request?.email);
    if (account) account.status = 'rejected';
    saveTeacherAccounts();
    adminData.pending = adminData.pending.filter(item => item.id !== id);
    saveAdminData(); renderApprovals(); return;
  }
  const edit = event.target.closest('[data-edit-teacher]');
  if (edit) {
    openTeacherModal(adminData.teachers.find(item => item.id === Number(edit.dataset.editTeacher)));
    return;
  }
  const remove = event.target.closest('[data-delete-teacher]');
  if (remove) {
    const id = Number(remove.dataset.deleteTeacher);
    const teacher = adminData.teachers.find(item => item.id === id);
    if (teacher && window.confirm(`Excluir o cadastro de ${teacher.name}?`)) {
      adminData.teachers = adminData.teachers.filter(item => item.id !== id);
      const account = teacherAccounts.find(item => item.email === teacher.email);
      if (account) account.status = 'disabled';
      saveTeacherAccounts();
      saveAdminData(); renderTeachers();
    }
    return;
  }
  if (event.target.closest('[data-export-report]')) {
    const rows = [['Indicador','Valor'],['Estudantes ativos','105'],['Professores',adminData.teachers.length],['Atividades concluídas','2847'],['Taxa média de acerto','81%']];
    const csv = rows.map(row => row.join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = 'relatorio-orbita.csv'; link.click(); URL.revokeObjectURL(url);
  }
});

document.addEventListener('click', event => {
  const navButton = event.target.closest('[data-teacher-view]');
  if (navButton) { setTeacherView(navButton.dataset.teacherView); return; }
  if (event.target.closest('[data-teacher-menu]')) { document.querySelector('.teacher-screen').classList.toggle('menu-open'); return; }
  if (event.target.closest('[data-teacher-logout]')) {
    state.teacherEmail = ''; teacherData = null; state.intent = 'login'; showScreen('home'); return;
  }
  if (event.target.closest('[data-add-class]')) {
    const form = document.querySelector('#class-form'); form.reset(); form.elements.code.value = generateCode(1);
    document.querySelector('[data-class-modal]').hidden = false; form.elements.name.focus(); return;
  }
  if (event.target.closest('[data-close-class-modal]')) { document.querySelector('[data-class-modal]').hidden = true; return; }
  if (event.target.closest('[data-add-student]')) {
    if (!teacherData.classes.length) { window.alert('Cadastre uma turma antes de adicionar estudantes.'); return; }
    renderTeacherClasses(); const form = document.querySelector('#student-form'); form.reset();
    const selectedClass = teacherData.classes[0]; form.elements.classId.value = selectedClass.id; form.elements.track.value = selectedClass.grade;
    document.querySelector('[data-student-modal]').hidden = false; form.elements.name.focus(); return;
  }
  if (event.target.closest('[data-close-student-modal]')) { document.querySelector('[data-student-modal]').hidden = true; return; }
  const deleteClass = event.target.closest('[data-delete-class]');
  if (deleteClass) {
    const id = Number(deleteClass.dataset.deleteClass); const classroom = teacherData.classes.find(item => item.id === id);
    const members = teacherData.students.filter(item => item.classId === id).length;
    if (classroom && window.confirm(`Excluir a turma ${classroom.name}${members ? ` e seus ${members} estudantes` : ''}?`)) {
      teacherData.classes = teacherData.classes.filter(item => item.id !== id);
      teacherData.students = teacherData.students.filter(item => item.classId !== id);
      saveTeacherData(); renderTeacherDashboard();
    }
    return;
  }
  const deleteStudent = event.target.closest('[data-delete-student]');
  if (deleteStudent) {
    const id = Number(deleteStudent.dataset.deleteStudent); const student = teacherData.students.find(item => item.id === id);
    if (student && window.confirm(`Excluir o cadastro de ${student.name}?`)) {
      teacherData.students = teacherData.students.filter(item => item.id !== id); saveTeacherData(); renderTeacherDashboard();
    }
    return;
  }
  const resetStudent = event.target.closest('[data-reset-student]');
  if (resetStudent) {
    const student = teacherData.students.find(item => item.id === Number(resetStudent.dataset.resetStudent));
    if (student && window.confirm(`Gerar um novo código de acesso para ${student.name}?`)) {
      student.accessCode = `ALU-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
      saveTeacherData(); renderTeacherStudents(); window.alert(`Novo código: ${student.accessCode}`);
    }
    return;
  }
  if (event.target.closest('[data-export-teacher-report]')) {
    const rows = [['Estudante','Turma','Trilha','Progresso','Erros']];
    teacherData.students.forEach(student => { const classroom = teacherData.classes.find(item => item.id === student.classId); rows.push([student.name,classroom?.name || '',trackName(student.track),`${student.progress}%`,student.errors.join(', ')]); });
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"','""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})); const link = document.createElement('a'); link.href=url; link.download='relatorio-turmas-orbita.csv'; link.click(); URL.revokeObjectURL(url);
  }
});

document.addEventListener('click', event => {
  const navButton = event.target.closest('[data-student-view]');
  if (navButton) { setStudentView(navButton.dataset.studentView); return; }
  if (event.target.closest('[data-student-menu]')) {
    document.querySelector('.student-screen').classList.toggle('menu-open'); return;
  }
  if (event.target.closest('[data-student-logout]')) {
    if (memoryFlipTimer) { clearTimeout(memoryFlipTimer); memoryFlipTimer = null; }
    if (rockyMemoryFlipTimer) { clearTimeout(rockyMemoryFlipTimer); rockyMemoryFlipTimer = null; }
    if (planetRouletteTimer) { clearTimeout(planetRouletteTimer); planetRouletteTimer = null; }
    clearConstellationTimers();
    clearMeteorTimers();
    clearSolarPuzzleState();
    currentStudent = null; studentWorkspace = null; state.studentStorageKey = '';
    memoryBonusState = null; rockyMemoryBonusState = null; planetRouletteState = null; constellationBonusState = null; meteorBonusState = null; solarPuzzleState = null; currentChallengeIndex = 0; currentMissionIndex = 0; state.intent = 'login'; state.role = 'student'; showScreen('home'); return;
  }
  if (event.target.closest('[data-open-memory-bonus]')) { startMemoryBonus(); return; }
  if (event.target.closest('[data-restart-memory-bonus]')) { restartMemoryBonus(); return; }
  if (event.target.closest('[data-close-memory-bonus]')) { renderStudentDashboard(); setStudentView('home'); return; }
  if (event.target.closest('[data-open-rocky-memory-bonus]')) { startRockyMemoryBonus(); return; }
  if (event.target.closest('[data-restart-rocky-memory-bonus]')) { restartRockyMemoryBonus(); return; }
  if (event.target.closest('[data-close-rocky-memory-bonus]')) { renderStudentDashboard(); setStudentView('home'); return; }
  if (event.target.closest('[data-open-planet-roulette]')) { startPlanetRoulette(); return; }
  if (event.target.closest('[data-spin-planet-roulette]')) { spinPlanetRoulette(); return; }
  if (event.target.closest('[data-close-planet-roulette]')) { renderStudentDashboard(); setStudentView('home'); return; }
  if (event.target.closest('[data-open-constellation-bonus]')) { startConstellationBonus(); return; }
  if (event.target.closest('[data-close-constellation-bonus]')) { closeConstellationBonus(); return; }
  if (event.target.closest('[data-open-meteor-bonus]')) { startMeteorBonus(); return; }
  if (event.target.closest('[data-close-meteor-bonus]')) { closeMeteorBonus(); return; }
  if (event.target.closest('[data-open-solar-puzzle]')) { startSolarPuzzle(); return; }
  if (event.target.closest('[data-close-solar-puzzle]')) { closeSolarPuzzle(); return; }
  if (event.target.closest('[data-check-solar-puzzle]')) { checkSolarPuzzle(); return; }
  if (event.target.closest('[data-resume-luck-round]')) { startLuckRound(pendingLuckRound()?.challengeId); return; }
  if (event.target.closest('[data-start-result-bonus]')) {
    startLuckRound();
    return;
  }
  if (event.target.closest('[data-result-path],[data-result-explore]')) {
    const view = event.target.closest('[data-result-explore]') ? 'explore' : 'path';
    missionResultState = null; bonusResultState = null;
    renderStudentDashboard(); setStudentView(view); return;
  }
  if (event.target.closest('[data-result-next-mission]')) {
    const nextMissionIndex = nextAvailableMissionIndex();
    if (nextMissionIndex >= 0) {
      abandonMissionSession(); beginMissionSession(nextMissionIndex); setStudentView('challenge');
    } else {
      missionResultState = null; bonusResultState = null; renderStudentDashboard(); setStudentView('home');
    }
    return;
  }
  const memoryCard = event.target.closest('[data-memory-card]');
  if (memoryCard) { chooseMemoryCard(memoryCard); return; }
  const rockyMemoryCard = event.target.closest('[data-rocky-memory-card]');
  if (rockyMemoryCard) { chooseRockyMemoryCard(rockyMemoryCard); return; }
  const constellationCard = event.target.closest('[data-constellation-card]');
  if (constellationCard && !constellationCard.disabled) { chooseConstellationCard(constellationCard); return; }
  const meteorCup = event.target.closest('[data-meteor-cup]');
  if (meteorCup && !meteorCup.disabled) { chooseMeteorCup(meteorCup); return; }
  const puzzlePiece = event.target.closest('[data-puzzle-piece]');
  if (puzzlePiece) {
    if (suppressSolarPuzzleClick) return;
    selectSolarPuzzlePiece(Number(puzzlePiece.dataset.puzzlePiece));
    return;
  }
  const puzzleSlot = event.target.closest('[data-puzzle-slot]');
  if (puzzleSlot) {
    activateSolarPuzzleSlot(Number(puzzleSlot.dataset.puzzleSlot));
    return;
  }
  const startChallenge = event.target.closest('[data-start-challenge]');
  if (startChallenge) {
    const missionIndex = currentStudent.track === 3 && startChallenge.dataset.studentMission !== undefined
      ? Number(startChallenge.dataset.studentMission) : currentMissionIndex;
    abandonMissionSession(); beginMissionSession(missionIndex);
    setStudentView('challenge'); return;
  }
  if (event.target.closest('[data-open-logbook]')) { setStudentView('logbook'); return; }
  if (event.target.closest('[data-speak-question]')) {
    const question = activeQuestionSet()[currentChallengeIndex % activeQuestionSet().length];
    speakText(orderMultiplication.spokenQuestion || arithmeticEnigmas.spokenQuestion || moneyMissions.spokenQuestion || regroupArithmetic.spokenQuestion || columnArithmetic.spokenQuestion || subtractionCards.spokenQuestion || question.spokenText || document.querySelector('[data-challenge-question]').textContent); return;
  }
  if (event.target.closest('[data-speak-feedback]')) {
    speakText(document.querySelector('[data-feedback-copy]').textContent); return;
  }
  if (event.target.closest('[data-speak-subtraction-review]')) {
    const feedback = event.target.closest('[data-review-feedback]');
    speakText([...feedback.querySelectorAll('strong,p')].map(element => element.textContent).join(' ')); return;
  }
  if (event.target.closest('[data-retry-challenge]')) {
    const question = activeQuestionSet()[currentChallengeIndex % activeQuestionSet().length];
    resetColumnAdditionAttempt(question);
    return;
  }

  const missionTab = event.target.closest('[data-select-mission]');
  if (missionTab) { abandonMissionSession(); beginMissionSession(Number(missionTab.dataset.selectMission)); renderChallenge(); window.platformUI?.navigate(); return; }
  if (event.target.closest('[data-begin-questions]')) {
    challengeStage = 'questions';
    const player = document.querySelector('[data-lesson-video-player]');
    if (player) player.pause();
    renderChallenge();
    return;
  }

  const answer = event.target.closest('[data-challenge-answer]');
  if (moneyMissions.handleClick(event)) return;
  if (regroupArithmetic.handleClick(event)) return;
  if (additionPuzzles.handleClick(event)) return;
  if (subtractionCards.handleClick(event)) return;
  if (answer && !answer.disabled) { answerChallenge(answer); return; }
  const clickAnswer = event.target.closest('[data-click-answer]');
  if (clickAnswer && !clickAnswer.disabled) {
    const question = activeQuestionSet()[currentChallengeIndex % activeQuestionSet().length];
    completeChallengeAnswer(clickAnswer.dataset.clickAnswer === question.answer,clickAnswer); return;
  }
  const dragCard = event.target.closest('[data-drag-value]');
  if (dragCard && !dragCard.disabled) {
    const source = document.querySelector('[data-drag-source]');
    const target = document.querySelector('[data-drag-answer]');
    (dragCard.parentElement === source ? target : source).appendChild(dragCard);
    target.querySelector('span')?.remove(); return;
  }
  if (event.target.closest('[data-check-challenge]')) {
    submitCurrentChallengeAnswer();
    return;
  }
  if (event.target.closest('[data-next-challenge]')) {
    advanceCurrentChallenge();
    return;
  }

  const avatarChoice = event.target.closest('[data-avatar-choice]');
  if (avatarChoice) {
    const group = avatarChoice.dataset.avatarChoice;
    if (['skin','face','hairStyle','hairColor','top','bottom','shoes','hairAccessory','glasses','bag','earrings'].includes(group)) {
      currentStudent.avatarConfig[group] = Number(avatarChoice.dataset.avatarValue);
      saveStudentWorkspace(); renderAvatarShop(); renderAvatarInstances();
    }
  }
});

document.addEventListener('submit', event => {
  const form = event.target.closest('[data-avatar-name-form]');
  if (!form || !currentStudent) return;
  event.preventDefault();
  const input = form.elements.avatarName;
  const feedback = form.querySelector('[data-avatar-name-feedback]');
  const avatarName = input.value.trim().replace(/\s+/g,' ').slice(0,24);
  if (!avatarName) {
    feedback.textContent = 'Digite um nome para o seu avatar.';
    input.focus();
    return;
  }
  currentStudent.avatarName = avatarName;
  input.value = avatarName;
  saveStudentWorkspace();
  renderAvatarName();
  feedback.textContent = 'Nome salvo!';
});

document.addEventListener('pointerdown', event => {
  const piece = event.target.closest('[data-puzzle-piece]');
  if (!piece || !solarPuzzleState || solarPuzzleState.phase !== 'playing') return;
  solarPuzzlePointerDrag = {
    pointerId:event.pointerId,
    pieceId:Number(piece.dataset.puzzlePiece),
    element:piece,
    startX:event.clientX,
    startY:event.clientY,
    moved:false
  };
  piece.setPointerCapture?.(event.pointerId);
});

document.addEventListener('pointermove', event => {
  const drag = solarPuzzlePointerDrag;
  if (!drag || drag.pointerId !== event.pointerId) return;
  const x = event.clientX - drag.startX;
  const y = event.clientY - drag.startY;
  if (!drag.moved && Math.hypot(x,y) < 5) return;
  drag.moved = true;
  event.preventDefault();
  drag.element.classList.add('is-dragging');
  drag.element.style.transform = `translate(${x}px,${y}px) scale(1.04)`;
});

function finishSolarPuzzlePointerDrag(event) {
  const drag = solarPuzzlePointerDrag;
  if (!drag || drag.pointerId !== event.pointerId) return;
  const slot = drag.moved && event.type === 'pointerup'
    ? document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-puzzle-slot]')
    : null;
  drag.element.releasePointerCapture?.(event.pointerId);
  drag.element.classList.remove('is-dragging');
  drag.element.style.transform = '';
  if (drag.moved && event.type === 'pointerup') {
    event.preventDefault();
    if (slot) placeSolarPuzzlePiece(drag.pieceId,Number(slot.dataset.puzzleSlot));
    suppressSolarPuzzleClick = true;
    setTimeout(() => { suppressSolarPuzzleClick = false; },0);
  }
  solarPuzzlePointerDrag = null;
}

document.addEventListener('pointerup',finishSolarPuzzlePointerDrag);
document.addEventListener('pointercancel',finishSolarPuzzlePointerDrag);

document.addEventListener('keydown', event => {
  if (moneyMissions.handleKeydown(event)) return;
  if (regroupArithmetic.handleKeydown(event)) return;
  if (columnArithmetic.handleKeydown(event)) return;
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

  const puzzleSlot = event.target.closest('[data-puzzle-slot]');
  if ((event.key === 'Enter' || event.key === ' ') && puzzleSlot && state.screen === 'student' && solarPuzzleState?.phase === 'playing') {
    event.preventDefault();
    activateSolarPuzzleSlot(Number(puzzleSlot.dataset.puzzleSlot));
    return;
  }

  if (event.key !== 'Enter') return;

  const authForm = event.target.closest('#auth-form');
  const isLoginAccessField = state.intent === 'login' && (
    event.target.matches('input[name="password"]') ||
    (state.role === 'student' && event.target.matches('input[name="code"]'))
  );
  if (authForm && isLoginAccessField) {
    event.preventDefault();
    authForm.requestSubmit();
    return;
  }

  if (state.screen !== 'student') return;
  const challengeSection = document.querySelector('[data-student-section="challenge"]');
  const questionScreen = document.querySelector('[data-question-screen]');
  if (!challengeSection || challengeSection.hidden || !questionScreen || questionScreen.hidden) return;

  const nextButton = document.querySelector('[data-next-challenge]');
  if (nextButton && !nextButton.hidden) {
    event.preventDefault();
    advanceCurrentChallenge();
    return;
  }

  if (event.target.matches('[data-challenge-input],[data-sum-square-cell],[data-column-digit],[data-regroup-answer],[data-regroup-record],[data-money-amount],[data-enigma-input]')) {
    event.preventDefault();
    submitCurrentChallengeAnswer();
  }
});

document.addEventListener('dragstart', event => {
  const card = event.target.closest('[data-drag-value]');
  if (!card || card.disabled) return;
  draggedChallengeCard = card;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain',card.dataset.dragValue);
});
document.addEventListener('dragover', event => {
  if (event.target.closest('[data-drag-source],[data-drag-answer]')) event.preventDefault();
});
document.addEventListener('drop', event => {
  const area = event.target.closest('[data-drag-source],[data-drag-answer]');
  if (!area || !draggedChallengeCard) return;
  event.preventDefault(); area.appendChild(draggedChallengeCard);
  document.querySelector('[data-drag-answer] span')?.remove(); draggedChallengeCard = null;
});

document.querySelector('#class-form').addEventListener('change', event => {
  if (event.target.name === 'grade') event.currentTarget.elements.code.value = generateCode(event.target.value);
});
document.querySelector('#class-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
  teacherData.classes.push({id:Date.now(),name:values.name.trim(),grade:Number(values.grade),code:values.code.trim().toUpperCase()});
  saveTeacherData(); renderTeacherDashboard(); document.querySelector('[data-class-modal]').hidden = true;
});
document.querySelector('#student-form').addEventListener('change', event => {
  if (event.target.name === 'classId') { const classroom = teacherData.classes.find(item => item.id === Number(event.target.value)); if (classroom) event.currentTarget.elements.track.value = classroom.grade; }
});
document.querySelector('#student-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
  teacherData.students.push({id:Date.now(),name:values.name.trim(),classId:Number(values.classId),track:Number(values.track),progress:0,errors:[],lastAccess:'Ainda não acessou'});
  saveTeacherData(); renderTeacherDashboard(); document.querySelector('[data-student-modal]').hidden = true;
});
document.querySelector('[data-report-type]').addEventListener('change', renderTeacherReport);
document.querySelector('[data-report-student]').addEventListener('change', renderTeacherReport);

document.querySelector('#teacher-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  const id = Number(values.id);
  if (id) {
    const teacher = adminData.teachers.find(item => item.id === id);
    if (teacher) Object.assign(teacher, {name:values.name.trim(), email:values.email.trim(), school:values.school.trim()});
  } else {
    const teacherId = Date.now();
    const email = values.email.trim().toLowerCase();
    adminData.teachers.push({id:teacherId, name:values.name.trim(), email, school:values.school.trim(), classes:0});
    teacherAccounts = teacherAccounts.filter(item => item.email !== email);
    teacherAccounts.push({id:teacherId,name:values.name.trim(),email,passwordHash:await sha256(values.password),status:'active'});
    saveTeacherAccounts();
  }
  saveAdminData(); renderTeachers();
  document.querySelector('[data-teacher-modal]').hidden = true;
});

document.addEventListener('focusout',event => moneyMissions.handleBlur(event));

document.addEventListener('input', event => {
  arithmeticEnigmas.handleInput(event);
  additionPuzzles.handleInput(event);
  subtractionCards.handleInput(event);
  columnArithmetic.handleInput(event);
  regroupArithmetic.handleInput(event);
  moneyMissions.handleInput(event);
  if (event.target.name === 'code') event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,'');
  if (event.target.matches('[data-column-addition] [data-challenge-input]')) {
    event.target.value = event.target.value.replace(/\D/g,'').slice(-1);
    event.target.classList.remove('is-correct','is-wrong');
  }
  const fieldEl = event.target.closest('.field');
  if (fieldEl) {
    fieldEl.classList.remove('has-error');
    event.target.removeAttribute('aria-invalid');
  }
});

document.querySelector('#auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  let valid = true;
  form.querySelectorAll('input[required]').forEach(input => {
    const emailInvalid = input.type === 'email' && !/^\S+@\S+\.\S+$/.test(input.value);
    const passwordInvalid = input.name === 'password' && state.intent === 'register' && input.value.length < 8;
    const invalid = !input.value.trim() || emailInvalid || passwordInvalid;
    input.closest('.field').classList.toggle('has-error', invalid);
    input.setAttribute('aria-invalid', String(invalid));
    if (invalid) valid = false;
  });
  const password = form.querySelector('[name="password"]');
  const confirm = form.querySelector('[name="confirm"]');
  if (confirm && password && confirm.value !== password.value) {
    confirm.closest('.field').classList.add('has-error');
    confirm.setAttribute('aria-invalid','true');
    confirm.closest('.field').querySelector('.field__error').textContent = 'As senhas precisam ser iguais.';
    valid = false;
  }
  const terms = form.querySelector('[name="terms"]');
  if (state.intent === 'register' && terms && !terms.checked) {
    document.querySelector('.form-message').textContent = 'Confirme que leu as informações sobre cadastro e armazenamento dos dados.';
    valid = false;
  } else document.querySelector('.form-message').textContent = '';
  if (!valid) {
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  if (state.role === 'teacher' && state.intent === 'register') {
    const email = form.querySelector('[name="email"]').value.trim().toLowerCase();
    if (teacherAccounts.some(item => item.email === email && item.status !== 'rejected')) {
      document.querySelector('.form-message').textContent = 'Já existe uma solicitação ou conta com este e-mail.';
      return;
    }
    const name = form.querySelector('[name="name"]').value.trim();
    const passwordHash = await sha256(form.querySelector('[name="password"]').value);
    const id = Date.now();
    teacherAccounts = teacherAccounts.filter(item => item.email !== email);
    teacherAccounts.push({id,name,email,passwordHash,status:'pending'});
    adminData.pending.push({id,name,email,school:'Escola não informada'});
    saveTeacherAccounts(); saveAdminData(); form.reset();
    document.querySelector('[data-success-copy]').textContent = 'Sua solicitação foi enviada. O acesso será liberado após a autorização da administradora.';
    document.querySelector('#success-title').textContent = 'Solicitação enviada!';
    showScreen('success');
    return;
  }
  if (state.role === 'teacher' && state.intent === 'login') {
    const email = form.querySelector('[name="email"]').value.trim().toLowerCase();
    const account = teacherAccounts.find(item => item.email === email);
    const passwordHash = await sha256(form.querySelector('[name="password"]').value);
    if (!account || account.passwordHash !== passwordHash) {
      document.querySelector('.form-message').textContent = 'E-mail ou senha de professor incorretos.'; return;
    }
    if (account.status === 'pending') {
      document.querySelector('.form-message').textContent = 'Seu cadastro ainda aguarda autorização da administradora.'; return;
    }
    if (account.status !== 'active') {
      document.querySelector('.form-message').textContent = 'Este acesso não está ativo. Entre em contato com a administração.'; return;
    }
    state.teacherEmail = email; loadTeacherData(email); form.reset(); setTeacherView('overview'); showScreen('teacher');
    return;
  }
  if (state.role === 'student' && state.intent === 'login') {
    const access = findStudentAccess(form.querySelector('[name="name"]').value, form.querySelector('[name="code"]').value);
    if (!access) { document.querySelector('.form-message').textContent = 'Nome ou código de acesso não encontrado.'; return; }
    studentWorkspace = access.data; currentStudent = access.student; state.studentStorageKey = access.key;
    normalizeStudentProfile(currentStudent); grantDailyReward();
    currentStudent.lastAccess = `Hoje, ${new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
    clearConstellationTimers();
    clearMeteorTimers();
    clearSolarPuzzleState();
    if (rockyMemoryFlipTimer) { clearTimeout(rockyMemoryFlipTimer); rockyMemoryFlipTimer = null; }
    memoryBonusState = null; rockyMemoryBonusState = null; planetRouletteState = null; constellationBonusState = null; meteorBonusState = null; solarPuzzleState = null; currentChallengeIndex = 0; currentMissionIndex = 0; missionSession = null; rewardNotice = null; saveStudentWorkspace(); form.reset();
    setStudentView('home'); showScreen('student');
    return;
  }
  if (state.role === 'admin' && state.intent === 'login') {
    const email = form.querySelector('[name="email"]').value.trim().toLowerCase();
    const passwordValue = form.querySelector('[name="password"]').value;
    let passwordHash = '';
    try { passwordHash = await sha256(passwordValue); } catch (_) {
      document.querySelector('.form-message').textContent = 'Não foi possível validar a senha neste navegador.';
      return;
    }
    if (email !== ADMIN_EMAIL || passwordHash !== ADMIN_PASSWORD_HASH) {
      document.querySelector('.form-message').textContent = 'E-mail ou senha de administrador incorretos.';
      form.querySelector('[name="email"]').focus();
      return;
    }
    form.reset();
    setAdminView('approvals');
    showScreen('admin');
    return;
  }
  document.querySelector('[data-success-copy]').textContent = state.intent === 'register'
    ? 'Sua conta foi criada. Prepare-se para explorar um universo de descobertas.'
    : 'Entrada realizada. Sua próxima missão já está esperando por você.';
  showScreen('success');
});

document.addEventListener('click', event => {
  if (event.target.closest('.sound-button,[data-challenge-answer],[data-click-answer],[data-check-challenge],[data-check-solar-puzzle],[data-speak-question],[data-speak-feedback],[data-memory-card],[data-meteor-cup],[data-subtraction-verdict],[data-speak-subtraction-review]')) return;
  if (event.target.closest('button,a')) playSound('ui');
});

updateSoundButtons();
updateFullscreenButton();
document.addEventListener('fullscreenchange',updateFullscreenButton);
