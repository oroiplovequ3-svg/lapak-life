"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { AdminStatsRow, useAdminUserStats } from "@/components/admin-stats";
import { Avatar } from "@/components/avatar";
import { Icon, type IconName } from "@/components/icons";
import { ProfileSheet } from "@/components/profile-sheet";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Sheet } from "@/components/sheet";
import type { AdminUserSummary, Report, ReportTargetPreview } from "@/lib/types";

const APP_VERSION = "인블루 (INBLUE) · v1.2";

const REPORT_TARGET_LABEL: Record<Report["targetType"], string> = {
  post: "글",
  comment: "댓글",
  review: "시야 후기",
  user_food: "직관러 맛집",
  user_food_comment: "맛집 댓글",
  user_parking: "주차 팁",
};

const REPORT_STATUS_LABEL: Record<Report["status"], string> = {
  open: "접수됨",
  resolved: "처리 완료",
  dismissed: "기각",
};

function MenuRow({
  icon,
  label,
  hint,
  onClick,
  danger = false,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition active:bg-[#F7F9FC]"
    >
      <span
        className={`grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] ${
          danger ? "bg-[#FEF3F2] text-[#B42318]" : "bg-brand-50 text-brand"
        }`}
      >
        <Icon name={icon} size={16} strokeWidth={1.9} />
      </span>
      <span
        className={`min-w-0 flex-1 text-[13px] font-extrabold tracking-tight2 ${
          danger ? "text-[#B42318]" : "text-ink"
        }`}
      >
        {label}
      </span>
      {hint ? (
        <span className="flex-none text-[11px] font-semibold text-ink-faint">{hint}</span>
      ) : null}
      <Icon name="chevron" size={12} strokeWidth={2.6} className="flex-none text-[#C4CBD6]" />
    </button>
  );
}

function LinkRow({
  icon,
  label,
  href,
  hint = "새 창",
}: {
  icon: IconName;
  label: string;
  href: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition active:bg-[#F7F9FC]"
    >
      <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] bg-brand-50 text-brand">
        <Icon name={icon} size={16} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1 text-[13px] font-extrabold tracking-tight2 text-ink">
        {label}
      </span>
      <span className="flex-none text-[10.5px] font-bold text-ink-faint">{hint}</span>
      <Icon name="chevron" size={12} strokeWidth={2.6} className="flex-none text-[#C4CBD6]" />
    </Link>
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

/** 신고 카드에 붙는 작은 버튼 (대상 보기 · 삭제 · 기각) */
function ReportAction({
  label,
  onClick,
  tone = "plain",
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  tone?: "plain" | "danger" | "brand";
  disabled?: boolean;
}) {
  const styles =
    tone === "danger"
      ? "bg-[#FEF3F2] text-[#B42318]"
      : tone === "brand"
        ? "bg-brand-50 text-brand-600"
        : "bg-white text-ink-muted ring-1 ring-line";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[8px] px-2 py-[5px] text-[10px] font-extrabold transition active:scale-[.97] disabled:opacity-50 ${styles}`}
    >
      {label}
    </button>
  );
}

/** 영구 정지 2단계 확인 — 사유를 적고 확정해야 정지됩니다. */
function BanConfirm({
  nickname,
  busy,
  onCancel,
  onConfirm,
}: {
  nickname: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="mt-2 w-full rounded-[10px] border border-[#FECDCA] bg-[#FEF3F2] px-2.5 py-2">
      <p className="text-[11px] font-extrabold text-[#B42318]">
        {nickname}님을 영구 정지할까요?
      </p>
      <p className="mt-1 wrap-any text-[10px] leading-relaxed text-[#B42318]/80">
        이 회원의 글·댓글·후기·맛집·주차 팁이 모두 숨겨지고, 재로그인과 같은
        이메일 재가입도 막힙니다.
      </p>
      <input
        value={reason}
        maxLength={100}
        onChange={(event) => setReason(event.target.value)}
        placeholder="정지 사유 (선택 · 마스터 메모)"
        className="mt-1.5 w-full rounded-[8px] border border-[#FDA29B] bg-white px-2 py-[6px] text-[11px] text-ink outline-none"
      />
      <div className="mt-1.5 flex gap-1.5">
        <button
          type="button"
          onClick={() => onConfirm(reason)}
          disabled={busy}
          className="flex-1 rounded-[8px] bg-[#B42318] py-1.5 text-[10.5px] font-extrabold text-white disabled:opacity-60"
        >
          {busy ? "정지 중…" : "정지 확정"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="flex-1 rounded-[8px] bg-white py-1.5 text-[10.5px] font-extrabold text-ink-2 ring-1 ring-line disabled:opacity-60"
        >
          취소
        </button>
      </div>
    </div>
  );
}

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  /**
   * 신고된 대상으로 이동 — 대상 보기 버튼을 눌렀을 때.
   * 글이면 그 글로, 후기면 그 구역으로, 맛집·주차면 해당 카드로 이동합니다.
   */
  onOpenReportTarget?: (report: Report, preview: ReportTargetPreview | null) => void;
}

/** 내 직관 상단 톱니(설정) — 프로필·약관·개인정보·신고 관리·계정 관리 */
export function SettingsSheet({ open, onClose, onOpenReportTarget }: SettingsSheetProps) {
  const {
    user,
    profile,
    configured,
    signingIn,
    signInWithGoogle,
    signOut,
    isAdmin,
    loadReports,
    setReportStatus,
    loadReportTarget,
    deletePost,
    deleteComment,
    deleteReview,
    deleteUserFood,
    deleteUserFoodComment,
    deleteUserParking,
    restoreReportedContent,
    deleteOwnAccount,
    listUsers,
    banUser,
    unbanUser,
  } = useApp();
  const toast = useToast();
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [previews, setPreviews] = useState<Record<string, ReportTargetPreview>>({});
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  /** 지금 처리 중인 신고 (삭제·기각 연타 방지) */
  const [busyReport, setBusyReport] = useState<string | null>(null);
  /** 삭제 확인을 기다리는 신고 */
  const [confirmReport, setConfirmReport] = useState<string | null>(null);
  /** 회원 탈퇴 확인 창 */
  const [accountDeleteOpen, setAccountDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  /* ── 회원 관리 (마스터) ──────────────────────────────────── */
  const [membersOpen, setMembersOpen] = useState(false);
  const [members, setMembers] = useState<AdminUserSummary[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  /** 지금 정지/해제를 처리 중인 회원 */
  const [busyMember, setBusyMember] = useState<string | null>(null);
  /** 영구 정지 2단계 확인을 기다리는 회원 (회원 목록 · 신고 카드 공용) */
  const [confirmBan, setConfirmBan] = useState<{
    userId: string;
    nickname: string;
    from: "member" | "report";
  } | null>(null);

  /** 마스터가 설정을 열면 읽는 회원 수·로그인 통계 (회원 관리 배지·패널) */
  const adminStats = useAdminUserStats(open && isAdmin);

  const refreshReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const list = await loadReports();
      setReports(list);
      // 신고된 글·댓글·후기의 본문을 함께 읽어, 8자 UUID만 보고 추측하지 않게 합니다.
      const targets = list.filter((report) => report.status === "open").slice(0, 30);
      const loaded = await Promise.all(
        targets.map(async (report) => {
          try {
            const preview = await loadReportTarget(report.targetType, report.targetId);
            return [report.id, preview] as const;
          } catch {
            return null;
          }
        }),
      );
      const next: Record<string, ReportTargetPreview> = {};
      for (const entry of loaded) {
        if (entry) next[entry[0]] = entry[1];
      }
      setPreviews(next);
    } catch (error) {
      // 오류를 []로 삼키지 않고 화면에 그대로 보여 줍니다.
      setReports([]);
      setPreviews({});
      setReportsError(
        error instanceof Error ? error.message : "신고 목록을 불러오지 못했어요",
      );
    } finally {
      setReportsLoading(false);
    }
  }, [loadReports, loadReportTarget]);

  useEffect(() => {
    if (!open || !isAdmin || !reportsOpen) return;
    void refreshReports();
  }, [open, isAdmin, reportsOpen, refreshReports]);

  useEffect(() => {
    if (!open) {
      setReportsOpen(false);
      setAccountDeleteOpen(false);
      setConfirmReport(null);
      setMembersOpen(false);
      setConfirmBan(null);
    }
  }, [open]);

  /* ── 회원 관리 ─────────────────────────────────────────────── */
  const refreshMembers = useCallback(async () => {
    setMembersLoading(true);
    setMembersError(null);
    try {
      const list = await listUsers();
      setMembers(list);
    } catch (error) {
      setMembers([]);
      setMembersError(
        error instanceof Error ? error.message : "회원 목록을 불러오지 못했어요",
      );
    } finally {
      setMembersLoading(false);
    }
  }, [listUsers]);

  useEffect(() => {
    if (!open || !isAdmin || !membersOpen) return;
    void refreshMembers();
  }, [open, isAdmin, membersOpen, refreshMembers]);

  /** 2단계 확인 뒤 실제 정지 — 글·후기 숨김까지 끝나면 목록과 신고함을 새로 읽습니다. */
  const submitBan = async (userId: string, reason: string) => {
    if (busyMember) return;
    setBusyMember(userId);
    const ok = await banUser(userId, reason.trim() || null);
    setBusyMember(null);
    if (!ok) return;
    setConfirmBan(null);
    setMembers((prev) =>
      prev.map((member) =>
        member.userId === userId
          ? { ...member, isBanned: true, banReason: reason.trim() || null }
          : member,
      ),
    );
    if (reportsOpen) await refreshReports();
  };

  /** 영구 정지 해제 */
  const submitUnban = async (userId: string) => {
    if (busyMember) return;
    setBusyMember(userId);
    const ok = await unbanUser(userId);
    setBusyMember(null);
    if (!ok) return;
    setMembers((prev) =>
      prev.map((member) =>
        member.userId === userId
          ? { ...member, isBanned: false, banReason: null }
          : member,
      ),
    );
  };

  const signedIn = Boolean(user);
  const me = user ?? profile;
  const name = signedIn || !configured ? me.nickname : "게스트";
  const avatarName = signedIn || !configured ? me.nickname : "게스트";
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

  /** 신고된 대상 삭제 — 지운 뒤 실제로 사라졌는지 다시 확인하고 신고를 마감합니다. */
  const deleteReportTarget = async (report: Report) => {
    if (busyReport) return;
    setBusyReport(report.id);
    setConfirmReport(null);
    try {
      const preview = previews[report.id] ?? null;
      switch (report.targetType) {
        case "post":
          await deletePost(report.targetId);
          break;
        case "comment":
          if (!preview?.postId) {
            toast("댓글이 달린 글을 찾지 못해 삭제하지 못했어요");
            return;
          }
          await deleteComment(preview.postId, report.targetId);
          break;
        case "review":
          await deleteReview(report.targetId);
          break;
        case "user_food":
          await deleteUserFood(report.targetId);
          break;
        case "user_food_comment":
          if (!preview?.foodId) {
            toast("댓글이 달린 맛집을 찾지 못해 삭제하지 못했어요");
            return;
          }
          await deleteUserFoodComment(preview.foodId, report.targetId);
          break;
        case "user_parking":
          await deleteUserParking(report.targetId);
          break;
      }

      // 삭제 권한·네트워크 문제로 남아 있을 수 있으니 실제 상태를 확인합니다.
      const after = await loadReportTarget(report.targetType, report.targetId).catch(
        () => null,
      );
      if (after?.found) {
        toast("신고된 내용을 삭제하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
        setPreviews((prev) => ({ ...prev, [report.id]: after }));
        return;
      }
      const ok = await setReportStatus(report.id, "resolved");
      if (ok) await refreshReports();
    } finally {
      setBusyReport(null);
    }
  };

  /** 신고 누적으로 숨겨진 대상을 다시 보이게 하고 신고 수를 초기화합니다. */
  const restoreTarget = async (report: Report) => {
    if (busyReport) return;
    setBusyReport(report.id);
    try {
      const ok = await restoreReportedContent(report.targetType, report.targetId);
      if (ok) await refreshReports();
    } finally {
      setBusyReport(null);
    }
  };

  const changeStatus = async (report: Report, status: Report["status"]) => {
    if (busyReport) return;
    setBusyReport(report.id);
    try {
      const ok = await setReportStatus(report.id, status);
      if (ok) {
        setReports((prev) =>
          prev.map((item) => (item.id === report.id ? { ...item, status } : item)),
        );
      }
    } finally {
      setBusyReport(null);
    }
  };

  const confirmAccountDelete = async () => {
    if (deletingAccount) return;
    setDeletingAccount(true);
    const ok = await deleteOwnAccount();
    setDeletingAccount(false);
    if (ok) {
      setAccountDeleteOpen(false);
      onClose();
    }
  };

  const targetLabel = (report: Report) => {
    const preview = previews[report.id];
    const body = preview?.body?.trim() ?? "";
    if (!preview) return null;
    if (!preview.found) {
      return <span className="text-[#B54708]">이미 삭제되었거나 찾을 수 없는 대상이에요</span>;
    }
    return (
      <span className="wrap-any">
        {preview.nickname ? <b className="text-ink-2">{preview.nickname}</b> : null}
        {preview.nickname ? " · " : null}
        {body.length > 90 ? `${body.slice(0, 90)}…` : body}
      </span>
    );
  };

  return (
    <>
      <Sheet open={open} title="설정" onClose={onClose}>
        <section className="flex items-center gap-3 rounded-[15px] border border-line bg-gradient-to-b from-white to-[#F8FAFD] px-3.5 py-3.5">
          <Avatar
            nickname={avatarName}
            avatarUrl={signedIn || !configured ? me.avatarUrl : null}
            size={50}
            className="bg-gradient-to-br from-brand-500 to-brand text-lg text-white shadow-[0_6px_16px_-6px_rgba(7,76,161,.7)]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-extrabold tracking-tight3">{name}</span>
              {signedIn || !configured ? (
                <span
                  className={`flex-none rounded-md px-1.5 py-[1px] text-[9.5px] font-extrabold ${
                    signedIn ? "bg-brand text-white" : "bg-brand-50 text-brand-600"
                  }`}
                >
                  {signedIn ? "로그인됨" : "데모"}
                </span>
              ) : null}
            </div>
            <p className="mt-[3px] truncate text-[11px] font-semibold text-ink-faint">{caption}</p>
          </div>
        </section>

        <div className="overflow-hidden rounded-[15px] border border-line bg-white">
          <MenuRow icon="my" label="프로필 설정" hint="닉네임·사진" onClick={openProfile} />
          <div className="border-t border-line-soft">
            <LinkRow icon="info" label="이용약관·커뮤니티 가이드라인" href="/terms" />
          </div>
          <div className="border-t border-line-soft">
            <LinkRow icon="shield" label="개인정보처리방침" href="/privacy" />
          </div>
          <div className="border-t border-line-soft">
            <PlainRow icon="info" label="서비스 정보" value={APP_VERSION} />
          </div>

          {isAdmin ? (
            <>
            <div className="border-t border-line-soft">
              <MenuRow
                icon="shield"
                label="신고 관리"
                hint={openCount > 0 ? `${openCount}건 대기` : "마스터 전용"}
                onClick={() => setReportsOpen((value) => !value)}
              />
              {reportsOpen ? (
                <div className="border-t border-line-soft bg-[#FBFCFE] px-3.5 py-3">
                  {reportsLoading ? (
                    <p className="py-2 text-center text-[11.5px] text-ink-faint">불러오는 중…</p>
                  ) : reportsError ? (
                    <div className="rounded-[11px] border border-[#FECDCA] bg-[#FEF3F2] px-3 py-2.5">
                      <p className="text-[11.5px] font-extrabold text-[#B42318]">
                        신고 목록을 불러오지 못했어요
                      </p>
                      <p className="mt-1 wrap-any text-[10.5px] leading-relaxed text-[#B42318]/80">
                        {reportsError}
                      </p>
                    </div>
                  ) : reports.length === 0 ? (
                    <p className="py-2 text-center text-[11.5px] text-ink-faint">
                      접수된 신고가 없어요.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {reports.map((report) => {
                        const preview = previews[report.id];
                        const canOpen =
                          Boolean(preview?.found) &&
                          (report.targetType === "post" ||
                            report.targetType === "review" ||
                            report.targetType === "user_food" ||
                            report.targetType === "user_parking" ||
                            (report.targetType === "comment" && Boolean(preview?.postId)) ||
                            (report.targetType === "user_food_comment" &&
                              Boolean(preview?.foodId)));
                        return (
                          <div
                            key={report.id}
                            className="rounded-[11px] border border-line bg-white px-3 py-2.5"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="rounded-md bg-[#FEF3F2] px-1.5 py-[1px] text-[9.5px] font-extrabold text-[#B42318]">
                                {REPORT_TARGET_LABEL[report.targetType]}
                              </span>
                              <span className="wrap-any text-[11.5px] font-extrabold text-ink">
                                {report.reason}
                              </span>
                              <span className="ml-auto flex-none text-[10px] font-semibold text-ink-faint">
                                {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                              </span>
                            </div>

                            {report.detail ? (
                              <p className="mt-1 wrap-any text-[11px] leading-relaxed text-ink-muted">
                                “{report.detail}”
                              </p>
                            ) : null}

                            {report.status === "open" ? (
                              <p className="mt-1.5 rounded-[8px] bg-[#F8FAFC] px-2 py-1.5 text-[10.5px] leading-relaxed text-ink-muted">
                                {targetLabel(report) ?? "내용을 불러오는 중…"}
                              </p>
                            ) : null}

                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span
                                className={`rounded-md px-1.5 py-[2px] text-[9.5px] font-extrabold ${
                                  report.status === "open"
                                    ? "bg-[#FFFAEB] text-[#B54708]"
                                    : report.status === "resolved"
                                      ? "bg-[#ECFDF3] text-[#027A48]"
                                      : "bg-[#F3F5F9] text-ink-muted"
                                }`}
                              >
                                {REPORT_STATUS_LABEL[report.status]}
                              </span>
                              <span className="text-[9px] font-semibold text-[#B9C0CB]">
                                {report.targetId.slice(0, 8)}…
                              </span>

                              {report.status === "open" ? (
                                <>
                                  {canOpen && onOpenReportTarget ? (
                                    <ReportAction
                                      label="대상 보기"
                                      onClick={() => onOpenReportTarget(report, preview ?? null)}
                                    />
                                  ) : null}
                                  {preview?.hidden ? (
                                    <ReportAction
                                      label="숨김 복구"
                                      tone="brand"
                                      disabled={busyReport === report.id}
                                      onClick={() => void restoreTarget(report)}
                                    />
                                  ) : null}
                                  {preview?.found ? (
                                    <ReportAction
                                      label={confirmReport === report.id ? "정말 삭제?" : "삭제"}
                                      tone="danger"
                                      disabled={busyReport === report.id}
                                      onClick={() => {
                                        if (confirmReport === report.id) {
                                          void deleteReportTarget(report);
                                        } else {
                                          setConfirmReport(report.id);
                                        }
                                      }}
                                    />
                                  ) : null}
                                  {confirmReport === report.id ? (
                                    <ReportAction
                                      label="취소"
                                      onClick={() => setConfirmReport(null)}
                                    />
                                  ) : (
                                    <ReportAction
                                      label="기각"
                                      tone="brand"
                                      disabled={busyReport === report.id}
                                      onClick={() => void changeStatus(report, "dismissed")}
                                    />
                                  )}
                                  {preview?.userId ? (
                                    <ReportAction
                                      label="작성자 정지"
                                      tone="danger"
                                      disabled={busyMember === preview.userId}
                                      onClick={() =>
                                        setConfirmBan({
                                          userId: preview.userId as string,
                                          nickname: preview.nickname,
                                          from: "report",
                                        })
                                      }
                                    />
                                  ) : null}
                                  <ReportAction
                                    label="처리 완료"
                                    disabled={busyReport === report.id}
                                    onClick={() => void changeStatus(report, "resolved")}
                                  />
                                </>
                              ) : (
                                <ReportAction
                                  label="다시 열기"
                                  disabled={busyReport === report.id}
                                  onClick={() => void changeStatus(report, "open")}
                                />
                              )}
                            </div>

                            {confirmBan?.from === "report" &&
                            preview?.userId === confirmBan.userId ? (
                              <BanConfirm
                                nickname={confirmBan.nickname}
                                busy={busyMember === confirmBan.userId}
                                onCancel={() => setConfirmBan(null)}
                                onConfirm={(reason) =>
                                  void submitBan(confirmBan.userId, reason)
                                }
                              />
                            ) : null}
                          </div>
                        );
                      })}
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

            <div className="border-t border-line-soft">
              <MenuRow
                icon="my"
                label="회원 관리"
                hint={
                  membersOpen
                    ? "접기"
                    : adminStats.stats
                      ? `전체 ${adminStats.stats.totalUsers.toLocaleString("ko-KR")}명`
                      : "정지·해제"
                }
                onClick={() => setMembersOpen((value) => !value)}
              />
              {membersOpen ? (
                <div className="border-t border-line-soft bg-[#FBFCFE] px-3.5 py-3">
                  <AdminStatsRow
                    stats={adminStats.stats}
                    loading={adminStats.loading}
                    error={adminStats.error}
                  />
                  {membersLoading ? (
                    <p className="py-2 text-center text-[11.5px] text-ink-faint">불러오는 중…</p>
                  ) : membersError ? (
                    <div className="rounded-[11px] border border-[#FECDCA] bg-[#FEF3F2] px-3 py-2.5">
                      <p className="text-[11.5px] font-extrabold text-[#B42318]">
                        회원 목록을 불러오지 못했어요
                      </p>
                      <p className="mt-1 wrap-any text-[10.5px] leading-relaxed text-[#B42318]/80">
                        {membersError}
                      </p>
                    </div>
                  ) : members.length === 0 ? (
                    <p className="py-2 text-center text-[11.5px] text-ink-faint">
                      아직 가입한 회원이 없어요.
                    </p>
                  ) : (
                    <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto">
                      {members.map((member) => (
                        <div
                          key={member.userId}
                          className="rounded-[11px] border border-line bg-white px-3 py-2.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="wrap-any text-[12px] font-extrabold text-ink">
                              {member.nickname}
                            </span>
                            {member.isBanned ? (
                              <span className="flex-none rounded-md bg-[#FEF3F2] px-1.5 py-[1px] text-[9.5px] font-extrabold text-[#B42318]">
                                정지됨
                              </span>
                            ) : null}
                            <span className="ml-auto flex-none text-[10px] font-semibold text-ink-faint">
                              {new Date(member.createdAt).toLocaleDateString("ko-KR")} 가입
                            </span>
                          </div>
                          <p className="mt-0.5 wrap-any text-[10.5px] text-ink-faint">
                            {member.email ?? "이메일 없음"}
                            {member.banReason ? ` · 사유: ${member.banReason}` : ""}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {member.isBanned ? (
                              <ReportAction
                                label={busyMember === member.userId ? "해제 중…" : "정지 해제"}
                                tone="brand"
                                disabled={busyMember === member.userId}
                                onClick={() => void submitUnban(member.userId)}
                              />
                            ) : (
                              <ReportAction
                                label="영구 정지"
                                tone="danger"
                                disabled={busyMember === member.userId}
                                onClick={() =>
                                  setConfirmBan({
                                    userId: member.userId,
                                    nickname: member.nickname,
                                    from: "member",
                                  })
                                }
                              />
                            )}
                            <span className="text-[9px] font-semibold text-[#B9C0CB]">
                              {member.userId.slice(0, 8)}…
                            </span>
                          </div>
                          {confirmBan?.from === "member" &&
                          confirmBan.userId === member.userId ? (
                            <BanConfirm
                              nickname={member.nickname}
                              busy={busyMember === member.userId}
                              onCancel={() => setConfirmBan(null)}
                              onConfirm={(reason) => void submitBan(member.userId, reason)}
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      void refreshMembers();
                      void adminStats.refresh();
                    }}
                    className="mt-2 w-full rounded-[10px] bg-white py-2 text-[11px] font-extrabold text-ink-muted ring-1 ring-line"
                  >
                    새로고침
                  </button>
                </div>
              ) : null}
            </div>
            </>
          ) : null}
        </div>

        {signedIn ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                void signOut();
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-[13px] bg-[#F3F5F9] py-3 text-[13px] font-extrabold text-ink-2 transition active:scale-[.99]"
            >
              <Icon name="logout" size={15} strokeWidth={2.1} />
              로그아웃
            </button>

            {accountDeleteOpen ? (
              <div className="rounded-[13px] border border-[#FECDCA] bg-[#FEF3F2] px-3.5 py-3">
                <p className="text-[12.5px] font-extrabold text-[#B42318]">정말 탈퇴할까요?</p>
                <p className="mt-1 wrap-any text-[11px] leading-relaxed text-[#B42318]/80">
                  내가 쓴 글·댓글·후기·맛집·주차 팁·직관 기록과 사진, 프로필이 모두 지워지고
                  되돌릴 수 없어요.
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void confirmAccountDelete()}
                    disabled={deletingAccount}
                    className="flex-1 rounded-[11px] bg-[#B42318] py-2.5 text-[12px] font-extrabold text-white disabled:bg-[#E4E7EC] disabled:text-ink-faint"
                  >
                    {deletingAccount ? "탈퇴 처리 중…" : "탈퇴하기"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountDeleteOpen(false)}
                    disabled={deletingAccount}
                    className="flex-1 rounded-[11px] bg-white py-2.5 text-[12px] font-extrabold text-ink-2 ring-1 ring-line"
                  >
                    계속 쓰기
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAccountDeleteOpen(true)}
                className="w-full py-1 text-[11px] font-bold text-[#98A2B3] underline decoration-[#D0D5DD] underline-offset-2"
              >
                회원 탈퇴 (계정·내 글·사진 모두 삭제)
              </button>
            )}
          </div>
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
