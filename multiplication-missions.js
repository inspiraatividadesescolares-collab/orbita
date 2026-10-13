const multiplicationMissions = (() => {
  const groupMission = typeof module !== 'undefined' && module.exports
    ? require('./multiplication-groups.js').mission : multiplicationGroups.mission;
  const figures = ['FIGURA A','FIGURA B','FIGURA C','FIGURA D'];
  const question = (mission,number,text,options,answerIndex,correct,incorrect,imageAlt,extra={}) => {
    const choices = options.map(String),answer = choices[answerIndex];
    return {
      id:`d12m${mission}q${number}`,type:'quiz',variant:'qt1',text,
      options:choices,answer,correct,incorrect,
      feedbackByAnswer:Object.fromEntries(choices.map(option => [option,option === answer ? correct : incorrect])),
      image:`assets/imagens/questoes/3-ano/desafio-12/missao-${mission}/d6-m${mission}-q${number}.png`,
      imageAlt,...extra
    };
  };
  const productQuestion = (mission,number,left,right,options,correct,incorrect,imageAlt,extra={}) =>
    question(mission,number,'Quanto é?',options,options.indexOf(left * right),correct,incorrect,imageAlt,{
      factors:[left,right],spokenText:`Quanto é ${left} vezes ${right}?`,...extra
    });
  const challenge = {
    title:'Desafio 12 — Multiplicação',
    missions:[
      groupMission,
      {
        title:'Multiplicando por 0, 1, 2 e 3',
        video:'assets/videos/desafio-6/missao-2/vd-explica-d6-m2.mp4',
        intro:'Observe as multiplicações e os grupos nas imagens. Multiplicar por 0 resulta em 0; multiplicar por 1 mantém o número. Use os grupos para calcular os outros produtos. Escolha uma alternativa em cada uma das 10 questões.',
        questions:[
          productQuestion(2,1,3,2,[4,5,6,7],
            'ÓTIMO! Você já sabe multiplicar.',
            'NÃO É ISSO! Conte as figuras, se necessário.',
            'A multiplicação 3 × 2 e grupos de joaninhas.'),
          productQuestion(2,2,3,1,[6,5,4,3],
            'MUITO BOM! Você acertou.',
            'TENTE NOVAMENTE! Você é capaz!',
            'A multiplicação 3 × 1 e grupos de gafanhotos.'),
          productQuestion(2,3,3,0,[3,2,1,0],
            'MUITO BOM! Você acertou.',
            'TENTE NOVAMENTE! Você é capaz!',
            'A multiplicação 3 × 0 e três círculos vazios.'),
          productQuestion(2,4,2,3,[6,5,7,8],
            'VOCÊ É UM GÊNIO! A resposta está certa!',
            'NÃO É ISSO! Tente novamente.',
            'A multiplicação 2 × 3 e dois grupos de formigas.',
            {text:'Quanto é 2 × 3?'}),
          productQuestion(2,5,2,2,[2,3,4,5],
            'PARABÉNS! Você acertou.',
            'PENSE MELHOR! Sua resposta não está correta.',
            'A multiplicação 2 × 2 e grupos de caracóis.'),
          productQuestion(2,6,2,4,[7,6,9,8],
            'RESPOSTA CERTA! Você é demais!',
            'RESPOSTA ERRADA! Tente de novo.',
            'A multiplicação 2 × 4 e grupos de minhocas.'),
          productQuestion(2,7,2,1,[0,1,2,3],
            'VOCÊ ACERTOU! Parabéns!',
            'RESPOSTA ERRADA! Tente de novo.',
            'A multiplicação 2 × 1 e dois grupos com conchas.'),
          productQuestion(2,8,2,0,[0,1,2,3],
            'MUITO BOM! Você aprende rápido.',
            'NÃO É ISSO. Tente mais uma vez.',
            'A multiplicação 2 × 0 e dois círculos vazios.'),
          productQuestion(2,9,2,5,[12,11,20,10],
            'EXCELENTE! Você é muito inteligente.',
            'NÃO FOI DESSA VEZ! Tente novamente.',
            'A multiplicação 2 × 5 e grupos de insetos.'),
          // 3 × 3 = 9 corresponde a C, não ao gabarito D do roteiro.
          productQuestion(2,10,3,3,[7,8,9,10],
            'QUE DEMAIS! Você acertou.',
            'NÃO É ISSO! Tente novamente.',
            'A multiplicação 3 × 3 e grupos de abelhas.')
        ]
      },
      {
        title:'Multiplicando por 5 e 10',
        video:'assets/videos/desafio-6/missao-3/vd-explica-d6-m3.mp4',
        intro:'Calcule os produtos usando as imagens e as tabuadas do 5 e do 10. Observe também os algarismos finais e a sequência que aumenta de 10 em 10. Escolha uma alternativa em cada uma das 10 questões.',
        questions:[
          productQuestion(3,1,3,5,[25,20,10,15],
            'PARABÉNS! Você acertou mais uma.',
            'RESPOSTA ERRADA! Tente novamente.',
            'A multiplicação 3 × 5 e três cédulas de cinco reais.'),
          productQuestion(3,2,2,5,[25,20,10,15],
            'MUITO BEM! Você é campeão.',
            'NÃO É ISSO! Tente novamente.',
            'A multiplicação 2 × 5 e duas mãos abertas.'),
          productQuestion(3,3,1,5,[1,6,5,10],
            'MUITO BEM! Você é demais!',
            'NÃO É ISSO! Tente novamente.',
            'A multiplicação 1 × 5 e um prato com biscoitos.'),
          // Os cinco pratos estão vazios: 5 × 0 = 0, alternativa D.
          productQuestion(3,4,5,0,[1,5,3,0],
            'VOCÊ BRILHOU! Aprendeu rapidinho.',
            'OPS! Quantos biscoitos há nos pratos?',
            'A multiplicação 5 × 0 e cinco pratos vazios.'),
          productQuestion(3,5,4,5,[15,20,25,30],
            'EXCELENTE! Você provou que é inteligente.',
            'RESPOSTA ERRADA! Volte e conte os gizes de cera.',
            'A multiplicação 4 × 5 e quatro caixas de giz de cera.'),
          productQuestion(3,6,5,5,[15,20,25,30],
            'PERFEITO! Você é fera!',
            'NÃO ESTÁ CERTO! Há 5 bombons em cada uma das 5 caixas.',
            'A multiplicação 5 × 5 e cinco caixas de bombons.'),
          productQuestion(3,7,5,10,[15,20,25,50],
            'BRILHANTE! Você acertou mais uma vez.',
            'NÃO É ISSO! Volte e tente de novo.',
            'A multiplicação 5 × 10 e cinco cédulas de dez reais.'),
          question(3,8,'Na tabuada do 5, todos os resultados terminam em:',['0 e 5','7 e 6','3 e 4','1 e 2'],0,
            'MUITO BOM! Você aprende rápido.',
            'OPS! Observe a imagem.',
            'Tabuada do 5, de 5 × 0 até 5 × 10.'),
          question(3,9,'Na tabuada do 10, todos os resultados terminam em:',['5','2','1','0'],3,
            'ESSA FOI FÁCIL, NÃO FOI?',
            'OBSERVE A TABUADA.',
            'Tabuada do 10, de 10 × 0 até 10 × 10.'),
          question(3,10,'Qual é o próximo número da sequência?',[69,71,80,90],2,
            'QUE DEMAIS! Você acertou.',
            'NÃO É ISSO! Tente novamente.',
            'Sequência 10, 20, 30, 40, 50, 60, 70, seguida de um espaço em branco.',
            {spokenText:'Qual é o próximo número da sequência: 10, 20, 30, 40, 50, 60, 70?'})
        ]
      }
    ]
  };
  return {challenge};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = multiplicationMissions;
