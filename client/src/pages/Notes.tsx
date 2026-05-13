import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Loader2, ChevronDown, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

function getWeekId(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function weekIdToLabel(weekId: string): string {
  const [year, w] = weekId.split("-W");
  return `Week ${parseInt(w)}, ${year}`;
}

interface Debrief { insight: string; talkingPoint: string; followUp: string; }

function parseDebrief(raw: string): Debrief {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "insight" in parsed) return parsed as Debrief;
  } catch {}
  return { insight: raw || "", talkingPoint: "", followUp: "" };
}

const FIELDS: { key: keyof Debrief; label: string; prompt: string; accent: string }[] = [
  { key: "insight", label: "Key insight", prompt: "What data point, trend, or story shifted your thinking this week?", accent: "rgba(245,166,35,0.7)" },
  { key: "talkingPoint", label: "Best talking point used", prompt: "Which line actually landed in a partner conversation this week? Who did you say it to?", accent: "rgba(52,211,153,0.7)" },
  { key: "followUp", label: "What to follow up", prompt: "Who needs a follow-up call or email next week? What is the hook?", accent: "rgba(96,165,250,0.7)" },
];

export default function Notes() {
  const [currentWeekId] = useState(getWeekId);
  const [selectedWeekId, setSelectedWeekId] = useState(getWeekId);
  const [debrief, setDebrief] = useState<Debrief>({ insight: "", talkingPoint: "", followUp: "" });
  const [isDirty, setIsDirty] = useState(false);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);

  const { data: allNotes, isLoading: notesLoading } = trpc.notes.list.useQuery();
  const { data: currentNote, isLoading: noteLoading } = trpc.notes.get.useQuery({ weekId: selectedWeekId });
  const utils = trpc.useUtils();

  const deleteNote = trpc.notes.delete.useMutation({
    onSuccess: () => {
      toast.success("Debrief deleted");
      utils.notes.list.invalidate();
      utils.notes.get.invalidate({ weekId: selectedWeekId });
      // If we deleted the currently selected week, go back to current week
      setSelectedWeekId(currentWeekId);
    },
    onError: () => toast.error("Failed to delete debrief"),
  });

  const handleDelete = useCallback((weekId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this debrief? This cannot be undone.")) return;
    deleteNote.mutate({ weekId });
  }, [deleteNote]);

  const saveNote = trpc.notes.save.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate();
      utils.notes.get.invalidate({ weekId: selectedWeekId });
      setIsDirty(false);
      toast.success("Debrief saved");
    },
    onError: () => toast.error("Failed to save"),
  });

  useEffect(() => {
    if (currentNote) { setDebrief(parseDebrief(currentNote.content)); setIsDirty(false); }
    else if (!noteLoading) { setDebrief({ insight: "", talkingPoint: "", followUp: "" }); setIsDirty(false); }
  }, [currentNote, noteLoading]);

  const updateField = (key: keyof Debrief, value: string) => {
    setDebrief(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = useCallback(() => {
    const hasContent = debrief.insight.trim() || debrief.talkingPoint.trim() || debrief.followUp.trim();
    if (hasContent) saveNote.mutate({ weekId: selectedWeekId, content: JSON.stringify(debrief) });
  }, [debrief, selectedWeekId, saveNote]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); if (isDirty) handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDirty, handleSave]);

  const weekOptions: string[] = [];
  for (let i = 0; i < 13; i++) { const d = new Date(); d.setDate(d.getDate() - i * 7); weekOptions.push(getWeekId(d)); }
  const uniqueWeeks = Array.from(new Set(weekOptions));
  const isCurrentWeek = selectedWeekId === currentWeekId;
  const hasContent = debrief.insight.trim() || debrief.talkingPoint.trim() || debrief.followUp.trim();

  // Check if the currently selected week has a saved note (for showing delete on current week)
  const currentNoteExists = allNotes?.some(n => n.weekId === selectedWeekId);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-2xl">
      <div className="mb-8">
        <p className="font-mono uppercase tracking-[0.22em] mb-3" style={{ fontSize: "8px", fontWeight: 700, color: "rgba(245,166,35,0.6)" }}>Weekly Debrief</p>
        <h1 className="font-serif font-bold tracking-tight mb-3" style={{ fontSize: "clamp(24px, 4vw, 32px)", letterSpacing: "-0.02em", color: "rgba(245,238,220,0.97)", lineHeight: 1.15 }}>What I learned this week</h1>
        <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.38)", lineHeight: 1.6 }}>Three questions. Five minutes. A record of what is actually working in the field.</p>
        <div style={{ marginTop: "20px", height: "1px", background: "linear-gradient(90deg, rgba(245,166,35,0.4) 0%, rgba(245,166,35,0.08) 40%, transparent 80%)" }} />
      </div>

      {/* Week picker + delete current week */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <button onClick={() => setWeekPickerOpen(v => !v)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 14px", background: "oklch(0.135 0.018 260 / 0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", cursor: "pointer" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,166,35,0.25)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
            <span className="font-mono" style={{ fontSize: "11px", color: "rgba(245,238,220,0.7)", fontWeight: 600 }}>{isCurrentWeek ? "This week" : weekIdToLabel(selectedWeekId)}</span>
            <ChevronDown style={{ width: "12px", height: "12px", color: "rgba(245,238,220,0.35)", transform: weekPickerOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>
          <AnimatePresence>
            {weekPickerOpen && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50, background: "oklch(0.14 0.018 260)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden", minWidth: "180px" }}>
                {uniqueWeeks.map(wk => (
                  <button key={wk} onClick={() => { setSelectedWeekId(wk); setWeekPickerOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 16px", fontSize: "12px", color: wk === selectedWeekId ? "rgba(245,166,35,0.9)" : "rgba(245,238,220,0.6)", background: wk === selectedWeekId ? "rgba(245,166,35,0.08)" : "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)" }} onMouseEnter={e => { if (wk !== selectedWeekId) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }} onMouseLeave={e => { if (wk !== selectedWeekId) e.currentTarget.style.background = "transparent"; }}>
                    {wk === currentWeekId ? "This week" : weekIdToLabel(wk)}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Delete button for currently selected week (only if it has saved content) */}
        {currentNoteExists && (
          <button
            onClick={(e) => handleDelete(selectedWeekId, e)}
            disabled={deleteNote.isPending}
            aria-label="Delete this debrief"
            style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "8px", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.18)"; }}
          >
            {deleteNote.isPending ? <Loader2 style={{ width: "11px", height: "11px", color: "rgba(239,68,68,0.7)" }} className="animate-spin" /> : <Trash2 style={{ width: "11px", height: "11px", color: "rgba(239,68,68,0.7)" }} />}
            <span className="font-mono" style={{ fontSize: "10px", color: "rgba(239,68,68,0.7)", fontWeight: 600 }}>Delete</span>
          </button>
        )}
      </div>

      {noteLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 style={{ width: "18px", height: "18px", color: "rgba(245,166,35,0.6)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {FIELDS.map(field => (
            <div key={field.key} style={{ background: "oklch(0.135 0.018 260 / 0.9)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: `3px solid ${field.accent}`, borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.35)" }}>
              <div style={{ padding: "12px 18px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="font-mono uppercase tracking-[0.15em]" style={{ fontSize: "8px", fontWeight: 700, color: field.accent }}>{field.label}</p>
              </div>
              <textarea value={debrief[field.key]} onChange={e => updateField(field.key, e.target.value)} placeholder={field.prompt} rows={3} style={{ width: "100%", padding: "14px 18px", background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "rgba(245,238,220,0.85)", lineHeight: 1.7, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
        <p className="font-mono" style={{ fontSize: "10px", color: "rgba(245,238,220,0.2)" }}>Cmd+S to save</p>
        <motion.button onClick={handleSave} disabled={!isDirty || saveNote.isPending || !hasContent} whileHover={isDirty && hasContent ? { scale: 1.04 } : {}} whileTap={isDirty && hasContent ? { scale: 0.95 } : {}} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 18px", fontSize: "11px", fontWeight: 600, background: isDirty && hasContent ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)", color: isDirty && hasContent ? "rgba(245,166,35,0.9)" : "rgba(245,238,220,0.25)", border: `1px solid ${isDirty && hasContent ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: "8px", cursor: isDirty && hasContent ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
          {saveNote.isPending ? <Loader2 style={{ width: "12px", height: "12px" }} className="animate-spin" /> : <Save style={{ width: "12px", height: "12px" }} />}
          Save debrief
        </motion.button>
      </div>

      {!notesLoading && allNotes && allNotes.filter(n => n.weekId !== selectedWeekId).length > 0 && (
        <div>
          <p className="font-mono uppercase tracking-[0.2em] mb-3" style={{ fontSize: "8px", color: "rgba(245,238,220,0.28)", fontWeight: 700 }}>Previous debriefs</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {allNotes.filter(n => n.weekId !== selectedWeekId).map(note => {
              const d = parseDebrief(note.content);
              return (
                <motion.div key={note.id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ position: "relative" }}>
                  <motion.button
                    onClick={() => setSelectedWeekId(note.weekId)}
                    whileHover={{ y: -2, boxShadow: "0 6px 24px rgba(0,0,0,0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    style={{ width: "100%", textAlign: "left", padding: "16px 18px", paddingRight: "52px", background: "oklch(0.135 0.018 260 / 0.85)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
                  >
                    <p className="font-mono" style={{ fontSize: "9px", color: "rgba(245,166,35,0.55)", marginBottom: "10px", fontWeight: 700, letterSpacing: "0.1em" }}>{weekIdToLabel(note.weekId)}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {FIELDS.map(field => {
                        const val = d[field.key];
                        if (!val || !val.trim()) return null;
                        return (
                          <div key={field.key} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: field.accent, marginTop: "5px", flexShrink: 0 }} />
                            <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.5)", lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as const }}>{val}</p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.button>
                  {/* Delete button overlaid on top-right of card */}
                  <button
                    onClick={(e) => handleDelete(note.weekId, e)}
                    aria-label={`Delete debrief for ${weekIdToLabel(note.weekId)}`}
                    style={{ position: "absolute", top: "12px", right: "12px", display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s", zIndex: 2 }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)"; }}
                  >
                    <Trash2 style={{ width: "12px", height: "12px", color: "rgba(239,68,68,0.65)" }} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
