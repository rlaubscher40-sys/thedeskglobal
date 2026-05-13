/**
 * LinkedInPostModal
 *
 * LinkedIn's share URL only supports pre-filling a URL, not post body text.
 * This modal works around that limitation with a "Copy & Post" flow:
 *   1. Show the generated post text in an editable textarea
 *   2. Auto-copy to clipboard on open (with a manual copy button as fallback)
 *   3. Open linkedin.com/feed in a new tab so the user can paste and post
 */
import { useState, useEffect, useRef } from "react";
import { X, Copy, Check, Linkedin, ExternalLink, ClipboardCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LinkedInPostModalProps {
  open: boolean;
  onClose: () => void;
  postText: string;
  /** Optional context label shown above the post, e.g. "Say This" or "Ruben's Take" */
  label?: string;
}

export function LinkedInPostModal({ open, onClose, postText, label = "LinkedIn Post" }: LinkedInPostModalProps) {
  const [text, setText] = useState(postText);
  const [copied, setCopied] = useState(false);
  const [autoCopied, setAutoCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset text when postText prop changes
  useEffect(() => {
    setText(postText);
  }, [postText]);

  // Auto-copy to clipboard when modal opens
  useEffect(() => {
    if (!open) {
      setCopied(false);
      setAutoCopied(false);
      return;
    }
    const tryAutoCopy = async () => {
      try {
        await navigator.clipboard.writeText(postText);
        setAutoCopied(true);
      } catch {
        // Clipboard permission denied -- user will use the manual copy button
      }
    };
    // Small delay so the modal is visible before the clipboard prompt fires
    const t = setTimeout(tryAutoCopy, 300);
    return () => clearTimeout(t);
  }, [open, postText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select all text in textarea
      textareaRef.current?.select();
    }
  };

  const handleOpenLinkedIn = () => {
    // Copy latest edited text before opening
    navigator.clipboard.writeText(text).catch(() => {});
    window.open("https://www.linkedin.com/feed/", "_blank", "noopener,noreferrer");
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="li-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998]"
            style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="li-modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="relative w-full max-w-lg rounded-2xl overflow-hidden"
              style={{
                pointerEvents: "auto",
                background: "rgba(10,12,24,0.98)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(10,102,194,0.2)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(10,102,194,0.2)", border: "1px solid rgba(10,102,194,0.35)" }}
                  >
                    <Linkedin className="w-4 h-4" style={{ color: "#0a66c2" }} />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(245,238,220,0.4)" }}>
                      {label}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "rgba(245,238,220,0.9)" }}>
                      Post to LinkedIn
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: "rgba(245,238,220,0.4)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(245,238,220,0.8)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(245,238,220,0.4)"; e.currentTarget.style.background = "transparent"; }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Auto-copy notice */}
              <AnimatePresence>
                {autoCopied && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 px-5 py-2.5"
                    style={{ background: "rgba(52,211,153,0.08)", borderBottom: "1px solid rgba(52,211,153,0.15)" }}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(52,211,153,0.85)" }} />
                    <p className="text-[11px] font-mono" style={{ color: "rgba(52,211,153,0.85)" }}>
                      Copied to clipboard automatically. Just paste in LinkedIn.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Instructions */}
              <div className="px-5 pt-4 pb-2">
                <p className="text-[12px]" style={{ color: "rgba(245,238,220,0.5)", lineHeight: 1.6 }}>
                  Edit the post below if needed, copy it, then click "Open LinkedIn" to paste and publish.
                </p>
              </div>

              {/* Editable post text */}
              <div className="px-5 pb-4">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  className="w-full resize-none rounded-xl text-sm leading-relaxed outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(245,238,220,0.85)",
                    padding: "14px 16px",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(10,102,194,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(10,102,194,0.12)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <p className="text-[10px] font-mono mt-1.5 text-right" style={{ color: "rgba(245,238,220,0.25)" }}>
                  {text.length} chars
                </p>
              </div>

              {/* Action buttons */}
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: copied ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.12)"}`,
                    color: copied ? "rgba(52,211,153,0.9)" : "rgba(245,238,220,0.75)",
                  }}
                  onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; } }}
                  onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; } }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy post"}
                </button>

                {/* Open LinkedIn button */}
                <button
                  onClick={handleOpenLinkedIn}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: "rgba(10,102,194,0.85)",
                    border: "1px solid rgba(10,102,194,0.6)",
                    color: "#ffffff",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(10,102,194,1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(10,102,194,0.85)"; }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open LinkedIn
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
