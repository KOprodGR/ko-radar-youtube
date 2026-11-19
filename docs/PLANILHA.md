# Planilha do radar

A planilha tem **cinco abas**. Os cabeçalhos devem ficar **exatamente** como abaixo (os nomes são usados pelo workflow). Os modelos em CSV estão em [`../planilha/`](../planilha/).

## `config` (você preenche)

Colunas: `chave`, `valor`. Chaves vazias usam o padrão do código. A lista completa e os padrões estão no [README](../README.md#configuração).

## `nichos` (você preenche)

| Coluna | Exemplo | Observação |
|---|---|---|
| `nicho` | `Terror` | Nome que aparece no ranking |
| `palavras_chave` | `histórias de terror; creepypasta` | De 1 a 5, separadas por `;`. Acima de 5, só as 5 primeiras valem |
| `regionCode` | `BR` | Padrão `BR` |
| `relevanceLanguage` | `pt` | Padrão `pt`. Também define o idioma do filtro |
| `ativo` | `sim` | `sim`, `s`, `true`, `1`, `x` ou `yes` ativam. Qualquer outro valor desativa |

## `resultados` (o workflow grava)

Uma linha por vídeo e por nicho. A coluna `chave` é `ciclo|nicho|id do vídeo`, e o workflow grava com `appendOrUpdate` por ela. Rodar de novo no mesmo ciclo **não duplica** as linhas. Um vídeo achado em dois nichos aparece uma vez em cada.

`chave`, `ciclo`, `nicho`, `data_execucao`, `palavra_chave`, `titulo`, `link`, `canal`, `link_canal`, `canal_id`, `inscritos`, `views`, `curtidas`, `comentarios`, `duracao_s`, `publicado_em`, `outlier`, `velocidade_views_h`, `engajamento`, `padrao_titulo`, `canal_novo`, `idade_canal_meses`, `palavras_que_acharam`, `idioma`

## `ranking_nichos` (o workflow grava)

Uma linha por nicho e por ciclo. A chave é `ciclo|nicho`. É daqui que o workflow sabe quais nichos já foram feitos no ciclo.

`chave`, `ciclo`, `data_execucao`, `nicho`, `palavras_usadas`, `chamadas_search`, `videos_achados`, `videos_outlier`, `canais_pequenos`, `mediana_outlier`, `concentracao_top_canal`, `duracao_mediana_s`, `score`, `outlier_maximo`

- `videos_outlier`: vídeos que passaram em todos os filtros.
- `canais_pequenos`: canais distintos entre eles.
- `concentracao_top_canal`: parcela das views desses vídeos que pertence ao maior canal (0 a 1).
- `score`: `canais_pequenos × mediana_outlier × (1 − concentracao_top_canal)`.

## `execucoes` (o workflow grava)

Um registro por execução. A coluna `chamadas_search_list` é somada por dia para respeitar o `limite_search_dia`.

`data_execucao`, `modo`, `palavras_usadas`, `chamadas_search_list`, `unidades_cota_estimadas`, `videos_encontrados`, `videos_apos_filtros`, `linhas_gravadas`, `erros`, `observacoes`

`modo` é `semanal` (gatilho diário) ou `teste` (gatilho manual). No modo `teste`, o ciclo é gravado como `teste`.
