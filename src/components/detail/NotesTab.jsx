import React, { useState } from "react";
import { MessageSquare, Send, Clock, User, CheckCircle2 } from "lucide-react";
import { formatDateTime } from "../../procurement/utils/dateUtils";

export default function NotesTab({
  record,
  notes = [],
  onAddNote,
  isAdding = false,
}) {
  const [newNoteText, setNewNoteText] = useState("");
  const currentUserName = localStorage.getItem("user-name") || "Admin User";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || isAdding) return;

    if (onAddNote) {
      const success = await onAddNote(newNoteText.trim());
      if (success) {
        setNewNoteText("");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Add Note Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft-sm">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-600" />
          <span>Add New Note / Activity Remark</span>
        </h4>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Write a note, meeting summary, or status update regarding this record..."
            rows={3}
            className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800 placeholder-slate-400 resize-none bg-slate-50/50"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Posting as <strong className="text-slate-700">{currentUserName}</strong>
            </span>
            <button
              type="submit"
              disabled={!newNoteText.trim() || isAdding}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-soft-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAdding ? "Saving..." : "Post Comment"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notes Reverse-Chronological Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Activity Timeline & Remarks ({notes.length})
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">Newest First</span>
        </div>

        {notes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-soft-sm">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No notes or remarks yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Use the box above to log comments, follow-up logs, or instructions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note, idx) => (
              <div
                key={note.id || idx}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-soft-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold uppercase">
                      {(note.author || note.addedBy || "U").charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {note.author || note.addedBy || "Team Member"}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-300" />
                    {note.timestamp ? formatDateTime(note.timestamp) : "Recent"}
                  </span>
                </div>

                <p className="text-xs text-slate-700 whitespace-pre-wrap pl-9 leading-relaxed">
                  {note.text || note.remark || note.remarks}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
