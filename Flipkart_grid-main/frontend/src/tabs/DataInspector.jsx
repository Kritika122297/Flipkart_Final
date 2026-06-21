import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileCheck2, Filter } from "lucide-react";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import { TABLE_ROWS, DATA_QUALITY } from "../data/mockData.js";

const CLEANERS = [
  { key: "datetime", label: "Drop invalid timestamps", on: true },
  { key: "coords", label: "Geo-fence to Bengaluru bounds", on: true },
  { key: "dedupe", label: "Remove duplicate challans", on: true },
  { key: "downcast", label: "Memory downcast (int/float)", on: false },
  { key: "category", label: "Categorize high-cardinality cols", on: false },
];

export default function DataInspector() {
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [cleaners, setCleaners] = useState(CLEANERS);

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFileName(f.name);
  };
  const toggle = (key) =>
    setCleaners((c) => c.map((x) => (x.key === key ? { ...x, on: !x.on } : x)));

  return (
    <div className="space-y-6">
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
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFileName(e.target.files[0].name)}
            />
            <motion.div animate={{ y: drag ? -4 : 0 }} className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-violet/15 text-violet">
              <UploadCloud size={26} />
            </motion.div>
            {fileName ? (
              <div className="flex items-center gap-2 font-mono text-sm text-emerald">
                <FileCheck2 size={16} /> {fileName}
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
            <QStat label="Raw rows" value={DATA_QUALITY.rawRows.toLocaleString()} accent="#94A3B8" />
            <QStat label="Clean rows" value={DATA_QUALITY.cleanRows.toLocaleString()} accent="#10B981" />
            <QStat label="Bad datetime" value={DATA_QUALITY.droppedDatetime} accent="#F59E0B" />
            <QStat label="Bad coords" value={DATA_QUALITY.droppedCoords} accent="#FB4D6D" />
          </div>
          <p className="mt-3 font-mono text-xs text-ink-faint">
            range: {DATA_QUALITY.dateRange} · {DATA_QUALITY.stations} stations · {DATA_QUALITY.locations} locations
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
                  <th key={h} className="bg-violet/[0.12] px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-violet">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((r, i) => (
                <tr
                  key={r.id}
                  className="border-t border-subtle transition-colors"
                  style={{
                    background: r.anomaly
                      ? "rgba(251,77,109,0.08)"
                      : i % 2 === 0
                      ? "rgba(14,21,37,0.4)"
                      : "rgba(19,29,48,0.4)",
                  }}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-faint">{r.id}</td>
                  <td className="px-4 py-2.5 text-ink-primary">{r.station}</td>
                  <td className="px-4 py-2.5 text-ink-body">{r.location}</td>
                  <td className="px-4 py-2.5 text-ink-body">{r.vehicle}</td>
                  <td className="px-4 py-2.5 text-ink-body">{r.violation}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-faint">{r.time}</td>
                  <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: r.anomaly ? "#FB4D6D" : "#7C6AF7" }}>
                    {r.cis}
                  </td>
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
    <span
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
      style={{ background: on ? "#10B981" : "rgba(148,163,220,0.15)" }}
    >
      <motion.span
        layout
        className="absolute h-4 w-4 rounded-full bg-white shadow"
        style={{ left: on ? 18 : 2 }}
      />
    </span>
  );
}
