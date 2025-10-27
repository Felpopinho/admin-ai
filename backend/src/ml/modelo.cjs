const MLReg = require('ml-regression-multivariate-linear');
const { db } = require('../config/firebase.js');

const areas = {
  financeiro: 0,
  operacoes: 1,
  rh: 2,
  marketing: 3,
  ti: 4,
  juridico: 5,
  "p&d": 6,
  sustentabilidade: 7,
  compras: 8,
  atendimento: 9,
  qualidade: 10,
  riscos: 11,
  parcerias: 12,
};

const tipos = {
  financeira: 0,
  operacional: 1,
  pessoal: 2,
  estrategica: 3,
  marketing: 4,
  tecnologia: 5,
  juridica: 6,
  parcerias: 7,
  inovacao: 8,
  sustentabilidade: 9,
};

// Pega dados históricos do Firestore
async function pegarDadosHistorico() {
  const snapshot = await db.collection('historico_analises').get();
  const dados = [];
  snapshot.forEach(doc => dados.push(doc.data()));
  return dados;
}

// Prepara X e y para o ML, convertendo tudo para número
function prepararDados(dados) {
  const X = dados.map(d => [
    Number(areas[d.area] ?? 0),
    Number(tipos[d.tipo] ?? 0),
    Number(d.custos ?? 0),
    Number(d.lucro_estimado ?? 0),
    Number(d.prazos ?? 0),
    Number(d.produtividade ?? 0)
  ]);

  const y = dados.map(d => [Number(d.pontuacao ?? 50)]);
  return { X, y };
}

// Treina o modelo ML
async function treinarModelo() {
  const dados = await pegarDadosHistorico();
  const { X, y } = prepararDados(dados);

  if (X.length === 0 || y.length === 0) {
    console.warn('Sem dados históricos, criando modelo padrão');
    return new MLReg([[0, 0, 0, 0, 0, 0]], [[50]]);
  }

  const modelo = new MLReg(X, y);
  return modelo;
}

// Prever pontuação de uma nova decisão
async function preverPontuacao(decisao, modelo) {
  if (!modelo || typeof modelo.predict !== 'function') {
    console.error('Modelo inválido ou predict não definido');
    return {
      pontuacao: 50,
      recomendacao: 'Revisar',
      justificativa: 'Erro no modelo de ML'
    };
  }

  const input = [
    Number(areas[decisao.area] ?? 0),
    Number(tipos[decisao.tipo] ?? 0),
    Number(decisao.impacto_previsto?.custos ?? 0),
    Number(decisao.impacto_previsto?.lucro_estimado ?? 0),
    Number(decisao.impacto_previsto?.prazos ?? 0),
    Number(decisao.impacto_previsto?.produtividade ?? 0)
  ];

  const predicao = modelo.predict([input]); // retorna array [[pontuação]]
  const pontuacao = Math.round(predicao[0][0]);

  return {
    pontuacao,
    recomendacao: pontuacao >= 70 ? 'Aprovar' : pontuacao >= 40 ? 'Revisar' : 'Rejeitar',
    justificativa: 'Pontuação calculada pelo modelo de ML'
  };
}

module.exports = {
  areas,
  tipos,
  treinarModelo,
  preverPontuacao
};
