/**
 * 게시글 작성순번 배지.
 * DB(019 마이그레이션)가 매기는 `post_no` 를 `No.1`, `No.2` … 로 보여 줍니다.
 * 번호가 없는 글(마이그레이션 이전 데모 데이터 등)은 배지를 그리지 않습니다.
 */
export function PostNo({
  no,
  className = "",
}: {
  no?: number | null;
  className?: string;
}) {
  if (!no || no <= 0) return null;
  return (
    <span
      className={`inline-flex flex-none items-center rounded-[5px] bg-[#EDF1F7] px-[5px] py-[1.5px] text-[10px] font-extrabold leading-[1.45] tracking-tight text-[#5C6B80] tabular-nums ${className}`}
      title={`작성순번 No.${no}`}
    >
      No.{no}
    </span>
  );
}
