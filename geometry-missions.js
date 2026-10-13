const geometryMissions = (() => {
  const figures = ['FIGURA A','FIGURA B','FIGURA C','FIGURA D'];
  const question = (mission,number,text,options,answerIndex,feedback,imageAlt,image='') => ({
    id:`d10m${mission}q${number}`,type:'quiz',variant:'qt1',text,options,
    answer:options[answerIndex],correct:feedback[answerIndex],
    feedbackByAnswer:Object.fromEntries(options.map((option,index) => [option,feedback[index]])),
    image:image || `assets/imagens/questoes/3-ano/desafio-10/missao-${mission}/d4-m${mission}-q${number}.png`,
    imageAlt
  });
  const challenge = {
    title:'Desafio 10 — Geometria',
    missions:[
      {
        title:'Figuras geométricas planas — polígonos',
        video:'assets/videos/desafio-4/missao-1/vd-explica-d4-m1.mp4',
        intro:'Observe as figuras e conte seus lados. Lembre-se: um polígono é uma figura plana fechada, formada por linhas retas. Quando a imagem mostrar figuras A, B, C e D, escolha a letra correspondente. São 10 questões.',
        questions:[
          question(1,1,'Qual das formas abaixo NÃO é um polígono?',figures,3,[
            'VOCÊ ERROU! O quadrado é um polígono.',
            'VOCÊ ERROU! O triângulo é um polígono.',
            'VOCÊ ERROU! O pentágono é um polígono.',
            'VOCÊ ACERTOU! A figura D não é um polígono porque não é uma figura fechada.'
          ],'Quatro figuras identificadas pelas letras A, B, C e D.'),
          question(1,2,'Qual das formas abaixo NÃO é um polígono?',figures,1,[
            'NÃO FOI DESSA VEZ! O quadrado é um polígono.',
            'ISSO MESMO! O círculo não é um polígono porque não é formado por linhas retas.',
            'NÃO FOI DESSA VEZ! O pentágono é um polígono.',
            'NÃO FOI DESSA VEZ! O hexágono é um polígono.'
          ],'Quatro figuras identificadas pelas letras A, B, C e D.'),
          question(1,3,'Quantos lados tem um QUADRADO?',['3','4','5','6'],1,[
            'VOCÊ ERROU! Conte os lados da figura.',
            'MUITO BEM! O quadrado tem 4 lados.',
            'VOCÊ ERROU! Conte os lados da figura.',
            'VOCÊ ERROU! Conte os lados da figura.'
          ],'Um quadrado.'),
          question(1,4,'Quantos lados tem um TRIÂNGULO?',['3','4','5','6'],0,[
            'É ISSO MESMO! O triângulo tem 3 lados.',
            'NÃO É ISSO! Conte os lados da figura.',
            'NÃO É ISSO! Conte os lados da figura.',
            'NÃO É ISSO! Conte os lados da figura.'
          ],'Um triângulo.'),
          question(1,5,'Quantos lados tem um HEXÁGONO?',['3','4','5','6'],3,[
            'NÃO É ISSO! Conte os lados da figura.',
            'NÃO É ISSO! Conte os lados da figura.',
            'NÃO É ISSO! Conte os lados da figura.',
            'VOCÊ É DEMAIS! O hexágono tem 6 lados.'
          ],'Um hexágono.'),
          question(1,6,'O nome da figura abaixo é DECÁGONO, porque ela tem…',['9 lados','10 lados','11 lados','12 lados'],1,[
            'NÃO É ISSO! Conte os lados da figura.',
            'ISSO MESMO! O decágono tem 10 lados.',
            'NÃO É ISSO! Conte os lados da figura.',
            'NÃO É ISSO! Conte os lados da figura.'
          ],'Um decágono.'),
          question(1,7,'Uma porta de sala de aula geralmente tem a forma de qual figura plana, considerando seus lados e vértices?',['QUADRADO','TRIÂNGULO','RETÂNGULO','CÍRCULO'],2,[
            'RESPOSTA INCORRETA! Observe melhor a figura da porta.',
            'RESPOSTA INCORRETA! Observe melhor a figura da porta.',
            'VOCÊ SABE TUDO! Uma porta geralmente tem a forma de um retângulo.',
            'RESPOSTA INCORRETA! Observe melhor a figura da porta.'
          ],'Uma porta de madeira.'),
          question(1,8,'Qual das formas abaixo é um OCTÓGONO?',figures,1,[
            'NÃO ESTÁ CERTO! A figura que você escolheu é um QUADRADO.',
            'SENSACIONAL! O OCTÓGONO é a figura que tem 8 lados.',
            'NÃO ESTÁ CERTO! A figura que você escolheu é um PENTÁGONO.',
            'NÃO ESTÁ CERTO! A figura que você escolheu é um HEXÁGONO.'
          ],'Quatro figuras identificadas pelas letras A, B, C e D.'),
          question(1,9,'Por que a figura abaixo não é considerada um POLÍGONO?',['Porque ela não tem linhas retas.','Porque ela não tem linhas curvas.','Porque ela não tem linhas.','Porque ela é uma figura fechada.'],0,[
            'BRILHANTE! O CÍRCULO é formado por uma linha curva.',
            'PENSE MELHOR! POLÍGONOS são figuras fechadas formadas por linhas retas.',
            'PENSE MELHOR! POLÍGONOS são figuras fechadas formadas por linhas retas.',
            'PENSE MELHOR! POLÍGONOS são figuras fechadas formadas por linhas retas.'
          ],'Um círculo.'),
          // O roteiro indicava A, mas a figura aberta e o feedback correto correspondem a D.
          question(1,10,'Por que a figura abaixo não é considerada um POLÍGONO?',['Porque ela não tem linhas retas.','Porque ela não tem linhas curvas.','Porque ela é fechada.','Porque ela é aberta.'],3,[
            'NÃO ESTÁ CERTO! Lembre-se das características dos polígonos.',
            'NÃO ESTÁ CERTO! Lembre-se das características dos polígonos.',
            'NÃO ESTÁ CERTO! Lembre-se das características dos polígonos.',
            'VOCÊ ACERTOU! As figuras abertas não são polígonos.'
          ],'Uma figura de segmentos de reta com uma abertura no contorno.')
        ]
      },
      {
        title:'Congruência e simetria',
        video:'assets/videos/desafio-4/missao-2/vd-explica-d4-m2.mp4',
        intro:'Compare a forma e o tamanho das figuras. Observe também os eixos de simetria e imagine como cada figura aparece no espelho. Escolha uma alternativa em cada uma das 10 questões.',
        questions:[
          question(2,1,'Quais figuras abaixo são CONGRUENTES, ou seja, possuem o mesmo tamanho e a mesma forma?',['A e C','A e B','B e C','C e D'],0,[
            'PARABÉNS! Você já sabe reconhecer figuras congruentes.',
            'NÃO ESTÁ CERTO! Conte os quadradinhos, se tiver dúvidas.',
            'NÃO ESTÁ CERTO! Conte os quadradinhos, se tiver dúvidas.',
            'NÃO ESTÁ CERTO! Conte os quadradinhos, se tiver dúvidas.'
          ],'Quatro figuras em malhas quadriculadas, identificadas pelas letras A, B, C e D.'),
          question(2,2,'Quais figuras abaixo são CONGRUENTES, ou seja, possuem o mesmo tamanho e a mesma forma?',['A e C','A e D','B e C','C e D'],1,[
            'TENTE NOVAMENTE! Conte os quadradinhos, se for preciso.',
            'MUITO BOM! Você já sabe reconhecer figuras congruentes.',
            'TENTE NOVAMENTE! Conte os quadradinhos, se for preciso.',
            'TENTE NOVAMENTE! Conte os quadradinhos, se for preciso.'
          ],'Quatro figuras formadas por triângulos, identificadas pelas letras A, B, C e D.'),
          question(2,3,'Qual dos PENTÁGONOS abaixo não é congruente?',figures,3,[
            'NÃO É ISSO. Observe melhor a forma das figuras.',
            'NÃO É ISSO. Observe melhor a forma das figuras.',
            'NÃO É ISSO. Observe melhor a forma das figuras.',
            'PARABÉNS! Você acertou.'
          ],'Quatro pentágonos em posições diferentes, identificados pelas letras A, B, C e D.'),
          question(2,4,'Quando duas figuras têm a mesma forma e o mesmo tamanho, mesmo que estejam em posições diferentes, elas são chamadas de…',['parecidas','congruentes','diferentes','sobrepostas'],1,[
            'PENSE BEM! Figuras congruentes não são apenas parecidas.',
            'PARABÉNS! Você sabe tudo.',
            'PENSE BEM! Figuras congruentes não são diferentes.',
            'PENSE BEM! Podemos sobrepor figuras que não são congruentes.'
          ],'Dois retângulos com medidas 5 por 2.'),
          // A comparação de forma e tamanho é A; o gabarito B do roteiro é inconsistente.
          question(2,5,'Uma maneira de verificar se duas figuras desenhadas em uma malha são congruentes é…',['Comparar a forma e o tamanho, contando a quantidade de quadradinhos na malha.','Contar quantos lápis foram usados para desenhar.','Comparar a cor e o tamanho de cada uma das figuras.','Comparar a forma e o brilho das figuras.'],0,[
            'ISSO MESMO! Você arrasou.',
            'RESPOSTA ERRADA! Os lápis usados para desenhar não interferem na congruência ou incongruência.',
            'RESPOSTA ERRADA! A cor não interfere na congruência ou incongruência.',
            'RESPOSTA ERRADA! O brilho não interfere na congruência ou incongruência.'
          ],'Duas figuras em forma de L desenhadas em uma malha quadriculada.'),
          question(2,6,'Qual das figuras abaixo é simétrica?',figures,0,[
            'MUITO BEM! Se dividirmos a figura por um eixo vertical, uma parte será o espelho da outra.',
            'OBSERVE BEM! Se dividirmos a figura em duas metades, uma nunca será o espelho da outra.',
            'OBSERVE BEM! Se dividirmos a figura em duas metades, uma nunca será o espelho da outra.',
            'OBSERVE BEM! Se dividirmos a figura em duas metades, uma nunca será o espelho da outra.'
          ],'Um coração, um barco, uma casa e uma bandeira, identificados pelas letras A, B, C e D.'),
          question(2,7,'Observe a borboleta. A linha pontilhada é um eixo de simetria?',['Não, porque borboletas nunca têm simetria.','Não, porque um lado fica maior que o outro.','Sim, porque os dois lados ficam iguais.','Sim, porque a linha está na horizontal.'],2,[
            'VOCÊ ERROU! Borboletas têm simetria sim.',
            'VOCÊ ERROU! Observe bem os dois lados.',
            'ISSO MESMO! Os dois lados ficam iguais.',
            'VOCÊ ERROU! A linha está na vertical.'
          ],'Uma borboleta com uma linha pontilhada vertical no centro.'),
          question(2,8,'Em qual alternativa a linha pontilhada divide a casinha em duas partes iguais?',figures,2,[
            'NÃO É ISSO! As duas partes não ficam espelhadas.',
            'NÃO É ISSO! As duas partes não ficam espelhadas.',
            'ISSO MESMO! As duas partes ficam espelhadas.',
            'NÃO É ISSO! As duas partes não ficam espelhadas.'
          ],'Quatro casinhas com linhas pontilhadas em posições diferentes, identificadas pelas letras A, B, C e D.'),
          question(2,9,'Imagine que o espelho está na linha pontilhada. Qual alternativa mostra a reflexão correta do barco?',figures,2,[
            'VOCÊ ERROU! As duas partes não ficam espelhadas.',
            'VOCÊ ERROU! As duas partes não ficam espelhadas.',
            'EXATAMENTE! As duas partes ficam espelhadas.',
            'VOCÊ ERROU! As duas partes não ficam espelhadas.'
          ],'Um barco ao lado de uma linha pontilhada vertical e quatro possibilidades de reflexão, identificadas pelas letras A, B, C e D.'),
          question(2,10,'Imagine que o espelho está na linha pontilhada. Qual alternativa mostra a reflexão correta do pinheiro?',figures,3,[
            'OLHE BEM! As duas partes não ficam espelhadas.',
            'OLHE BEM! As duas partes não ficam espelhadas.',
            'OLHE BEM! As duas partes não ficam espelhadas.',
            'MARAVILHA! As duas partes ficam espelhadas.'
          ],'Parte de um pinheiro ao lado de uma linha pontilhada vertical e quatro possibilidades de reflexão, identificadas pelas letras A, B, C e D.')
        ]
      },
      {
        title:'Figuras geométricas espaciais',
        video:'assets/videos/desafio-4/missao-3/vd-explica-d4-m3.mp4',
        intro:'Reconheça os sólidos geométricos e os objetos que se parecem com eles. Observe suas bases, faces e pontas. Nas três últimas questões, escolha a figura que mostra a planificação do sólido indicado.',
        questions:[
          question(3,1,'O sólido da imagem parece uma bola. Ele é…',['uma esfera','um círculo','uma pirâmide','um cubo'],0,[
            'PARABÉNS! Você acertou.',
            'NÃO É ISSO! O círculo é uma figura plana.',
            'NÃO É ISSO! A pirâmide tem superfícies planas.',
            'NÃO É ISSO! O cubo tem partes planas.'
          ],'Uma esfera.'),
          question(3,2,'Qual sólido geométrico tem uma base circular e uma ponta?',['cubo','esfera','cone','cilindro'],2,[
            'RESPOSTA ERRADA! O cubo não tem base circular.',
            'RESPOSTA ERRADA! A esfera não tem ponta.',
            'VOCÊ ACERTOU!',
            'RESPOSTA ERRADA! O cilindro tem 2 bases circulares.'
          ],'Um sólido geométrico com uma base circular e uma ponta.'),
          // A imagem original d4-m3-q3 mostra um cilindro; esta ilustração corresponde à pergunta.
          question(3,3,'O sólido da imagem tem faces triangulares que se encontram em uma ponta. Ele é…',['um cubo','uma esfera','uma pirâmide','um cilindro'],2,[
            'RESPOSTA ERRADA! O cubo não tem ponta.',
            'RESPOSTA ERRADA! A esfera não tem ponta.',
            'VOCÊ ACERTOU!',
            'RESPOSTA ERRADA! O cilindro não tem faces triangulares.'
          ],'Um sólido geométrico com faces triangulares que se encontram em uma ponta.','assets/imagens/questoes/3-ano/desafio-10/missao-3/piramide.svg'),
          question(3,4,'Qual destes objetos se parece com um cilindro?',figures,3,[
            'VOCÊ ERROU! Lembre-se: o dado é um cubo.',
            'VOCÊ ERROU! A bola é uma esfera.',
            'VOCÊ ERROU! O chapéu de aniversário é um cone.',
            'RESPOSTA CERTA! A lata se parece com um cilindro.'
          ],'Um dado, uma bola, um chapéu de aniversário e uma lata, identificados pelas letras A, B, C e D.'),
          // O dado da imagem corresponde a A, não ao gabarito C do roteiro.
          question(3,5,'O objeto da figura se parece com qual sólido geométrico?',['cubo','esfera','cone','cilindro'],0,[
            'MUITO BOM! O dado é um cubo.',
            'TENTE NOVAMENTE! A esfera se parece com uma bola.',
            'TENTE NOVAMENTE! O cone se parece com uma casquinha de sorvete.',
            'TENTE NOVAMENTE! O cilindro se parece com uma lata.'
          ],'Um dado.'),
          question(3,6,'Qual sólido tem somente faces planas?',['cilindro','cubo','cone','esfera'],1,[
            'NÃO FOI DESSA VEZ! O cilindro tem uma superfície curva.',
            'ISSO MESMO! O cubo só tem faces planas.',
            'NÃO FOI DESSA VEZ! O cone tem uma superfície curva.',
            'TENTE NOVAMENTE! A esfera não tem nenhuma face plana.'
          ],'Quatro sólidos geométricos identificados pelas letras A, B, C e D.'),
          // As faces do cubo são quadradas; gabarito e feedbacks haviam sido copiados da questão anterior.
          question(3,7,'No cubo da imagem, cada face tem forma de…',['quadrado','círculo','retângulo','triângulo'],0,[
            'ISSO MESMO! Cada face do cubo tem a forma de um quadrado.',
            'NÃO FOI DESSA VEZ! O círculo tem uma linha curva. Observe os lados da face do cubo.',
            'NÃO FOI DESSA VEZ! Cada face do cubo tem quatro lados iguais: é um quadrado.',
            'TENTE NOVAMENTE! O triângulo tem três lados. Observe a face do cubo.'
          ],'Um cubo com arestas visíveis e arestas ocultas tracejadas.'),
          question(3,8,'Qual figura abaixo é a planificação de um cubo?',figures,0,[
            'EXCELENTE! Você soube reconhecer o cubo planificado.',
            'OPS! Isso não forma um cubo.',
            'OPS! Isso não forma um cubo.',
            'OPS! Isso não forma um cubo.'
          ],'Quatro conjuntos de figuras planas identificados pelas letras A, B, C e D.'),
          question(3,9,'Qual figura abaixo é a planificação de um cilindro?',figures,2,[
            'OPS! Isso não forma um cilindro.',
            'OPS! Isso não forma um cilindro.',
            'MARAVILHA! Você soube reconhecer um cilindro planificado.',
            'OPS! Isso não forma um cilindro.'
          ],'Quatro conjuntos de figuras planas identificados pelas letras A, B, C e D.'),
          question(3,10,'Qual figura abaixo é a planificação de uma pirâmide?',figures,1,[
            'OPS! Isso não forma uma pirâmide.',
            'VOCÊ BRILHOU! Isso forma uma pirâmide.',
            'OPS! Isso não forma uma pirâmide.',
            'OPS! Isso não forma uma pirâmide.'
          ],'Quatro conjuntos de figuras planas identificados pelas letras A, B, C e D.')
        ]
      }
    ]
  };
  return {challenge};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = geometryMissions;
