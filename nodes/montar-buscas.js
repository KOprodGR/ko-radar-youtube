// Radar do YouTube (multi-nicho) - nó "Montar buscas": escolhe os nichos que cabem na cota do dia e monta uma busca por (nicho, palavra-chave).
// Entradas: "Ler config", "Ler nichos", "Ler ranking" (para saber quais nichos já foram feitos neste ciclo) e, como entrada deste nó, a aba execucoes (chamadas de hoje).
// Ciclo = o domingo da semana (no teste manual, "teste"). Um nicho nunca é dividido: se as palavras dele não cabem na cota de hoje, ele fica para o dia seguinte.
const cfg = {};
$('Ler config').all().forEach(function (it) {
  const r = it.json || {};
  if (r.chave !== undefined && String(r.chave).trim() !== '') cfg[String(r.chave).trim()] = r.valor;
});
const num = function (v, padrao) {
  if (v === undefined || v === null || String(v).trim() === '') return padrao;
  const n = Number(String(v).replace(',', '.'));
  return isFinite(n) ? n : padrao;
};
let modo = 'semanal';
try {
  if ($('Teste manual').isExecuted) modo = 'teste';
} catch (e) {
  modo = 'semanal';
}
const agora = new Date();
const agoraBr = agora.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).slice(0, 16); // AAAA-MM-DD HH:MM (Brasília)
const hoje = agoraBr.slice(0, 10);
const diaSemana = new Date(hoje + 'T12:00:00Z').getUTCDay(); // 0 = domingo
const domingo = new Date(Date.parse(hoje + 'T12:00:00Z') - diaSemana * 86400000).toISOString().slice(0, 10);
const ciclo = modo === 'teste' ? 'teste' : domingo;
const limite = num(cfg.limite_search_dia, 90);
let usadas = 0;
$input.all().forEach(function (it) {
  const r = it.json || {};
  if (String(r.data_execucao || '').slice(0, 10) === hoje) usadas += num(r.chamadas_search_list, 0);
});
const sim = function (v) { return ['sim', 's', 'true', '1', 'x', 'yes'].indexOf(String(v === undefined ? '' : v).trim().toLowerCase()) >= 0; };
const avisos = [];
let ativos = [];
$('Ler nichos').all().forEach(function (it) {
  const r = it.json || {};
  const nome = String(r.nicho || '').trim();
  if (!nome || !sim(r.ativo)) return;
  let kws = String(r.palavras_chave || '').split(/[;,]/).map(function (s) { return s.trim(); }).filter(Boolean);
  if (kws.length < 1) { avisos.push('nicho "' + nome + '" sem palavras-chave; ignorado'); return; }
  if (kws.length > 5) { avisos.push('nicho "' + nome + '" tem ' + kws.length + ' palavras; só as 5 primeiras valem'); kws = kws.slice(0, 5); }
  ativos.push({ nicho: nome, kws: kws, regionCode: String(r.regionCode || 'BR').trim().toUpperCase(), relevanceLanguage: String(r.relevanceLanguage || 'pt').trim().toLowerCase() });
});
const feitos = {};
$('Ler ranking').all().forEach(function (it) {
  const r = it.json || {};
  if (String(r.ciclo || '') === ciclo && r.nicho) feitos[String(r.nicho)] = true;
});
let pendentes;
if (modo === 'teste') {
  const nn = Math.max(1, Math.round(num(cfg.teste_num_nichos, 3)));
  const pp = Math.max(1, Math.round(num(cfg.teste_palavras_por_nicho, 2)));
  pendentes = ativos.slice(0, nn).map(function (n) { return Object.assign({}, n, { kws: n.kws.slice(0, pp) }); });
} else {
  pendentes = ativos.filter(function (n) { return !feitos[n.nicho]; });
}
const orcamento = Math.max(0, limite - usadas);
const escolhidos = [];
let gasto = 0;
pendentes.forEach(function (n, i) {
  if (escolhidos.length !== i) return; // já parou: o resto fica para amanhã
  let kws = n.kws;
  if (!escolhidos.length && kws.length > limite) kws = kws.slice(0, Math.max(1, limite));
  if (gasto + kws.length <= orcamento) {
    escolhidos.push(Object.assign({}, n, { kws: kws }));
    gasto += kws.length;
  }
});
const c = {
  duracao_max_s: num(cfg.duracao_max_s, 90),
  inscritos_max: num(cfg.inscritos_max, 50000),
  views_min: num(cfg.views_min, 5000),
  janela_dias: num(cfg.janela_dias, 14),
  resultados_por_busca: Math.max(1, Math.min(50, Math.round(num(cfg.resultados_por_busca, 50)))),
  filtrar_idioma: String(cfg.filtrar_idioma === undefined ? 'sim' : cfg.filtrar_idioma).trim().toLowerCase() !== 'nao',
  email_destino: String(cfg.email_destino || ''),
  top_por_nicho: Math.max(1, Math.round(num(cfg.top_por_nicho_email, 5))),
};
const restantes = pendentes.length - escolhidos.length;
const comum = {
  modo: modo, hoje: hoje, agora_br: agoraBr, ciclo: ciclo, limite_search_dia: limite, chamadas_ja_usadas_hoje: usadas,
  nichos_ativos: ativos.length, nichos_pendentes_no_inicio: pendentes.length, nichos_restantes_para_amanha: restantes,
  completo_apos: restantes === 0, avisos: avisos, cfg: c,
};
if (!escolhidos.length) {
  let motivo = 'nada a fazer';
  if (!ativos.length) motivo = 'nenhum nicho ativo na aba nichos';
  else if (!pendentes.length) motivo = 'ciclo ' + ciclo + ' já completo (todos os nichos ativos já têm ranking); nada a fazer';
  else motivo = 'cota de search.list do dia não comporta o próximo nicho (' + usadas + ' de ' + limite + ' chamadas já usadas hoje); continua amanhã';
  return [{ json: Object.assign({ abortado: true, motivo: motivo }, comum) }];
}
const apos = new Date(agora.getTime() - c.janela_dias * 86400000).toISOString();
const saida = [];
escolhidos.forEach(function (n) {
  n.kws.forEach(function (q) {
    saida.push({ json: Object.assign({ abortado: false, nicho: n.nicho, q: q, regionCode: n.regionCode, relevanceLanguage: n.relevanceLanguage, publishedAfter: apos, maxResults: c.resultados_por_busca }, comum) });
  });
});
return saida;
