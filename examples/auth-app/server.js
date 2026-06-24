import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";

const port = Number(process.env.PORT || 4321);

const users = [
  {
    id: "1",
    email: "alice@example.test",
    password: "password123",
    role: "member",
    privateNote: "Alice draft launch notes",
  },
  {
    id: "2",
    email: "bob@example.test",
    password: "password123",
    role: "admin",
    privateNote: "Bob admin checklist",
  },
];

const sessions = new Map();
const posts = [
  { id: "1", ownerId: "1", title: "Hello from Alice", body: "First post" },
];

function hash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function html(title, body) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
  </head>
  <body>
    <main>
      ${body}
    </main>
  </body>
</html>`;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    ...headers,
  });
  res.end(body);
}

function redirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, ...headers });
  res.end();
}

function parseCookies(req) {
  const cookie = req.headers.cookie || "";
  return Object.fromEntries(
    cookie
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value),
  );
}

function currentUser(req) {
  const { sid } = parseCookies(req);
  const userId = sid ? sessions.get(sid) : undefined;
  return users.find((user) => user.id === userId);
}

async function readForm(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  return new URLSearchParams(body);
}

function requireUser(req, res) {
  const user = currentUser(req);
  if (!user) {
    redirect(res, "/");
    return undefined;
  }
  return user;
}

function loginPage(message = "") {
  return html(
    "Auth Fixture",
    `
      <h1>Auth Fixture</h1>
      <p>This local-only app is intentionally small and disposable.</p>
      ${message ? `<p><strong>${message}</strong></p>` : ""}
      <form method="post" action="/login">
        <label>Email <input name="email" value="alice@example.test"></label>
        <label>Password <input name="password" type="password" value="password123"></label>
        <button>Sign in</button>
      </form>
      <p>Try alice@example.test / password123 or bob@example.test / password123.</p>
    `,
  );
}

function dashboardPage(user) {
  const visiblePosts = posts
    .map(
      (post) => `
        <li>
          <strong>${post.title}</strong>
          <span>owner hash ${hash(post.ownerId)}</span>
        </li>
      `,
    )
    .join("");

  return html(
    "Dashboard",
    `
      <h1>Dashboard</h1>
      <p>Signed in as ${user.email} (${user.role})</p>
      <nav>
        <a href="/profile?id=${user.id}">My profile</a>
        <a href="/profile?id=2">Admin profile</a>
        <a href="/logout">Log out</a>
      </nav>
      <h2>Posts</h2>
      <ul>${visiblePosts}</ul>
      <form method="post" action="/posts">
        <label>Title <input name="title" value="Test post"></label>
        <label>Body <textarea name="body">Created by a local test account.</textarea></label>
        <button>Create post</button>
      </form>
    `,
  );
}

function profilePage(viewer, profile) {
  return html(
    "Profile",
    `
      <h1>Profile ${profile.id}</h1>
      <p>Viewer: ${viewer.email}</p>
      <p>Email: ${profile.email}</p>
      <p>Role: ${profile.role}</p>
      <p>Private note: ${profile.privateNote}</p>
      <p><a href="/dashboard">Back</a></p>
    `,
  );
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "HEAD" || url.pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ok");
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    const user = currentUser(req);
    if (user) {
      redirect(res, "/dashboard");
      return;
    }
    send(res, 200, loginPage());
    return;
  }

  if (req.method === "POST" && url.pathname === "/login") {
    const form = await readForm(req);
    const user = users.find(
      (candidate) =>
        candidate.email === form.get("email") && candidate.password === form.get("password"),
    );

    if (!user) {
      send(res, 401, loginPage("Invalid credentials"));
      return;
    }

    const sid = randomUUID();
    sessions.set(sid, user.id);
    redirect(res, "/dashboard", { "Set-Cookie": `sid=${sid}; SameSite=Lax; Path=/` });
    return;
  }

  if (req.method === "GET" && url.pathname === "/dashboard") {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }
    send(res, 200, dashboardPage(user));
    return;
  }

  if (req.method === "GET" && url.pathname === "/profile") {
    const viewer = requireUser(req, res);
    if (!viewer) {
      return;
    }
    const profile = users.find((user) => user.id === url.searchParams.get("id")) || viewer;
    send(res, 200, profilePage(viewer, profile));
    return;
  }

  if (req.method === "POST" && url.pathname === "/posts") {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }
    const form = await readForm(req);
    posts.push({
      id: String(posts.length + 1),
      ownerId: user.id,
      title: String(form.get("title") || "Untitled"),
      body: String(form.get("body") || ""),
    });
    redirect(res, "/dashboard");
    return;
  }

  if (req.method === "GET" && url.pathname === "/logout") {
    const { sid } = parseCookies(req);
    if (sid) {
      sessions.delete(sid);
    }
    redirect(res, "/", { "Set-Cookie": "sid=; Max-Age=0; Path=/" });
    return;
  }

  send(res, 404, html("Not found", "<h1>Not found</h1>"));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Auth fixture running at http://localhost:${port}`);
});
