const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
// comentário de IA:
// Dá pra escolher em qual etapa o servidor sobe, tipo: node server.js simples
//   simples  -> cookie "usuario=<id>" solto, sem proteção nenhuma
//   httponly -> mesmo cookie, mas o JS da página não consegue mais ler
//   seguro   -> httponly + sameSite + secure
//   jwt      -> troca o id pelo token assinado (o desafio extra)
// Se não passar nada, sobe no modo jwt.
const MODOS = ["simples", "httponly", "seguro", "jwt"];
const MODO = process.argv[2] || process.env.AUTH_MODE || "jwt";

if (!MODOS.includes(MODO)) {
  console.error(`Modo inválido: "${MODO}". Use um destes: ${MODOS.join(", ")}`);
  process.exit(1);
}

// Numa aplicação de verdade essa chave não ficaria aqui, viria de variável de ambiente.
const JWT_SECRET = process.env.JWT_SECRET || "uma-chave-secreta";
const JWT_EXPIRACAO = "30m";
const JWT_EXPIRACAO_MS = 30 * 60 * 1000;

// Secure exige HTTPS, então em localhost precisa ficar false.
const SECURE = process.env.NODE_ENV === "production";

// Sem banco: só um array em memória mesmo, e a senha em texto puro é só pro exercício.
const usuarios = [
  { id: 1, nome: "Ana Silva", login: "ana", senha: "123" },
  { id: 2, nome: "Carlos Souza", login: "carlos", senha: "456" },
];

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

// Cookie muda de cara dependendo do modo

const NOME_COOKIE = MODO === "jwt" ? "token" : "usuario";

// Essas opções servem tanto pra criar o cookie quanto pra apagar depois —
// o navegador só apaga certinho se você mandar os mesmos atributos de quando criou.
function opcoesBase() {
  switch (MODO) {
    case "simples":
      return { httpOnly: false };
    case "httponly":
      return { httpOnly: true };
    default: // seguro e jwt
      return { httpOnly: true, sameSite: "strict", secure: SECURE };
  }
}

//Checa se quem tá pedindo realmente logou

function autenticar(req, res, next) {
  const valor = req.cookies[NOME_COOKIE];

  if (!valor) {
    return res.status(401).json({ mensagem: "Usuário não autenticado" });
  }

  if (MODO === "jwt") {
    try {
      // se alguém mexeu no token ou ele já venceu, isso aqui estoura
      req.usuario = jwt.verify(valor, JWT_SECRET);
      return next();
    } catch (erro) {
      return res.status(401).json({ mensagem: "Token inválido ou expirado" });
    }
  }

  // nos outros modos o cookie é só o id cru, então basta procurar o usuário
  const usuario = usuarios.find((u) => u.id === Number(valor));

  if (!usuario) {
    return res.status(401).json({ mensagem: "Usuário inválido" });
  }

  req.usuario = usuario;
  next();
}

// Rotas

// Só pra página saber em que modo o servidor tá e mostrar isso na tela.
app.get("/modo", (req, res) => {
  res.json({ modo: MODO, cookie: NOME_COOKIE });
});

app.post("/login", (req, res) => {
  const { login, senha } = req.body;

  const usuario = usuarios.find((u) => u.login === login && u.senha === senha);

  if (!usuario) {
    return res.status(401).json({ mensagem: "Login ou senha inválidos" });
  }

  if (MODO === "jwt") {
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, login: usuario.login },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRACAO },
    );

    res.cookie("token", token, { ...opcoesBase(), maxAge: JWT_EXPIRACAO_MS });
  } else {
    res.cookie("usuario", usuario.id.toString(), opcoesBase());
  }

  res.json({ mensagem: "Login realizado com sucesso" });
});

app.get("/usuario", autenticar, (req, res) => {
  res.json({
    id: req.usuario.id,
    nome: req.usuario.nome,
    login: req.usuario.login,
  });
});

app.post("/logout", (req, res) => {
  // aqui não precisa de maxAge, só dos mesmos atributos usados pra criar o cookie, UTILIZEI IA (não tinha entendido)
  res.clearCookie(NOME_COOKIE, opcoesBase());
  res.json({ mensagem: "Logout realizado" });
});

app.listen(PORT, () => {
  console.log(
    `Servidor em http://localhost:${PORT}  |  modo: ${MODO}  |  cookie: ${NOME_COOKIE}`,
  );
});
