import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileCheck2, Filter, Loader2, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
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

export default function DataInspector() {
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [cleaners, setCleaners] = useState(CLEANERS);
  const [rows, setRows] = useState([]);
  const [quality, setQuality] = useState(null);
  const [activated, setActivated] = useState(null);
  const [uploadState, setUploadState] = useState("idle"); // idle | uploading | processing | done | error
  const [uploadError, setUploadError] = useState(null);
  const pollRef = useRef(null);

  const { data: preview, loading, error, refetch } = useFetch(endpoints.dataPreview, []);
  useEffect(() => {
    if (preview) {
      setRows(preview.rows);
      setQuality(preview.quality);
    }
  }, [preview]);

  const { run: runUpload } = useLazyRequest(endpoints.dataUpload);
  const { run: runClean, data: cleanResult, loading: cleaning } = useLazyRequest(endpoints.dataClean);

  // Poll job status until done or error.
  const startPolling = (jobId) => {
    setUploadState("processing");
    pollRef.current = setInterval(async () => {
      try {
        const job = await endpoints.uploadStatus(jobId);
        if (job.status === "done") {
          clearInterval(pollRef.current);
          setUploadState("done");
          const res = job.result;
          if (res.activated) setActivated(res.active);
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
          // Refetch the preview to get the updated rows (avoids sending all rows via job result).
          refetch();
          window.dispatchEvent(new CustomEvent("parkwatch:dataset-changed"));
        } else if (job.status === "error") {
          clearInterval(pollRef.current);
          setUploadState("error");
          setUploadError(job.error || "Processing failed");
        }
      } catch {
        clearInterval(pollRef.current);
        setUploadState("error");
        setUploadError("Lost connection to server");
      }
    }, 2000);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const onFile = async (f) => {
    if (!f) return;
    setFileName(f.name);
    setUploadState("uploading");
    setUploadError(null);
    setActivated(null);
    try {
      const res = await runUpload(f);
      // Backend returns job_id immediately — start polling.
      startPolling(res.job_id);
    } catch (e) {
      setUploadState("error");
      setUploadError(e?.message || "Upload failed");
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

  const q = quality ?? preview?.quality ?? {};
  const isProcessing = uploadState === "uploading" || uploadState === "processing";

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <AnimatePresence>
        {activated && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-card px-4 py-3"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderLeft: "3px solid #10B981" }}
          >
            <CheckCircle2 size={18} className="shrink-0 text-emerald" />
            <p className="text-sm text-ink-body">
              <span className="font-semibold text-emerald">Dataset activated.</span>{" "}
              {activated.rows?.toLocaleString()} records · {activated.stations} stations · avg CIS {activated.avgCIS}.
              All tabs now reflect this data.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Upload zone */}
        <GlassCard className="p-5 lg:col-span-2" accentBar="from-violet to-cyan" hover={false}>
          <SectionHeader title="Data inspector" sub="Upload a BTP violation CSV to ingest" className="mb-4" />

          <label
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className="flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-12 text-center transition-all"
            style={{
              borderColor: drag ? "#7C6AF7" : "rgba(124,106,247,0.4)",
              background: drag ? "rgba(124,106,247,0.08)" : "transparent",
              pointerEvents: isProcessing ? "none" : "auto",
            }}
          >
            <input
              type="file"
              accept=".csv"
              className="hidden"
              disabled={isProcessing}
              onChange={(e) => onFile(e.target.files?.[0])}
            />

            <motion.div animate={{ y: drag ? -4 : 0 }} className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-violet/15 text-violet">
              {isProcessing ? <Loader2 size={26} className="animate-spin" /> : <UploadCloud size={26} />}
            </motion.div>

            {isProcessing ? (
              <div className="space-y-1">
                <p className="font-medium text-ink-primary">{fileName}</p>
                <p className="text-xs text-ink-faint">
                  {uploadState === "uploading" ? "Uploading…" : "Processing in background — you can browse other tabs"}
                </p>
                <div className="mx-auto mt-3 h-1 w-40 overflow-hidden rounded-full bg-violet/20">
                  <motion.div
                    className="h-full rounded-full bg-violet"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                  />
                </div>
              </div>
            ) : uploadState === "error" ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-rose">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">Upload failed</span>
                </div>
                <p className="text-xs text-ink-faint">{uploadError}</p>
                <p className="mt-1 text-xs text-violet">Click to try again</p>
              </div>
            ) : fileName && uploadState === "done" ? (
              <div className="flex items-center gap-2 font-mono text-sm text-emerald">
                <FileCheck2 size={16} /> {fileName} · done
              </div>
            ) : (
              <>
                <p className="font-medium text-ink-primary">Drag & drop CSV here</p>
                <p className="mt-1 text-xs text-ink-faint">or click to browse</p>
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
