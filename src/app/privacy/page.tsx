import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "개인정보처리방침 — 인블루 (INBLUE)",
  description:
    "인블루(INBLUE)가 구글 로그인과 커뮤니티 이용 과정에서 받는 정보, 이용 목적, 보관·파기 방법과 문의처를 안내합니다.",
  alternates: { canonical: "/privacy" },
};

const SERVICE_URL = "lapak-life.vercel.app";
const CONTACT_EMAIL = "oroiplovequ3@gmail.com";
const EFFECTIVE_DATE = "2026년 11월 21일";

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
          <span className="min-w-0 flex-1 break-keep">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-extrabold text-ink">{children}</strong>;
}

export default function PrivacyPage() {
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
          <h1 className="truncate text-[15px] font-extrabold tracking-tight3">개인정보처리방침</h1>
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
            <p className="relative mt-2.5 break-keep text-[11.5px] leading-relaxed text-white/85">
              인블루는 라팍(대구 삼성라이온즈파크)에 가는 팬들이 좌석 시야·먹거리·주차 정보와
              직관 기록을 나누는 커뮤니티입니다. 이 방침은 인블루가 어떤 정보를 받고, 무엇에
              쓰고, 언제 파기하는지 알려 드립니다.
            </p>
            <span className="relative mt-2.5 inline-block rounded-md bg-white/[.16] px-2 py-1 text-[10px] font-extrabold text-white/95">
              시행일 {EFFECTIVE_DATE}
            </span>
          </section>

          <Section n={1} title="수집하는 정보">
            <Bullets
              items={[
                <>
                  <Strong>구글 로그인 정보</Strong> — 이메일 주소, 프로필 기본 정보(닉네임,
                  프로필 사진). 비밀번호는 인블루가 받지 않으며 로그인은 Google이 처리합니다.
                </>,
                <>
                  <Strong>이용자가 직접 작성한 정보</Strong> — 게시글·댓글, 직관 시야 후기, 직관
                  기록(날짜·상대 팀·점수·메모), 맛집·주차 팁, 그리고 이 글들에 첨부한 이미지.
                </>,
                <>
                  <Strong>로그인 유지 정보</Strong> — 브라우저 쿠키에 담기는 로그인 세션 정보.
                </>,
                <>
                  이름·전화번호·주민등록번호·주소·카드 정보는 받지 않습니다.
                </>,
              ]}
            />
          </Section>

          <Section n={2} title="이용 목적">
            <Bullets
              items={[
                <>회원 식별과 로그인 상태 유지</>,
                <>게시글·댓글·시야 후기·직관 기록·맛집·주차 팁의 게시, 저장, 수정, 삭제</>,
                <>작성자 표시(닉네임·프로필 사진)와 ‘내 직관’의 내가 쓴 글 관리</>,
                <>문의 접수와 응대</>,
              ]}
            />
            <p className="break-keep rounded-[11px] bg-[#F7F9FC] px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-muted">
              받은 정보를 광고·판매·프로파일링에 쓰지 않습니다.
            </p>
          </Section>

          <Section n={3} title="보관 기간과 파기">
            <Bullets
              items={[
                <>
                  보관 기간은 <Strong>회원 탈퇴 또는 삭제 요청 시까지</Strong>입니다. 탈퇴나
                  삭제를 요청하시면 지체 없이 파기합니다.
                </>,
                <>
                  앱에서 직접 지운 글·댓글·후기·기록·팁은 바로 삭제되며, 화면에서 지운 항목은
                  다시 표시되지 않습니다.
                </>,
                <>전자적 파일 형태로 저장된 정보는 복구할 수 없는 방법으로 삭제합니다.</>,
                <>
                  관련 법령이 일정 기간 보관을 요구하는 경우에는 해당 기간 동안만 보관한 뒤
                  파기합니다.
                </>,
              ]}
            />
          </Section>

          <Section n={4} title="쿠키 사용 안내">
            <Bullets
              items={[
                <>
                  인블루는 로그인 상태를 유지하기 위해 브라우저 <Strong>쿠키</Strong>를
                  사용합니다. 로그인하지 않으면 이 쿠키는 만들어지지 않습니다.
                </>,
                <>광고나 행태 추적을 위한 쿠키는 사용하지 않습니다.</>,
                <>
                  브라우저 설정에서 언제든 쿠키를 삭제할 수 있으며, 삭제하면 로그아웃됩니다.
                </>,
              ]}
            />
          </Section>

          <Section n={5} title="제3자 제공과 처리 위탁">
            <Bullets
              items={[
                <>
                  이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 다만 로그인은
                  이용자가 고른 구글 계정을 통해 이루어지므로, 그 과정에는 Google의
                  개인정보처리방침이 함께 적용됩니다.
                </>,
                <>
                  서비스 운영에 필요한 범위에서 아래 업체의 인프라를 이용합니다.
                  <span className="mt-1.5 flex flex-col gap-1 rounded-[11px] bg-[#F7F9FC] px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-muted">
                    <span>· Google — 로그인 인증</span>
                    <span>· Supabase Inc. — 데이터베이스·로그인 인증 처리</span>
                    <span>· Vercel Inc. — 웹 호스팅</span>
                  </span>
                </>,
              ]}
            />
          </Section>

          <Section n={6} title="이용자의 권리">
            <Bullets
              items={[
                <>
                  ‘내 직관’에서 닉네임·프로필 사진을 바꾸고, 내가 쓴 글·댓글·후기·직관
                  기록·팁을 직접 삭제할 수 있습니다.
                </>,
                <>언제든 로그아웃할 수 있습니다.</>,
                <>
                  열람·정정·삭제·처리 정지를 아래 문의처로 요청하시면 지체 없이 처리하고
                  결과를 알려 드립니다.
                </>,
              ]}
            />
          </Section>

          <Section n={7} title="만 14세 미만 아동">
            <p className="break-keep">
              인블루는 만 14세 미만 아동의 개인정보를 수집하지 않습니다. 아동의 정보가
              수집된 것을 알게 되면 지체 없이 파기합니다.
            </p>
          </Section>

          <Section n={8} title="Google API 사용자 데이터">
            <p className="break-keep">
              인블루가 Google로부터 받은 정보는 회원 식별과 로그인에만 사용합니다. Google API
              서비스 사용자 데이터 정책(제한적 사용 요구사항 포함)을 준수하며, 광고 목적으로
              사용하거나 제3자에게 제공하지 않습니다.
            </p>
          </Section>

          <Section n={9} title="문의처">
            <p className="break-keep">
              개인정보와 관련한 문의·삭제 요청은 아래로 보내 주세요. 확인하는 대로 답변드립니다.
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

          <Section n={10} title="방침 변경 안내">
            <p className="break-keep">
              이 방침이 바뀌면 이 페이지에 바뀐 내용과 시행일을 함께 게시합니다. 이용자에게
              중요한 변경은 앱 공지로 미리 알립니다.
            </p>
          </Section>

          <p className="break-keep px-2.5 pt-1.5 text-center text-[10.5px] leading-relaxed text-[#AEB6C2]">
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
