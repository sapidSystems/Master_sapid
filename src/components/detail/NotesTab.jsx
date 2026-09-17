import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Clock,
  User,
  AtSign,
  CheckCircle2,
  Bell,
  Sparkles,
  Users,
} from "lucide-react";
import { formatDateTime } from "../../procurement/utils/dateUtils";
import supabase from "../../SupabaseClient";

export default function NotesTab({
  record,
  notes = [],
  onAddNote,
  isAdding = false,
  systemConfig,
  systemId,
}) {
  const [newNoteText, setNewNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Mention autocomplete state
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const textareaRef = useRef(null);
  const popupRef = useRef(null);

  const currentUserName = localStorage.getItem("user-name") || "Admin User";
  const currentUserId = localStorage.getItem("user-id");

  // 1. Fetch team members from Supabase users table on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const { data, error } = await supabase
          .from("users")
          .select("id, user_name, email_id, role, profile_image")
          .order("user_name");

        if (!error && data) {
          setUsers(data);
        }
      } catch (err) {
        console.error("Error fetching users for mentions:", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Filter users based on mention query
  const filteredUsers = users.filter((u) => {
    const q = (mentionQuery || "").toLowerCase();
    const uname = (u.user_name || "").toLowerCase();
    const email = (u.email_id || "").toLowerCase();
    return uname.includes(q) || email.includes(q);
  });

  // Keep highlighted index in bounds when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [mentionQuery]);

  // Click outside to close mention popup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target)
      ) {
        setShowMentionPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. Handle text changes and detect '@' trigger
  const handleTextChange = (e) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    setNewNoteText(val);

    const textBeforeCursor = val.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);

    if (mentionMatch) {
      const q = mentionMatch[1];
      // Index where the '@' character starts
      const atIdx = cursor - q.length - 1;
      setMentionQuery(q);
      setMentionStartIndex(atIdx);
      setShowMentionPopup(true);
    } else {
      setShowMentionPopup(false);
      setMentionStartIndex(-1);
    }
  };

  // 3. Insert selected user mention
  const handleSelectUser = (user) => {
    if (!user || mentionStartIndex < 0) return;

    const textarea = textareaRef.current;
    const cursor = textarea ? textarea.selectionStart : newNoteText.length;
    const before = newNoteText.slice(0, mentionStartIndex);
    const after = newNoteText.slice(cursor);
    const mentionTag = `@${user.user_name} `;
    const updatedText = `${before}${mentionTag}${after}`;

    setNewNoteText(updatedText);
    setShowMentionPopup(false);
    setMentionStartIndex(-1);

    // Reposition cursor and refocus
    setTimeout(() => {
      if (textarea) {
        const nextCursor = before.length + mentionTag.length;
        textarea.focus();
        textarea.setSelectionRange(nextCursor, nextCursor);
      }
    }, 10);
  };

  // 4. Keyboard navigation in autocomplete
  const handleKeyDown = (e) => {
    if (!showMentionPopup || filteredUsers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredUsers.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length
      );
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      handleSelectUser(filteredUsers[highlightedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowMentionPopup(false);
    }
  };

  // 5. Quick trigger button to insert '@'
  const handleTriggerMention = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart || newNoteText.length;
    const before = newNoteText.slice(0, cursor);
    const needsSpace = before.length > 0 && !before.endsWith(" ");
    const inserted = `${needsSpace ? " " : ""}@`;
    const updatedText = `${before}${inserted}${newNoteText.slice(cursor)}`;

    setNewNoteText(updatedText);
    setShowMentionPopup(true);
    setMentionQuery("");
    setMentionStartIndex(before.length + (needsSpace ? 1 : 0));

    setTimeout(() => {
      textarea.focus();
      const newPos = before.length + inserted.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  // 6. Submit note and dispatch notifications to tagged users
  const handleSubmit = async (e) => {
    e.preventDefault();
    const textToPost = newNoteText.trim();
    if (!textToPost || isAdding || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Parse all mentions in text (@username)
      const mentionMatches = textToPost.match(/@([a-zA-Z0-9._-]+)/g) || [];
      const mentionedUsernames = [
        ...new Set(mentionMatches.map((m) => m.slice(1).toLowerCase())),
      ];

      // Find real team members matching the tags
      const taggedUsersList = users.filter((u) =>
        mentionedUsernames.includes((u.user_name || "").toLowerCase())
      );

      // Send notifications to each tagged person
      if (taggedUsersList.length > 0) {
        const author = currentUserName;
        const systemTitle = systemConfig?.title || "Operational Systems";
        const recordRef =
          record?.woNo ||
          record?.sampleWONo ||
          record?.title ||
          record?.task_id ||
          record?.id ||
          "Record";

        const notifInserts = taggedUsersList.map((targetUser) => ({
          title: `@Mention: ${author} tagged you on ${recordRef}`,
          message: `${author} mentioned you in ${systemTitle} on ${recordRef}:\n\n"${textToPost}"\n\nLink: ${window.location.pathname}`,
          role_target: (targetUser.user_name || "").toLowerCase(),
          created_by: currentUserId ? parseInt(currentUserId) : null,
        }));

        const { error: notifError } = await supabase
          .from("notifications")
          .insert(notifInserts);

        if (notifError) {
          console.error("Error creating mention notifications:", notifError);
        } else {
          // Broadcast to sync local layout and open tabs
          window.dispatchEvent(new CustomEvent("notification-sent"));
        }
      }

      // Save note to record
      if (onAddNote) {
        const success = await onAddNote(textToPost);
        if (success) {
          setNewNoteText("");
          setShowMentionPopup(false);
          setMentionStartIndex(-1);
        }
      }
    } catch (err) {
      console.error("Failed to post note / notifications:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Format note text with highlighted @mention badges
  const renderNoteContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9._-]+)/g);

    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const username = part.slice(1);
        return (
          <span
            key={index}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mr-1 shadow-2xs cursor-default select-none"
          >
            <AtSign className="w-2.5 h-2.5 text-indigo-500" />
            <span>{username}</span>
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Add Note Card with Mention Support */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft-sm relative">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-600" />
            <span>Add New Note / Activity Remark</span>
          </h4>

          <button
            type="button"
            onClick={handleTriggerMention}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 transition-colors cursor-pointer"
            title="Type @ to tag a team member"
          >
            <AtSign className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tag Person (@)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newNoteText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Write a note, meeting summary, or status update regarding this record (type @ to tag any team member)..."
              rows={3}
              className="w-full p-3.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800 placeholder-slate-400 resize-none bg-slate-50/50 leading-relaxed font-sans"
            />

            {/* Mention Suggestions Floating Dropdown */}
            {showMentionPopup && (
              <div
                ref={popupRef}
                className="absolute z-50 left-0 bottom-full mb-2 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Header */}
                <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-brand-600" />
                    <span>Tag Team Member</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ↑↓ Navigate • ↵ Select • Esc Close
                  </span>
                </div>

                {/* Users List */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {isLoadingUsers ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Loading team members...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No team members match{" "}
                      <span className="font-semibold text-slate-600">
                        "{mentionQuery}"
                      </span>
                    </div>
                  ) : (
                    filteredUsers.map((u, idx) => {
                      const isHighlighted = idx === highlightedIndex;
                      const initial = (u.user_name || "U").charAt(0).toUpperCase();

                      return (
                        <button
                          key={u.id || idx}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={`w-full px-3.5 py-2.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                            isHighlighted
                              ? "bg-brand-50/80 text-brand-900"
                              : "hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          {/* Avatar */}
                          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 overflow-hidden">
                            {u.profile_image ? (
                              <img
                                src={u.profile_image}
                                alt={u.user_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initial
                            )}
                          </div>

                          {/* Name & Email */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold truncate">
                                @{u.user_name}
                              </span>
                              <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60">
                                {u.role || "user"}
                              </span>
                            </div>
                            {u.email_id && (
                              <p className="text-[10px] text-slate-400 truncate">
                                {u.email_id}
                              </p>
                            )}
                          </div>

                          {isHighlighted && (
                            <span className="text-[10px] font-bold text-brand-600 bg-white px-2 py-0.5 rounded-full border border-brand-200 shadow-2xs">
                              Press ↵
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>
                Posting as{" "}
                <strong className="text-slate-700 font-bold">
                  {currentUserName}
                </strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] text-indigo-600 font-medium">
                Tagged users get an instant alert in Checklist Notifications
              </span>
            </div>

            <button
              type="submit"
              disabled={!newNoteText.trim() || isAdding || isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-soft-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isAdding || isSubmitting ? "Posting & Notifying..." : "Post Comment"}
              </span>
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
          <span className="text-[11px] text-slate-400 font-medium">
            Newest First
          </span>
        </div>

        {notes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-soft-sm">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No notes or remarks yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Use the box above to tag team members (@username) or post status updates.
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

                <div className="text-xs text-slate-700 whitespace-pre-wrap pl-9 leading-relaxed">
                  {renderNoteContent(note.text || note.remark || note.remarks)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
