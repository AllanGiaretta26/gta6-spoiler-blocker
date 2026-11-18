# GTA 6 Spoiler Blocker

Userscript para **Tampermonkey** que esconde do feed qualquer vídeo, Short ou post que mencione GTA 6. Assim você navega até jogar sem levar spoiler.

Funciona como os filtros cosméticos do uBlock Origin, só que roda em navegadores com **Manifest V3** (Edge e Chrome), onde o uBlock Origin completo foi desativado.

| Site | O que é escondido |
|---|---|
| **YouTube** | vídeos da página inicial, da busca e da barra lateral, cards de Shorts e o card do jogo no topo da busca. No **player de Shorts**, o short de GTA é escondido, pausado e pulado automaticamente. |
| **X / Twitter** | posts da timeline e das respostas |
| **Reddit** | posts do feed (`shreddit-post`) |

> Os seletores do YouTube foram verificados em novembro de 2026. Os do X e do Reddit ainda não foram testados nas páginas atuais.

## Instalação

### 1. Instale o Tampermonkey

- **Edge:** [Tampermonkey na loja do Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- **Chrome:** [Tampermonkey na Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)

### 2. Libere os scripts de usuário (obrigatório no Manifest V3)

**Edge**
1. Abra `edge://extensions`.
2. Ligue o **Modo de desenvolvedor** (canto inferior esquerdo).
3. Clique em **Detalhes** no Tampermonkey e ative **Permitir scripts de usuário**.

**Chrome**
1. Abra `chrome://extensions`.
2. Clique em **Detalhes** no Tampermonkey e ative **Permitir scripts do usuário**. Nas versões mais antigas, basta ligar o **Modo do desenvolvedor**.

Sem esse passo o Tampermonkey instala o script, mas ele não roda.

### 3. Instale o script

**Opção A: um clique**

Abra [`gta6-spoiler-blocker.user.js` (raw)](https://github.com/AllanGiaretta26/gta6-spoiler-blocker/raw/main/gta6-spoiler-blocker.user.js). O Tampermonkey abre a tela de instalação. Clique em **Instalar**.

**Opção B: manual**
1. Clique no ícone do Tampermonkey e escolha **Criar um novo script**.
2. Apague o modelo e cole o conteúdo de [`gta6-spoiler-blocker.user.js`](gta6-spoiler-blocker.user.js).
3. Salve com **Ctrl+S**.

### 4. Teste

Recarregue o YouTube e pesquise **"GTA 6"**. Os resultados devem sumir e sobrar só o que não tem relação. Para conferir pelo console (F12):

```js
document.querySelectorAll('[data-gta-hidden]').length // quantos itens foram escondidos
```

## Personalização

Tudo o que você vai querer mudar fica no topo do script.

**Termos.** Edite o array `TERMS`. Maiúsculas e minúsculas não importam, o espaço entre as palavras é opcional (`GTA 6` também pega `GTA6` e `GTA-6`) e um termo só casa com a palavra inteira (`Lucia` não pega `Luciana`).

```js
const TERMS = ['GTA 6', 'GTA6', 'GTA VI', 'GTAVI', 'Grand Theft Auto 6', 'Grand Theft Auto VI',
  'Vice City', 'Lucia', 'Jason Duval'];
```

**Seletores.** Os sites mudam o HTML sem aviso. Quando alguma coisa voltar a aparecer, inspecione o card (botão direito → Inspecionar) e acrescente o nome da tag ao objeto `SITES`. Um seletor que não existe na página não causa erro: ele só não encontra nada.

## Como funciona

- Um `MutationObserver` observa só os nós adicionados e reavalia apenas os cards afetados, em lotes de 200 ms. O documento inteiro nunca é varrido a cada mudança.
- O script testa o texto do card e os atributos `title`, `aria-label` e `alt` dos elementos dentro dele.
- Os itens são escondidos com `display: none` por meio de um atributo (`data-gta-hidden`) e nunca removidos do DOM, para não quebrar a rolagem infinita dos sites.
- **Player de Shorts:** o player fica escondido assim que você troca de short e só reaparece se o título for limpo. O vídeo não toca enquanto está escondido, porque o áudio também pode ter spoiler. Se o short bater com os termos, o script pausa e pula para o próximo.

## Privacidade

O script **não faz nenhuma requisição de rede**, não tem dependências externas e não lê nem guarda dados seus. São cerca de 100 linhas, fáceis de auditar antes de instalar.

## Limitações conhecidas

- Uma thumbnail com "GTA 6" escrito só na imagem, sem o termo no título, passa pelo filtro.
- Termos genéricos como "Lucia" e "Vice City" também escondem conteúdo sem relação (por exemplo, o GTA Vice City de 2002). Tire esses termos da lista se incomodar.
- Nos Shorts, cada vídeo limpo leva cerca de 0,3 s para aparecer depois que você rola.
- No X, a timeline virtual pode deixar um espaço vazio onde havia um post escondido.
- Variações com acento ("Lúcia") ou abreviações novas que não estejam na lista passam.

## Licença

[MIT](LICENSE). Use, modifique e redistribua à vontade, mantendo o aviso de copyright.
