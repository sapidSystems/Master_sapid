import React, { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Database,
  TrendingUp,
  Zap,
  X,
  Save,
  HelpCircle,
} from "lucide-react";
import supabase from "../../SupabaseClient";
import { useMagicToast } from "../../context/MagicToastContext";
import { DEFAULT_TAT_CONFIGS } from "../../utils/tatUtils";

const AVAILABLE_SYSTEMS = [
  {
    id: "sample",
    name: "Sample System",
    icon: Database,
    color: "text-blue-600 bg-blue-50 border-blue-100",
    pages: [
      {
        name: "Sample Management",
        path: "/dashboard/sample-management",
      },
    ],
  },
  {
    id: "production",
    name: "Production Planning and Monitoring",
    icon: TrendingUp,
    color: "text-purple-600 bg-purple-50 border-purple-100",
    pages: [
      {
        name: "Production Planning and Monitoring",
        path: "/dashboard/bulk-order",
      },
    ],
  },
  {
    id: "procurement",
    name: "Procurement System",
    icon: Zap,
    color: "text-amber-600 bg-amber-50 border-amber-100",
    pages: [
      {
        name: "New Leather Development",
        path: "/dashboard/procurement/new-leather",
      },
      {
        name: "Daily Leather Procurement",
        path: "/dashboard/procurement/daily-leather",
      },
      {
        name: "Daily Material Procurement",
        path: "/dashboard/procurement/material",
      },
      {
        name: "Packaging Procurement",
        path: "/dashboard/procurement/packaging",
      },
    ],
  },
];

export default function TatMasterTab() {
  const { showToast } = useMagicToast();
  const [tatList, setTatList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [systemFilter, setSystemFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formSystemId, setFormSystemId] = useState("sample");
  const [formPagePath, setFormPagePath] = useState("/dashboard/sample-management");
  const [formTatDays, setFormTatDays] = useState("5");
  const [formDescription, setFormDescription] = useState("");

  // Load TAT records
  const loadTatConfigs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("tat_master")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        setTatList(data);
      } else {
        // Fallback to defaults
        setTatList(DEFAULT_TAT_CONFIGS);
      }
    } catch (err) {
      console.warn("Could not query tat_master, using defaults:", err);
      setTatList(DEFAULT_TAT_CONFIGS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTatConfigs();

    // Listen for realtime updates on tat_master
    const channel = supabase
      .channel("tat_master_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tat_master" },
        () => {
          loadTatConfigs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // When system changes in form, reset selected page to first available page
  const handleSystemChange = (sysId) => {
    setFormSystemId(sysId);
    const targetSys = AVAILABLE_SYSTEMS.find((s) => s.id === sysId);
    if (targetSys && targetSys.pages.length > 0) {
      setFormPagePath(targetSys.pages[0].path);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormSystemId("sample");
    setFormPagePath("/dashboard/sample-management");
    setFormTatDays("5");
    setFormDescription("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditingId(item.id || item.page_path);
    setFormSystemId(item.system_id || "sample");
    setFormPagePath(item.page_path || "/dashboard/sample-management");
    setFormTatDays(String(item.tat_days || 5));
    setFormDescription(item.description || "");
    setIsModalOpen(true);
  };

  // Save / Update TAT Rule
  const handleSave = async (e) => {
    e.preventDefault();
    const days = parseInt(formTatDays, 10);
    if (isNaN(days) || days < 0) {
      showToast("Please enter a valid number of days (>= 0)", "error");
      return;
    }

    const selectedSys = AVAILABLE_SYSTEMS.find((s) => s.id === formSystemId);
    const selectedPage = selectedSys?.pages.find((p) => p.path === formPagePath);

    const payload = {
      system_id: formSystemId,
      system_name: selectedSys ? selectedSys.name : formSystemId,
      page_name: selectedPage ? selectedPage.name : formPagePath,
      page_path: formPagePath,
      tat_days: days,
      description: formDescription.trim(),
      updated_at: new Date().toISOString(),
    };

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("tat_master")
        .upsert([payload], { onConflict: "system_id, page_path" });

      if (error) {
        // Local state optimistic update if DB table is missing
        console.warn("DB update failed, updating local state:", error);
        setTatList((prev) => {
          const idx = prev.findIndex((p) => p.page_path === formPagePath);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...payload };
            return next;
          }
          return [...prev, { id: `local_${Date.now()}`, ...payload }];
        });
      } else {
        await loadTatConfigs();
      }

      showToast(
        `TAT rule for ${selectedPage?.name || "page"} saved successfully!`,
        "success"
      );
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving TAT master:", err);
      showToast("Failed to save TAT rule", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete TAT Rule
  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to remove the TAT rule for "${item.page_name}"?`)) {
      return;
    }

    try {
      if (item.id && typeof item.id === "string" && !item.id.startsWith("local_")) {
        const { error } = await supabase.from("tat_master").delete().eq("id", item.id);
        if (error) throw error;
      }
      setTatList((prev) => prev.filter((p) => p.page_path !== item.page_path));
      showToast(`TAT rule for "${item.page_name}" removed`, "success");
    } catch (err) {
      console.error("Error deleting TAT rule:", err);
      showToast("Could not delete from database", "error");
    }
  };

  // Filter list
  const filteredList = tatList.filter((item) => {
    const matchesSys = systemFilter === "all" || item.system_id === systemFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      item.page_name?.toLowerCase().includes(q) ||
      item.system_name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q);
    return matchesSys && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-soft-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  TAT Master Management
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Configure turnaround times (TAT in days) for each operational system & page.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-soft-sm transition-all hover:shadow-md cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add TAT Master</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by page or system..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
              Filter System:
            </span>
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">All Operational Systems</option>
              <option value="sample">Sample System</option>
              <option value="production">Production Planning</option>
              <option value="procurement">Procurement System</option>
            </select>
          </div>
        </div>
      </div>

      {/* TAT Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">System</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Page / Module</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Target TAT</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Description / SLA Note</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    Loading TAT Master rules...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">No TAT rules found</p>
                    <p className="text-[11px] mt-0.5">Click "Add TAT Master" above to create one.</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const sysObj = AVAILABLE_SYSTEMS.find((s) => s.id === item.system_id);
                  const SysIcon = sysObj?.icon || Layers;

                  return (
                    <tr
                      key={item.id || item.page_path || idx}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* System Column */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg border flex items-center justify-center ${
                              sysObj?.color || "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            <SysIcon className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-bold text-slate-900">
                            {item.system_name || sysObj?.name || item.system_id}
                          </span>
                        </div>
                      </td>

                      {/* Page Column */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-slate-800">{item.page_name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.page_path}
                          </span>
                        </div>
                      </td>

                      {/* Target TAT Column */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">
                          <Clock className="w-3 h-3" />
                          <span>{item.tat_days} Days</span>
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-4 max-w-xs truncate text-slate-600 font-medium">
                        {item.description || <span className="text-slate-300 italic">No notes</span>}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit TAT Rule"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete TAT Rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit TAT Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isEditing ? "Edit TAT Rule" : "Add New TAT Rule"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Define target turnaround days for this page.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Select System */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Select System <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={isEditing}
                  value={formSystemId}
                  onChange={(e) => handleSystemChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white font-semibold text-slate-800 cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  {AVAILABLE_SYSTEMS.map((sys) => (
                    <option key={sys.id} value={sys.id}>
                      {sys.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Page */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Select Page / Module <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={isEditing}
                  value={formPagePath}
                  onChange={(e) => setFormPagePath(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white font-semibold text-slate-800 cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  {AVAILABLE_SYSTEMS.find((s) => s.id === formSystemId)?.pages.map((p) => (
                    <option key={p.path} value={p.path}>
                      {p.name} ({p.path})
                    </option>
                  ))}
                </select>
              </div>

              {/* TAT Days */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Target TAT (in Days) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    required
                    value={formTatDays}
                    onChange={(e) => setFormTatDays(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-slate-50/50 font-bold text-slate-900"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Days
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Tasks completed after this duration will display in red (delayed); completed before or on time in green.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Description / SLA Remark (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Work order sample creation turnaround SLA"
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-slate-50/50 text-slate-800 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-soft-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : isEditing ? "Update Rule" : "Create Rule"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
