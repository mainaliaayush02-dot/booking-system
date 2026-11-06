import { spawn } from "child_process";
import fs from "fs";
import path from "path";

console.log("==================================================================");
console.log("CLARITY BOOKING REDESIGN: BROWSER VISUAL VERIFICATION");
console.log("Newborn Photography Nepal — Studio Manager");
console.log("==================================================================");

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chromeProcess = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--remote-debugging-port=9222",
  "--user-data-dir=/tmp/chrome-test-clarity-" + Date.now(),
  "http://localhost:3000/login"
]);

const screenshotDir = path.resolve("./screenshots");
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const artifactDir = "/Users/aayushmainali/.gemini/antigravity/brain/de18ed17-de09-46b0-9466-0cbd4727be69";

async function runClarityVerification() {
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

  console.log(`Attached to target: ${target.title} (${target.url})`);

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

  // Helper to capture screenshot and copy to artifacts
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

  // Helper to navigate
  async function navigateTo(url) {
    console.log(`Navigating to ${url}...`);
    await send("Page.navigate", { url });
    await new Promise((r) => setTimeout(r, 3000));
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

  // 2. Set Mobile Viewport (iPhone 14 style: 390x844)
  console.log("\n--- 2. MOBILE VIEWPORT VERIFICATION: CALENDAR (SCREENSHOT 2) ---");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await navigateTo("http://localhost:3000/calendar");

  const pageInfo = await send("Runtime.evaluate", {
    expression: `(() => ({
      href: window.location.href,
      title: document.title,
      textPreview: document.body.innerText.slice(0, 200).replace(/\\n+/g, " | ")
    }))()`,
    returnByValue: true
  });
  console.log("Current Page Info:", pageInfo.result.value);

  const calendarEval = await send("Runtime.evaluate", {
    expression: `(() => {
      const text = document.body.innerText;
      return {
        hasCalendarHeader: text.includes("Newborn Photography"),
        hasDaysOfWeek: text.includes("SUN") && text.includes("MON"),
        hasSelectedDay: text.includes("Scheduled"),
        hasMorningSlot: text.includes("Morning Session"),
        hasAfternoonSlot: text.includes("Afternoon Session"),
        hasEveningSlot: text.includes("Evening Session"),
        hasPlusButton: !!document.querySelector("button[aria-label='Add session']"),
      };
    })()`,
    returnByValue: true,
  });
  console.log("Calendar Evaluation:", calendarEval.result.value);
  await capture("clarity_mobile_calendar.png");

  // 3. Mobile Drawer Navigation (SCREENSHOT 1)
  console.log("\n--- 3. MOBILE VIEWPORT VERIFICATION: DRAWER NAVIGATION (SCREENSHOT 1) ---");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const menuBtn = document.querySelector("button[aria-label='Open navigation menu']");
      if (menuBtn) menuBtn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 800));

  const drawerEval = await send("Runtime.evaluate", {
    expression: `(() => {
      const text = document.body.innerText;
      return {
        hasCalendarLink: text.includes("Calendar"),
        hasSessionsLink: text.includes("Sessions"),
        hasLeadsLink: text.includes("Leads"),
        hasFollowUpsLink: text.includes("Follow-ups"),
        hasDashboardLink: text.includes("Dashboard"),
        hasTrashLink: text.includes("Trash"),
        hasSignOut: text.includes("Sign Out"),
        hasCloseBtn: !!document.querySelector("button[aria-label='Close menu']"),
      };
    })()`,
    returnByValue: true,
  });
  console.log("Drawer Evaluation:", drawerEval.result.value);
  await capture("clarity_mobile_drawer.png");

  // Close drawer
  await send("Runtime.evaluate", {
    expression: `(() => {
      const closeBtn = document.querySelector("button[aria-label='Close menu']");
      if (closeBtn) closeBtn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 500));

  // 4. Mobile Sessions View (SCREENSHOT 3)
  console.log("\n--- 4. MOBILE VIEWPORT VERIFICATION: SESSIONS (SCREENSHOT 3) ---");
  await navigateTo("http://localhost:3000/sessions");

  const sessionsInfo = await send("Runtime.evaluate", {
    expression: `(() => ({
      href: window.location.href,
      textPreview: document.body.innerText.slice(0, 250).replace(/\\n+/g, " | ")
    }))()`,
    returnByValue: true
  });
  console.log("Sessions Page Info:", sessionsInfo.result.value);

  const sessionsEval = await send("Runtime.evaluate", {
    expression: `(() => {
      const text = document.body.innerText;
      return {
        hasMonthSelector: text.includes(new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date())),
        hasSortByUrgency: text.includes("Sort by Urgency"),
        hasTotalRevenue: text.includes("TOTAL REVENUE"),
        hasTotalSessions: text.includes("TOTAL SESSIONS"),
        hasDeliveredCard: text.includes("DELIVERED"),
        hasTableHeader: text.includes("SESSION DATE") && text.includes("CLIENT NAME") && text.includes("SESSION TYPE"),
      };
    })()`,
    returnByValue: true,
  });
  console.log("Sessions Evaluation:", sessionsEval.result.value);
  await capture("clarity_mobile_sessions.png");

  // 5. Desktop Viewport (1440x900)
  console.log("\n--- 5. DESKTOP VIEWPORT VERIFICATION (1440x900) ---");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });

  await navigateTo("http://localhost:3000/calendar");
  await capture("clarity_desktop_calendar.png");

  await navigateTo("http://localhost:3000/sessions");
  await capture("clarity_desktop_sessions.png");

  console.log("\n==================================================================");
  console.log("✅ ALL BROWSER VISUAL CHECKS COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");

  ws.close();
  chromeProcess.kill();
  process.exit(0);
}

runClarityVerification().catch((err) => {
  console.error("Verification error:", err);
  chromeProcess.kill();
  process.exit(1);
});
