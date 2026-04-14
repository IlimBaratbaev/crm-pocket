import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { pb } from "../lib/pb";
import { Send, CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react";

type BroadcastForm = { message_text: string; link: string };

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  draft:   { label: "Черновик", icon: Clock,        color: "text-gray-500" },
  sending: { label: "Отправляется", icon: Loader2,  color: "text-blue-500 animate-spin" },
  sent:    { label: "Отправлено",   icon: CheckCircle, color: "text-green-500" },
  failed:  { label: "Ошибка",      icon: AlertCircle, color: "text-red-500" },
};

export default function Broadcasts() {
  const qc = useQueryClient();
  const [sending, setSending] = useState(false);

  const { data: history = [] } = useQuery({
    queryKey: ["broadcasts"],
    queryFn: () => pb.collection("broadcasts").getFullList({ sort: "-created" }),
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasSending = Array.isArray(data) && data.some((b) => (b as unknown as { status: string }).status === "sending");
      return hasSending ? 3000 : false;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BroadcastForm>({
    defaultValues: { message_text: "", link: "" },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: BroadcastForm) => {
      setSending(true);
      const broadcast = await pb.collection("broadcasts").create({
        message_text: data.message_text,
        link: data.link || "",
        status: "sending",
        sent_count: 0,
        total_count: 0,
      });
      return broadcast;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broadcasts"] });
      reset();
      setSending(false);
    },
    onError: () => setSending(false),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Рассылки</h1>

      {/* Compose */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Новая рассылка</h2>
        <form onSubmit={handleSubmit((d) => sendMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Текст сообщения *</label>
            <textarea
              {...register("message_text", { required: "Введите текст сообщения" })}
              rows={5}
              placeholder="Уважаемый клиент! Просим вас оставить отзыв о нашей работе..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
            {errors.message_text && <p className="text-red-500 text-xs mt-1">{errors.message_text.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка (необязательно)</label>
            <input
              {...register("link")}
              type="url"
              placeholder="https://instagram.com/yourcompany"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Сообщение будет отправлено всем лидам с номером телефона</p>
            <button
              type="submit"
              disabled={sending || sendMutation.isPending}
              className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? "Отправляется..." : "Отправить всем"}
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">История рассылок</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3 font-medium">Сообщение</th>
              <th className="px-5 py-3 font-medium">Ссылка</th>
              <th className="px-5 py-3 font-medium">Отправлено</th>
              <th className="px-5 py-3 font-medium">Статус</th>
              <th className="px-5 py-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody>
            {history.map((b) => {
              const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.draft;
              const Icon = cfg.icon;
              return (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 max-w-xs">
                    <p className="truncate text-gray-800">{b.message_text}</p>
                  </td>
                  <td className="px-5 py-3">
                    {b.link ? (
                      <a href={b.link} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-xs truncate block max-w-32">
                        {b.link}
                      </a>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {b.status === "sending" ? (
                      <span className="text-blue-600">{b.sent_count}/{b.total_count}</span>
                    ) : b.status === "sent" ? (
                      <span>{b.sent_count}/{b.total_count}</span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                      <Icon size={14} /> {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{new Date(b.created).toLocaleDateString("ru-RU")}</td>
                </tr>
              );
            })}
            {!history.length && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Нет рассылок</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
