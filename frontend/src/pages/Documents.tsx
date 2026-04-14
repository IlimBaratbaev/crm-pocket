import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pb } from "../lib/pb";
import { FolderPlus, Upload, Trash2, Download, FolderOpen, Folder } from "lucide-react";

export default function Documents() {
  const qc = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  const { data: leads = [] } = useQuery({
    queryKey: ["leads-list"],
    queryFn: () => pb.collection("leads").getFullList({ sort: "phone" }),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["folders", selectedLead],
    queryFn: () => pb.collection("folders").getFullList({ filter: `lead="${selectedLead}"`, sort: "name" }),
    enabled: !!selectedLead,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", selectedFolder],
    queryFn: () => pb.collection("documents").getFullList({ filter: `folder="${selectedFolder}"`, sort: "-created" }),
    enabled: !!selectedFolder,
  });

  const createFolderMutation = useMutation({
    mutationFn: () => pb.collection("folders").create({ lead: selectedLead, name: newFolderName }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["folders"] }); setNewFolderName(""); },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => pb.collection("folders").delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders"] });
      if (selectedFolder) setSelectedFolder(null);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("folder", selectedFolder!);
      fd.append("lead", selectedLead!);
      fd.append("file", file);
      fd.append("file_name", file.name);
      return pb.collection("documents").create(fd);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id: string) => pb.collection("documents").delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = "";
  }

  function getFileUrl(doc: { id: string; collectionId: string; file: string }) {
    return pb.files.getURL(doc, doc.file);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Документы</h1>

      <div className="flex gap-4 h-[calc(100vh-160px)]">
        {/* Leads panel */}
        <div className="w-48 bg-white rounded-xl border border-gray-200 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">Клиенты</div>
          {leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => { setSelectedLead(lead.id); setSelectedFolder(null); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${selectedLead === lead.id ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-700"}`}
            >
              {lead.name || lead.phone}
            </button>
          ))}
          {!leads.length && <p className="px-4 py-4 text-xs text-gray-400">Нет клиентов</p>}
        </div>

        {/* Folders panel */}
        <div className="w-52 bg-white rounded-xl border border-gray-200 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">Папки</div>
          {selectedLead ? (
            <>
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-gray-50 ${selectedFolder === folder.id ? "bg-brand-50" : ""}`}
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    {selectedFolder === folder.id ? <FolderOpen size={15} className="text-brand-500" /> : <Folder size={15} className="text-gray-400" />}
                    {folder.name}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm("Удалить папку?")) deleteFolderMutation.mutate(folder.id); }}
                    className="text-gray-300 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <div className="px-3 py-2 border-t border-gray-100 flex gap-1">
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && newFolderName && createFolderMutation.mutate()}
                  placeholder="Новая папка"
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none"
                />
                <button
                  onClick={() => newFolderName && createFolderMutation.mutate()}
                  className="p-1.5 bg-brand-600 text-white rounded hover:bg-brand-700"
                >
                  <FolderPlus size={13} />
                </button>
              </div>
            </>
          ) : (
            <p className="px-4 py-4 text-xs text-gray-400">Выберите клиента</p>
          )}
        </div>

        {/* Files panel */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Файлы</span>
            {selectedFolder && (
              <label className="flex items-center gap-1.5 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-brand-700">
                <Upload size={13} /> Загрузить
                <input type="file" className="hidden" onChange={handleFileInput} />
              </label>
            )}
          </div>
          {!selectedFolder ? (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">Выберите папку</p>
          ) : documents.length === 0 ? (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">Нет файлов — загрузите первый</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-left">
                  <th className="px-5 py-3 font-medium">Файл</th>
                  <th className="px-5 py-3 font-medium">Дата</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">{doc.file_name || doc.file}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(doc.created).toLocaleDateString("ru-RU")}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <a href={getFileUrl(doc as { id: string; collectionId: string; file: string })} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-700">
                          <Download size={15} />
                        </a>
                        <button
                          onClick={() => { if (confirm("Удалить файл?")) deleteDocMutation.mutate(doc.id); }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
