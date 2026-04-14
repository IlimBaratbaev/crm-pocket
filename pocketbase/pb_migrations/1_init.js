/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // leads
    const leads = new Collection({
      name: "leads",
      type: "base",
      fields: [
        { name: "name",               type: "text" },
        { name: "phone",              type: "text",   required: true },
        { name: "source",             type: "select", options: { values: ["whatsapp","instagram"] } },
        { name: "instagram_handle",   type: "text" },
        { name: "status",             type: "select", options: { values: ["new","contacted","qualified"] }, required: true },
        { name: "notes",              type: "text" },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_leads_phone ON leads (phone)"],
    });
    app.save(leads);

    // deals
    const deals = new Collection({
      name: "deals",
      type: "base",
      fields: [
        { name: "lead",   type: "relation", required: true, options: { collectionId: leads.id, cascadeDelete: false } },
        { name: "title",  type: "text", required: true },
        { name: "stage",  type: "select", required: true, options: { values: ["new","in_progress","proposal","won","lost"] } },
        { name: "value",  type: "number" },
        { name: "notes",  type: "text" },
      ],
    });
    app.save(deals);

    // folders
    const folders = new Collection({
      name: "folders",
      type: "base",
      fields: [
        { name: "lead", type: "relation", required: true, options: { collectionId: leads.id, cascadeDelete: true } },
        { name: "name", type: "text", required: true },
      ],
    });
    app.save(folders);

    // documents
    const documents = new Collection({
      name: "documents",
      type: "base",
      fields: [
        { name: "folder",    type: "relation", required: true, options: { collectionId: folders.id, cascadeDelete: true } },
        { name: "lead",      type: "relation", required: true, options: { collectionId: leads.id, cascadeDelete: true } },
        { name: "file",      type: "file", required: true, options: { maxSelect: 1, maxSize: 52428800 } },
        { name: "file_name", type: "text" },
      ],
    });
    app.save(documents);

    // auto_replies
    const autoReplies = new Collection({
      name: "auto_replies",
      type: "base",
      fields: [
        { name: "trigger_type",  type: "select", required: true, options: { values: ["welcome","info","default"] } },
        { name: "platform",      type: "select", required: true, options: { values: ["whatsapp","instagram","both"] } },
        { name: "message_text",  type: "text", required: true },
        { name: "is_active",     type: "bool" },
        { name: "sort_order",    type: "number" },
      ],
    });
    app.save(autoReplies);

    // broadcasts
    const broadcasts = new Collection({
      name: "broadcasts",
      type: "base",
      fields: [
        { name: "message_text", type: "text", required: true },
        { name: "link",         type: "url" },
        { name: "status",       type: "select", required: true, options: { values: ["draft","sending","sent","failed"] } },
        { name: "sent_count",   type: "number" },
        { name: "total_count",  type: "number" },
      ],
    });
    app.save(broadcasts);

    // broadcast_logs
    const broadcastLogs = new Collection({
      name: "broadcast_logs",
      type: "base",
      fields: [
        { name: "broadcast",     type: "relation", required: true, options: { collectionId: broadcasts.id, cascadeDelete: true } },
        { name: "lead",          type: "relation", options: { collectionId: leads.id, cascadeDelete: false } },
        { name: "phone",         type: "text" },
        { name: "status",        type: "select", options: { values: ["sent","failed"] } },
        { name: "error_message", type: "text" },
        { name: "sent_at",       type: "date" },
      ],
    });
    app.save(broadcastLogs);
  },
  (app) => {
    for (const name of ["broadcast_logs","broadcasts","auto_replies","documents","folders","deals","leads"]) {
      try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) {}
    }
  }
);
