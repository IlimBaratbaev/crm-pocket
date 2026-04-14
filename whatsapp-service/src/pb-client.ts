import PocketBase from "pocketbase";

const PB_URL = process.env.PB_URL || "http://pocketbase:8090";
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || "";
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || "";

export const pb = new PocketBase(PB_URL);

export async function authenticate() {
  await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
}

export async function upsertLead(phone: string, source: "whatsapp" | "instagram") {
  try {
    const existing = await pb.collection("leads").getFirstListItem(`phone="${phone}"`);
    return existing;
  } catch {
    return await pb.collection("leads").create({
      phone,
      source,
      status: "new",
    });
  }
}

export async function getActiveAutoReply(triggerType: string, platform: "whatsapp" | "instagram") {
  try {
    const reply = await pb.collection("auto_replies").getFirstListItem(
      `trigger_type="${triggerType}" && (platform="${platform}" || platform="both") && is_active=true`,
      { sort: "sort_order" }
    );
    return reply.message_text as string;
  } catch {
    return null;
  }
}

export async function getBroadcast(broadcastId: string) {
  return await pb.collection("broadcasts").getOne(broadcastId);
}

export async function getAllLeadsWithPhone() {
  return await pb.collection("leads").getFullList({ filter: 'phone != ""' });
}

export async function updateBroadcastStatus(
  broadcastId: string,
  status: string,
  sentCount?: number,
  totalCount?: number
) {
  const data: Record<string, unknown> = { status };
  if (sentCount !== undefined) data.sent_count = sentCount;
  if (totalCount !== undefined) data.total_count = totalCount;
  return await pb.collection("broadcasts").update(broadcastId, data);
}

export async function logBroadcastResult(
  broadcastId: string,
  leadId: string | undefined,
  phone: string,
  status: "sent" | "failed",
  errorMessage?: string
) {
  await pb.collection("broadcast_logs").create({
    broadcast: broadcastId,
    lead: leadId,
    phone,
    status,
    error_message: errorMessage || "",
    sent_at: new Date().toISOString(),
  });
}
