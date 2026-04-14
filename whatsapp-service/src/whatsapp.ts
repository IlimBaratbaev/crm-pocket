import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import { upsertLead, getActiveAutoReply } from "./pb-client";

let sock: WASocket | null = null;
let latestQR: string | null = null;
let isConnected = false;

export function getSocket(): WASocket | null {
  return sock;
}

export function getQR(): string | null {
  return latestQR;
}

export function connected(): boolean {
  return isConnected;
}

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: require("pino")({ level: "warn" }),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQR = qr;
      qrcode.generate(qr, { small: true });
      console.log("[whatsapp] QR code generated — scan with WhatsApp");
    }

    if (connection === "open") {
      isConnected = true;
      latestQR = null;
      console.log("[whatsapp] connected");
    }

    if (connection === "close") {
      isConnected = false;
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(`[whatsapp] disconnected (code ${code}), reconnect=${shouldReconnect}`);
      if (shouldReconnect) {
        setTimeout(startWhatsApp, 5000);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.endsWith("@g.us")) continue; // skip groups

      const phone = remoteJid.replace("@s.whatsapp.net", "");
      console.log(`[whatsapp] incoming from ${phone}`);

      try {
        const lead = await upsertLead(phone, "whatsapp");
        const isNew = !lead.updated || lead.created === lead.updated;

        // Only auto-reply on first contact
        if (isNew) {
          const replyText = await getActiveAutoReply("welcome", "whatsapp");
          if (replyText && sock) {
            await sock.sendMessage(remoteJid, { text: replyText });
          }
        }
      } catch (err) {
        console.error("[whatsapp] message handler error:", err);
      }
    }
  });
}
