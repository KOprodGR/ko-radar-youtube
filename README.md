# KO Radar · YouTube

Radar de **outliers em YouTube Shorts**, feito como workflow do [n8n](https://n8n.io). Todo dia ele busca Shorts em português por nicho, separa os vídeos que renderam muitas views em **canais pequenos** e entrega um ranking de nichos e de vídeos por e-mail e em uma planilha do Google.

Serve para descobrir **temas e padrões de título que estão funcionando**. É um sinal de pesquisa, não de cópia: o conteúdo do seu canal continua sendo original.

> **Status:** testado em modo manual (novembro de 2026). O workflow vem **desativado** (`"active": false`) e você decide quando ligar. Veja [Limitações](#limitações-e-pontos-de-atenção).

## O que ele faz

1. Lê da planilha os **nichos ativos** (cada um com 1 a 5 palavras-chave).
2. Busca Shorts por palavra-chave (`search.list`), ordenados por views, nos últimos 14 dias (configurável).
3. Detalha os vídeos (`videos.list`) e os canais (`channels.list`) em lotes de 50.
4. Filtra por duração, idioma, inscritos e views mínimas.
5. Calcula, por vídeo: **outlier**, velocidade de views, engajamento, padrão do título e idade do canal.
6. Calcula, por nicho, uma **pontuação** e monta o ranking.
7. Grava na planilha e manda **um e-mail HTML por ciclo** com o ranking e o top de cada nicho.

### Como as métricas são calculadas

| Métrica | Fórmula |
|---|---|
| **Outlier** | `views ÷ max(inscritos, 500)` |
| **Velocidade** | views por hora desde a publicação |
| **Engajamento** | `(curtidas + comentários) ÷ views` |
| **Padrão do título** | `numero_no_inicio`, `aspas`, `pergunta`, `termo_tecnico_isolado` ou `outro` |
| **Canal novo** | `sim` se o canal tem menos de 6 meses |
| **Pontuação do nicho** | `canais pequenos distintos × mediana do outlier × (1 − parcela de views do maior canal)` |

A pontuação sobe quando **muitos canais pequenos** vão bem **sem depender de um só**.

Um vídeo só entra no resultado se passar em todos os filtros: duração máxima (padrão 90 s), idioma, canal com até 50.000 inscritos (e inscritos visíveis) e pelo menos 5.000 views.

### Ciclo e cota

- O **ciclo** é o domingo da semana. O gatilho roda **todo dia às 04:00**.
- Cada dia ele processa os próximos nichos do ciclo, **um nicho inteiro por vez**, até a cota diária (`limite_search_dia`) acabar. O que sobra continua no dia seguinte.
- O **e-mail sai uma vez por ciclo**, no dia em que o último nicho termina. No teste manual, sai sempre.
- Sem nada a fazer, o dia só registra "SEM BUSCA" na aba `execucoes`.

## Estrutura do repositório

```
ko-radar-youtube/
├── README.md
├── workflow/
│   └── ko-radar-youtube.workflow.json   # workflow do n8n (sem credenciais, inativo)
├── nodes/                               # código de cada nó "Code", para ler e revisar
│   ├── montar-buscas.js                 # escolhe os nichos que cabem na cota e monta as buscas
│   ├── consolidar-buscas.js             # junta e deduplica os resultados do search.list
│   ├── consolidar-videos.js             # duração, idioma, estatísticas
│   ├── pontuar.js                       # filtros, métricas e ranking de nichos
│   ├── montar-email.js                  # e-mail HTML do ciclo
│   ├── linhas-ranking.js                # linhas da aba ranking_nichos
│   └── execucao-abortada.js             # registro de dia sem busca
├── planilha/                            # modelos CSV das abas (cabeçalhos prontos)
└── docs/
    └── PLANILHA.md                      # colunas de cada aba e chaves da config
```

Os arquivos de `nodes/` são **idênticos** ao código dentro do JSON do workflow. Eles existem só para facilitar a leitura e o versionamento.

## Requisitos

- Uma instância do **n8n** (local ou na nuvem).
- Um projeto no **Google Cloud** com a **YouTube Data API v3** ativada.
- Três credenciais no n8n: **Google Sheets OAuth2**, **YouTube OAuth2** e **Gmail OAuth2**.

## Instalação

1. **Crie a planilha.** Crie um Google Sheets com cinco abas (`config`, `nichos`, `resultados`, `ranking_nichos`, `execucoes`) e importe os modelos da pasta [`planilha/`](planilha/) (um CSV por aba). Detalhes em [`docs/PLANILHA.md`](docs/PLANILHA.md).
2. **Preencha a config.** Na aba `config`, coloque seu e-mail em `email_destino`.
3. **Aponte o workflow para a sua planilha.** Abra `workflow/ko-radar-youtube.workflow.json` e troque `SEU_ID_DA_PLANILHA` pelo ID da sua planilha (o trecho da URL entre `/d/` e `/edit`).
4. **Importe no n8n.** Em *Workflows → Import from File*, escolha o JSON.
5. **Ligue as credenciais.** Em cada nó que mostrar `CONFIGURAR`, selecione sua credencial (Google Sheets, YouTube e Gmail).
6. **Teste.** Abra o workflow e rode o gatilho **Teste manual**. Ele usa só alguns nichos (`teste_num_nichos`) e poucas palavras por nicho (`teste_palavras_por_nicho`), e envia sempre o e-mail.
7. **Ative** o workflow só depois de conferir o e-mail e a planilha.

## Configuração

Todas as chaves ficam na aba `config` (colunas `chave` e `valor`). Os valores abaixo são os **padrões do código**, usados quando a chave está vazia.

| Chave | Padrão | O que faz |
|---|---|---|
| `duracao_max_s` | 90 | Duração máxima do vídeo, em segundos |
| `inscritos_max` | 50000 | Só canais com até esse número de inscritos |
| `views_min` | 5000 | Views mínimas do vídeo |
| `janela_dias` | 14 | Só vídeos publicados nos últimos N dias |
| `resultados_por_busca` | 50 | Resultados por chamada de busca (1 a 50) |
| `limite_search_dia` | 90 | Máximo de chamadas de `search.list` por dia (veja a cota) |
| `filtrar_idioma` | sim | `nao` desliga o filtro de idioma |
| `top_por_nicho_email` | 5 | Quantos vídeos de cada nicho vão no e-mail |
| `teste_num_nichos` | 3 | Nichos usados no teste manual |
| `teste_palavras_por_nicho` | 2 | Palavras por nicho no teste manual |
| `email_destino` | (vazio) | Para quem o e-mail é enviado |

Os **nichos** ficam na aba `nichos`: `nicho`, `palavras_chave` (separadas por `;`, de 1 a 5), `regionCode` (padrão `BR`), `relevanceLanguage` (padrão `pt`) e `ativo` (`sim` ou `nao`).

## Cota da API: leia antes de ligar

- `search.list` custa **100 unidades** por chamada. `videos.list` e `channels.list` custam **1 por lote de 50**.
- A cota padrão do Google é de **10.000 unidades por dia por projeto**.
- O padrão `limite_search_dia = 90` pode gastar **9.000 unidades** em um dia. Se o mesmo projeto do Google também faz **uploads de vídeo** (cada upload custa 1.600) ou outras chamadas, a cota pode estourar.
- Se você divide a cota, use algo perto de **10 chamadas por dia** (1.000 unidades). Com 12 nichos de 3 palavras, o ciclo leva cerca de 4 dias. O modelo [`planilha/config.csv`](planilha/config.csv) já vem com `limite_search_dia = 10`.
- O e-mail mostra a cota estimada de cada execução. O dia de cota do Google vira à meia-noite no fuso do Pacífico.

## Autenticação

A credencial **YouTube OAuth2** do n8n funcionou para `search.list`, `videos.list` e `channels.list` nos testes. Se aparecer o erro `ACCESS_TOKEN_SCOPE_INSUFFICIENT`, o e-mail e a aba `execucoes` trazem o aviso `ESCOPO`. Nesse caso:

1. No Google Cloud, crie uma **chave de API** restrita à *YouTube Data API v3*.
2. No n8n, crie uma credencial **Query Auth** com o nome `key` e a chave no valor.
3. Nos três nós HTTP do radar, troque a autenticação para *Generic Credential Type → Query Auth*.

**Nunca coloque chaves ou tokens em arquivos do repositório.** Elas ficam só nas credenciais do n8n.

## Limitações e pontos de atenção

- **Idioma.** `relevanceLanguage=pt` e `regionCode=BR` **não garantem** vídeos em português. Nos testes, a maioria dos resultados brutos estava em outros idiomas. Por isso existe o filtro de idioma, baseado no idioma declarado pelo canal e, sem declaração, numa heurística simples sobre o título. O valor `pt` também aceita `pt-pt`, e muitos canais brasileiros declaram `pt-pt`. Por isso o filtro usa `pt`, e não `pt-br`.
- **Inscritos ocultos.** Canais que escondem o número de inscritos ficam fora do ranking (só são contados no funil).
- **Limite do Google Sheets.** Os nós de leitura da planilha usam `executeOnce`. Sem isso, o workflow chegou a estourar o limite de 60 leituras por minuto do Google Sheets (erro 429).
- **Cota do dia.** A contagem de chamadas do dia vem da aba `execucoes`, então só enxerga as chamadas feitas por este radar.
- **Teste curto.** Um teste real com 3 nichos × 2 palavras fez 6 chamadas de busca e gastou cerca de 609 unidades. Os resultados mudam muito de um nicho para outro, e os números de um teste não servem de regra.
- O workflow foi testado **manualmente**. Antes de ligar o gatilho diário, rode o teste manual e confira o e-mail e a planilha.

## Uso responsável

O radar usa só a **API oficial** do YouTube (YouTube Data API v3) e respeita a cota. Siga os [Termos de Serviço dos serviços de API do YouTube](https://developers.google.com/youtube/terms/api-services-terms-of-service). Os dados servem para **pesquisa de tema e de padrão**; não copie conteúdo de outros criadores.

## Ideias futuras (não implementadas)

- Aba com **métricas do próprio canal** por vídeo (tempo assistido, % assistido, inscritos ganhos) via YouTube Analytics API, para comparar com o que o radar mostra. Exige o escopo `yt-analytics.readonly`.

## Licença

[MIT](LICENSE) © 2026 KO Production.
