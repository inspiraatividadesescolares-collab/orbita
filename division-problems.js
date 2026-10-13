const divisionProblems = (() => {
  const toolsRoot = 'assets/imagens/questoes/3-ano/desafio-17/missão-3';
  const problems = [
    {text:'Lúcia comprou 10 figurinhas e vai dividi-las igualmente com sua amiga. Com quantas figurinhas Lúcia vai ficar?',total:10,divisor:2,unit:'figurinhas',answerLabel:'Figurinhas para Lúcia'},
    {text:'Lucas tem 12 figurinhas e vai colocar todas em 1 envelope. Quantas figurinhas ficarão nesse envelope?',total:12,divisor:1,unit:'figurinhas',answerLabel:'Figurinhas no envelope'},
    {text:'Pedro preparou 15 biscoitos e vai reparti-los igualmente entre 3 crianças. Quantos biscoitos cada criança receberá?',total:15,divisor:3,unit:'biscoitos',answerLabel:'Biscoitos para cada criança'},
    {text:'Bia quer guardar 12 lápis em 4 estojos, com a mesma quantidade em cada um. Quantos lápis ficarão em cada estojo?',total:12,divisor:4,unit:'lápis',answerLabel:'Lápis em cada estojo'},
    {text:'Ana tem 20 flores e vai distribuí-las igualmente em 5 vasos. Quantas flores ficarão em cada vaso?',total:20,divisor:5,unit:'flores',answerLabel:'Flores em cada vaso'},
    {text:'Uma professora vai repartir 30 folhas de papel igualmente entre 10 estudantes. Quantas folhas cada estudante receberá?',total:30,divisor:10,unit:'folhas',answerLabel:'Folhas para cada estudante'},
    {text:'Rafael tem 18 carrinhos e vai guardá-los em 3 caixas, com a mesma quantidade em cada uma. Quantos carrinhos ficarão em cada caixa?',total:18,divisor:3,unit:'carrinhos',answerLabel:'Carrinhos em cada caixa'},
    {text:'Marina vai repartir 24 botões igualmente em 4 potes. Quantos botões ficarão em cada pote?',total:24,divisor:4,unit:'botões',answerLabel:'Botões em cada pote'},
    {text:'Caio tem 25 adesivos e quer colar a mesma quantidade em cada um de seus 5 cadernos. Quantos adesivos ele colocará em cada caderno?',total:25,divisor:5,unit:'adesivos',answerLabel:'Adesivos em cada caderno'},
    {text:'Sofia vai colocar 20 balas em 10 saquinhos, com quantidades iguais. Quantas balas ficarão em cada saquinho?',total:20,divisor:10,unit:'balas',answerLabel:'Balas em cada saquinho'}
  ];
  const mission = {
    title:'Problemas envolvendo divisão',
    intro:'Use as ferramentas para resolver cada problema. Uma moldura representa cada pessoa ou recipiente, e uma tampinha representa cada objeto. Arraste as ferramentas várias vezes para criar cópias. Monte a quantidade de molduras indicada no problema e reparta todas as tampinhas igualmente entre elas. Depois, conte os objetos de um grupo, digite a resposta e confira. Você também pode selecionar uma ferramenta e tocar na área de cálculo. São 10 questões, com divisões por 1, 2, 3, 4, 5 e 10 e duas tentativas por questão. Limpar a área não recupera tentativas usadas.',
    questions:problems.map((problem,index) => {
      const answer = problem.total / problem.divisor;
      return {id:`d17m3q${index + 1}`,type:'division-calculation',...problem,answer:String(answer),
        requireArrangement:true,frameLabel:'Moldura',frameInset:[.18,.12],itemImage:`${toolsRoot}/d17-m3-b.png`,targetImage:`${toolsRoot}/d17-m3-a.png`,
        spokenText:`${problem.text} Use uma moldura para cada grupo e uma tampinha para cada objeto. Reparta os objetos igualmente e depois digite sua resposta.`,
        correct:`MUITO BEM! ${problem.total} ÷ ${problem.divisor} = ${answer}. ${index === 0 ? `Lúcia ficará com ${answer} figurinhas.` : `Cada grupo ficou com ${answer} ${problem.unit}.`}`,
        incorrect:`Conte as tampinhas de uma moldura. Você repartiu ${problem.total} ${problem.unit} em ${problem.divisor} ${problem.divisor === 1 ? 'grupo' : 'grupos iguais'}.`};
    })
  };
  return {mission};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = divisionProblems;
