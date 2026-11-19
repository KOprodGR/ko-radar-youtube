// Radar do YouTube (multi-nicho) - nó "Montar e-mail": ranking dos nichos (aba ranking_nichos do ciclo) + top N outliers de cada nicho + cota e funil.
// Teste manual: usa só os dados desta execução. Semanal: usa o que está na planilha para o ciclo (que junta os dias em que o ciclo foi sendo completado).
const p = $('Pontuar e filtrar').first().json;
const esc = function (s) {
  return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
const n = function (v) { return Number(v).toLocaleString('pt-BR'); };
const d1 = function (v) { return (Math.round(Number(v) * 100) / 100).toLocaleString('pt-BR'); };
let ranking = p.ranking;
let linhas = p.linhas;
if (p.modo !== 'teste') {
  ranking = $('Ler ranking do ciclo').all().map(function (i) { return i.json; }).filter(function (r) { return String(r.ciclo || '') === p.ciclo && r.nicho; });
  linhas = $('Ler resultados do ciclo').all().map(function (i) { return i.json; }).filter(function (r) { return String(r.ciclo || '') === p.ciclo && r.nicho; });
  ranking.forEach(function (r) { r.score = Number(r.score); });
  linhas.forEach(function (l) { l.outlier = Number(l.outlier); });
}
ranking = ranking.slice().sort(function (a, b) { return Number(b.score) - Number(a.score); });
const partes = [];
partes.push('<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:960px">');
partes.push('<h2 style="margin:0 0 6px">Radar multi-nicho</h2>');
partes.push('<p style="margin:0 0 12px;color:#555">' + esc(p.agora_br) + ' (Brasília) · ciclo ' + esc(p.ciclo) + ' · modo ' + esc(p.modo) + ' · ' + ranking.length + ' nicho(s) no ranking</p>');
if (p.erros.length) {
  partes.push('<p style="background:#fdecea;border-left:4px solid #c0392b;padding:8px 12px"><b>Avisos e erros:</b><br>' + p.erros.map(esc).join('<br>') + '</p>');
}
partes.push('<h3 style="margin:12px 0 4px">Ranking dos nichos</h3>');
partes.push('<p style="margin:0 0 6px;color:#666;font-size:12px">Pontuação = canais pequenos distintos × mediana do outlier × (1 − parcela de views do maior canal). Sobe quando há muitos canais pequenos se saindo bem, sem depender de um só.</p>');
partes.push('<table style="border-collapse:collapse;width:100%;font-size:13px">');
partes.push('<tr style="background:#2b1d24;color:#fff;text-align:left"><th style="padding:6px">#</th><th style="padding:6px">Nicho</th><th style="padding:6px;text-align:right">Vídeos outlier</th><th style="padding:6px;text-align:right">Canais pequenos</th><th style="padding:6px;text-align:right">Mediana outlier</th><th style="padding:6px;text-align:right">Maior canal (views)</th><th style="padding:6px;text-align:right">Duração mediana</th><th style="padding:6px;text-align:right">Pontuação</th></tr>');
ranking.forEach(function (r, i) {
  const fundo = i % 2 ? '#f6f1f3' : '#ffffff';
  partes.push('<tr style="background:' + fundo + '"><td style="padding:6px">' + (i + 1) + '</td><td style="padding:6px"><b>' + esc(r.nicho) + '</b></td><td style="padding:6px;text-align:right">' + n(r.videos_outlier) + '</td><td style="padding:6px;text-align:right">' + n(r.canais_pequenos) + '</td><td style="padding:6px;text-align:right">' + d1(r.mediana_outlier) + '×</td><td style="padding:6px;text-align:right">' + Math.round(Number(r.concentracao_top_canal) * 100) + '%</td><td style="padding:6px;text-align:right">' + d1(r.duracao_mediana_s) + ' s</td><td style="padding:6px;text-align:right"><b>' + d1(r.score) + '</b></td></tr>');
});
partes.push('</table>');
ranking.forEach(function (r) {
  const top = linhas.filter(function (l) { return l.nicho === r.nicho; }).sort(function (a, b) { return Number(b.outlier) - Number(a.outlier); }).slice(0, p.cfg.top_por_nicho);
  partes.push('<h3 style="margin:18px 0 4px">' + esc(r.nicho) + '</h3>');
  if (!top.length) {
    partes.push('<p style="margin:0;color:#777">Nenhum vídeo passou nos filtros neste nicho (duração ≤ ' + p.cfg.duracao_max_s + ' s, canal ≤ ' + n(p.cfg.inscritos_max) + ' inscritos, ≥ ' + n(p.cfg.views_min) + ' views, últimos ' + p.cfg.janela_dias + ' dias).</p>');
    return;
  }
  partes.push('<table style="border-collapse:collapse;width:100%;font-size:13px">');
  top.forEach(function (l, i) {
    const fundo = i % 2 ? '#f6f1f3' : '#ffffff';
    partes.push('<tr style="background:' + fundo + '"><td style="padding:5px">' + (i + 1) + '</td><td style="padding:5px"><a href="' + esc(l.link) + '">' + esc(l.titulo) + '</a>' + (l.canal_novo === 'sim' ? ' <span style="color:#b5651d">(canal novo)</span>' : '') + '</td><td style="padding:5px"><a href="' + esc(l.link_canal) + '">' + esc(l.canal) + '</a></td><td style="padding:5px;text-align:right">' + n(l.inscritos) + ' insc.</td><td style="padding:5px;text-align:right">' + n(l.views) + ' views</td><td style="padding:5px;text-align:right"><b>' + d1(l.outlier) + '×</b></td><td style="padding:5px">' + esc(l.padrao_titulo) + '</td></tr>');
  });
  partes.push('</table>');
});
const r = p.resumo;
partes.push('<h3 style="margin:18px 0 4px">Cota desta execução</h3>');
partes.push('<p style="margin:0;color:#444">search.list: ' + r.chamadas_search + ' chamada(s) (' + (r.chamadas_search * 100) + ' unidades) · total estimado: ' + n(r.unidades_cota) + ' de 10.000 unidades/dia (compartilhadas com qualquer outro uso do mesmo projeto do Google) · ids únicos ' + r.ids_unicos + ' · fora da duração ' + r.acima_da_duracao + ' · restam para os próximos dias: ' + r.restam_para_amanha + ' nicho(s)</p>');
partes.push('<p style="color:#888;font-size:12px;margin-top:16px">Sinal de tema e padrão, não de cópia: o conteúdo do canal continua original. Planilha do radar: abas resultados e ranking_nichos.</p>');
partes.push('</div>');
const assunto = (p.modo === 'teste' ? '[TESTE] ' : '') + 'Radar multi-nicho: ' + ranking.length + ' nichos (ciclo ' + p.ciclo + ')';
return [{ json: { para: p.cfg.email_destino, assunto: assunto, html: partes.join('') } }];
