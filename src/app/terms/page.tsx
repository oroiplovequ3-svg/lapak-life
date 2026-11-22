import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "이용약관·커뮤니티 가이드라인 — 인블루 (INBLUE)",
  description:
    "인블루(INBLUE) 이용약관과 커뮤니티 가이드라인 — 금지 행위, 신고·제재 기준, 게시물 관리와 계정 탈퇴 안내입니다.",
  alternates: { canonical: "/terms" },
};

const SERVICE_URL = "inblue-fan.vercel.app";
const CONTACT_EMAIL = "oroiplovequ3@gmail.com";
const EFFECTIVE_DATE = "2026년 11월 22일";

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-md2 border border-line bg-white px-[15px] py-[14px] shadow-card">
      <div className="flex items-center gap-2">
        <span className="grid h-[21px] w-[21px] flex-none place-items-center rounded-[7px] bg-brand-50 text-[10.5px] font-extrabold text-brand-600">
          {n}
        </span>
        <h2 className="text-[14px] font-extrabold tracking-tight3 text-ink">{title}</h2>
      </div>
      <div className="mt-2.5 flex flex-col gap-2 text-[12.5px] leading-[1.75] text-ink-2">
        {children}
      </div>
    </section>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-[7px]">
      {items.map((item, index) => (
        <li key={index} className="flex gap-[7px]">
          <span className="mt-[7.5px] h-[3px] w-[3px] flex-none rounded-full bg-brand-500" />
          <span className="min-w-0 flex-1 wrap-any">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-extrabold text-ink">{children}</strong>;
}

export default function TermsPage() {
  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-canvas">
      {/* 상단 앱바 */}
      <header className="z-20 flex flex-none items-center gap-2.5 border-b border-line bg-white px-3 pb-2.5 pt-[calc(11px+env(safe-area-inset-top))]">
        <Link
          href="/"
          aria-label="홈으로 돌아가기"
          className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] bg-[#F3F5F9] text-ink-2 transition active:scale-[.96]"
        >
          <Icon name="chevron" size={16} strokeWidth={2.4} className="rotate-180" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-extrabold tracking-tight3">
            이용약관·커뮤니티 가이드라인
          </h1>
          <p className="mt-[1px] truncate text-[10.5px] font-semibold text-ink-faint">
            인블루 (INBLUE) · 시행일 {EFFECTIVE_DATE}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-[calc(26px+env(safe-area-inset-bottom))] pt-3.5">
        <div className="flex flex-col gap-2.5">
          {/* 서비스 소개 */}
          <section className="relative overflow-hidden rounded-lg2 bg-gradient-to-br from-[#0B4E9B] via-brand-600 to-[#2A7BE4] px-[17px] py-[17px] text-white shadow-[0_12px_26px_-12px_rgba(7,76,161,.7)]">
            <div className="pointer-events-none absolute -right-[46px] -top-[52px] h-[150px] w-[150px] rounded-full bg-white/[.07]" />
            <div className="relative flex items-center gap-2.5">
              <Image
                src="/images/lapak-mascot-badge.png"
                alt="인블루 마스코트"
                width={96}
                height={96}
                className="h-[44px] w-[44px] flex-none rounded-full border-2 border-white/25 bg-white/15 object-cover"
              />
              <div className="min-w-0">
                <div className="text-[15.5px] font-extrabold tracking-tight3">인블루 (INBLUE)</div>
                <div className="mt-[2px] truncate text-[11px] font-semibold text-white/75">
                  {SERVICE_URL}
                </div>
              </div>
            </div>
            <p className="relative mt-2.5 wrap-any text-[11.5px] leading-relaxed text-white/85">
              인블루는 라팍(대구 삼성라이온즈파크)에 가는 삼성 라이온즈 팬들이 좌석 시야·먹거리·주차
              정보와 직관 기록을 나누는 커뮤니티입니다. 함께 쓰는 공간인 만큼 아래 약속을 지켜
              주세요.
            </p>
            <span className="relative mt-2.5 inline-block rounded-md bg-white/[.16] px-2 py-1 text-[10px] font-extrabold text-white/95">
              시행일 {EFFECTIVE_DATE}
            </span>
          </section>

          <Section n={1} title="약관의 적용">
            <Bullets
              items={[
                <>
                  이 약관은 인블루가 제공하는 커뮤니티 서비스(라팍톡, 좌석 시야 후기, 맛집·주차,
                  직관 기록)의 이용 조건과 운영 기준을 정합니다.
                </>,
                <>
                  인블루에 글·후기·기록을 남기면 이 약관과{" "}
                  <Link
                    href="/privacy"
                    className="font-extrabold text-brand-600 underline underline-offset-2"
                  >
                    개인정보처리방침
                  </Link>
                  에 동의한 것으로 봅니다.
                </>,
                <>약관이 바뀌면 이 페이지에 바뀐 내용과 시행일을 함께 게시합니다.</>,
              ]}
            />
          </Section>

          <Section n={2} title="계정">
            <Bullets
              items={[
                <>
                  로그인은 <Strong>구글 계정</Strong>으로 합니다. 인블루는 비밀번호를 받지
                  않습니다.
                </>,
                <>
                  계정으로 남긴 글·후기·기록의 책임은 그 계정의 이용자에게 있습니다. 계정을 다른
                  사람에게 빌려 주거나 넘기지 마세요.
                </>,
                <>
                  설정에서 <Strong>로그아웃</Strong>과 <Strong>회원 탈퇴</Strong>를 직접 할 수
                  있습니다. 탈퇴하면 내 글·댓글·후기·맛집·주차 팁·직관 기록과 첨부 사진, 프로필이
                  모두 삭제되고 되돌릴 수 없습니다.
                </>,
              ]}
            />
          </Section>

          <Section n={3} title="커뮤니티 가이드라인 — 하지 말아야 할 것">
            <Bullets
              items={[
                <>
                  <Strong>욕설·비방·혐오</Strong> — 특정인이나 집단을 비하하는 말, 인신공격,
                  싸움을 붙이는 글
                </>,
                <>
                  <Strong>개인정보 노출</Strong> — 다른 사람의 이름·전화번호·주소·계정·사진을
                  당사자 동의 없이 올리는 행위
                </>,
                <>
                  <Strong>스팸·광고·사기</Strong> — 티켓 되팔기(암표), 상업적 홍보, 반복 도배,
                  외부로 유인하는 링크
                </>,
                <>
                  <Strong>허위 정보</Strong> — 확인되지 않은 경기·티켓·행사 소식을 사실인 것처럼
                  퍼뜨려 피해를 주는 행위
                </>,
                <>
                  <Strong>음란·불법·유해 콘텐츠</Strong> — 성적 표현, 폭력적 이미지, 저작권을
                  침해하는 사진·글
                </>,
                <>
                  <Strong>서비스 방해</Strong> — 자동화된 대량 등록, 다른 사람 계정 도용, 신고
                  기능 악용
                </>,
              ]}
            />
            <p className="wrap-any rounded-[11px] bg-[#F7F9FC] px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-muted">
              응원은 뜨겁게, 말은 다정하게. 야구 이야기에서 서로 응원 팀이 달라도 괜찮아요.
            </p>
          </Section>

          <Section n={4} title="신고와 제재">
            <Bullets
              items={[
                <>
                  문제가 되는 글·댓글·후기·맛집·주차 팁에는 <Strong>신고</Strong> 버튼이 있습니다.
                  신고는 운영자(마스터)만 확인하며, 같은 항목은 한 번만 접수됩니다.
                </>,
                <>
                  운영자는 신고된 내용을 확인한 뒤 <Strong>게시물 삭제</Strong>,{" "}
                  <Strong>기각(문제 없음)</Strong>, <Strong>처리 완료</Strong> 중 하나로 정리합니다.
                </>,
                <>
                  위 가이드라인을 어긴 경우 <Strong>경고 → 게시물 삭제 → 이용 제한</Strong>{" "}
                  순서로 조치할 수 있고, 중대한 위반(개인정보 노출, 사기, 불법 콘텐츠)은 바로
                  삭제·이용 제한할 수 있습니다.
                </>,
                <>신고 기능을 괴롭힘 수단으로 반복 사용하는 경우에도 이용이 제한될 수 있습니다.</>,
              ]}
            />
          </Section>

          <Section n={5} title="내가 쓴 글의 권리와 책임">
            <Bullets
              items={[
                <>
                  내가 쓴 글·사진의 저작권은 나에게 있습니다. 다만 인블루가 서비스를 운영·개선하고
                  화면에 표시하는 데 필요한 범위에서 이를 사용할 수 있습니다.
                </>,
                <>
                  다른 사람의 사진·글을 가져올 때는 출처와 허락을 확인해 주세요.
                </>,
                <>
                  내가 쓴 글은 언제든 직접 수정·삭제할 수 있습니다. 삭제하면 첨부 사진도 함께
                  지워집니다.
                </>,
              ]}
            />
          </Section>

          <Section n={6} title="정보의 정확성">
            <p className="wrap-any">
              좌석 가격·구역 이름·먹거리·주차 정보는 공개 자료와 팬들의 후기를 바탕으로 정리한
              참고 정보입니다. 구단 정책이나 시즌 운영에 따라 달라질 수 있으니, 예매·방문 전에
              구단 공식 안내를 함께 확인해 주세요.
            </p>
          </Section>

          <Section n={7} title="서비스 변경·중단">
            <Bullets
              items={[
                <>인블루는 더 나은 서비스를 위해 기능을 더하거나 바꿀 수 있습니다.</>,
                <>
                  점검·장애·운영상 필요에 따라 서비스가 잠시 멈출 수 있으며, 중요한 변경은 앱
                  화면으로 미리 알립니다.
                </>,
                <>
                  서비스를 마칠 때는 공지 후 일정 기간을 두고, 개인정보는{" "}
                  <Link
                    href="/privacy"
                    className="font-extrabold text-brand-600 underline underline-offset-2"
                  >
                    개인정보처리방침
                  </Link>
                  에 따라 파기합니다.
                </>,
              ]}
            />
          </Section>

          <Section n={8} title="책임의 한계">
            <p className="wrap-any">
              인블루는 팬들이 자유롭게 정보를 나누는 공간입니다. 이용자가 올린 글의 내용과 그
              글로 인한 거래·약속의 책임은 작성자에게 있으며, 인블루는 서비스 운영에 필요한
              주의를 다합니다.
            </p>
          </Section>

          <Section n={9} title="문의">
            <p className="wrap-any">
              신고·삭제 요청, 계정 문의는 아래로 보내 주세요. 확인하는 대로 답변드립니다.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-2 rounded-[11px] bg-brand-50 px-3 py-2.5 text-[12.5px] font-extrabold text-brand-600"
            >
              <Icon name="comment" size={14} strokeWidth={2} />
              <span className="min-w-0 flex-1 truncate">{CONTACT_EMAIL}</span>
              <span className="text-[11px] font-bold text-brand-500">메일 보내기</span>
            </a>
          </Section>

          <p className="wrap-any px-2.5 pt-1.5 text-center text-[10.5px] leading-relaxed text-[#AEB6C2]">
            인블루 (INBLUE) · 시행일 {EFFECTIVE_DATE}
          </p>

          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 rounded-[13px] bg-brand px-4 py-3 text-[13.5px] font-extrabold text-white shadow-brand"
          >
            <Icon name="home" size={16} strokeWidth={2.1} />
            인블루 홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
