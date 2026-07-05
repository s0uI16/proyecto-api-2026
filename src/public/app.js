function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function loadPosts() {
  const container = document.getElementById("posts");

  try {
    const response = await fetch("/api/posts");
    if (!response.ok) throw new Error("No se pudieron cargar los posts.");

    const posts = await response.json();

    if (posts.length === 0) {
      container.textContent = "No hay posts todavía.";
      return;
    }

    container.innerHTML = posts
      .map((post) => {
        const title = escapeHtml(post.title);
        const author = escapeHtml(post.user?.username ?? "desconocido");
        const topic = escapeHtml(post.topic?.title ?? "sin tópico");

        return `
          <div class="post">
            <h3>${title}</h3>
            <div class="meta">Por ${author} · Tópico: ${topic}</div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    container.textContent = "Error al cargar los posts.";
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", loadPosts);
