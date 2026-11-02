import { spawn } from "child_process";

console.log("Launching Headless Chrome to verify login form behavior...");

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chromeProcess = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--remote-debugging-port=9223",
  "--user-data-dir=/tmp/chrome-test-login-" + Date.now(),
  "http://localhost:3000/login"
]);

async function run() {
  let target = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch("http://127.0.0.1:9223/json");
      const list = await res.json();
      target = list.find((t) => t.url.includes("login") || t.type === "page");
      if (target) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (!target) {
    console.error("Failed to attach to Chrome CDP.");
    chromeProcess.kill();
    process.exit(1);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener("message", handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await new Promise((r) => setTimeout(r, 2000));

  // Check form inputs
  const formCheck = await send("Runtime.evaluate", {
    expression: `(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitBtn = document.querySelector('button[type="submit"]');
      const logoImg = document.querySelector('img[alt="Newborn Photography Nepal"]');
      const h1 = document.querySelector("h1")?.innerText || "";
      const subtitle = document.querySelector("p")?.innerText || "";

      return {
        hasEmail: Boolean(emailInput),
        hasPassword: Boolean(passwordInput),
        hasSubmit: Boolean(submitBtn),
        hasLogo: Boolean(logoImg),
        h1,
        subtitle,
        currentUrl: window.location.href,
      };
    })()`,
    returnByValue: true,
  });

  console.log("Login Form Inspection:", formCheck.result?.value);

  // Type in dummy credentials and test submission to verify no '#', '?' regression
  await send("Runtime.evaluate", {
    expression: `(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      emailInput.value = "test@studio.com";
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      passwordInput.value = "wrongpassword123";
      passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
      const form = document.querySelector("form");
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    })()`,
  });

  // Wait for submission response
  await new Promise((r) => setTimeout(r, 3000));

  const postSubmitCheck = await send("Runtime.evaluate", {
    expression: `(() => {
      const currentUrl = window.location.href;
      const errorText = document.querySelector('.bg-rose-50')?.innerText || "";
      return { currentUrl, errorText };
    })()`,
    returnByValue: true,
  });

  console.log("Post-Submit Check:", postSubmitCheck.result?.value);

  if (postSubmitCheck.result?.value?.currentUrl?.includes("#") || postSubmitCheck.result?.value?.currentUrl?.includes("?")) {
    console.error("❌ REGRESSION: URL contains '#' or '?'!");
  } else {
    console.log("✅ PASS: URL remained clean without hash '#' or query '?' navigation!");
  }

  if (postSubmitCheck.result?.value?.errorText) {
    console.log("✅ PASS: Clean error state rendered properly:", postSubmitCheck.result?.value?.errorText);
  }

  ws.close();
  chromeProcess.kill();
}

run().catch((err) => {
  console.error("Error:", err);
  chromeProcess.kill();
  process.exit(1);
});

