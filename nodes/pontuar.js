// Radar do YouTube (multi-nicho) - nó "Pontuar e filtrar": para CADA nicho junta canais e vídeos, aplica idioma, inscritos e views, calcula outlier, velocidade, engajamento,
// padrão do título e idade do canal, e monta a linha do ranking do nicho. Devolve UM item com as linhas, o ranking, o resumo e a linha da aba execucoes.
const base = $('Montar buscas').first().json;
const cfg = base.cfg;
const meta = $('Consolidar buscas').first().json.meta;
const dados = $('Consolidar videos').first().json.dados;
const videos = dados.videos;
const erros = [].concat(meta.erros, dados.erros, base.avisos || []);
const idiomaDoNicho = {};
$('Montar buscas').all().forEach(function (i) { idiomaDoNicho[i.json.nicho] = i.json.relevanceLanguage; });
const canais = {};
$input.all().forEach(function (it, i) {
  const r = it.json || {};
  const corpo = r.body && typeof r.body === 'object' ? r.body : r;
  const status = Number(r.statusCode || 200);
  if (status >= 400 || corpo.error) {
    const e = corpo.error || {};
    const razao = e.errors && e.errors[0] ? String(e.errors[0].reason || '') : '';
    erros.push('channels.list lote ' + (i + 1) + ': HTTP ' + status + ' ' + razao + ' ' + String(e.message || '').slice(0, 140));
    return;
  }
  (corpo.items || []).forEach(function (c) {
    const est = c.statistics || {};
    canais[c.id] = {
      titulo: String((c.snippet || {}).title || ''),
      criado: (c.snippet || {}).publishedAt,
      oculto: est.hiddenSubscriberCount === true || est.subscriberCount === undefined,
      inscritos: est.subscriberCount === undefined ? null : Number(est.subscriberCount),
    };
  });
});
const TERMOS = ['gaslighting', 'love bombing', 'narcisis', 'narcisismo', 'manipula', 'darvo', 'triangula', 'hoovering', 'flying monkey', 'abus', 'toxic', 'psicopata', 'sociopata', 'codependen', 'dissonancia', 'apego', 'creepypasta', 'serial killer', 'buraco negro', 'estoicismo', 'mitologia'];
const padraoTitulo = function (t) {
  const limpo = String(t || '').replace(/#[^ ]+/g, ' ').replace(/ +/g, ' ').trim();
  if (/^(top )?[0-9]+/i.test(limpo)) return 'numero_no_inicio';
  if (/["“”«»]/.test(limpo)) return 'aspas';
  if (limpo.indexOf('?') >= 0) return 'pergunta';
  const baixo = limpo.toLowerCase();
  const palavras = limpo.split(' ').filter(Boolean).length;
  if (palavras <= 4 && TERMOS.some(function (x) { return baixo.indexOf(x) >= 0; })) return 'termo_tecnico_isolado';
  return 'outro';
};
const arred = function (n, d) { const f = Math.pow(10, d); return Math.round(n * f) / f; };
const mediana = function (a) {
  if (!a.length) return 0;
  const s = a.slice().sort(function (x, y) { return x - y; });
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const agoraMs = Date.now();
const linhas = [];
const ranking = [];
const funil = [];
Object.keys(meta.por_nicho).forEach(function (nicho) {
  const g = meta.por_nicho[nicho];
  const lang = idiomaDoNicho[nicho] || 'pt';
  const f = { achados: Object.keys(g.ids).length, detalhados_ok: 0, outro_idioma: 0, sem_canal: 0, canal_oculto: 0, acima_de_inscritos: 0, abaixo_de_views: 0 };
  const doNicho = [];
  Object.keys(g.ids).forEach(function (id) {
    const v = videos[id];
    if (!v) return; // fora da duração, sem estatísticas ou erro no videos.list (contados em dados)
    f.detalhados_ok += 1;
    let idioma = v.declarado ? v.declarado : '?';
    if (cfg.filtrar_idioma) {
      if (v.declarado) {
        if (v.declarado.indexOf(lang) !== 0) { f.outro_idioma += 1; return; }
      } else if (lang === 'pt' && v.titulo_pt) {
        idioma = 'pt (titulo)';
      } else { f.outro_idioma += 1; return; }
    }
    const canal = canais[v.canal_id];
    if (!canal) { f.sem_canal += 1; return; }
    if (canal.oculto) { f.canal_oculto += 1; return; }
    if (canal.inscritos > cfg.inscritos_max) { f.acima_de_inscritos += 1; return; }
    if (v.views < cfg.views_min) { f.abaixo_de_views += 1; return; }
    const horas = Math.max(1, (agoraMs - Date.parse(v.publicado)) / 3600000);
    const idade = canal.criado ? (agoraMs - Date.parse(canal.criado)) / (30.4375 * 86400000) : null;
    const palavras = g.ids[id] || [];
    doNicho.push({
      chave: base.ciclo + '|' + nicho + '|' + id,
      ciclo: base.ciclo,
      nicho: nicho,
      data_execucao: base.agora_br,
      palavra_chave: palavras[0] || '',
      titulo: v.titulo,
      link: 'https://www.youtube.com/shorts/' + id,
      canal: canal.titulo || v.canal,
      link_canal: 'https://www.youtube.com/channel/' + v.canal_id,
      canal_id: v.canal_id,
      inscritos: canal.inscritos,
      views: v.views,
      curtidas: v.curtidas === null ? '' : v.curtidas,
      comentarios: v.comentarios === null ? '' : v.comentarios,
      duracao_s: v.duracao_s,
      publicado_em: v.publicado,
      outlier: arred(v.views / Math.max(canal.inscritos, 500), 2),
      velocidade_views_h: arred(v.views / horas, 1),
      engajamento: arred(((v.curtidas || 0) + (v.comentarios || 0)) / Math.max(v.views, 1), 4),
      padrao_titulo: padraoTitulo(v.titulo),
      canal_novo: idade !== null && idade < 6 ? 'sim' : 'nao',
      idade_canal_meses: idade === null ? '' : arred(idade, 1),
      palavras_que_acharam: palavras.join(' | '),
      idioma: idioma,
    });
  });
  doNicho.sort(function (a, b) { return b.outlier - a.outlier; });
  const porCanal = {};
  let totalViews = 0;
  doNicho.forEach(function (l) {
    porCanal[l.canal_id] = (porCanal[l.canal_id] || 0) + l.views;
    totalViews += l.views;
  });
  const idsCanais = Object.keys(porCanal);
  const maior = idsCanais.reduce(function (m, k) { return Math.max(m, porCanal[k]); }, 0);
  const conc = totalViews > 0 ? maior / totalViews : 0;
  const med = mediana(doNicho.map(function (l) { return l.outlier; }));
  ranking.push({
    chave: base.ciclo + '|' + nicho,
    ciclo: base.ciclo,
    data_execucao: base.agora_br,
    nicho: nicho,
    palavras_usadas: g.palavras.join('; '),
    chamadas_search: g.chamadas,
    videos_achados: f.achados,
    videos_outlier: doNicho.length,
    canais_pequenos: idsCanais.length,
    mediana_outlier: arred(med, 2),
    concentracao_top_canal: arred(conc, 3),
    duracao_mediana_s: arred(mediana(doNicho.map(function (l) { return l.duracao_s; })), 1),
    score: arred(idsCanais.length * med * (1 - conc), 2),
    outlier_maximo: doNicho.length ? doNicho[0].outlier : 0,
  });
  funil.push(Object.assign({ nicho: nicho, saida: doNicho.length }, f));
  doNicho.forEach(function (l) { linhas.push(l); });
});
ranking.sort(function (a, b) { return b.score - a.score; });
const unidades = meta.chamadas_search * 100 + dados.lotes_videos + $input.all().length;
if (meta.erro_escopo) erros.push('ESCOPO: a credencial OAuth do YouTube não tem permissão para search.list/videos.list; é preciso uma chave de API do YouTube Data API v3 (ver a seção Autenticação do README)');
if (meta.quota_excedida) erros.push('COTA: a API respondeu quotaExceeded; o relatório pode estar incompleto');
const nichosFeitos = ranking.map(function (r) { return r.nicho; });
const obs = funil.map(function (x) { return x.nicho + ': ' + x.achados + ' achados > ' + x.detalhados_ok + ' ok > idioma -' + x.outro_idioma + ' > inscritos -' + x.acima_de_inscritos + ' > views -' + x.abaixo_de_views + ' = ' + x.saida; }).join(' | ') + ' || fora da duração ' + dados.acima_da_duracao + '; sem estatísticas ' + dados.sem_estatisticas + '; duplicados no nicho ' + meta.duplicados + '; ids únicos ' + meta.total_ids_unicos + '; restam para amanhã ' + base.nichos_restantes_para_amanha + ' nicho(s)';
const resumo = { chamadas_search: meta.chamadas_search, unidades_cota: unidades, ids_unicos: meta.total_ids_unicos, duplicados_no_nicho: meta.duplicados, videos_detalhados: dados.detalhados, sem_estatisticas: dados.sem_estatisticas, acima_da_duracao: dados.acima_da_duracao, funil: funil, restam_para_amanha: base.nichos_restantes_para_amanha };
return [{
  json: {
    linhas: linhas,
    ranking: ranking,
    resumo: resumo,
    erros: erros,
    cfg: cfg,
    modo: base.modo,
    hoje: base.hoje,
    agora_br: base.agora_br,
    ciclo: base.ciclo,
    enviar_email: base.modo === 'teste' ? true : base.completo_apos === true,
    execucao: {
      data_execucao: base.agora_br,
      modo: base.modo,
      palavras_usadas: nichosFeitos.join('; '),
      chamadas_search_list: meta.chamadas_search,
      unidades_cota_estimadas: unidades,
      videos_encontrados: meta.total_ids_unicos,
      videos_apos_filtros: linhas.length,
      linhas_gravadas: linhas.length,
      erros: erros.join(' || ').slice(0, 900),
      observacoes: obs.slice(0, 1800),
    },
  },
}];
