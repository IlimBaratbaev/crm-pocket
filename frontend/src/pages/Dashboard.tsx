import { useQuery } from "@tanstack/react-query";
import { pb } from "../lib/pb";
import { Users, Briefcase, Megaphone } from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: leads } = useQuery({
    queryKey: ["leads-count"],
    queryFn: () => pb.collection("leads").getList(1, 1),
  });
  const { data: deals } = useQuery({
    queryKey: ["deals-open-count"],
    queryFn: () => pb.collection("deals").getList(1, 1, { filter: 'stage!="won"&&stage!="lost"' }),
  });
  const { data: broadcasts } = useQuery({
    queryKey: ["broadcasts-count"],
    queryFn: () => pb.collection("broadcasts").getList(1, 1, { filter: 'status="sent"' }),
  });
  const { data: recentLeads } = useQuery({
    queryKey: ["recent-leads"],
    queryFn: () => pb.collection("leads").getList(1, 10, { sort: "-created" }),
  });

  const sourceLabel: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram" };
  const statusLabel: Record<string, string> = { new: "Новый", contacted: "Связались", qualified: "Квалифицирован" };
  const statusColor: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-yellow-100 text-yellow-700",
    qualified: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Главная</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Всего лидов" value={leads?.totalItems ?? "—"} icon={Users} color="bg-blue-500" />
        <StatCard label="Открытых сделок" value={deals?.totalItems ?? "—"} icon={Briefcase} color="bg-indigo-500" />
        <StatCard label="Рассылок отправлено" value={broadcasts?.totalItems ?? "—"} icon={Megaphone} color="bg-violet-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Последние лиды</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3 font-medium">Телефон</th>
              <th className="px-5 py-3 font-medium">Имя</th>
              <th className="px-5 py-3 font-medium">Источник</th>
              <th className="px-5 py-3 font-medium">Статус</th>
              <th className="px-5 py-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody>
            {recentLeads?.items.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-mono">{lead.phone}</td>
                <td className="px-5 py-3">{lead.name || <span className="text-gray-400">—</span>}</td>
                <td className="px-5 py-3">{sourceLabel[lead.source] || lead.source}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[lead.status] || "bg-gray-100 text-gray-600"}`}>
                    {statusLabel[lead.status] || lead.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">{new Date(lead.created).toLocaleDateString("ru-RU")}</td>
              </tr>
            ))}
            {!recentLeads?.items.length && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Нет лидов</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
