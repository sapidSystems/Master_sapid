import React, { useState } from "react";
import { FileText, Image as ImageIcon, Volume2, Download, Eye, ExternalLink } from "lucide-react";
import AudioPlayer from "../AudioPlayer";

export default function FilesTab({ record }) {
  const [activeImage, setActiveImage] = useState(null);

  const hasImage = Boolean(record?.image);
  const hasAudio = Boolean(record?.audio_url);
  const hasAttachment = Boolean(record?.instruction_attachment_url);

  if (!hasImage && !hasAudio && !hasAttachment) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-soft-sm max-w-xl mx-auto">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
        <p className="font-semibold text-slate-700 text-sm">No Files or Media Attached</p>
        <p className="text-xs text-slate-400 mt-1">
          This record does not have photos, audio recordings, or instruction attachments associated with it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Audio Voice Notes */}
      {hasAudio && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Volume2 className="w-4 h-4 text-brand-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Audio Recording / Voice Instruction
            </h4>
          </div>
          <AudioPlayer audioUrl={record.audio_url} />
        </div>
      )}

      {/* Photo Attachment */}
      {hasImage && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Task Completion Photo / Image Evidence
              </h4>
            </div>
            <a
              href={record.image}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-semibold"
            >
              <span>Open full size</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50 max-h-96 flex items-center justify-center p-2">
            <img
              src={record.image}
              alt="Task Attachment"
              className="max-h-80 object-contain rounded-lg shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => setActiveImage(record.image)}
            />
          </div>
        </div>
      )}

      {/* Instruction Attachment Document */}
      {hasAttachment && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <FileText className="w-4 h-4 text-brand-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Standard Operating Instruction Document
            </h4>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-brand-500" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Instruction Attachment
                </p>
                <p className="text-[11px] text-slate-400">
                  Type: {record.instruction_attachment_type || "Document"}
                </p>
              </div>
            </div>

            <a
              href={record.instruction_attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-soft-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-transparent">
            <img
              src={activeImage}
              alt="Full Preview"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
