// Radar do YouTube (multi-nicho) - nó "Execucao abortada": monta a linha da aba execucoes quando não há o que fazer hoje
// (ciclo já completo, nenhum nicho ativo ou cota do dia sem espaço para o próximo nicho).
const d = $input.first().json;
return [{
  json: {
    execucao: {
      data_execucao: d.agora_br,
      modo: d.modo,
      palavras_usadas: '',
      chamadas_search_list: 0,
      unidades_cota_estimadas: 0,
      videos_encontrados: 0,
      videos_apos_filtros: 0,
      linhas_gravadas: 0,
      erros: '',
      observacoes: 'SEM BUSCA: ' + d.motivo + ' | ciclo ' + d.ciclo + '; limite ' + d.limite_search_dia + ' chamadas/dia; já usadas hoje ' + d.chamadas_ja_usadas_hoje + '; nichos ativos ' + d.nichos_ativos,
    },
  },
}];
