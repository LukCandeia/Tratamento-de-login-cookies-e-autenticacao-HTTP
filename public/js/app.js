// Quem decide se você tá logado é o servidor, não a página — por isso o fetch.
// O cookie vai junto sozinho, o navegador cuida disso, mesmo sendo HttpOnly.
async function carregarUsuario() {

    const resposta = await fetch("/usuario");

    if (resposta.status === 401) {
        window.location.href = "/";
        return;
    }

    const usuario = await resposta.json();

    document.getElementById("usuario").textContent = `Olá, ${usuario.nome}`;
}

async function mostrarModo() {
    const d = await (await fetch("/modo")).json();
    document.getElementById("modo").textContent =
        `Modo do servidor: ${d.modo} (cookie: ${d.cookie})`;
}

document.getElementById("lerCookie").addEventListener("click", () => {
    document.getElementById("saidaCookie").textContent =
        document.cookie === ""
            ? 'document.cookie = "" (vazio: o cookie é HttpOnly ou não existe)'
            : `document.cookie = "${document.cookie}"`;
});

document.getElementById("logout").addEventListener("click", async () => {

    await fetch("/logout", { method: "POST" });

    window.location.href = "/";
});

carregarUsuario();
mostrarModo();
