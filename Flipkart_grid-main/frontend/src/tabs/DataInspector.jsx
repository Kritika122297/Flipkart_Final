import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileCheck2, Filter, Loader2, CheckCircle2, Sparkles, Columns, X } from "lucide-react";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import { Loading, ErrorState } from "../components/ui/AsyncState.jsx";
import { useFetch, useLazyRequest, endpoints } from "../lib/api.js";

const CLEANERS = [
  { key: "datetime", label: "Drop invalid timestamps", on: true },
  { key: "coords", label: "Geo-fence to Bengaluru bounds", on: true },
  { key: "dedupe", label: "Remove duplicate challans", on: true },
  { key: "downcast", label: "Memory downcast (int/float)", on: false },
  { key: "category", label: "Standardize / categorize text", on: false },
];

// Required schema + the labels/aliases used to auto-guess a mapping.
const REQUIRED = [
  { key: "latitude", label: "Latitude", aliases: ["lat"] },
  { key: "longitude", label: "Longitude", aliases: ["lng", "lon", "long"] },
  { key: "created_datetime", label: "Timestamp", aliases: ["timestamp", "datetime", "date_time", "date", "time"] },
  { key: "police_station", label: "Police station", aliases: ["station", "ps"] },
];

// Read the header row of a CSV client-side.
function readHeaders(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const firstLine = text.split(/\r?\n/).find((l) => l.trim().length) || "";
      resolve(firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, "")));
    };
    reader.onerror = () => resolve([]);
    reader.readAsText(file.slice(0, 65536)); // first 64KB is plenty for headers
  });
}

// Best-guess header for each required field (exact → alias → keyword include).
function guessMap(headers) {
  const lower = headers.map((h) => h.toLowerCase());
  const out = {};
  for (const f of REQUIRED) {
    let idx = lower.indexOf(f.key);
    if (idx === -1) idx = lower.findIndex((h) => f.aliases.includes(h));
    if (idx === -1) idx = lower.findIndex((h) => f.aliases.some((a) => h.includes(a)) || h.includes(f.key));
    out[f.key] = idx >= 0 ? headers[idx] : "";
  }
  return out;
}

export default function DataInspector() {
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [cleaners, setCleaners] = useState(CLEANERS);
  const [rows, setRows] = useState([]);
  const [quality, setQuality] = useState(null);
  const [activated, setActivated] = useState(null);
  const [mapping, setMapping] = useState(null); // { file, headers, map } when manual mapping needed

  // Default dataset preview.
  const { data: preview, loading, error, refetch } = useFetch(endpoints.dataPreview, []);
  useEffect(() => {
    if (preview) {
      setRows(preview.rows);
      setQuality(preview.quality);
    }
  }, [preview]);

  // Upload + clean actions.
  const { run: runUpload, loading: uploading } = useLazyRequest(endpoints.dataUpload);
  const { run: runClean, data: cleanResult, loading: cleaning } = useLazyRequest(endpoints.dataClean);

  // Always attempt the upload first (backend fuzzy-maps Lat/Lng/Timestamp/etc.).
  // Only fall back to the manual mapping UI if the backend reports missing columns.
  const onFile = (f) => {
    if (!f) return;
    setFileName(f.name);
    doUpload(f);
  };

  const doUpload = async (f, columnMap) => {
    setMapping(null);
    try {
      const res = await runUpload(f, columnMap);
      if (res.activated) setActivated(res.active);
      if (res.rows?.length) setRows(res.rows);
      if (res.metadata) {
        setQuality({
          rawRows: res.metadata.rawRows ?? 0,
          cleanRows: res.metadata.cleanRows ?? 0,
          droppedDatetime: res.metadata.droppedDatetime ?? 0,
          droppedCoords: res.metadata.droppedCoords ?? 0,
          dateRange: res.metadata.dateRange ?? "—",
          stations: res.metadata.stations ?? 0,
          locations: res.metadata.locations ?? 0,
        });
      }
      // Tell every mounted tab to refetch the now-active dataset.
      if (res.activated) window.dispatchEvent(new CustomEvent("parkwatch:dataset-changed"));
    } catch (e) {
      // Schema mismatch → let the user map columns manually, then retry.
      if (/missing required|could not process/i.test(e?.message || "")) {
        const headers = await readHeaders(f);
        if (headers.length) setMapping({ file: f, headers, map: guessMap(headers) });
      }
      /* other errors: keep prior preview; upload spinner already cleared */
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    onFile(e.dataTransfer.files?.[0]);
  };
  const toggle = (key) => setCleaners((c) => c.map((x) => (x.key === key ? { ...x, on: !x.on } : x)));

  const applyClean = () => {
    const get = (k) => cleaners.find((c) => c.key === k)?.on;
    runClean({
      drop_nulls: !!(get("datetime") || get("coords")),
      remove_dupes: !!get("dedupe"),
      standardize: !!get("category"),
    }).catch(() => {});
  };

  if (loading && !preview) return <Loading label="Loading dataset…" height={420} />;
  if (error) return <ErrorState error={error} onRetry={refetch} height={420} />;

  const q = quality ?? preview.quality;

  return (
    <div className="space-y-6">
      {activated && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-card px-4 py-3"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderLeft: "3px solid #10B981" }}
        >
          <CheckCircle2 size={18} className="shrink-0 text-emerald" />
          <p className="text-sm text-ink-body">
            <span className="font-semibold text-emerald">Dataset activated.</span> {activated.rows.toLocaleString()} records ·{" "}
            {activated.stations} stations · avg CIS {activated.avgCIS}. All tabs (Command Center, Analytics, Forecast,
            Dispatch, CCTV, Fleet) now reflect this data — switch tabs to see it update.
          </p>
        </motion.div>
      )}

      {/* Manual column mapping — shown when uploaded headers don't match exactly */}
      <AnimatePresence>
        {mapping && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <GlassCard className="p-5" accentBar="from-amber to-rose" hover={false}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <SectionHeader
                  title="Map your columns"
                  sub={`"${mapping.file.name}" headers don't match the schema — map each required field to a column.`}
                  icon={Columns}
                  accent="amber"
                  className="mb-0"
                />
                <button onClick={() => setMapping(null)} className="text-ink-faint transition-colors hover:text-ink-primary">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {REQUIRED.map((f) => (
                  <label key={f.key} className="block">
                    <span className="label-caps mb-1.5 block">
                      {f.label} <span className="text-rose">*</span>
                    </span>
                    <select
                      value={mapping.map[f.key] || ""}
                      onChange={(e) => setMapping((m) => ({ ...m, map: { ...m.map, [f.key]: e.target.value } }))}
                      className="w-full rounded-inner border bg-card/60 px-3 py-2.5 text-sm text-ink-primary outline-none transition-colors focus:border-amber focus:ring-2 focus:ring-amber/30"
                      style={{ borderColor: mapping.map[f.key] ? "rgba(148,163,220,0.15)" : "rgba(251,77,109,0.5)" }}
                    >
                      <option value="" style={{ background: "#0E1525" }}>— select column —</option>
                      {mapping.headers.map((h) => (
                        <option key={h} value={h} style={{ background: "#0E1525", color: "#E2E8F0" }}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => {
                    const cm = {};
                    REQUIRED.forEach((f) => {
                      if (mapping.map[f.key]) cm[f.key] = mapping.map[f.key];
                    });
                    doUpload(mapping.file, cm);
                  }}
                  disabled={REQUIRED.some((f) => !mapping.map[f.key]) || uploading}
                  className="flex items-center gap-2 rounded-inner bg-gradient-to-r from-emerald to-cyan px-5 py-2.5 font-semibold text-white shadow-glow-emerald transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Confirm mapping & upload
                </button>
                <button onClick={() => setMapping(null)} className="rounded-inner border border-subtle px-4 py-2.5 text-sm text-ink-body transition-colors hover:text-ink-primary">
                  Cancel
                </button>
                {REQUIRED.some((f) => !mapping.map[f.key]) && (
                  <span className="text-xs text-rose">Map all four required fields to continue.</span>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Upload zone */}
        <GlassCard className="p-5 lg:col-span-2" accentBar="from-violet to-cyan" hover={false}>
          <SectionHeader title="Data inspector" sub="Upload a BTP violation CSV to ingest" className="mb-4" />
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className="flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-12 text-center transition-all"
            style={{
              borderColor: drag ? "#7C6AF7" : "rgba(124,106,247,0.4)",
              background: drag ? "rgba(124,106,247,0.08)" : "transparent",
              boxShadow: drag ? "0 0 0 4px rgba(124,106,247,0.12)" : "none",
            }}
          >
            <input type="file" accept=".csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <motion.div animate={{ y: drag ? -4 : 0 }} className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-violet/15 text-violet">
              {uploading ? <Loader2 size={26} className="animate-spin" /> : <UploadCloud size={26} />}
            </motion.div>
            {fileName ? (
              <div className="flex items-center gap-2 font-mono text-sm text-emerald">
                <FileCheck2 size={16} /> {fileName} {uploading && <span className="text-ink-faint">· processing…</span>}
              </div>
            ) : (
              <>
                <p className="font-medium text-ink-primary">Drag & drop CSV here</p>
                <p className="mt-1 text-xs text-ink-faint">or click to browse · max 200 MB</p>
              </>
            )}
          </label>

          {/* Quality stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QStat label="Raw rows" value={(q.rawRows ?? 0).toLocaleString()} accent="#94A3B8" />
            <QStat label="Clean rows" value={(q.cleanRows ?? 0).toLocaleString()} accent="#10B981" />
            <QStat label="Bad datetime" value={q.droppedDatetime ?? 0} accent="#F59E0B" />
            <QStat label="Bad coords" value={q.droppedCoords ?? 0} accent="#FB4D6D" />
          </div>
          <p className="mt-3 font-mono text-xs text-ink-faint">
            range: {q.dateRange} · {q.stations} stations · {q.locations} locations
          </p>
        </GlassCard>

        {/* Cleaning toggles */}
        <GlassCard className="p-5" accentBar="from-emerald to-cyan" hover={false}>
          <SectionHeader title="Cleaning pipeline" icon={Filter} accent="emerald" className="mb-4" />
          <div className="space-y-2.5">
            {cleaners.map((c) => (
              <button
                key={c.key}
                onClick={() => toggle(c.key)}
                className="flex w-full items-center justify-between rounded-inner border border-subtle bg-card/40 px-3.5 py-2.5 text-left text-sm transition-colors hover:border-strong"
              >
                <span className={c.on ? "text-ink-primary" : "text-ink-body"}>{c.label}</span>
                <Toggle on={c.on} />
              </button>
            ))}
          </div>

          <button
            onClick={applyClean}
            disabled={cleaning}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-inner bg-gradient-to-r from-emerald to-cyan py-2.5 font-semibold text-white shadow-glow-emerald transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {cleaning ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {cleaning ? "Cleaning…" : "Apply cleaning"}
          </button>

          {cleanResult && (
            <div className="mt-3 rounded-inner border border-subtle bg-card/40 p-3 text-xs">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="label-caps">Result</span>
                <span className="font-mono text-emerald">
                  {cleanResult.before.rows.toLocaleString()} → {cleanResult.after.rows.toLocaleString()} rows
                </span>
              </div>
              {cleanResult.changes.length ? (
                cleanResult.changes.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-ink-body">
                    <CheckCircle2 size={12} className="text-emerald" /> {c}
                  </div>
                ))
              ) : (
                <div className="text-ink-faint">No changes with current settings.</div>
              )}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Data table */}
      <GlassCard className="overflow-hidden p-0" accentBar="from-violet to-cyan" hover={false}>
        <div className="px-5 py-4">
          <SectionHeader title="Records preview" sub="Anomaly rows (CIS > 88) highlighted in rose" className="mb-0" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                {["ID", "Station", "Location", "Vehicle", "Violation", "Time", "CIS"].map((h) => (
                  <th key={h} className="bg-violet/[0.12] px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-violet">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={`${r.id}-${i}`}
                  className="border-t border-subtle transition-colors"
                  style={{ background: r.anomaly ? "rgba(251,77,109,0.08)" : i % 2 === 0 ? "rgba(14,21,37,0.4)" : "rgba(19,29,48,0.4)" }}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-faint">{r.id}</td>
                  <td className="px-4 py-2.5 text-ink-primary">{r.station}</td>
                  <td className="px-4 py-2.5 text-ink-body">{r.location}</td>
                  <td className="px-4 py-2.5 text-ink-body">{r.vehicle}</td>
                  <td className="px-4 py-2.5 text-ink-body">{r.violation}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-faint">{r.time}</td>
                  <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: r.anomaly ? "#FB4D6D" : "#7C6AF7" }}>{r.cis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function QStat({ label, value, accent }) {
  return (
    <div className="rounded-inner border border-subtle bg-card/40 p-3 text-center">
      <div className="font-display text-xl" style={{ color: accent }}>{value}</div>
      <div className="mt-1 text-[0.6rem] uppercase tracking-wider text-ink-faint">{label}</div>
    </div>
  );
}

function Toggle({ on }) {
  return (
    <span className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors" style={{ background: on ? "#10B981" : "rgba(148,163,220,0.15)" }}>
      <motion.span layout className="absolute h-4 w-4 rounded-full bg-white shadow" style={{ left: on ? 18 : 2 }} />
    </span>
  );
}
