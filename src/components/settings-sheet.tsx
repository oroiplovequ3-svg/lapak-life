"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Avatar } from "@/components/avatar";
import { Icon, type IconName } from "@/components/icons";
import { ProfileSheet } from "@/components/profile-sheet";
import { useApp } from "@/components/providers/app-provider";
import { Sheet } from "@/components/sheet";
import type { Report } from "@/lib/types";

const APP_VERSION = "인블루 (INBLUE) · v1.1";

const REPORT_TARGET_LABEL: Record<Report["targetType"], string> = {
  post: "글",
  comment: "댓글",
  review: "시야 후기",
  user_food: "직관러 맛집",
  user_parking: "주차 팁",
};

function MenuRow({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition active:bg-[#F7F9FC]"
    >
      <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] bg-brand-50 text-brand">
        <Icon name={icon} size={16} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1 text-[13px] font-extrabold tracking-tight2 text-ink">
        {label}
      </span>
      {hint ? (
        <span className="flex-none text-[11px] font-semibold text-ink-faint">{hint}</span>
      ) : null}
      <Icon name="chevron" size={12} strokeWidth={2.6} className="flex-none text-[#C4CBD6]" />
    </button>
  );
}

function PlainRow({ icon, label, value }: { icon: IconName; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3">
      <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] bg-[#F3F5F9] text-ink-muted">
        <Icon name={icon} size={16} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1 text-[13px] font-extrabold tracking-tight2 text-ink">
        {label}
      </span>
      <span className="flex-none text-[11px] font-bold text-ink-faint">{value}</span>
    </div>
  );
}

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

/** 내 직관 상단 톱니(설정) — 프로필·개인정보처리방침·신고 관리·서비스 정보·로그인 관리 */
export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const {
    user,
    profile,
    configured,
    signingIn,
    signInWithGoogle,
    signOut,
    isAdmin,
    loadReports,
    resolveReport,
  } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const refreshReports = useCallback(async () => {
    setReportsLoading(true);
    const list = await loadReports();
    setReports(list);
    setReportsLoading(false);
  }, [loadReports]);

  useEffect(() => {
    if (!open || !isAdmin || !reportsOpen) return;
    void refreshReports();
  }, [open, isAdmin, reportsOpen, refreshReports]);

  useEffect(() => {
    if (!open) setReportsOpen(false);
  }, [open]);

  const signedIn = Boolean(user);
  const me = user ?? profile;
  const name = signedIn || !configured ? me.nickname : "게스트";
  const caption = signedIn
    ? (user?.email ?? "구글 로그인")
    : configured
      ? "로그인하면 기록·저장이 계정에 남아요"
      : "데모 모드 · 이 브라우저에만 저장돼요";

  const openProfile = () => {
    // 설정 시트를 먼저 닫아야 프로필 시트가 위에서 열립니다.
    onClose();
    setProfileOpen(true);
  };

  const openCount = reports.filter((report) => report.status === "open").length;

  return (
    <>
      <Sheet open={open} title="설정" onClose={onClose}>
        <section className="flex items-center gap-3 rounded-[15px] border border-line bg-gradient-to-b from-white to-[#F8FAFD] px-3.5 py-3.5">
          <Avatar
            nickname={me.nickname}
            avatarUrl={me.avatarUrl}
            size={50}
            className="bg-gradient-to-br from-brand-500 to-brand text-lg text-white shadow-[0_6px_16px_-6px_rgba(7,76,161,.7)]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-extrabold tracking-tight3">{name}</span>
              <span
                className={`flex-none rounded-md px-1.5 py-[1px] text-[9.5px] font-extrabold ${
                  signedIn ? "bg-brand text-white" : "bg-brand-50 text-brand-600"
                }`}
              >
                {signedIn ? "로그인됨" : "게스트"}
              </span>
            </div>
            <p className="mt-[3px] truncate text-[11px] font-semibold text-ink-faint">{caption}</p>
          </div>
        </section>

        <div className="overflow-hidden rounded-[15px] border border-line bg-white">
          <MenuRow icon="my" label="프로필 설정" hint="닉네임·사진" onClick={openProfile} />
          <div className="border-t border-line-soft">
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition active:bg-[#F7F9FC]"
            >
              <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] bg-brand-50 text-brand">
                <Icon name="shield" size={16} strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-extrabold tracking-tight2 text-ink">
                개인정보처리방침
              </span>
              <span className="flex-none text-[10.5px] font-bold text-ink-faint">새 창</span>
              <Icon name="chevron" size={12} strokeWidth={2.6} className="flex-none text-[#C4CBD6]" />
            </Link>
          </div>
          <div className="border-t border-line-soft">
            <PlainRow icon="info" label="서비스 정보" value={APP_VERSION} />
          </div>

          {isAdmin ? (
            <div className="border-t border-line-soft">
              <MenuRow
                icon="shield"
                label="신고 관리"
                hint={reportsOpen ? `${openCount}건 대기` : "마스터 전용"}
                onClick={() => setReportsOpen((value) => !value)}
              />
              {reportsOpen ? (
                <div className="border-t border-line-soft bg-[#FBFCFE] px-3.5 py-3">
                  {reportsLoading ? (
                    <p className="py-2 text-center text-[11.5px] text-ink-faint">불러오는 중…</p>
                  ) : reports.length === 0 ? (
                    <p className="py-2 text-center text-[11.5px] text-ink-faint">
                      접수된 신고가 없어요.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="rounded-[11px] border border-line bg-white px-3 py-2.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-md bg-[#FEF3F2] px-1.5 py-[1px] text-[9.5px] font-extrabold text-[#B42318]">
                              {REPORT_TARGET_LABEL[report.targetType]}
                            </span>
                            <span className="text-[11.5px] font-extrabold text-ink">
                              {report.reason}
                            </span>
                            <span className="ml-auto text-[10px] font-semibold text-ink-faint">
                              {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                          {report.detail ? (
                            <p className="mt-1 break-keep text-[11px] leading-relaxed text-ink-muted">
                              {report.detail}
                            </p>
                          ) : null}
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-[9.5px] font-semibold text-[#B9C0CB]">
                              {report.targetId.slice(0, 8)}…
                            </span>
                            {report.status === "open" ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await resolveReport(report.id);
                                  if (ok) {
                                    setReports((prev) =>
                                      prev.map((item) =>
                                        item.id === report.id
                                          ? { ...item, status: "resolved" as const }
                                          : item,
                                      ),
                                    );
                                  }
                                }}
                                className="ml-auto rounded-md bg-brand-50 px-2 py-1 text-[10px] font-extrabold text-brand-600"
                              >
                                처리 완료
                              </button>
                            ) : (
                              <span className="ml-auto rounded-md bg-[#ECFDF3] px-2 py-1 text-[10px] font-extrabold text-[#027A48]">
                                처리됨
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => void refreshReports()}
                    className="mt-2 w-full rounded-[10px] bg-white py-2 text-[11px] font-extrabold text-ink-muted ring-1 ring-line"
                  >
                    새로고침
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {signedIn ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              void signOut();
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-[13px] bg-[#F3F5F9] py-3 text-[13px] font-extrabold text-[#B42318] transition active:scale-[.99]"
          >
            <Icon name="logout" size={15} strokeWidth={2.1} />
            로그아웃
          </button>
        ) : configured ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              void signInWithGoogle();
            }}
            disabled={signingIn}
            className="flex w-full items-center justify-center gap-2 rounded-[13px] bg-white px-4 py-3 text-[13.5px] font-extrabold text-[#1F1F1F] ring-1 ring-[#DADCE0] shadow-[0_1px_2px_rgba(60,64,67,.16)] disabled:opacity-60"
          >
            <Icon name="google" size={18} />
            {signingIn ? "구글로 이동 중…" : "구글로 시작하기"}
          </button>
        ) : (
          <p className="rounded-[11px] bg-brand-50 px-3 py-2.5 text-[11px] leading-relaxed text-brand">
            지금은 데모 모드예요. Supabase를 연결하면 구글 로그인이 활성화되고 기록이 계정에
            저장됩니다.
          </p>
        )}
      </Sheet>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
