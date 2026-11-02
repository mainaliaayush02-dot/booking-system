import { spawn } from "child_process";

console.log("Launching Headless Chrome to verify http://localhost:3000/finance...");

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chromeProcess = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--remote-debugging-port=9222",
  "--user-data-dir=/tmp/chrome-test-finance-" + Date.now(),
  "http://localhost:3000/finance"
]);

chromeProcess.stderr.on("data", (data) => {
  // console.log("Chrome stderr:", data.toString());
});

async function runVerification() {
  // Wait for Chrome CDP port to be ready
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

  // Connect via WebSocket to target
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise((resolve) => ws.onopen = resolve);
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

  // Listen to console API calls and exceptions
  const consoleErrors = [];
  ws.addEventListener("message", (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === "Runtime.consoleAPICalled" && (msg.params.type === "error" || msg.params.type === "assert")) {
      consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(" "));
    }
    if (msg.method === "Runtime.exceptionThrown") {
      consoleErrors.push(msg.params.exceptionDetails.text + " " + (msg.params.exceptionDetails.exception?.description || ""));
    }
  });

  await send("Runtime.enable");
  await send("Page.enable");

  // Wait for React hydration
  await new Promise((r) => setTimeout(r, 3500));

  // Evaluate DOM state
  const evalResult = await send("Runtime.evaluate", {
    expression: `(() => {
      const title = document.title;
      const h1 = document.querySelector("h1")?.innerText || "";
      const text = document.body.innerText;
      const kpis = {
        salesCard: text.includes("Total Booking Sales") || text.includes("Booking Sales"),
        paymentsCard: text.includes("Payments Received"),
        outstandingCard: text.includes("Outstanding Amount"),
        expensesCard: text.includes("Expenses Paid") || text.includes("Studio Expenses"),
        profitCard: text.includes("Net Cash Profit"),
      };
      const tabs = {
        receiptsTab: text.includes("Payment Receipts"),
        expensesTab: text.includes("Studio Overhead & Expenses") || text.includes("Studio Expenses"),
      };
      const periods = {
        today: text.includes("Today"),
        month: text.includes("This Month"),
        quarter: text.includes("This Quarter"),
        year: text.includes("This Year"),
      };
      const buttons = {
        recordPayment: Boolean(Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Record Payment"))),
        logExpense: Boolean(Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Log Expense"))),
        auditSync: Boolean(Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Audit & Sync Advances"))),
      };
      const currentUrl = window.location.href;
      return { title, h1, kpis, tabs, periods, buttons, currentUrl };
    })()`,
    returnByValue: true,
  });

  console.log("\n--- BROWSER VERIFICATION AUDIT ---");
  console.log("Current Page URL:", evalResult.result?.value?.currentUrl);
  console.log("Heading (h1):", evalResult.result?.value?.h1);
  console.log("5 KPI Cards Present:", evalResult.result?.value?.kpis);
  console.log("Dual Ledger Tabs Present:", evalResult.result?.value?.tabs);
  console.log("Date Range Presets Present:", evalResult.result?.value?.periods);
  console.log("Core Action Buttons Present:", evalResult.result?.value?.buttons);

  if (consoleErrors.length > 0) {
    console.log("\nConsole Errors / Exceptions:", consoleErrors);
  } else {
    console.log("\n✅ Zero console exceptions or errors in browser session!");
  }

  ws.close();
  chromeProcess.kill();
  console.log("\n🎉 Live Browser Verification Complete!");
}

runVerification().catch((err) => {
  console.error("Verification error:", err);
  chromeProcess.kill();
  process.exit(1);
});

