import express from "express";
import { authenticate } from "./pb-client";
import { startWhatsApp, getSocket, getQR, connected } from "./whatsapp";
import { sendBroadcast } from "./broadcast";

const PORT = parseInt(process.env.WA_SERVICE_PORT || "3001", 10);
const SECRET = process.env.WA_SERVICE_SECRET || "";

const app = express();
app.use(express.json());

// Simple secret check for internal calls from PocketBase hook
function checkSecret(req: express.Request, res: express.Response): boolean {
  if (SECRET && req.headers["x-secret"] !== SECRET) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}

app.get("/status", (_req, res) => {
  res.json({ connected: connected(), hasQR: getQR() !== null });
});

app.get("/qr", (_req, res) => {
  const qr = getQR();
  if (!qr) {
    res.json({ qr: null, message: connected() ? "already connected" : "no QR yet, wait a moment" });
    return;
  }
  res.json({ qr });
});

app.post("/broadcast/:id", async (req, res) => {
  if (!checkSecret(req, res)) return;

  const sock = getSocket();
  if (!sock || !connected()) {
    res.status(503).json({ error: "whatsapp not connected" });
    return;
  }

  const { id } = req.params;
  res.json({ ok: true, message: `broadcast ${id} queued` });

  // Run in background so response returns immediately
  sendBroadcast(sock, id).catch((err) => {
    console.error("[index] broadcast error:", err);
  });
});

async function main() {
  console.log("[main] authenticating with PocketBase...");
  // Retry PB auth until PocketBase is ready
  for (let i = 0; i < 20; i++) {
    try {
      await authenticate();
      console.log("[main] PocketBase auth OK");
      break;
    } catch {
      console.log(`[main] PocketBase not ready, retry ${i + 1}/20...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log("[main] starting WhatsApp...");
  await startWhatsApp();

  app.listen(PORT, () => {
    console.log(`[main] HTTP server listening on :${PORT}`);
  });
}

main().catch(console.error);
