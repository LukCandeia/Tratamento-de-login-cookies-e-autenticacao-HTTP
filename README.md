# Laboratório: Cookies, HttpOnly e JWT

Node.js + Express + JavaScript Vanilla. Sem banco de dados: os usuários ficam em um array no `server.js`.

## Como executar

```bash
npm install
npm run start:simples    # Etapas 1-3: cookie simples (httpOnly: false)
npm run start:httponly   # Etapa 4: cookie HttpOnly
npm run start:seguro     # Etapa 5: HttpOnly + SameSite=Strict + Secure (false em localhost)
npm run start:jwt        # Extra: JWT dentro de cookie HttpOnly (padrão)
```

Acesse `http://localhost:3000`. Usuários: `ana / 123` e `carlos / 456`.

O mesmo `server.js` implementa todas as etapas; o modo é escolhido na inicialização para que cada fase possa ser demonstrada separadamente.

## Estrutura

```
projeto/
├── server.js
├── package.json
└── public/
    ├── index.html      (login)
    ├── app.html        (área autenticada)
    ├── css/style.css
    └── js/
        ├── login.js
        └── app.js
```

## Rotas

| Rota | O que faz |
|---|---|
| `POST /login` | Valida login/senha no array; se válido, envia o cookie (`Set-Cookie`). |
| `GET /usuario` | Lê o cookie recebido, verifica o usuário e responde 200 ou 401. |
| `POST /logout` | Remove o cookie (`clearCookie`). |
| `GET /modo` | Só informa o modo do servidor, para exibir na tela. |

## Roteiro de demonstração

1. **Cookie simples** (`start:simples`): faça login, rode `document.cookie` no console. Resultado: `usuario=1`. Confira também em DevTools → Application → Cookies.
2. **Falha proposital**: ainda no modo simples, rode `document.cookie = "usuario=2"` e recarregue `/app.html`. Você passa a ser "Carlos Souza" sem saber a senha. Isso mostra por que `usuario=<id>` não é autenticação de verdade.
3. **Logout**: clique em Sair. O cookie some e `/usuario` volta a responder 401.
4. **HttpOnly** (`start:httponly`): faça login e rode `document.cookie`. Resultado: `""`. Mesmo assim `/app.html` mostra "Olá, Ana Silva", porque o navegador continua enviando o cookie ao servidor.
5. **Secure e SameSite** (`start:seguro`): em DevTools → Application → Cookies, veja as colunas HttpOnly e SameSite marcadas.
6. **JWT** (`start:jwt`): o cookie passa a se chamar `token`, tem três partes separadas por ponto e expira em 30 minutos. Cole o valor em <https://jwt.io> para ver que o conteúdo é legível por qualquer pessoa (só não pode ser alterado sem invalidar a assinatura).

## Questões para reflexão

**1. O que é um cookie?**
Um pequeno par nome=valor que o servidor manda ao navegador e que fica guardado lá, associado ao site que o criou.

**2. Quem armazena o cookie: cliente ou servidor?**
O cliente (navegador). O servidor só o cria via `Set-Cookie` e depois lê o valor que volta.

**3. Quem envia o cookie nas próximas requisições?**
O navegador, automaticamente, no cabeçalho `Cookie` de toda requisição ao mesmo site, sem o código JavaScript precisar fazer nada.

**4. O que muda quando utilizamos HttpOnly?**
O JavaScript da página deixa de enxergar o cookie: `document.cookie` não o mostra mais. O cookie continua armazenado e sendo enviado.

**5. Por que um cookie HttpOnly continua funcionando mesmo não aparecendo em `document.cookie`?**
Porque quem envia o cookie é o navegador, não o script. `HttpOnly` só bloqueia a leitura pelo JavaScript; o envio nas requisições HTTP é um mecanismo separado e continua igual.

**6. Qual é a finalidade de Secure?**
Fazer o navegador enviar o cookie somente por HTTPS, para que ele não trafegue em texto puro numa rede onde alguém possa interceptá-lo.

**7. Qual é a finalidade de SameSite?**
Restringir o envio do cookie em requisições que partem de outros sites. Com `strict`, o cookie só vai quando a requisição nasce no próprio site, o que dificulta ataques CSRF.

**8. Qual a diferença entre armazenar simplesmente um identificador de usuário e armazenar um JWT?**
O `usuario=1` não tem proteção nenhuma: qualquer pessoa pode trocar o valor por `2`. O JWT é assinado com a chave secreta do servidor, então qualquer alteração invalida a assinatura e o `jwt.verify` rejeita. Além disso, o JWT carrega dados (id, nome, login) e tem prazo de expiração (`exp`).

**9. O conteúdo de um JWT é secreto?**
Não. Header e payload são apenas Base64URL, e qualquer um pode decodificar. A assinatura garante **integridade** (ninguém alterou), não **sigilo**. Por isso não se coloca senha ou dado sensível no payload.

**10. Por que armazenar um JWT em um cookie HttpOnly pode ser mais seguro do que disponibilizá-lo diretamente ao JavaScript?**
Se o token fica acessível ao JavaScript (por exemplo em `localStorage`), um ataque XSS consegue lê-lo e enviá-lo para o atacante, que passa a usar a sessão de outro lugar. Em cookie HttpOnly o script injetado não consegue ler o token. (O XSS ainda pode fazer requisições em nome do usuário enquanto a página estiver aberta, mas não consegue levar o token embora.)

## Limitações conhecidas (é um laboratório)

- Senhas em texto puro no código: em produção seriam hashes (bcrypt/argon2) num banco de dados.
- `JWT_SECRET` fixo no código: em produção viria de variável de ambiente.
- `Secure` fica `false` em `http://localhost`; em produção (HTTPS) o servidor usa `true` quando `NODE_ENV=production`.
- Não há mecanismo de revogação: o logout só apaga o cookie no navegador. Um JWT copiado antes continuaria válido até expirar.
