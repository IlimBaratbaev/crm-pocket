import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { pb } from "../lib/pb";
import { Plus, Trash2, X } from "lucide-react";

type LeadForm = { phone: string; name: string; source: string; status: string; notes: string };

const sourceLabel: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram" };
const statusLabel: Record<string, string> = { new: "Новый", contacted: "Связались", qualified: "Квалифицирован" };
const statusColor: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-green-100 text-green-700",
};

export default function Leads() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [filterSource, setFilterSource] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filter = [
    filterSource && `source="${filterSource}"`,
    filterStatus && `status="${filterStatus}"`,
  ].filter(Boolean).join("&&");

  const { data, isLoading } = useQuery({
    queryKey: ["leads", filterSource, filterStatus],
    queryFn: () => pb.collection("leads").getFullList({ filter: filter || undefined, sort: "-created" }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadForm>({
    defaultValues: { phone: "", name: "", source: "whatsapp", status: "new", notes: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: LeadForm) => pb.collection("leads").create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); setShowModal(false); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pb.collection("leads").delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Лиды</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} /> Добавить лид
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">Все источники</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram">Instagram</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">Все статусы</option>
          <option value="new">Новый</option>
          <option value="contacted">Связались</option>
          <option value="qualified">Квалифицирован</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3 font-medium">Телефон</th>
              <th className="px-5 py-3 font-medium">Имя</th>
              <th className="px-5 py-3 font-medium">Источник</th>
              <th className="px-5 py-3 font-medium">Статус</th>
              <th className="px-5 py-3 font-medium">Заметки</th>
              <th className="px-5 py-3 font-medium">Дата</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">Загрузка...</td></tr>
            )}
            {data?.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-mono">{lead.phone}</td>
                <td className="px-5 py-3">{lead.name || <span className="text-gray-400">—</span>}</td>
                <td className="px-5 py-3">{sourceLabel[lead.source] || lead.source}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[lead.status] || "bg-gray-100 text-gray-600"}`}>
                    {statusLabel[lead.status] || lead.status}
                  </span>
                </td>
                <td className="px-5 py-3 max-w-xs truncate text-gray-500">{lead.notes || "—"}</td>
                <td className="px-5 py-3 text-gray-500">{new Date(lead.created).toLocaleDateString("ru-RU")}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => { if (confirm("Удалить лид?")) deleteMutation.mutate(lead.id); }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.length && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">Нет лидов</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Добавить лид</h2>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
                <input
                  {...register("phone", { required: "Обязательное поле" })}
                  placeholder="+7 999 000 00 00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                <input
                  {...register("name")}
                  placeholder="Имя клиента"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Источник</label>
                  <select {...register("source")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <select {...register("status")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="new">Новый</option>
                    <option value="contacted">Связались</option>
                    <option value="qualified">Квалифицирован</option>
                  </select>
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
