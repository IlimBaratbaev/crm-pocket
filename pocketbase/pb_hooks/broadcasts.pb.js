/// <reference path="../pb_data/types.d.ts" />

// Trigger WhatsApp service to send broadcast when status is set to "sending"
onRecordAfterUpdateSuccess((e) => {
  const record = e.record;
  if (record.get("status") !== "sending") return;

  const waUrl = $os.getenv("WA_SERVICE_URL") || "http://whatsapp:3001";
  const secret = $os.getenv("WA_SERVICE_SECRET") || "";

  try {
    const res = $http.send({
      url:     `${waUrl}/broadcast/${record.id}`,
      method:  "POST",
      headers: { "x-secret": secret, "Content-Type": "application/json" },
      body:    "{}",
      timeout: 5,
    });
    if (res.statusCode !== 200) {
      console.error(`[broadcasts hook] whatsapp service returned ${res.statusCode}`);
    }
  } catch (err) {
    console.error("[broadcasts hook] failed to notify whatsapp service:", err);
  }
}, "broadcasts");
