import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { pb } from "../lib/pb";
import { Plus, X, Trash2 } from "lucide-react";

const STAGES = [
  { key: "new",         label: "Новые",       color: "bg-gray-100 border-gray-200" },
  { key: "in_progress", label: "В работе",    color: "bg-blue-50 border-blue-200" },
  { key: "proposal",    label: "Предложение", color: "bg-yellow-50 border-yellow-200" },
  { key: "won",         label: "Выиграно",    color: "bg-green-50 border-green-200" },
  { key: "lost",        label: "Проиграно",   color: "bg-red-50 border-red-200" },
];

const STAGE_HEADER: Record<string, string> = {
  new: "text-gray-700", in_progress: "text-blue-700", proposal: "text-yellow-700",
  won: "text-green-700", lost: "text-red-700",
};

type DealForm = { title: string; lead: string; stage: string; value: string; notes: string };

export default function Deals() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: deals = [] } = useQuery({
    queryKey: ["deals"],
    queryFn: () => pb.collection("deals").getFullList({ expand: "lead", sort: "-created" }),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads-list"],
    queryFn: () => pb.collection("leads").getFullList({ sort: "phone" }),
  });

  const { register, handleSubmit, reset } = useForm<DealForm>({
    defaultValues: { title: "", lead: "", stage: "new", value: "", notes: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: DealForm) =>
      pb.collection("deals").create({ ...data, value: data.value ? Number(data.value) : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deals"] }); setShowModal(false); reset(); },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      pb.collection("deals").update(id, { stage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pb.collection("deals").delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });

  const byStage = (stage: string) => deals.filter((d) => d.stage === stage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Сделки</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} /> Добавить сделку
        </button>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-5 gap-3 overflow-x-auto pb-2">
        {STAGES.map(({ key, label, color }) => (
          <div key={key} className={`rounded-xl border ${color} p-3 min-h-64`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${STAGE_HEADER[key]}`}>
              {label} <span className="opacity-60">({byStage(key).length})</span>
            </h3>
            <div className="space-y-2">
              {byStage(key).map((deal) => (
                <div key={deal.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-medium text-gray-900 leading-tight">{deal.title}</p>
                    <button
                      onClick={() => { if (confirm("Удалить сделку?")) deleteMutation.mutate(deal.id); }}
                      className="text-gray-300 hover:text-red-400 shrink-0 mt-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {deal.expand?.lead && (
                    <p className="text-xs text-gray-400 mt-1">{deal.expand.lead.phone}</p>
                  )}
                  {deal.value ? (
                    <p className="text-xs text-gray-500 mt-1">{Number(deal.value).toLocaleString("ru-RU")} ₸</p>
                  ) : null}
                  {/* Stage changer */}
                  <select
                    value={deal.stage}
                    onChange={(e) => updateStageMutation.mutate({ id: deal.id, stage: e.target.value })}
                    className="mt-2 w-full text-xs border border-gray-200 rounded px-1.5 py-1 bg-white"
                  >
                    {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Добавить сделку</h2>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input
                  {...register("title", { required: true })}
                  placeholder="Обучение в Германии"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Лид *</label>
                <select {...register("lead", { required: true })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">— выберите лида —</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.phone}{l.name ? ` (${l.name})` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Этап</label>
                  <select {...register("stage")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (₸)</label>
                  <input
                    {...register("value")}
                    type="number"
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
                <textarea
                  {...register("notes")}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Отмена</button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                  {createMutation.isPending ? "Сохранение..." : "Добавить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
