"use client";

import { useCallback, useEffect, useState } from "react";

import { useApp } from "@/components/providers/app-provider";
import type { AdminUserStats } from "@/lib/types";

/**
 * 마스터 회원 현황 (admin_user_stats) 을 화면에서 읽어 오는 훅.
 * - enabled 가 false 이거나 마스터가 아니면 아무것도 부르지 않습니다.
 * - 실패는 화면이 직접 보여 줄 수 있게 error 로 돌려줍니다 (0명으로 속이지 않음).
 */
export function useAdminUserStats(enabled: boolean) {
  const { isAdmin, loadUserStats } = useApp();
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const next = await loadUserStats();
      setStats(next);
    } catch (cause) {
      setStats(null);
      setError(
        cause instanceof Error ? cause.message : "회원 현황을 불러오지 못했어요",
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin, loadUserStats]);

  useEffect(() => {
    if (!enabled || !isAdmin) {
      setStats(null);
      setError(null);
      return;
    }
    void refresh();
  }, [enabled, isAdmin, refresh]);

  return { stats, loading, error, refresh };
}

const count = (value: number | undefined) =>
  typeof value === "number" ? value.toLocaleString("ko-KR") : "–";

function StatCell({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <div className="rounded-[11px] bg-white/[.08] px-2.5 py-2 ring-1 ring-inset ring-white/[.06]">
      <div className="text-[10px] font-bold tracking-tight text-white/60">{label}</div>
      <div className="mt-1 text-[17px] font-extrabold leading-none tracking-tight2">
        {loading && value === undefined ? (
          <span className="text-white/40">–</span>
        ) : (
          <>
            {count(value)}
            <small className="ml-0.5 text-[10px] font-bold text-white/60">명</small>
          </>
        )}
      </div>
    </div>
  );
}

/** 내 직관 상단 — 마스터에게만 보이는 회원 수·로그인 요약 카드 */
export function AdminStatsCard({
  stats,
  loading,
  error,
  onRefresh,
}: {
  stats: AdminUserStats | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const banned = stats?.bannedUsers ?? 0;
  const newToday = stats?.newToday ?? 0;

  return (
    <section
      aria-label="마스터 회원 현황"
      className="relative overflow-hidden rounded-md2 border border-[#1B2A46] bg-gradient-to-br from-[#0F172A] via-[#101F3A] to-[#132B4F] px-3.5 py-3 text-white shadow-card"
    >
      <div className="pointer-events-none absolute -right-[40px] -top-[44px] h-[120px] w-[120px] rounded-full bg-[#FFD77A]/[.06]" />
      <div className="relative flex items-center gap-1.5">
        <span className="text-[11.5px] font-extrabold tracking-[.02em] text-[#FFD77A]">
          MASTER · 회원 현황
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="회원 현황 새로고침"
          className="ml-auto flex-none rounded-lg bg-white/10 px-2 py-[3px] text-[10px] font-extrabold text-white/80 transition active:scale-[.97] disabled:opacity-50"
        >
          {loading ? "불러오는 중" : "새로고침"}
        </button>
      </div>

      <div className="relative mt-2.5 grid grid-cols-3 gap-1.5">
        <StatCell label="전체 회원" value={stats?.totalUsers} loading={loading} />
        <StatCell label="오늘 로그인" value={stats?.todaySignins} loading={loading} />
        <StatCell label="최근 7일" value={stats?.weekSignins} loading={loading} />
      </div>

      {error ? (
        <p className="relative mt-2 wrap-any rounded-[9px] bg-[#7F1D1D]/50 px-2 py-1.5 text-[10.5px] leading-relaxed text-[#FEE4E2]">
          {error}
        </p>
      ) : banned > 0 || newToday > 0 ? (
        <div className="relative mt-2 flex flex-wrap items-center gap-1.5">
          {newToday > 0 ? (
            <span className="rounded-md bg-white/10 px-1.5 py-[2px] text-[9.5px] font-extrabold text-white/80">
              오늘 가입 {newToday}명
            </span>
          ) : null}
          {banned > 0 ? (
            <span className="rounded-md bg-[#F04438]/25 px-1.5 py-[2px] text-[9.5px] font-extrabold text-[#FDA29B]">
              정지 {banned}명
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** 설정 → 회원 관리 패널 위에 붙는 한 줄 요약 */
export function AdminStatsRow({
  stats,
  loading,
  error,
}: {
  stats: AdminUserStats | null;
  loading: boolean;
  error: string | null;
}) {
  const chips: { label: string; value: number | undefined; tone?: "danger" }[] = [
    { label: "전체", value: stats?.totalUsers },
    { label: "오늘 로그인", value: stats?.todaySignins },
    { label: "최근 7일", value: stats?.weekSignins },
    { label: "정지", value: stats?.bannedUsers, tone: "danger" },
  ];

  return (
    <div className="mb-2 rounded-[11px] border border-line bg-white px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-extrabold tracking-tight2 text-ink-2">
          회원 현황
        </span>
        <span className="ml-auto flex-none text-[9.5px] font-semibold text-ink-faint">
          {loading ? "불러오는 중…" : "KST 기준"}
        </span>
      </div>
      {error ? (
        <p className="mt-1.5 wrap-any rounded-[8px] border border-[#FECDCA] bg-[#FEF3F2] px-2 py-1.5 text-[10px] leading-relaxed text-[#B42318]">
          {error}
        </p>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className={`rounded-md px-1.5 py-[3px] text-[9.5px] font-extrabold ${
                chip.tone === "danger" && (chip.value ?? 0) > 0
                  ? "bg-[#FEF3F2] text-[#B42318]"
                  : "bg-[#F3F5F9] text-ink-muted"
              }`}
            >
              {chip.label} {count(chip.value)}명
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
