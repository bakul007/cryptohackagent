"use client";

export function NarrativeReport({ narrative, loading }: { narrative: string | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="panel">
        <div className="meta">Agent is narrating the trace...</div>
      </div>
    );
  }
  if (!narrative) return null;

  return (
    <div className="panel">
      <div className="meta">Agent narrative</div>
      <div className="narrative">{narrative}</div>
    </div>
  );
}
