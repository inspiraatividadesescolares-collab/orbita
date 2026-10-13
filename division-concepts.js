const divisionConcepts = (() => {
  const root = 'assets/imagens/questoes/3-ano/desafio-17/missão-2';
  const asset = file => `${root}/${file}.png`;
  const picture = (number,letter) => asset(`d17-m2-q${number}-${letter}`);
  const quiz = (number,text,options,index,correct,incorrect,visual) => {
    const choices = options.map(String),answer = choices[index];
    return {id:`d17m2q${number}`,type:'quiz',variant:'qt1',text,options:choices,answer,correct,incorrect,
      feedbackByAnswer:Object.fromEntries(choices.map(choice => [choice,choice === answer ? correct : incorrect])),divisionVisual:visual};
  };
  const bar = (number,parts,file) => ({kind:'bar',parts,image:asset(file),alt:`Barra dividida em ${parts} partes iguais, com uma parte pintada.`});
  const group = (label,image,count,area) => ({label,image,count,area});
  const scene = (item,itemImage,groups,extra={}) => ({kind:'groups',item,itemImage,groups,...extra});
  const sharing = (question,total,item,plural,targets,extra={}) => {
    const {divisionVisual,...data} = question;
    return {...data,type:'division-sharing',mode:'sharing',total,item,plural,targets,groups:targets.length,
      divisor:targets.length,answer:total / targets.length,choiceAnswer:question.answer,requireEqual:true,
      target:'Destino',answerLabel:'Escolha a resposta',itemImage:divisionVisual.itemImage,...extra};
  };
  const mission = {
    title:'Metade, terça parte e quarta parte',
    intro:'Metade é uma de duas partes iguais. Terça parte é uma de três partes iguais, e quarta parte é uma de quatro partes iguais. Nas questões de repartição, distribua as figuras em partes iguais antes de escolher a resposta. Na questão das folhas, outro grupo aparece quando o anterior recebe cinco folhas. Nas duas últimas questões, use a tampinha e o quadro para montar seu cálculo: cada ferramenta pode ser arrastada várias vezes. São 10 questões, com duas tentativas por questão. Recomeçar não recupera tentativas usadas.',
    questions:[
      quiz(1,'A barra foi dividida em 2 partes iguais. Como se chama a parte pintada?',
        ['metade','quarta parte','quinta parte','terça parte'],0,
        'MUITO BEM! Uma de duas partes iguais é a metade.',
        'Observe as duas partes iguais da barra. A parte pintada é uma dessas duas partes.',bar(1,2,'d17-m2-q1-a')),
      quiz(2,'Pedro fez 8 biscoitos. Guardou a METADE no pote e pôs a outra metade na lancheira para levar para a escola. Quantos biscoitos ele levou?',
        [8,6,3,4],3,'ISSO MESMO! A metade de 8 é 4. Pedro levou 4 biscoitos na lancheira.',
        'Metade significa dividir em duas partes iguais. Conte os biscoitos da lancheira ou calcule 8 ÷ 2.',
        scene('biscoito',picture(2,'a'),[group('Pote',picture(2,'b'),4,[28,29,44,48]),group('Lancheira',picture(2,'c'),4,[22,52,56,33])])),
      quiz(3,'A barra foi dividida em partes iguais. A parte pintada corresponde a qual parte do inteiro?',
        ['quinta parte','metade','décima parte','terça parte'],3,'PARABÉNS! A barra tem três partes iguais. A parte pintada é a terça parte.',
        'Conte em quantas partes iguais a barra foi dividida. Só uma delas está pintada.',bar(3,3,'d17-m2-q3-a')),
      quiz(4,'Bia separou seus 15 adesivos em 3 partes iguais. Uma parte ela vai colar no caderno, outra no armário e a última na mochila. Quantos adesivos ela colou na mochila?',
        [3,5,6,2],1,'MUITO BEM! 15 ÷ 3 = 5. Bia colou 5 adesivos na mochila.',
        'Divida os 15 adesivos em três partes iguais ou conte os adesivos da mochila.',
        scene('adesivo',picture(4,'a'),[
          group('Caderno',picture(4,'b'),5,[29,25,46,57]),
          // O arquivo do armário foi fornecido com o nome da questão 5.
          group('Armário',picture(5,'c'),5,[25,23,50,55]),
          group('Mochila',picture(4,'d'),5,[28,36,44,46])])),
      quiz(5,'Observe a barra. Qual é o nome de uma das quatro partes iguais em que ela foi dividida?',
        ['metade','quarta parte','quinta parte','terça parte'],1,'VOCÊ ACERTOU! Uma de quatro partes iguais é a quarta parte.',
        'Conte as partes iguais da barra. Pense no nome de uma parte quando o inteiro é dividido em quatro.',bar(5,4,'d17-m2-q5')),
      quiz(6,'Uma estante tem 20 livros. A QUARTA PARTE deles é de histórias de animais. Quantos livros são de histórias de animais?',
        [10,16,4,5],3,'ISSO MESMO! 20 ÷ 4 = 5. São 5 livros de histórias de animais.',
        'Quarta parte significa uma de quatro partes iguais. Divida os 20 livros por 4.',
        {kind:'shelf',image:picture(6,'a'),itemImage:picture(6,'b'),printedCount:1,rowCounts:[4,5,5,5],alt:'Estante com 20 livros: cinco em cada uma das quatro prateleiras. A segunda prateleira é de histórias de animais.'}),
      {id:'d17m2q7',type:'input',text:'Uma floricultura tem 20 vasos de flores. Vendeu a METADE deles. Quantos vasos de flores ainda restam?',answer:'10',
        options:['20','5','10','15'],
        correct:'MUITO BEM! A metade de 20 é 10. Restam 10 vasos de flores para vender.',
        incorrect:'Metade significa duas partes iguais. Calcule 20 ÷ 2 e conte os vasos que ainda estão para vender.',
        divisionVisual:scene('vaso de flores',picture(7,'a'),[group('Vendidos',picture(7,'b'),10),group('Para vender',picture(7,'C'),10)],{layout:'outside'})},
      {id:'d17m2q8',type:'division-sharing',mode:'grouping',text:'Há 20 folhas de papel. Cada grupo deve ter 5 folhas. Qual divisão calcula a quantidade de grupos?',
        total:20,groupSize:5,divisor:5,answer:4,item:'folha de papel',plural:'folhas',target:'Grupo',answerLabel:'Escolha a divisão que calcula a quantidade de grupos',
        itemImage:picture(8,'a'),targetImage:picture(8,'b'),area:[17,25,66,55],
        options:['20 − 5 = 15','20 ÷ 4 = 5','20 ÷ 5 = 4','20 + 5 = 25'],choiceAnswer:'20 ÷ 5 = 4',
        correct:'MUITO BEM! 20 ÷ 5 = 4. Você formou 4 grupos com 5 folhas em cada um.',
        incorrect:'O total é 20 folhas e cada grupo recebe 5. Divida 20 por 5 para descobrir quantos grupos foram formados.'},
      quiz(9,'Use a imagem como apoio e calcule. Quanto é 16 ÷ 2 = ?',
        [8,11,6,7],0,'PARABÉNS! 16 ÷ 2 = 8. Cada grupo tem 8 tampinhas.',
        'Represente 16 tampinhas e reparta em dois grupos iguais. Conte as tampinhas de um grupo.',
        scene('palito',picture(9,'a'),[group('Grupo 1',picture(9,'b'),8,[23,17,54,66]),group('Grupo 2',picture(9,'b'),8,[23,17,54,66])],{layout:'sticks',columns:4})),
      quiz(10,'Use a imagem como apoio e calcule: 27 ÷ 3 = ?',
        [9,11,13,6],0,'VOCÊ ACERTOU! 27 ÷ 3 = 9. Cada grupo tem 9 tampinhas.',
        'Represente 27 tampinhas e reparta em três grupos iguais. Conte as tampinhas de um grupo.',
        scene('palito',picture(10,'a'),[group('Grupo 1',picture(10,'b'),9,[15,20,70,61]),group('Grupo 2',picture(10,'b'),9,[15,20,70,61]),group('Grupo 3',picture(10,'b'),9,[15,20,70,61])],{layout:'sticks',columns:3}))
    ]
  };
  for (const [index,total,item,plural] of [[1,8,'biscoito','biscoitos'],[3,15,'adesivo','adesivos'],[6,20,'vaso de flores','vasos de flores']]) {
    const q = mission.questions[index];
    mission.questions[index] = sharing(q,total,item,plural,q.divisionVisual.groups.map(g => ({
      label:g.label,image:g.image,area:g.area || [8,47,84,48],columns:index === 6 ? 5 : index === 1 ? 2 : 3,
      outside:index === 6
    })));
  }
  mission.questions[5] = sharing(mission.questions[5],20,'livro','livros',[
    {label:'Contos de fadas',area:[19,11,64,16],columns:5},
    {label:'Animais',area:[19,32,64,16],columns:5},
    {label:'Terror',area:[19,52,64,16],columns:5},
    {label:'Heróis',area:[19,73,64,16],columns:5}
  ],{targetLayout:'shelf',targetImage:picture(6,'a')});
  mission.questions[1].itemCrop = [9,10,82,80];
  mission.questions[1].targets[0].placement = {size:18,slots:[[42,39,-12],[57,39,14],[42,60,8],[57,60,-6]]};
  mission.questions[1].targets[1].placement = {size:17,slots:[[34,61,-10],[55,61,8],[40,75,5],[63,75,-8]]};
  mission.questions[3].itemCrop = [16,15,63,65];
  mission.questions[3].targets[0].placement = {size:15,slots:[[42,28,-17],[64,32,-10],[50,47,-15],[47,68,-19],[69,65,-11]]};
  mission.questions[3].targets[1].placement = {size:16,slots:[[31,27,-7],[68,35,8],[33,46,6],[70,61,-6],[31,67,-4]]};
  mission.questions[3].targets[2].placement = {size:14,slots:[[57,30,-8],[72,39,10],[48,55,5],[69,64,-7],[52,77,9]]};
  mission.questions[5].itemCrop = [39,11,24,78];
  mission.questions[6].itemCrop = [24,4,60,94];
  mission.questions[6].targets.forEach(target => { target.outside = false; target.area = [13,24,74,67]; });
  mission.questions[7].itemCrop = [12,9,75,79];
  mission.questions[7].placement = {size:16,slots:[[42,38,-13],[59,40,12],[35,55,-7],[53,56,8],[62,64,-10]]};
  for (const index of [8,9]) {
    const {divisionVisual,...q} = mission.questions[index];
    mission.questions[index] = {...q,type:'division-calculation',itemImage:`${root}/tampinha-calculo.svg`,
      targetImage:picture(index + 1,'b'),frameCrop:index === 8 ? [17,1,73,97] : [3,9,94,82],frameInset:[.08,.08]};
  }
  mission.questions.forEach(question => {
    question.spokenText = `${question.text}${question.id === 'd17m2q8' ? ' Arraste cinco folhas para cada grupo. Outro grupo aparece automaticamente quando o anterior fica completo. Distribua todas as folhas e escolha uma alternativa.' : ''}`;
    if (question.requireEqual) question.spokenText += ' Reparta as figuras em partes iguais e depois escolha uma alternativa.';
    if (question.id === 'd17m2q9') question.spokenText = 'Use as tampinhas e os quadros como apoio e calcule. Quanto é dezesseis dividido por dois?';
    if (question.id === 'd17m2q10') question.spokenText = 'Use as tampinhas e os quadros como apoio e calcule. Quanto é vinte e sete dividido por três?';
  });
  const isVisual = question => Boolean(question?.divisionVisual);

  function images(question) {
    if (!isVisual(question)) return [...new Set([question.itemImage,question.targetImage,...(question.targets || []).map(t => t.image)].filter(Boolean))];
    const visual = question.divisionVisual;
    return [...new Set([visual.image,visual.itemImage,...(visual.groups || []).map(group => group.image)].filter(Boolean))];
  }

  function renderMedia(question,container) {
    const visual = question.divisionVisual;
    if (!visual) return;
    container.hidden = false;
    if (visual.kind === 'bar') {
      container.innerHTML = `<div class="division-bar-visual ${visual.parts === 4 ? 'division-bar-visual--four' : ''}"><img src="${visual.image}" alt="${visual.alt}"></div>`;
    } else if (visual.kind === 'shelf') {
      const rows = [[30,12,53,17],[19,34,65,17],[19,54,65,17],[19,75,65,17]];
      container.innerHTML = `<div class="division-shelf-visual" role="img" aria-label="${visual.alt}"><img class="division-shelf-art" src="${visual.image}" alt="">${visual.rowCounts.map((count,index) => {
        const [left,top,width,height] = rows[index];
        return `<div class="division-shelf-row" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%;--shelf-columns:${count}">${Array.from({length:count},() => `<img data-concept-item src="${visual.itemImage}" alt="">`).join('')}</div>`;
      }).join('')}</div>`;
    } else {
      const total = visual.groups.reduce((sum,group) => sum + group.count,0);
      container.innerHTML = `<div class="division-concept-groups ${visual.layout === 'outside' ? 'division-concept-groups--outside' : ''} ${visual.layout === 'sticks' ? 'division-concept-groups--sticks' : ''}" style="--concept-columns:${visual.groups.length}" role="group" aria-label="${total} ${visual.item === 'vaso de flores' ? 'vasos de flores' : `${visual.item}s`} divididos em ${visual.groups.length} partes iguais">${visual.groups.map(group => {
        const [left,top,width,height] = group.area || [0,0,100,100];
        const figures = Array.from({length:group.count},() => `<img data-concept-item src="${visual.itemImage}" alt="" draggable="false">`).join('');
        return `<figure class="division-concept-group"><figcaption>${group.label}</figcaption><div class="division-concept-surface"><img class="division-concept-target" src="${group.image}" alt="${group.label}" draggable="false">${visual.layout === 'outside' ? '' : `<div class="division-concept-items" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%;--stick-columns:${visual.columns || 3};--stick-rows:${Math.ceil(group.count / (visual.columns || 3))}">${figures}</div>`}</div>${visual.layout === 'outside' ? `<div class="division-concept-items-outside">${figures}</div>` : ''}</figure>`;
      }).join('')}</div>`;
    }
  }
  return {mission,isVisual,images,renderMedia};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = divisionConcepts;
