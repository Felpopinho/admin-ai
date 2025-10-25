export function calcularPontuacao(decisao) {
  let score = 50;

  const { impacto_previsto } = decisao;

  if (!impacto_previsto) return 50;

  if (impacto_previsto.lucro_estimado > impacto_previsto.custos)
    score += 20;

  if (impacto_previsto.produtividade && impacto_previsto.produtividade > 1)
    score += 10;

  if (impacto_previsto.prazos && impacto_previsto.prazos.includes("+"))
    score -= 10;

  return Math.min(100, Math.max(0, score));
}