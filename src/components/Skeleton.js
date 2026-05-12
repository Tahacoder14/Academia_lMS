"use client";
import React from 'react';

export function SkeletonCard() {
  return (
    <div className="p-8 sm:p-10 bg-white dark:bg-[#0A0F1E] border border-slate-100 dark:border-white/5 rounded-[2rem] sm:rounded-[3rem] animate-pulse">
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
      <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-2/3 mt-6"></div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}></div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar() {
  return (
    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default { SkeletonCard, SkeletonText, SkeletonTable, SkeletonAvatar, SkeletonGrid };
