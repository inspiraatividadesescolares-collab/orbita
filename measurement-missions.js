const measurementMissions = (() => {
  const figures = ['FIGURA A','FIGURA B','FIGURA C','FIGURA D'];
  const question = (mission,number,text,options,answerIndex,correct,incorrect,imageAlt,extra={}) => {
    const choices = options.map(String),answer = choices[answerIndex];
    return {
      id:`d13m${mission}q${number}`,type:'quiz',variant:'qt1',text,
      options:choices,answer,correct,
      incorrect:Array.isArray(incorrect) ? incorrect.find(Boolean) : incorrect,
      feedbackByAnswer:Object.fromEntries(choices.map((option,index) => [option,index === answerIndex
        ? correct : Array.isArray(incorrect) ? incorrect[index] : incorrect])),
      // As referências da missão 3 estavam deslocadas a partir da questão 6 no roteiro.
      image:`assets/imagens/questoes/3-ano/desafio-13/missao-${mission}/d7-m${mission}-q${number}.png`,
      imageAlt,...extra
    };
  };
  const challenge = {
    title:'Desafio 13 — Sistemas de medidas',
    missions:[
      {
        title:'Comprimento',
        intro:'Escolha as unidades adequadas para medir objetos e distâncias. Lembre-se: 1 metro tem 100 centímetros. Nas réguas, observe as marcas das duas extremidades do objeto e calcule a diferença. São 10 questões, com uma alternativa em cada uma.',
        questions:[
          question(1,1,'Para medir o comprimento de um lápis, qual unidade é mais adequada?',['metro','quilômetro','centímetro','litro'],2,
            'VOCÊ CONSEGUIU! A resposta está certa.',
            'PENSE MELHOR! Essa não é a resposta certa.',
            'Um lápis amarelo.'),
          question(1,2,'Para medir a altura de uma porta, qual unidade é mais adequada?',['centímetro','metro','quilômetro','grama'],1,
            'PARABÉNS! Você acertou mais uma.',
            'NÃO É ISSO! A resposta não está certa.',
            'Uma porta de madeira.'),
          question(1,3,'Um metro tem quantos centímetros?',['10 cm','50 cm','60 cm','100 cm'],3,
            'VOCÊ É DEMAIS! A resposta é essa mesmo.',
            'TENTE NOVAMENTE! Essa não é a resposta certa.',
            'Uma fita métrica.'),
          question(1,4,'Uma fita tem 1 metro. Ana usou 40 cm dessa fita. Quantos centímetros sobraram?',['40 cm','50 cm','60 cm','140 cm'],2,
            'EXCELENTE! Você acertou.',
            'PENSE MELHOR! Essa não é a resposta certa.',
            'Uma fita de 1 metro e um pedaço de 40 centímetros.'),
          question(1,5,'Um caderno tem 28 cm; uma borracha tem 4 cm e um lápis tem 18 cm. Qual objeto tem o maior comprimento?',['caderno','borracha','lápis','todos têm o mesmo comprimento'],0,
            'ESPETACULAR! Você entendeu direitinho.',
            'RESPOSTA ERRADA! Pense mais um pouco.',
            'Um caderno, um lápis e uma borracha.'),
          question(1,6,'Qual é o comprimento deste objeto?',['7 cm','0 cm','8 cm','80 cm'],2,
            'VOCÊ ARRASOU! Acertou mais uma.',
            'NÃO É ISSO! Tente novamente.',
            'Um lápis sobre uma régua, entre as marcas 0 e 8 centímetros.',
            {imageLayout:'ruler',spokenText:'Qual é o comprimento do lápis? Ele começa na marca 0 centímetro e termina na marca 8 centímetros da régua.'}),
          question(1,7,'Qual é o comprimento deste objeto?',['5 cm','0 cm','15 cm','6 cm'],0,
            'ESPETACULAR! Você entendeu direitinho.',
            'RESPOSTA ERRADA! Pense mais um pouco.',
            'Um clipe sobre uma régua, entre as marcas 2 e 7 centímetros.',
            {imageLayout:'ruler',spokenText:'Qual é o comprimento do clipe? Ele começa na marca 2 centímetros e termina na marca 7 centímetros da régua.'}),
          question(1,8,'Qual fita é mais comprida?',['rosa','amarela','azul','todas têm o mesmo comprimento'],2,
            'PARABÉNS! Você é muito inteligente.',
            'OPS! Tente mais uma vez.',
            'Fitas amarela, rosa e azul sobre réguas, com as extremidades marcadas.'),
          question(1,9,'Andei 6 metros para a esquerda, depois andei 3 metros para cima, depois andei 6 metros para a direita e depois mais 1 metro para baixo. Quantos metros eu andei no total?',['17 metros','14 metros','15 metros','16 metros'],3,
            'MUITO BEM! Você fez as contas certinho.',
            'RESPOSTA ERRADA! Tente mais uma vez.',
            'Um percurso com trechos de 6 metros, 3 metros, 6 metros e 1 metro.'),
          question(1,10,'A medida 150 cm também pode ser escrita como:',['15 m','1 m e 50 cm','150 m','5 m e 10 cm'],1,
            'PARABÉNS! Você acertou.',
            'NÃO É ISSO! Pense mais um pouco.',
            'Uma girafa ao lado de uma escala de altura em centímetros.')
        ]
      },
      {
        title:'Massa',
        intro:'Observe os instrumentos e compare as massas dos objetos. Use gramas e quilogramas: 1 quilograma equivale a 1.000 gramas. Considere as porções mostradas nas imagens. Escolha uma alternativa em cada uma das 10 questões.',
        questions:[
          question(2,1,'Qual dos instrumentos abaixo é usado para medir a massa (ou peso)?',figures,2,
            'MUITO BOM! Você aprendeu tudo.',
            'TENTE OUTRA VEZ! Sua resposta não está certa.',
            'Uma régua, um relógio, uma balança e um termômetro, identificados pelas letras A, B, C e D.'),
          question(2,2,'Qual dos instrumentos abaixo NÃO é usado para medir a massa (ou peso)?',figures,1,
            'PARABÉNS! Você acertou.',
            'NÃO É ISSO! Pense mais um pouco.',
            'Quatro instrumentos identificados pelas letras A, B, C e D: três balanças e uma trena.'),
          question(2,3,'Qual das medidas abaixo é utilizada para medir a massa (ou peso)?',['quilograma (kg)','litro (L)','centímetro (cm)','metro (m)'],0,
            'ISSO MESMO! O quilograma é uma medida de massa.',
            'TENTE DE NOVO! A resposta não é essa.',
            'Uma personagem em cima de uma balança.'),
          question(2,4,'Qual das medidas abaixo NÃO é utilizada para medir a massa (ou peso)?',['quilograma (kg)','grama (g)','tonelada (t)','quilômetro (km)'],3,
            'SENSACIONAL! Quilômetro NÃO é medida de massa.',
            'A RESPOSTA ESTÁ ERRADA! Mas você ainda tem uma chance.',
            'Um caminhão transportando uma carga.'),
          question(2,5,'No supermercado, a massa de um saco de feijão costuma ser indicada em:',['centímetros','horas','quilogramas','metros'],2,
            'ISSO MESMO! O feijão é vendido no quilo.',
            'PENSE MELHOR! Você tem mais uma chance.',
            'Um pacote de feijão com a indicação de 1 kg.'),
          question(2,6,'Qual fruta tem a maior massa?',['maçã','laranja','banana','as três têm a mesma massa'],1,
            'EXCELENTE! A laranja é a mais pesada.',
            'RESPOSTA ERRADA! Tente mais uma vez.',
            'Uma maçã de 150 g, uma laranja de 170 g e uma banana de 120 g sobre balanças.',
            {spokenText:'Qual fruta tem a maior massa? A maçã tem 150 gramas, a laranja tem 170 gramas e a banana tem 120 gramas.'}),
          question(2,7,'Qual desses seres vivos provavelmente terá a massa medida em kg (quilograma)?',['formiga','borboleta','cachorro','joaninha'],2,
            'VOCÊ BRILHOU! Acertou mais uma.',
            'CONCENTRE-SE! Você ainda tem uma chance.',
            'Uma formiga, uma borboleta, um cachorro e uma joaninha.'),
          question(2,8,'O peso abaixo equivale a:',['100 gramas','1.000 gramas','10 gramas','1 grama'],1,
            'ISSO MESMO! 1 kg equivale a 1.000 gramas.',
            'NÃO É ISSO! Tente mais uma vez.',
            'Um peso de balança com a indicação de 1 kg.',
            {spokenText:'O peso de 1 quilograma mostrado na imagem equivale a quantos gramas?'}),
          question(2,9,'Qual das massas abaixo é a MENOR?',['80 g','800 g','1 kg','50 kg'],0,
            'SENSACIONAL! Você acertou.',
            'RESPOSTA ERRADA! Tente mais uma vez.',
            'Um bombom, um pacote de feijão, um saco de cimento e um pedaço de carne.'),
          // As porções importam: o pacote de arroz da imagem está marcado como 5 kg.
          question(2,10,'Considerando as porções da imagem, qual dos alimentos pode pesar 1 kg?',['arroz','alface','morango','carne'],3,
            'PARABÉNS! Mais uma resposta certa.',
            'NÃO ESTÁ CERTO! Tente mais uma vez.',
            'Um pacote de arroz de 5 kg, uma alface, um morango e um pedaço de carne.')
        ]
      },
      {
        title:'Capacidade',
        intro:'Compare a capacidade dos recipientes e as quantidades de líquido. Lembre-se: 1 litro equivale a 1.000 mililitros. Observe as marcas dos recipientes e faça as contas quando precisar. Escolha uma alternativa em cada uma das 10 questões.',
        questions:[
          question(3,1,'Qual das unidades de medida abaixo é utilizada para indicar o conteúdo da caixa de leite?',['1 quilo','1 metro','1 grama','1 litro'],3,
            'PARABÉNS! 1 caixa de leite, em geral, contém um litro.',
            'NÃO ESTÁ CERTO! Tente mais uma vez.',
            'Uma caixa de leite integral.'),
          question(3,2,'Qual dos produtos abaixo é vendido por medida de capacidade (L)?',['O papel higiênico','Os ovos','O refrigerante','O feijão'],2,
            'MARAVILHA! O refrigerante é vendido em L ou mL.',
            'ESSA NÃO! Este produto não é vendido por medida de capacidade.',
            'Papel higiênico, ovos, refrigerante e feijão, identificados pelas letras A, B, C e D.'),
          question(3,3,'Quantos mL de suco há na jarra?',['750 mL','250 mL','500 mL','1.000 mL'],1,
            'SENSACIONAL! A jarra da figura tem 250 mL de suco.',
            'NÃO É ISSO! Observe melhor a figura.',
            'Uma jarra graduada com suco na marca de 250 mL.'),
          question(3,4,'Clara bebeu menos do que Davi. Eva bebeu mais do que Davi. Sabendo que as quantidades são 300 mL, 400 mL e 500 mL, quantos mL Davi bebeu?',[250,300,400,500],2,
            'Você acertou! Davi bebeu 400 mL.',
            'PENSE MELHOR! Davi bebeu mais do que Clara e menos do que Eva.',
            'Três copos graduados com 300 mL, 400 mL e 500 mL.'),
          question(3,5,'A garrafa vermelha tem 400 mL. A azul tem 200 mL a mais que a vermelha. A verde tem 100 mL a menos que a azul. Quantos mL tem a garrafa verde?',[500,300,400,600],0,
            'VOCÊ ACERTOU! A garrafa verde tem 500 mL.',
            'TENTE OUTRA VEZ! A garrafa verde tem 100 mL a menos que a azul. E a azul tem 200 mL a mais que a vermelha.',
            'Três garrafas com líquidos azul, vermelho e verde.'),
          // O balde corresponde a C; o gabarito B do roteiro apontava para o copo.
          question(3,6,'Qual recipiente devemos usar para carregar uma quantidade próxima de 10 litros de água?',['Uma colher','Um copo','Um balde','Uma piscina'],2,
            'ISSO MESMO! Um balde pode ter capacidade de 10 L.',[
              'ESSA NÃO! Uma colher comporta mais ou menos 15 mL.',
              'ESSA NÃO! Um copo comporta mais ou menos 400 mL.',
              '',
              'ESSA NÃO! Uma piscina pequena comporta mais ou menos 5.000 L.'
            ],'Uma colher, um copo, um balde e uma piscina.'),
          // Dois copos de 500 mL completam 1 L: alternativa C, não A.
          question(3,7,'Uma garrafa tem capacidade para 1 L de suco. Qual das alternativas abaixo enche completamente a garrafa?',['3 copos de 200 mL','3 copos de 300 mL','2 copos de 500 mL','2 copos de 400 mL'],2,
            'É ISSO MESMO! 500 mL + 500 mL = 1 L.',
            'TENTE OUTRA VEZ! Lembre-se que um litro é igual a 1.000 mL.',
            'Uma garrafa com a indicação de 1 litro.'),
          question(3,8,'Dona Vilma compra 3 litros de leite por dia. Quantos litros de leite ela compra em uma semana?',[18,21,15,12],1,
            'É ISSO MESMO! Uma semana tem 7 dias, então 7 × 3 = 21.',
            'TENTE OUTRA VEZ! Lembre-se que uma semana tem 7 dias.',
            'Três caixas de leite.'),
          question(3,9,'Qual dos recipientes abaixo é mais adequado para medir 1 mL?',['O garrafão','O copo','A jarra','O conta-gotas'],3,
            'EXCELENTE! O conta-gotas é o mais indicado para medidas muito pequenas.',
            'OPS! 1 mL é uma quantidade muito pequena.',
            'Um garrafão, um copo, uma jarra e um conta-gotas.'),
          // A capacidade exata distingue a jarra dos recipientes maiores, que também recebem 1 L.
          question(3,10,'Qual dos recipientes abaixo tem capacidade para receber exatamente 1 L de água?',['O balde','O copo','A jarra','O filtro'],2,
            'EXCELENTE! A jarra da figura tem capacidade para receber exatamente 1 L.',[
              'OPS! O balde da figura tem capacidade para 10 L de água.',
              'OPS! O copo da figura tem capacidade para 250 mL de água.',
              '',
              'OPS! O filtro da figura tem capacidade para 5 L de água.'
            ],'Um balde, um copo, uma jarra e um filtro de água.')
        ]
      }
    ]
  };
  return {challenge};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = measurementMissions;
