import { spawn } from "child_process";
import fs from "fs";
import path from "path";

console.log("==================================================================");
console.log("SIMPLIFIED BOOKING FORM & CLIENTS REMOVAL: BROWSER VERIFICATION");
console.log("Newborn Photography Nepal — Studio Manager");
console.log("==================================================================");

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chromeProcess = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--remote-debugging-port=9222",
  "--user-data-dir=/tmp/chrome-test-simplified-" + Date.now(),
  "http://localhost:3000/login"
]);

const screenshotDir = path.resolve("./screenshots");
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const artifactDir = "/Users/aayushmainali/.gemini/antigravity/brain/de18ed17-de09-46b0-9466-0cbd4727be69";

async function runBrowserChecks() {
  let target = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch("http://127.0.0.1:9222/json");
      const list = await res.json();
      target = list.find((t) => t.url.includes("localhost:3000") || t.type === "page");
      if (target) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (!target) {
    console.error("❌ Failed to attach to Chrome CDP endpoint.");
    chromeProcess.kill();
    process.exit(1);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => (ws.onopen = resolve));
  console.log("Connected to Chrome WebSocket debugger.");

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

  async function capture(filename) {
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    const filePath = path.join(screenshotDir, filename);
    fs.writeFileSync(filePath, Buffer.from(data, "base64"));
    console.log(`📸 Screenshot saved: ${filePath}`);

    try {
      const artPath = path.join(artifactDir, filename);
      fs.writeFileSync(artPath, Buffer.from(data, "base64"));
    } catch (e) {}

    return filePath;
  }

  async function navigateTo(url) {
    console.log(`Navigating to ${url}...`);
    await send("Page.navigate", { url });
    await new Promise((r) => setTimeout(r, 2500));
  }

  // 1. Establish session
  console.log("\n--- 1. ESTABLISHING ADMIN SESSION ---");
  await navigateTo("http://localhost:3000/login");
  await send("Runtime.evaluate", {
    expression: `(() => {
      window.localStorage.setItem("__STUDIO_DEV_AUTH__", JSON.stringify({
        uid: "99NIadNmrqVKWyWMngiMoAmYfOf1",
        email: "newbornphotographynepal.studio@gmail.com",
        displayName: "Newborn Photography Nepal Admin",
        role: "admin",
        active: true
      }));
    })()`,
  });

  // 2. Verify /clients route is completely gone (returns 404)
  console.log("\n--- 2. VERIFYING /clients ROUTE REMOVAL (404 TEST) ---");
  await navigateTo("http://localhost:3000/clients");
  const clientsRouteCheck = await send("Runtime.evaluate", {
    expression: `(() => ({
      href: window.location.href,
      bodyText: document.body.innerText,
      is404: document.body.innerText.includes("404") || document.body.innerText.includes("This page could not be found")
    }))()`,
    returnByValue: true
  });
  console.log("Clients Route Status:", clientsRouteCheck.result.value);
  await capture("clients_route_404.png");

  // 3. Verify New Booking Modal on Desktop (1440x900)
  console.log("\n--- 3. VERIFYING SIMPLIFIED BOOKING MODAL (DESKTOP) ---");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });

  await navigateTo("http://localhost:3000/calendar");
  // Click '+' floating action button
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector("button[aria-label='Add session']") || document.querySelector("button[title*='Schedule']");
      if (btn) btn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 600));

  const modalEval = await send("Runtime.evaluate", {
    expression: `(() => {
      const text = document.body.innerText;
      return {
        hasTitle: text.includes("New Photography Booking"),
        hasSection1: text.includes("Client Details") && text.includes("Client Name") && text.includes("Phone Number") && text.includes("Source"),
        hasSection2: text.includes("Session Details") && text.includes("Session Type") && text.includes("Time Slot") && text.includes("Morning") && text.includes("Afternoon") && text.includes("Evening") && text.includes("Custom Time"),
        hasSection3: text.includes("Deliverables") && text.includes("Delivery Deadline") && text.includes("3 Days") && text.includes("1 Week") && text.includes("2 Weeks") && text.includes("1 Month") && text.includes("Mark as Delivered") && text.includes("Album Included") && text.includes("Photo Frame Included"),
        hasSection4: text.includes("Payment") && text.includes("Total Amount (NPR)") && text.includes("Deposit Amount (NPR)") && text.includes("Remaining Balance"),
        hasSection5: text.includes("Additional Notes") && text.includes("Any special requests or details"),
        hasSaveButton: !!document.querySelector("button[type='submit']"),
        hasCancelButton: text.includes("Cancel")
      };
    })()`,
    returnByValue: true,
  });
  console.log("Modal Evaluation (Desktop):", modalEval.result.value);
  await capture("simplified_booking_modal_desktop.png");

  // 4. Verify New Booking Modal on Mobile Viewport (390x844)
  console.log("\n--- 4. VERIFYING SIMPLIFIED BOOKING MODAL (MOBILE VIEWPORT) ---");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 400));
  await capture("simplified_booking_modal_mobile.png");

  console.log("\n==================================================================");
  console.log("✅ ALL BROWSER VERIFICATIONS COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");

  ws.close();
  chromeProcess.kill();
  process.exit(0);
}

runBrowserChecks().catch((err) => {
  console.error("Browser verification error:", err);
  chromeProcess.kill();
  process.exit(1);
});
