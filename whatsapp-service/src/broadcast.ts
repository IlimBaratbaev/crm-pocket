import type { WASocket } from "@whiskeysockets/baileys";
import {
  getBroadcast,
  getAllLeadsWithPhone,
  updateBroadcastStatus,
  logBroadcastResult,
} from "./pb-client";

// Delay between messages to avoid WA rate-limiting (ms)
const SEND_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendBroadcast(sock: WASocket, broadcastId: string) {
  let broadcast: Awaited<ReturnType<typeof getBroadcast>>;

  try {
    broadcast = await getBroadcast(broadcastId);
  } catch (err) {
    console.error(`[broadcast] could not fetch broadcast ${broadcastId}:`, err);
    return;
  }

  const leads = await getAllLeadsWithPhone();
  const total = leads.length;

  await updateBroadcastStatus(broadcastId, "sending", 0, total);

  let sentCount = 0;
  const text = broadcast.link
    ? `${broadcast.message_text}\n\n${broadcast.link}`
    : broadcast.message_text;

  for (const lead of leads) {
    const phone = (lead.phone as string).replace(/[^\d]/g, "");
    const jid = `${phone}@s.whatsapp.net`;

    try {
      await sock.sendMessage(jid, { text });
      sentCount++;
      await logBroadcastResult(broadcastId, lead.id, lead.phone as string, "sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await logBroadcastResult(broadcastId, lead.id, lead.phone as string, "failed", msg);
    }

    await updateBroadcastStatus(broadcastId, "sending", sentCount, total);
    await sleep(SEND_DELAY_MS);
  }

  await updateBroadcastStatus(broadcastId, "sent", sentCount, total);
  console.log(`[broadcast] ${broadcastId} done — ${sentCount}/${total} sent`);
}
