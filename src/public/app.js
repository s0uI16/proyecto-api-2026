// ---------- Utilidades ----------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Lee la cookie 'csrfToken' (legible por JS a propósito: httpOnly:false)
// para reenviarla en el header x-csrf-token de toda petición que muta estado.
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function withCsrfHeaders(extraHeaders = {}) {
  return {
    "Content-Type": "application/json",
    "x-csrf-token": getCsrfToken() ?? "",
    ...extraHeaders,
  };
}

// ---------- Estado ----------

let currentUser = null;
let allTopics = [];

function canManage(post) {
  return !!currentUser && post.userId === currentUser.id;
}

// ---------- Sesión ----------

async function fetchCurrentUser() {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) {
      currentUser = null;
      return;
    }
    currentUser = await res.json();
  } catch {
    currentUser = null;
  }
}

function renderAuthState() {
  const loginForm = document.getElementById("loginForm");
  const sessionBox = document.getElementById("sessionBox");
  const newPostForm = document.getElementById("newPostForm");
  const label = document.getElementById("currentUserLabel");

  if (currentUser) {
    loginForm.classList.add("hidden");
    sessionBox.classList.remove("hidden");
    newPostForm.classList.remove("hidden");
    label.textContent = `Sesión: ${currentUser.username}`;
  } else {
    loginForm.classList.remove("hidden");
    sessionBox.classList.add("hidden");
    newPostForm.classList.add("hidden");
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const errorBox = document.getElementById("authError");
  errorBox.textContent = "";

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: withCsrfHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorBox.textContent = data.error || "Error al iniciar sesión.";
      return;
    }

    currentUser = data;
    renderAuthState();
    await loadPosts();
  } catch {
    errorBox.textContent = "Error de red al iniciar sesión.";
  }
}

async function handleLogout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    headers: withCsrfHeaders(),
  });
  currentUser = null;
  renderAuthState();
  await loadPosts();
}

// ---------- Tópicos ----------

async function loadTopics() {
  const select = document.getElementById("postTopic");
  try {
    const res = await fetch("/api/topics");
    allTopics = await res.json();

    select.innerHTML = allTopics
      .map((t) => `<option value="${t.id}">${escapeHtml(t.title)}</option>`)
      .join("");
  } catch {
    select.innerHTML = "";
  }
}

// ---------- Posts ----------

function renderPost(post) {
  const title = escapeHtml(post.title);
  const content = escapeHtml(post.content);
  const author = escapeHtml(post.user?.username ?? "desconocido");
  const topic = escapeHtml(post.topic?.title ?? "sin tópico");

  const actions = canManage(post)
    ? `<div class="post-actions">
         <button data-action="edit" data-id="${post.id}">Editar</button>
         <button data-action="delete" data-id="${post.id}">Borrar</button>
       </div>`
    : "";

  return `
    <div class="post" data-post-id="${post.id}">
      <h3>${title}</h3>
      <div class="meta">Por ${author} · Tópico: ${topic}</div>
      <div class="post-content">${content}</div>
      ${actions}
    </div>
  `;
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

    container.innerHTML = posts.map(renderPost).join("");
  } catch (error) {
    container.textContent = "Error al cargar los posts.";
    console.error(error);
  }
}

async function handleCreatePost(event) {
  event.preventDefault();
  const title = document.getElementById("postTitle").value;
  const topicId = document.getElementById("postTopic").value;
  const content = document.getElementById("postContent").value;
  const errorBox = document.getElementById("postError");
  errorBox.textContent = "";

  try {
    const res = await fetch("/api/posts", {
      method: "POST",
      credentials: "include",
      headers: withCsrfHeaders(),
      body: JSON.stringify({ title, content, topicId: Number(topicId) }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorBox.textContent = data.error || "Error al crear el post.";
      return;
    }

    document.getElementById("newPostForm").reset();
    await loadPosts();
  } catch {
    errorBox.textContent = "Error de red al crear el post.";
  }
}

// Edita un post en el DOM: reemplaza el contenido por un textarea + Guardar/Cancelar.
function startEditPost(postEl, postId) {
  const contentEl = postEl.querySelector(".post-content");
  const originalHtml = contentEl.innerHTML;
  const originalText = contentEl.textContent;

  contentEl.innerHTML = `
    <textarea rows="3">${escapeHtml(originalText)}</textarea>
    <button data-action="save" data-id="${postId}">Guardar</button>
    <button data-action="cancel">Cancelar</button>
  `;

  contentEl.querySelector('[data-action="cancel"]').addEventListener("click", () => {
    contentEl.innerHTML = originalHtml;
  });
}

async function saveEditedPost(postEl, postId) {
  const textarea = postEl.querySelector("textarea");
  const content = textarea.value;

  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      credentials: "include",
      headers: withCsrfHeaders(),
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "No se pudo guardar el cambio.");
      return;
    }

    await loadPosts();
  } catch {
    alert("Error de red al guardar el post.");
  }
}

async function deletePostById(postId) {
  const confirmed = confirm("¿Seguro que quieres borrar este post?");
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      credentials: "include",
      headers: withCsrfHeaders(),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "No se pudo borrar el post.");
      return;
    }

    await loadPosts();
  } catch {
    alert("Error de red al borrar el post.");
  }
}

// Delegación de eventos: un solo listener para editar/borrar/guardar en toda la lista.
function setupPostListDelegation() {
  const container = document.getElementById("posts");

  container.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const postEl = button.closest(".post");
    const postId = button.dataset.id || postEl?.dataset.postId;

    if (action === "edit") {
      startEditPost(postEl, postId);
    } else if (action === "save") {
      saveEditedPost(postEl, postId);
    } else if (action === "delete") {
      deletePostById(postId);
    }
  });
}

// ---------- Inicio ----------

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  document.getElementById("newPostForm").addEventListener("submit", handleCreatePost);
  setupPostListDelegation();

  await fetchCurrentUser();
  renderAuthState();
  await loadTopics();
  await loadPosts();
});
