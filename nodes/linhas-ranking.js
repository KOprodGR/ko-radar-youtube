// Radar do YouTube (multi-nicho) - nó "Linhas do ranking": depois de gravar os vídeos, devolve uma linha por nicho processado (aba ranking_nichos).
return $('Pontuar e filtrar').first().json.ranking.map(function (r) { return { json: r }; });
