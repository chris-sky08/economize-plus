import React from "react";

export default function SkeletonCard() {
  return (
    <div
      role="status"
      aria-label="Carregando produto..."
      className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs"
    >
      <div className="animate-pulse space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 rounded-full bg-slate-200" />
          <div className="h-4 w-24 rounded-md bg-slate-100" />
        </div>
        <div className="flex items-center gap-3.5">
          <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-6 w-28 rounded bg-emerald-100" />
          </div>
        </div>
        <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
          <div className="h-8 w-full rounded-lg bg-slate-100" />
          <div className="h-8 w-full rounded-lg bg-slate-100" />
          <div className="h-8 w-full rounded-lg bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-10 flex-1 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-10 w-20 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
