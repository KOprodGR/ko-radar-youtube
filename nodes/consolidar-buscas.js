// Radar do YouTube (multi-nicho) - nó "Consolidar buscas": junta as respostas do search.list POR NICHO, tira duplicados dentro do nicho (guardando todas as palavras que
// acharam o vídeo) e monta lotes de até 50 ids ÚNICOS (de todos os nichos) para o videos.list. Erros 403 (cota, escopo) viram texto em meta.erros; nada aqui lança erro.
const buscas = $('Montar buscas').all();
const respostas = $input.all();
const porNicho = {};
const erros = [];
let chamadas = 0;
let quotaExcedida = false;
let erroEscopo = false;
respostas.forEach(function (it, i) {
  chamadas += 1;
  const b = buscas[i] && buscas[i].json ? buscas[i].json : { nicho: '?', q: '?' };
  if (!porNicho[b.nicho]) porNicho[b.nicho] = { chamadas: 0, palavras: [], ids: {} };
  const grupo = porNicho[b.nicho];
  grupo.chamadas += 1;
  if (grupo.palavras.indexOf(b.q) < 0) grupo.palavras.push(b.q);
  const r = it.json || {};
  const corpo = r.body && typeof r.body === 'object' ? r.body : r;
  const status = Number(r.statusCode || 200);
  if (status >= 400 || corpo.error) {
    const e = corpo.error || {};
    const bruto = JSON.stringify(e);
    const razao = e.errors && e.errors[0] ? String(e.errors[0].reason || '') : '';
    if (razao === 'quotaExceeded' || razao === 'dailyLimitExceeded' || razao === 'rateLimitExceeded') quotaExcedida = true;
    if (status === 403 && (bruto.indexOf('SCOPE_INSUFFICIENT') >= 0 || bruto.indexOf('insufficientPermissions') >= 0 || bruto.indexOf('insufficient authentication scopes') >= 0)) erroEscopo = true;
    erros.push('search [' + b.nicho + '] "' + b.q + '": HTTP ' + status + ' ' + razao + ' ' + String(e.message || '').slice(0, 140));
    return;
  }
  (corpo.items || []).forEach(function (v) {
    const id = v.id && v.id.videoId;
    if (!id) return;
    if (!grupo.ids[id]) grupo.ids[id] = [];
    if (grupo.ids[id].indexOf(b.q) < 0) grupo.ids[id].push(b.q);
  });
});
const unicos = {};
let duplicados = 0;
Object.keys(porNicho).forEach(function (n) {
  Object.keys(porNicho[n].ids).forEach(function (id) {
    unicos[id] = true;
    if (porNicho[n].ids[id].length > 1) duplicados += 1;
  });
});
const ids = Object.keys(unicos);
const meta = { erros: erros, chamadas_search: chamadas, quota_excedida: quotaExcedida, erro_escopo: erroEscopo, total_ids_unicos: ids.length, duplicados: duplicados, por_nicho: porNicho };
const lotes = [];
for (let i = 0; i < ids.length; i += 50) lotes.push(ids.slice(i, i + 50));
if (!lotes.length) lotes.push(['nenhum']); // videos.list com id inexistente devolve lista vazia (1 unidade) e mantém o fluxo vivo
return lotes.map(function (l, k) {
  const j = { ids: l.join(','), lote: k + 1, vazio: ids.length === 0 };
  if (k === 0) j.meta = meta;
  return { json: j };
});
