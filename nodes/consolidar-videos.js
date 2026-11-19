// Radar do YouTube (multi-nicho) - nó "Consolidar videos": lê o videos.list, trata vídeo sem estatísticas, converte a duração ISO 8601 e aplica o filtro de duração.
// Guarda o idioma declarado e um palpite pelo título (o filtro de idioma é aplicado por nicho no nó seguinte). Monta lotes de até 50 canais para o channels.list.
const cfg = $('Montar buscas').first().json.cfg;
const videos = {};
const erros = [];
let detalhados = 0;
let semEstatisticas = 0;
let longos = 0;
const MARCAS_PT = [' você ', ' voce ', ' não ', ' nao ', ' uma ', ' seu ', ' sua ', ' com ', ' para ', ' pra ', ' quando ', ' amor ', ' dele ', ' dela ', ' como ', ' mais ', ' isso ', ' ele ', ' ela ', ' ção', 'ções', 'ão ', 'ões '];
const MARCAS_OUTRO = [' the ', ' you ', ' your ', ' and ', ' of ', ' he ', ' she ', ' his ', ' her ', ' how ', ' why ', ' with ', ' when ', ' el ', ' los ', ' las ', ' una ', ' tu ', ' es ', ' pero ', ' le ', ' est ', ' pas ', ' und ', ' der ', ' nicht '];
const achaPt = function (titulo) {
  const t = ' ' + String(titulo || '').toLowerCase().replace(/[#!?.,:;()|"]/g, ' ').replace(/ +/g, ' ') + ' ';
  let a = 0;
  let b = 0;
  MARCAS_PT.forEach(function (m) { if (t.indexOf(m) >= 0) a += 1; });
  MARCAS_OUTRO.forEach(function (m) { if (t.indexOf(m) >= 0) b += 1; });
  return a > b;
};
const duracaoSeg = function (d) {
  const m = /^P(?:([0-9]+)D)?T?(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?$/.exec(String(d || ''));
  if (!m) return null;
  return Number(m[1] || 0) * 86400 + Number(m[2] || 0) * 3600 + Number(m[3] || 0) * 60 + Number(m[4] || 0);
};
$input.all().forEach(function (it, i) {
  const r = it.json || {};
  const corpo = r.body && typeof r.body === 'object' ? r.body : r;
  const status = Number(r.statusCode || 200);
  if (status >= 400 || corpo.error) {
    const e = corpo.error || {};
    const razao = e.errors && e.errors[0] ? String(e.errors[0].reason || '') : '';
    erros.push('videos.list lote ' + (i + 1) + ': HTTP ' + status + ' ' + razao + ' ' + String(e.message || '').slice(0, 140));
    return;
  }
  (corpo.items || []).forEach(function (v) {
    detalhados += 1;
    const est = v.statistics || {};
    if (est.viewCount === undefined) {
      semEstatisticas += 1;
      return;
    }
    const dur = duracaoSeg(v.contentDetails && v.contentDetails.duration);
    if (dur === null || dur > cfg.duracao_max_s) {
      longos += 1;
      return;
    }
    const s = v.snippet || {};
    videos[v.id] = {
      id: v.id,
      titulo: String(s.title || ''),
      canal_id: s.channelId,
      canal: String(s.channelTitle || ''),
      publicado: s.publishedAt,
      views: Number(est.viewCount),
      curtidas: est.likeCount === undefined ? null : Number(est.likeCount),
      comentarios: est.commentCount === undefined ? null : Number(est.commentCount),
      duracao_s: dur,
      declarado: String(s.defaultAudioLanguage || s.defaultLanguage || '').toLowerCase(),
      titulo_pt: achaPt(s.title) || achaPt(s.channelTitle),
    };
  });
});
const canais = [];
Object.keys(videos).forEach(function (id) {
  if (canais.indexOf(videos[id].canal_id) < 0) canais.push(videos[id].canal_id);
});
const lotes = [];
for (let i = 0; i < canais.length; i += 50) lotes.push(canais.slice(i, i + 50));
if (!lotes.length) lotes.push(['nenhum']);
return lotes.map(function (l, k) {
  const j = { ids: l.join(','), lote: k + 1 };
  if (k === 0) j.dados = { videos: videos, erros: erros, detalhados: detalhados, sem_estatisticas: semEstatisticas, acima_da_duracao: longos, lotes_videos: $input.all().length };
  return { json: j };
});
