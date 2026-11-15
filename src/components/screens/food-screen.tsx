"use client";

import { useState } from "react";

import { Icon } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { FLOOR_GUIDE } from "@/lib/data/foods";
import { PARKING } from "@/lib/data/parking";
import type { Food } from "@/lib/types";

type FoodFilter = "all" | "in" | "out";

function FoodCard({ food }: { food: Food }) {
  const { saves, toggleSaveFood } = useApp();
  const saved = saves.foods.includes(food.id);
  const waitColor = ["text-[#027A48] bg-[#ECFDF3]", "text-[#B54708] bg-[#FFFAEB]", "text-[#B42318] bg-[#FEF3F2]"][
    food.wait
  ];

  return (
    <article className="relative rounded-md2 border border-line bg-white p-3 shadow-card">
      <button
        type="button"
        aria-label={saved ? "저장 해제" : "저장"}
        onClick={() => void toggleSaveFood(food.id)}
        className={`absolute right-[9px] top-[9px] grid h-[30px] w-[30px] place-items-center rounded-[10px] transition ${
          saved ? "bg-brand-50 text-brand" : "bg-[#F5F7FA] text-[#B4BCC9]"
        }`}
      >
        <Icon name="bookmark" size={15} strokeWidth={2} filled={saved} />
      </button>
      <div className="flex gap-2.5 pr-6">
        <div
          className="grid h-[58px] w-[58px] flex-none place-items-center rounded-[15px] text-[26px]"
          style={{ background: food.thumbBg }}
        >
          {food.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-[7px]">
            <h3 className="text-[14.5px] font-extrabold tracking-tight2">{food.name}</h3>
            {food.price ? (
              <span className="text-[11.5px] font-extrabold text-brand-600">{food.price}</span>
            ) : null}
          </div>
          <div className="mt-[3px] text-[11px] font-semibold text-ink-muted">📍 {food.loc}</div>
          <p className="mt-1.5 break-keep text-xs leading-relaxed text-ink-2">{food.menu}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#FFFAEB] px-1.5 py-0.5 text-[11px] font-extrabold text-[#B54708]">
              ★ {food.rating.toFixed(1)}
            </span>
            <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-extrabold ${waitColor}`}>
              웨이팅 {food.waitTxt}
            </span>
            <span className="text-[11.5px] text-ink-faint">
              {food.inStadium ? "구장 안" : "구장 밖"}
            </span>
          </div>
          <div className="mt-2 break-keep rounded-[9px] bg-[#F8FAFC] px-[9px] py-[7px] text-[11.5px] leading-[1.5] text-[#475467]">
            💡 {food.tip}
          </div>
        </div>
      </div>
    </article>
  );
}

export function FoodScreen() {
  const { foods } = useApp();
  const [segment, setSegment] = useState<"food" | "parking">("food");
  const [filter, setFilter] = useState<FoodFilter>("all");

  const insideCount = foods.filter((food) => food.inStadium).length;
  const filtered =
    filter === "all" ? foods : foods.filter((food) => (filter === "in" ? food.inStadium : !food.inStadium));

  return (
    <div className="flex flex-col gap-3.5 px-4 pb-[30px] pt-3.5">
      <div className="flex gap-[3px] rounded-[14px] bg-[#EEF1F6] p-1">
        <button
          type="button"
          onClick={() => setSegment("food")}
          className={`flex-1 rounded-[11px] py-2.5 text-[12.5px] font-extrabold transition ${
            segment === "food" ? "bg-white text-brand shadow-[0_1px_4px_rgba(16,24,40,.12)]" : "text-ink-muted"
          }`}
        >
          🍔 먹거리·맛집
        </button>
        <button
          type="button"
          onClick={() => setSegment("parking")}
          className={`flex-1 rounded-[11px] py-2.5 text-[12.5px] font-extrabold transition ${
            segment === "parking" ? "bg-white text-brand shadow-[0_1px_4px_rgba(16,24,40,.12)]" : "text-ink-muted"
          }`}
        >
          🚗 주차·교통
        </button>
      </div>

      {segment === "parking" ? (
        <>
          <div className="flex items-center gap-2.5 rounded-md2 border border-[#D7E6FA] bg-[#F2F8FF] p-3.5">
            <div className="grid h-[38px] w-[38px] flex-none place-items-center rounded-xl bg-[#DCEAFF] text-lg">
              ℹ️
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-[#0B4A96]">
                2026 시즌부터 전설로 주차장은 사전예약제
              </div>
              <div className="mt-[3px] text-[11.5px] leading-relaxed text-ink-faint">
                현장 판매가 없어 사전에 잡지 않으면 입차할 수 없어요.
              </div>
            </div>
          </div>

          {PARKING.map((card) => (
            <article key={card.title} className="rounded-md2 border border-line bg-white p-3.5 shadow-card">
              <div className="mb-1 flex items-center gap-2.5">
                <div className="grid h-[38px] w-[38px] flex-none place-items-center rounded-xl bg-brand-50 text-lg">
                  {card.ic}
                </div>
                <div>
                  <h3 className="text-[14.5px] font-extrabold tracking-tight2">{card.title}</h3>
                  <div className="mt-0.5 text-[11px] font-semibold text-ink-faint">{card.sub}</div>
                </div>
              </div>
              {card.kvs.map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-3.5 border-b border-dashed border-[#EDF0F4] py-2 text-[12.5px] last:border-none"
                >
                  <span className="flex-none font-semibold text-ink-muted">{k}</span>
                  <span className="text-right font-extrabold tracking-tight text-ink">{v}</span>
                </div>
              ))}
              {card.warn ? (
                <div className="mt-2.5 break-keep rounded-[11px] bg-[#FEF3F2] px-[11px] py-2.5 text-xs leading-relaxed text-[#B42318]">
                  ⚠️ {card.warn}
                </div>
              ) : null}
              {card.tip ? (
                <div className="mt-2.5 break-keep rounded-[11px] bg-[#F2F8FF] px-[11px] py-2.5 text-xs leading-relaxed text-[#0B4A96]">
                  💡 {card.tip}
                </div>
              ) : null}
            </article>
          ))}

          <p className="break-keep px-2.5 pt-1 text-center text-[10.5px] leading-relaxed text-[#AEB6C2]">
            주차 요금·운영 시간은 2026 시즌 구단 공지 기준입니다. 방문 전 구단 앱 공지와 티켓링크 예약
            페이지를 다시 확인하세요.
          </p>
        </>
      ) : (
        <>
          <div className="-mx-4 flex gap-[7px] overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(
              [
                ["all", "전체", foods.length],
                ["in", "구장 안", insideCount],
                ["out", "구장 밖(입장 전)", foods.length - insideCount],
              ] as [FoodFilter, string, number][]
            ).map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`inline-flex flex-none items-center gap-[5px] rounded-full border px-[13px] py-2 text-[12.5px] font-bold transition ${
                  filter === id
                    ? "border-brand bg-brand text-white shadow-[0_3px_10px_-2px_rgba(7,76,161,.5)]"
                    : "border-line bg-white text-[#475467]"
                }`}
              >
                {label}
                <span className="ml-px text-[10.5px] font-extrabold opacity-70">{count}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            {filtered.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>

          <div className="rounded-md2 border border-line bg-[#F8FAFC] p-3.5 shadow-card">
            <div className="mb-1.5 text-[12.5px] font-extrabold">🍽️ 층별로 빠르게 찾기</div>
            <div className="text-[11.5px] leading-[1.75] text-ink-faint">
              {FLOOR_GUIDE.map((guide) => (
                <span key={guide.title} className="block">
                  {guide.title} · {guide.items}
                </span>
              ))}
            </div>
          </div>

          <p className="break-keep px-2.5 pt-1 text-center text-[10.5px] leading-relaxed text-[#AEB6C2]">
            매장·메뉴는 2026 시즌 공개 자료를 참고한 샘플입니다. 실제 운영은 구단 공지로 확인하세요.
          </p>
        </>
      )}
    </div>
  );
}
