/* Discoveries use the same wallet and journal as the student's existing collection. */
const worldJournalRanks = ['Observador do Céu','Aprendiz Espacial','Cadete das Estrelas','Piloto de Foguete','Explorador de Planetas','Navegador de Constelações','Capitão da Órbita','Comandante Galáctico','Guardião do Cosmos','Mestre do Universo'];
const systemStar = {id:'aura-rubre',name:'Aura Rubre',system:'Aura Rubre',unlockStars:15,image:'aura-rubre.png',description:'Aura Rubre ilumina este sistema. Nove planetas giram ao seu redor, cada um com seu próprio tamanho e sua própria órbita.'};
const worldDiscoveries = [
  {
    id:'lamalume', name:'Lamalume', system:'Aura Rubre', planetNumber:2, unlockStars:10,
    items:[
      {slug:'planeta-lamalume',title:'O planeta Lamalume visto do espaço',mapImage:'assets/imagens/mundos/aura-rubre/lamalume.png',price:650,curiosity:'Muito além das rotas conhecidas, depois das dobras do tempo e da imaginação, existe um planeta chamado Lamalume. Visto do espaço, ele parece uma enorme bola de chocolate derretido.'},
      {slug:'chuva-em-lamalume',title:'Os habitantes do planeta Lamalume',price:350,curiosity:'Toda a superfície do planeta Lamalume é coberta pelo Grande Lago de Lama, porque chove a maior parte do tempo. Neste grande lago, vivem criaturas totalmente feitas de lama.'},
      {slug:'problema-da-vaidade',title:'Vaidade: maior motivo de conflito entre os lamalumenses',price:450,curiosity:'Embora, em tempos líquidos, ninguém possa distinguir um lamalumense do outro, essas criaturas são muito orgulhosas da sua beleza física; tanto que o maior problema político de Lamalume é a vaidade extrema dos seus habitantes. Cada lamalumense se considera mais bonito que o outro e não admite nenhuma crítica à sua aparência.'},
      {slug:'sol-de-lamalume',title:'A estrela Aura Rubre vista do planeta Lamalume',price:600,curiosity:'Devido à sua órbita elíptica, uma vez por ano, o planeta Lamalume fica bem perto da estrela Aura Rubre. É o período que os lamalumenses chamam de tempo seco, que seria o equivalente ao nosso verão.'},
      {slug:'saindo-da-lama',title:'O período seco em Lamalume',price:500,curiosity:'O calor seca uma parte do planeta e as criaturas de lama saem do lago, se separam dos outros e dão formas aos seus corpos.'},
      {slug:'lamalumense-de-bigode',title:'Lamalumense desenhando um bigode no rosto',price:400,curiosity:'Alguns habitantes de Lamalume tomam formas compridas como cipós e passam horas desenhando um bigode.'},
      {slug:'lamalumense-redonda',title:'Lamalumense fazendo covinhas nas bochechas',price:400,curiosity:'Outros preferem contornos arredondados e gostam de fazer covinhas nas bochechas, com os dedos.'},
      {slug:'lamalumense-quadrado',title:'Lamalumense quadrado, esculpindo dentes perfeitos',price:400,curiosity:'Há também quem se molde em formas quadradas e dê a si mesmo dentes perfeitos, embora os lamalumenses não precisem de dentes para comer, pois se alimentam de lama.'},
      {slug:'lamalumense-triangular',title:'Lamalumense triangular, moldando um nariz',price:400,curiosity:'Também não faltam os que preferem a forma triangular, moldando narizes finos e compridos.'},
      {slug:'concepcao',title:'Dois lamalumenses em ritual de amor e reprodução',price:350,curiosity:'É durante esse festival de formas que acontecem os encontros amorosos. Quando dois lamalumenses desejam continuar ligados, eles retiram um pequeno punhado de lama de seus próprios corpos e misturam as duas porções dentro de uma concha.'},
      {slug:'nascimento',title:'Nascimento de um bebê em Lamalume',price:500,curiosity:'A concha é enterrada na margem do lago e se transforma em um casulo de barro. Depois das primeiras chuvas, o casulo se abre e um pequeno monstrinho de lama escorrega para dentro do lago.'},
      {slug:'pergunta',title:'Visitante em Lamalume',price:600,curiosity:'Uma coisa curiosa sobre o planeta Lamalume é que seus habitantes adoram receber visitantes. Quando chega alguém de outro planeta, os homens de lama correm em sua direção com uma única pergunta nos lábios (que, aliás, é tudo o quanto desejam saber):\n\n— Sou bonito?'}
    ]
  },
  {
    id:'planeta-42', name:'42', system:'Aura Rubre', planetNumber:3, unlockStars:6,
    items:[
      {slug:'planeta-42',title:'Planeta 42 visto do espaço',mapImage:'assets/imagens/mundos/aura-rubre/planeta-42.png',price:650,curiosity:'A cem anos-luz de distância, já é possível avistar a enorme névoa que envolve o Planeta 42.'},
      {slug:'planeta-enfumaçado',title:'Atmosfera do Planeta 42',price:350,curiosity:'Essa névoa nada mais é do que a fumaça que sai dos cérebros dos nove bilhões de seres vivos que habitam o planeta.\n\n— E por que sai fumaça do cérebro deles? — alguém pode perguntar.\n\nEu posso responder: porque a população do Planeta 42 é formada por matemáticos que passam o dia e a noite fazendo contas.'},
      {slug:'habitante-planeta-42',title:'Matemático envolvido pela fumaça do seu pensamento',price:450,curiosity:'Eles pensam tanto, mas tanto, que a fumaça começa a sair de suas cabeças.\n\nE, por falar em cabeça, a dos habitantes do Planeta 42 é duas vezes maior que o restante do corpo. Seus braços e pernas são curtos, e eles possuem somente três dedos em cada mão. Se não fosse a enorme quantidade de cabelo sobre suas cabeças e, no caso dos homens, as longas barbas em seus queixos, eu diria que essas criaturas se parecem com bebês que ainda estão se formando na barriga de suas mães.'},
      {slug:'cidade-no-planeta-42',title:'A capital do Planeta 42',price:600,curiosity:'Apesar de muito inteligentes, os matemáticos são pouco criativos. Prova disso é que tudo se parece no Planeta 42. As casas são formadas por figuras geométricas simétricas, as copas das árvores são círculos perfeitos e as ruas são todas retas.'},
      {slug:'parque-de-diversao-planeta-42',title:'Parque de diversões do Planeta 42',price:500,curiosity:'Tudo é muito cinzento no Planeta 42, até mesmo os parques de diversões. Em vez de escorregadores e balanços, as crianças brincam com números e sinais das operações matemáticas.'},
      {slug:'bebe-planeta-42',title:'Nascimento de um bebê no Planeta 42',price:550,curiosity:'Quando nascem, os bebês não ganham ursinhos de pelúcia nem roupinhas do Homem-Aranha. Cada um recebe logo uma calculadora.'},
      {slug:'matematico-contando-estrelas',title:'Matemático especialista na contagem de estrelas',price:400,curiosity:'Mas que contas fazem os matemáticos do Planeta 42?\n\nOra, eles contam tudo!\n\nContam as estrelas do céu.'},
      {slug:'matematico-contando-areia',title:'Matemático especialista na contagem de grãos de areia',price:400,curiosity:'Contam os grãos de areia das praias.'},
      {slug:'matematico-contando-gotas-do-mar',title:'Matemático especialista na contagem de gotas de água do mar',price:400,curiosity:'Contam as gotas de água dos mares.'},
      {slug:'matematico-contando-a-chuva',title:'Matemático especialista na contagem de pingos de chuva',price:350,curiosity:'Quando chove, contam até mesmo os pingos de chuva.'},
      {slug:'matematico-doente',title:'Matemático que perdeu a conta',price:500,curiosity:'E não há nada mais triste do que um matemático do Planeta 42 quando perde a conta. É como se ele ficasse doente.'},
      {slug:'matematico-conversando-com-capitao',title:'O capitão da Expedição Órbita conversando com um matemático do Planeta 42',price:300,curiosity:'O mais impressionante é que quando o capitão da Expedição Órbita chegou ao planeta 42 e perguntou:\n\n— Quantas são as estrelas do céu? E os grãos de areia da praia? E as gotas de água do mar? E os pingos da chuva?\n\nNenhum matemático soube responder.'}
    ]
  },
  {
    id:'mecano', name:'Mecano', system:'Aura Rubre', planetNumber:8, unlockStars:6,
    items:[
      {slug:'planeta-mecano',title:'O planeta Mecano visto do espaço',mapImage:'assets/imagens/mundos/aura-rubre/mecano.png',price:650,curiosity:'Dois anos-luz depois da dobra do tempo, existe um pequeno planeta chamado Mecano. Ele é um dos astros mais brilhantes do espaço, pois sua superfície é quase toda formada por aço, alumínio e silício. No sistema estelar de Aura Rubre, o planeta Mecano reluz como um gigantesco espelho prateado.'},
      {slug:'chuva-no-planeta-mecano',title:'Chuva no planeta Mecano',price:350,curiosity:'No planeta Mecano, as chuvas ocorrem somente uma vez a cada 72 anos e, em vez de serem recebidas com alegria, provocam grande preocupação.'},
      {slug:'maquinas-enferrujadas',image:'assets/imagens/mundos/mecano/maquina-enferrujada.png',title:'Máquinas que se enferrujaram com a última chuva no planeta Mecano',price:450,curiosity:'Isso acontece porque os habitantes do planeta são máquinas pensantes, construídas com uma grande quantidade de aço. Durante o período chuvoso, elas precisam permanecer protegidas para evitar que seus corpos enferrujem e seus mecanismos sejam danificados.'},
      {slug:'maquinas-em-duvida',image:'assets/imagens/mundos/mecano/confusao.png',title:'Quem terá criado a primeira máquina no Planeta Mecano?',price:600,curiosity:'Entretanto, a chuva não é o maior problema enfrentado pela população. A questão mais grave do planeta Mecano é de natureza política e filosófica: as máquinas não sabem quem as criou — nem com qual finalidade.'},
      {slug:'ser-humano-construindo-maquina',title:'Teoria sobre a origem da vida no Planeta Mecano',price:500,curiosity:'Muitas acreditam que foram criadas por seres orgânicos que desapareceram há trilhões de anos.'},
      {slug:'maquinas-construindo-maquinas',title:'Máquinas construindo máquinas no Planeta Mecano',price:550,curiosity:'Segundo essa teoria, os antigos criadores teriam construído uma máquina capaz de produzir outras máquinas. Estas, por sua vez, teriam fabricado outras máquinas e, assim, inúmeras gerações de máquinas foram se sucedendo até que a lembrança da sua origem se apagou completamente.'},
      {slug:'maquinas-na-mesa-do-bar',image:'assets/imagens/mundos/mecano/maquinas-na-mesma-do-bar.png',title:'Máquinas do Planeta Mecano conversando sobre a origem da vida',price:400,curiosity:'Sem conhecer seus primeiros criadores, as máquinas do planeta Mecano não podem saber por que existem. Muitas defendem que devem continuar construindo novas máquinas, pois essa seria a missão deixada pelos seus criadores. Mas nem todas concordam com isso. Algumas afirmam que cada máquina deveria escolher livremente o sentido da própria existência. Assim, as discussões nas mesas dos bares são intermináveis.'},
      {slug:'discussao-politica',title:'Conflitos políticos no Planeta Mecano',price:400,curiosity:'Essas diferentes ideias dividem a população e provocam discussões e conflitos por todo o planeta.'},
      {slug:'teoria-do-ovo',title:'O ovo de Silício',price:400,curiosity:'Existe também uma crença bem mais antiga e misteriosa. Um pequeno grupo afirma que toda a vida mecânica surgiu de um enorme Ovo de Silício, abandonado no planeta há trilhões de anos.'},
      {slug:'maquina-construindo-maquina-da-casca-do-ovo',title:'Máquina do ovo de Silício construindo a primeira máquina',price:350,curiosity:'De acordo com essa tradição, do Ovo saiu a primeira máquina, que teria poderes transcendentais, ou seja, que seria capaz de acessar a utilidade de todas as coisas. Ela teria revelado a função das máquinas pensantes para a segunda máquina, que ela mesma construiu usando fragmentos do ovo de silício. Com o tempo, as sucessivas gerações de máquinas se afastaram deste conhecimento primordial, que será novamente revelado quando o Ovo Sagrado retornar.'},
      {slug:'sentido-da-vida',title:'Máquinas indagam os visitantes sobre o sentido da vida',price:500,curiosity:'Por causa dos conflitos filosóficos e políticos, o visitante Órbita que ousou pisar no solo do planeta brilhante, quase foi destruído pelas máquinas pensantes, porque ousou expressar uma opinião diferente.'},
      {slug:'maquinas-atacando',title:'Máquinas atacando o visitante Órbita',price:300,curiosity:'O fato é que, no planeta Mecan, assim como na Terra, ninguém sabe dizer, com certeza, se a vida realmente tem sentido.'}
    ]
  },
  {
    id:'aerivia', name:'Aerívia', system:'Aura Rubre', planetNumber:9, unlockStars:8,
    items:[
      {slug:'planeta-aerivia',title:'O planeta Aerívia visto do Espaço',mapImage:'assets/imagens/mundos/aura-rubre/aerivia.png',price:650,slot:'planet',curiosity:'Aerívia é o nono planeta do sistema estelar Aura Rubre. Visto do espaço, ele se parece um pouco com a Terra, por causa da sua cor azulada, mas, ao contrário do nosso planeta, ele não possui nenhum elemento sólido.'},
      {slug:'rios-suspensos',title:'Rios suspensos no planeta Aerívia',price:350,slot:'river',curiosity:'Em Aerívia, tudo flutua. Os ventos são tão fortes que carregam as gotas de água, formando rios suspensos.'},
      {slug:'aeriviano',title:'Habitante do planeta Aerívia',price:450,slot:'resident',curiosity:'Os habitantes de Aerívia são chamados de aerivianos. Eles possuem corpos leves e elásticos, braços compridos e pés que balançam no ar como se fossem bandeirinhas e cabeças enfiadas em nuvens.'},
      {slug:'aeriviano-alegre',title:'Aeriviano de bom-humor',price:450,slot:'happy',curiosity:'Cada aeriviano possui sua própria nuvem, que o acompanha desde o nascimento. Essas nuvens mudam de cor conforme o humor de seus donos. Quando um aeriviano está alegre, sua nuvem fica cor-de-rosa.'},
      {slug:'aeriviano-com-medo',title:'Aeriviano com medo',price:600,slot:'afraid',curiosity:'Quando um habitante deste planeta sente medo, sua nuvem se torna roxa.'},
      {slug:'aeriviano-zangado',title:'Aeriviano zangado',price:500,slot:'angry',curiosity:'Quando um aeriviano fica zangado, pequenos relâmpagos começam a estalar sobre suas orelhas.'},
      {slug:'casa-em-aerivia',title:'Casa flutuante no planeta Aerívia',price:550,slot:'house',curiosity:'As casas também flutuam. Elas são feitas dentro de bolhas enormes, formadas por várias camadas de vapor.'},
      {slug:'correio-em-aerivia',title:'Correio em Aerívia',price:400,slot:'mail',curiosity:'Como os ventos nunca param, as casas mudam de lugar o tempo todo. Por isso, ninguém possui endereço fixo. As cartas são entregues por pequenas correntes de ar treinadas para reconhecer o cheiro do destinatário.'},
      {slug:'viagem-com-guarda-chuvas',title:'Aeriviano viajando com guarda-chuvas',price:400,slot:'umbrella',curiosity:'Em Aerívia não existem ruas. Para viajar, os habitantes aproveitam as correntes de vento. Alguns usam grandes guarda-chuvas.'},
      {slug:'viagem-com-pipas',title:'Aeriviano viajando com pipa',price:400,slot:'kite',curiosity:'Há também habitantes que preferem viajar com pipas amarradas à cintura.'},
      {slug:'aeriviana-correndo-atras-da-panela',title:'Aeriviana fazendo o jantar',price:350,slot:'chase',curiosity:'Apesar de viver com a cabeça entre as nuvens, os aerivianos não são nada distraídos. Ao contrário, viver perseguindo a própria casa, a escola, os materiais de trabalho etc., exige muita atenção e é muito cansativo.'},
      {slug:'o-peso-da-vida',title:'Quanto pesa a vida em Aerívia?',price:500,slot:'weight',curiosity:'Quando o visitante Órbita chegou em Aerívia, quis saber por que os habitantes pareciam tão cansados. Afinal, quanto pesa uma vida tão leve?'}
    ]
  }
];
const worldAccessDestinations = [systemStar, ...worldDiscoveries];
const worldMapSlots = ['planet','river','resident','happy','afraid','angry','house','mail','umbrella','kite','chase','weight'];
const worldJournalItems = worldDiscoveries.flatMap(world => world.items.map((item,index) => ({
  ...item,
  slot:item.slot || worldMapSlots[index],
  mapTitle: world.mapTitles?.[item.slot] || item.title,
  id:`${world.id}-${item.slug}`,
  worldId:world.id,
  worldName:world.name,
  system:world.system,
  planetNumber:world.planetNumber,
  image:item.image || `assets/imagens/mundos/${world.id}/${item.slug}.png`
})));
