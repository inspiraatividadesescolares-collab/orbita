const mentalCalculations = (() => {
  const sets = [
    [
      [102,53,[155,150,145,165]],
      [124,35,[150,149,159,169]],
      [213,46,[250,259,249,269]],
      [341,27,[360,358,378,368]],
      [452,16,[460,468,458,478]],
      [531,28,[559,550,549,569]],
      [602,75,[670,667,687,677]],
      [723,64,[780,777,787,797]],
      [815,32,[847,840,837,857]],
      [164,23,[180,187,177,197]]
    ],
    [
      [397,12,[400,399,409,419]],
      [286,23,[300,299,319,309]],
      [478,31,[509,500,499,519]],
      [569,24,[580,593,583,603]],
      [658,32,[680,700,710,690]],
      [187,25,[200,202,212,222]],
      [296,17,[300,313,303,323]],
      [389,26,[415,400,405,425]],
      [477,38,[500,505,515,525]],
      [568,27,[580,585,605,595]]
    ],
    [
      [306,202,[500,408,508,608]],
      [405,103,[508,500,408,608]],
      [208,304,[500,412,612,512]],
      [507,206,[700,713,613,813]],
      [609,108,[717,700,617,817]],
      [302,409,[700,611,711,811]],
      [704,105,[800,809,709,909]],
      [206,503,[700,609,809,709]],
      [408,207,[615,600,515,715]],
      [509,308,[800,717,817,917]]
    ]
  ];
  const strategies = [
    {title:'Separe as unidades',unit:10,
      instruction:'Separe as unidades dos dois números. Some as partes inteiras, depois as unidades, e reúna os resultados.',
      reminder:'Separe as unidades'},
    {title:'Some primeiro as dezenas',unit:10,
      instruction:'Decomponha em dezenas inteiras e unidades. Depois, reúna os resultados.',
      reminder:'Some primeiro as dezenas inteiras'},
    {title:'Some primeiro as centenas',unit:100,
      instruction:'Decomponha em centenas inteiras e unidades. Depois, reúna os resultados.',
      reminder:'Some primeiro as centenas inteiras'}
  ];

  function decomposition(left,right,unit) {
    const leftUnits = left % unit,rightUnits = right % unit;
    const leftBase = left - leftUnits,rightBase = right - rightUnits;
    const bases = leftBase + rightBase,units = leftUnits + rightUnits;
    return {
      steps:[
        `${left} = ${leftBase} + ${leftUnits} e ${right} = ${rightBase} + ${rightUnits}`,
        `${leftBase} + ${rightBase} = ${bases}`,
        `${leftUnits} + ${rightUnits} = ${units}`,
        `${bases} + ${units} = ${left + right}`
      ],
      hint:`${left} = ${leftBase} + ${leftUnits} e ${right} = ${rightBase} + ${rightUnits}. Some ${leftBase} + ${rightBase} e ${leftUnits} + ${rightUnits}. Depois, reúna os resultados.`
    };
  }

  const challenge = {
    title:'Desafio 11 — Cálculos mentais',
    missions:strategies.map((strategy,missionIndex) => {
      const [left,right] = sets[missionIndex][0];
      return {
        title:strategy.title,
        kicker:'CÁLCULO MENTAL: COMPOSIÇÃO E DECOMPOSIÇÃO',
        intro:`Resolva mentalmente e marque apenas uma alternativa em cada questão. ${strategy.instruction}`,
        example:{operation:`${left} + ${right}`,steps:decomposition(left,right,strategy.unit).steps},
        questions:sets[missionIndex].map(([left,right,options],questionIndex) => {
          const work = decomposition(left,right,strategy.unit);
          return {
            id:`d11m${missionIndex + 1}q${questionIndex + 1}`,
            type:'quiz',variant:'qt3',text:`Quanto é ${left} + ${right}?`,
            options:options.map(String),answer:String(left + right),
            correct:`MUITO BEM! ${work.steps.join('; ')}.`,
            incorrect:`TENTE NOVAMENTE! ${strategy.reminder}: ${work.hint}`
          };
        })
      };
    })
  };
  return {challenge};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = mentalCalculations;
