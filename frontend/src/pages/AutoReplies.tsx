import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pb } from "../lib/pb";
import { Plus, Save, X, ToggleLeft, ToggleRight } from "lucide-react";

const TRIGGER_LABELS: Record<string, string> = { welcome: "Приветствие", info: "Информация", default: "Стандартный" };
const TRIGGER_COLORS: Record<string, string> = {
  welcome: "bg-green-100 text-green-700",
  info:    "bg-blue-100 text-blue-700",
  default: "bg-gray-100 text-gray-600",
};
const PLATFORM_LABELS: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", both: "Оба" };

type AutoReply = { id: string; trigger_type: string; platform: string; message_text: string; is_active: boolean; sort_order: number };

export default function AutoReplies() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({ trigger_type: "welcome", platform: "whatsapp", message_text: "", sort_order: 0 });

  const { data: replies = [] } = useQuery<AutoReply[]>({
    queryKey: ["auto-replies"],
    queryFn: () => pb.collection("auto_replies").getFullList({ sort: "sort_order,created" }) as Promise<AutoReply[]>,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AutoReply> }) =>
      pb.collection("auto_replies").update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["auto-replies"] }); setEditingId(null); },
  });

  const createMutation = useMutation({
    mutationFn: () => pb.collection("auto_replies").create({ ...newForm, is_active: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["auto-replies"] }); setShowAdd(false); setNewForm({ trigger_type: "welcome", platform: "whatsapp", message_text: "", sort_order: 0 }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pb.collection("auto_replies").delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auto-replies"] }),
  });

  function startEdit(r: AutoReply) {
    setEditingId(r.id);
    setEditText(r.message_text);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Автоответы</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="space-y-3">
        {replies.map((reply) => (
          <div key={reply.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TRIGGER_COLORS[reply.trigger_type]}`}>
                  {TRIGGER_LABELS[reply.trigger_type] || reply.trigger_type}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {PLATFORM_LABELS[reply.platform] || reply.platform}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateMutation.mutate({ id: reply.id, data: { is_active: !reply.is_active } })}
                  className={reply.is_active ? "text-green-500 hover:text-green-600" : "text-gray-300 hover:text-gray-400"}
                  title={reply.is_active ? "Выключить" : "Включить"}
                >
                  {reply.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
                <button
                  onClick={() => { if (confirm("Удалить автоответ?")) deleteMutation.mutate(reply.id); }}
                  className="text-gray-300 hover:text-red-400"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {editingId === reply.id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updateMutation.mutate({ id: reply.id, data: { message_text: editText } })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700"
                  >
                    <Save size={13} /> Сохранить
                  </button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">Отмена</button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => startEdit(reply)}
                className="text-sm text-gray-700 whitespace-pre-wrap cursor-text hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
                title="Нажмите для редактирования"
              >
                {reply.message_text || <span className="text-gray-400 italic">Текст не задан — нажмите для редактирования</span>}
              </p>
            )}
          </div>
        ))}

        {!replies.length && (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            Нет автоответов — добавьте первый
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Новый автоответ</h2>
              <button onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Триггер</label>
                  <select
                    value={newForm.trigger_type}
                    onChange={(e) => setNewForm((f) => ({ ...f, trigger_type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="welcome">Приветствие</option>
                    <option value="info">Информация</option>
                    <option value="default">Стандартный</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Платформа</label>
                  <select
                    value={newForm.platform}
                    onChange={(e) => setNewForm((f) => ({ ...f, platform: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="both">Оба</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Текст сообщения *</label>
                <textarea
                  value={newForm.message_text}
                  onChange={(e) => setNewForm((f) => ({ ...f, message_text: e.target.value }))}
                  rows={5}
                  placeholder="Привет! Мы рады видеть вас. Напишите ваш номер телефона..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Отмена</button>
                <button
                  onClick={() => newForm.message_text && createMutation.mutate()}
                  disabled={!newForm.message_text || createMutation.isPending}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Сохранение..." : "Добавить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
