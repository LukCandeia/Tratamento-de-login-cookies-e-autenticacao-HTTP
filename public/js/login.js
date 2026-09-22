const mensagem = document.getElementById("mensagem");

// Mostra em qual etapa/modo o servidor foi iniciado.
fetch("/modo")
  .then((r) => r.json())
  .then((d) => {
    document.getElementById("modo").textContent =
      `Modo do servidor: ${d.modo} (cookie: ${d.cookie})`;
  });

document
  .getElementById("loginForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const login = document.getElementById("login").value;
    const senha = document.getElementById("senha").value;

    const resposta = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, senha }),
    });

    const dados = await resposta.json();
    mensagem.textContent = dados.mensagem;

    if (resposta.ok) {
      // deu certo, manda pra área autenticada
      window.location.href = "/app.html";
    }
  });
