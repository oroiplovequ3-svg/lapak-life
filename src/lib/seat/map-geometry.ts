/**
 * 대구 삼성라이온즈파크(라팍) 좌석 도면 지오메트리.
 *
 * 사용자가 올린 구단 좌석안내도를 기준으로 필드 외곽 폴리곤과 층별 밴드를
 * 오프셋해 만든 데이터입니다. 좌표계는 원본 이미지 픽셀(1206x1092)이고
 * SVG viewBox 로 그대로 환산해 렌더링합니다.
 *
 *  - 필드: 넓은 팔각형 — 상단 중견수 펜스가 짧고 좌우 파울라인이 45도로
 *    홈플레이트까지 좁아지는 형태
 *  - 3층(내야): 테이블석 · 블루존/원정응원석 · 익사이팅석 · 내야지정석
 *  - 4층: 스윗박스 띠 + 3루 끝 파티플로어석, 홈 뒤 VIP
 *  - 5층: SKY지정석(1~19) · SKY 블루(20~24) · SKY자유석(25~31) · SKY박스
 *  - 외야: LF1~10 / RF1~10 · 외야패밀리석 · 외야테이블 · 외야루프탑
 *  - 잔디그린존 · 캠핑존(1루 외야 코너), 출입구 3곳
 *
 * scripts/build-seatmap.mjs 가 생성합니다. 직접 고치지 마세요.
 */
export type Pt = [number, number];

export const VIEWBOX = "0 0 1206 1092";

export const COLORS = {
  grassA: "#7CBB4F",
  grassB: "#A6CD79",
  track: "#F2A93B",
  outfield: "#D9662F",
  ofFamily: "#C9BF62",
  ofInnerGreen: "#A9C43C",
  rooftop: "#A62B22",
  ofTable: "#D9C23F",
  navy: "#0D288C",
  skyBlue: "#55A3EB",
  magenta: "#9C4088",
  vip: "#A32C87",
  party: "#8A6A43",
  purple: "#491978",
  pink: "#D792B2",
  blue: "#4574B5",
  table: "#4C0F06",
  centerYellow: "#EFC24F",
  centerGreen: "#C6D45B",
  jungleDark: "#2E6B34",
  jungleLight: "#8DBB5A",
  outerWall: "#D7E0EC",
  outerLine: "#9AA9BD",
  concourse: "#F7F9FC",
  walkway: "#DDE4EE",
  ink: "#5B6675",
} as const;

/** 클릭 가능한 좌석 구역 코드 (8개) */
export type ZoneCode = "C" | "T3" | "BZ" | "I1" | "T1" | "SB" | "OF" | "SKY";

export interface Block {
  zone: string;
  fill: string;
  path: string;
  cx: number;
  cy: number;
  label?: string;
  angle?: number;
  fs?: number;
  plain?: boolean;
}

export const BLOCKS: Block[] = [
  { zone:"I1", fill:"#491978", path:"M910,432.3 L900.4,444.9 L993.1,516.1 L1002.8,503.6 Z", cx:951.6, cy:474.2, angle:45, fs:9.5 },
  { zone:"I1", fill:"#491978", path:"M899.8,445.6 L890.1,458.2 L982.9,529.5 L992.5,516.9 Z", cx:941.3, cy:487.6, angle:45, fs:9.5 },
  { zone:"I1", fill:"#491978", path:"M889.5,459 L879.9,471.5 L972.7,542.8 L982.3,530.3 Z", cx:931.1, cy:500.9, angle:45, fs:9.5 },
  { zone:"I1", fill:"#491978", path:"M879.3,472.3 L869.6,484.8 L962.4,556.1 L972,543.6 Z", cx:920.8, cy:514.2, angle:45, fs:9.5 },
  { zone:"I1", fill:"#491978", path:"M869,485.6 L859.4,498.2 L952.2,569.5 L961.8,556.9 Z", cx:910.6, cy:527.5, angle:45, fs:9.5 },
  { zone:"I1", fill:"#491978", path:"M858.8,499 L849.2,511.5 L941.9,582.8 L951.6,570.3 Z", cx:900.4, cy:540.9, angle:45, fs:9.5 },
  { zone:"I1", fill:"#491978", path:"M848.5,512.3 L838.9,524.8 L931.7,596.1 L941.3,583.6 Z", cx:890.1, cy:554.2, angle:45, fs:9.5 },
  { zone:"I1", fill:"#D792B2", path:"M838.2,525.7 L827,540.3 L919.8,611.6 L931,597 Z", cx:879, cy:568.6, label:"1", angle:45, fs:11.1 },
  { zone:"I1", fill:"#D792B2", path:"M826.3,541.2 L815.1,555.9 L907.8,627.1 L919.1,612.5 Z", cx:867.1, cy:584.2, label:"2", angle:45, fs:11.1 },
  { zone:"I1", fill:"#4574B5", path:"M814.4,556.7 L804.5,569.6 L897.3,640.9 L907.2,628 Z", cx:855.8, cy:598.8, angle:45, fs:9.7 },
  { zone:"I1", fill:"#4574B5", path:"M803.9,570.4 L794,583.3 L886.8,654.6 L896.6,641.7 Z", cx:845.3, cy:612.5, angle:45, fs:9.7 },
  { zone:"I1", fill:"#4574B5", path:"M793.4,584.1 L783.5,597 L876.2,668.3 L886.1,655.4 Z", cx:834.8, cy:626.2, angle:45, fs:9.7 },
  { zone:"I1", fill:"#4574B5", path:"M782.8,597.8 L773,610.6 L865.7,681.9 L875.6,669.1 Z", cx:824.3, cy:639.9, angle:45, fs:9.7 },
  { zone:"I1", fill:"#4574B5", path:"M772.3,611.5 L762.4,624.3 L855.2,695.6 L865.1,682.8 Z", cx:813.8, cy:653.5, angle:45, fs:9.7 },
  { zone:"T1", fill:"#4C0F06", path:"M761.5,625.6 L740.7,652.6 L833.5,723.9 L854.2,696.9 Z", cx:797.5, cy:674.8, label:"4", angle:45, fs:20.5 },
  { zone:"T1", fill:"#4C0F06", path:"M739.4,654.4 L718.6,681.4 L811.3,752.7 L832.1,725.7 Z", cx:775.4, cy:703.5, label:"3", angle:45, fs:20.5 },
  { zone:"T1", fill:"#4C0F06", path:"M717.2,683.1 L696.5,710.2 L789.2,781.5 L810,754.4 Z", cx:753.2, cy:732.3, label:"2", angle:45, fs:20.5 },
  { zone:"T1", fill:"#4C0F06", path:"M695.1,711.9 L674.4,738.9 L767.1,810.2 L787.9,783.2 Z", cx:731.1, cy:761.1, label:"1", angle:45, fs:20.5 },
  { zone:"T3", fill:"#4C0F06", path:"M531.9,739.3 L519.3,722.8 L426.5,794.1 L439.1,810.6 Z", cx:479.2, cy:766.7, label:"1", angle:-45, fs:12.4 },
  { zone:"T3", fill:"#4C0F06", path:"M518.5,721.8 L505.8,705.3 L413,776.6 L425.7,793.1 Z", cx:465.8, cy:749.2, label:"2", angle:-45, fs:12.4 },
  { zone:"T3", fill:"#4C0F06", path:"M505,704.3 L492.4,687.9 L399.6,759.1 L412.2,775.6 Z", cx:452.3, cy:731.7, label:"3", angle:-45, fs:12.4 },
  { zone:"T3", fill:"#4C0F06", path:"M491.6,686.8 L478.9,670.4 L386.2,741.7 L398.8,758.1 Z", cx:438.9, cy:714.2, label:"4", angle:-45, fs:12.4 },
  { zone:"BZ", fill:"#4574B5", path:"M478.2,669.4 L468.1,656.3 L375.3,727.6 L385.4,740.7 Z", cx:426.8, cy:698.5, angle:-45, fs:10 },
  { zone:"BZ", fill:"#4574B5", path:"M467.4,655.4 L457.3,642.3 L364.6,713.6 L374.7,726.7 Z", cx:416, cy:684.5, angle:-45, fs:10 },
  { zone:"BZ", fill:"#4574B5", path:"M456.7,641.4 L446.6,628.3 L353.8,699.6 L363.9,712.7 Z", cx:405.3, cy:670.5, angle:-45, fs:10 },
  { zone:"BZ", fill:"#4574B5", path:"M445.9,627.4 L435.8,614.3 L343.1,685.6 L353.2,698.7 Z", cx:394.5, cy:656.5, angle:-45, fs:10 },
  { zone:"BZ", fill:"#4574B5", path:"M435.2,613.4 L425.1,600.3 L332.3,671.6 L342.4,684.7 Z", cx:383.7, cy:642.5, angle:-45, fs:10 },
  { zone:"BZ", fill:"#4574B5", path:"M424.4,599.4 L414.3,586.3 L321.5,657.6 L331.7,670.7 Z", cx:373, cy:628.5, angle:-45, fs:10 },
  { zone:"BZ", fill:"#4574B5", path:"M413.7,585.4 L403.6,572.3 L310.8,643.6 L320.9,656.7 Z", cx:362.2, cy:614.5, angle:-45, fs:10 },
  { zone:"BZ", fill:"#D792B2", path:"M403,571.5 L394,559.8 L301.2,631.1 L310.2,642.8 Z", cx:352.1, cy:601.3, angle:-45, fs:9 },
  { zone:"BZ", fill:"#D792B2", path:"M393.4,559.1 L384.4,547.4 L291.6,618.7 L300.6,630.4 Z", cx:342.5, cy:588.9, angle:-45, fs:9 },
  { zone:"BZ", fill:"#491978", path:"M383.7,546.5 L371.6,530.7 L278.8,602 L291,617.8 Z", cx:331.3, cy:574.2, label:"9", angle:-45, fs:11.9 },
  { zone:"BZ", fill:"#491978", path:"M370.8,529.7 L358.7,513.9 L265.9,585.2 L278.1,601 Z", cx:318.4, cy:557.4, label:"9", angle:-45, fs:11.9 },
  { zone:"BZ", fill:"#491978", path:"M357.9,512.9 L345.8,497.1 L253,568.4 L265.2,584.2 Z", cx:305.5, cy:540.7, label:"10", angle:-45, fs:11.9 },
  { zone:"BZ", fill:"#491978", path:"M345,496.1 L332.9,480.3 L240.1,551.6 L252.2,567.4 Z", cx:292.6, cy:523.9, label:"11", angle:-45, fs:11.9 },
  { zone:"BZ", fill:"#491978", path:"M332.1,479.3 L320,463.5 L227.2,534.8 L239.3,550.6 Z", cx:279.7, cy:507.1, label:"10", angle:-45, fs:11.9 },
  { zone:"BZ", fill:"#DDE4EE", path:"M319.6,463 L295.7,431.9 L296.6,415 L228.2,349.1 L226.8,534.3 Z", cx:273.4, cy:438.7, fs:31.9 },
  { zone:"OF", fill:"#D9662F", path:"M301.9,409.5 L327.3,383.1 L258.8,317.2 L233.5,343.6 Z", cx:280.4, cy:363.3, label:"LF1", angle:-45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M328.9,381.4 L354.3,355 L285.8,289.1 L260.5,315.5 Z", cx:307.4, cy:335.3, label:"LF2", angle:-45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M355.9,353.3 L381.3,326.9 L312.8,261.1 L287.5,287.5 Z", cx:334.4, cy:307.2, label:"LF3", angle:-45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M382.9,325.2 L408.3,298.8 L339.8,233 L314.5,259.4 Z", cx:361.4, cy:279.1, label:"LF4", angle:-45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M409.9,297.1 L435.3,270.8 L366.8,204.9 L341.5,231.3 Z", cx:388.4, cy:251, label:"LF5", angle:-45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M436.9,269.1 L462.3,242.7 L393.8,176.8 L368.5,203.2 Z", cx:415.4, cy:222.9, label:"LF6", angle:-45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M463.9,241 L489.3,214.6 L420.8,148.7 L395.5,175.1 Z", cx:442.4, cy:194.9, label:"LF7", angle:-45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M490.9,212.9 L516.3,186.5 L447.8,120.7 L422.5,147.1 Z", cx:469.4, cy:166.8, label:"LF8", angle:-45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M689.7,186.5 L715.1,212.9 L777.8,152.6 L752.4,126.2 Z", cx:733.7, cy:169.6, label:"RF8", angle:45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M716.7,214.6 L742.1,241 L804.8,180.7 L779.4,154.3 Z", cx:760.7, cy:197.6, label:"RF7", angle:45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M743.7,242.7 L769.1,269.1 L831.8,208.8 L806.4,182.4 Z", cx:787.7, cy:225.7, label:"RF6", angle:45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M770.7,270.8 L796.1,297.1 L858.8,236.8 L833.4,210.5 Z", cx:814.7, cy:253.8, label:"RF5", angle:45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M797.7,298.8 L823.1,325.2 L885.8,264.9 L860.4,238.5 Z", cx:841.7, cy:281.9, label:"RF4", angle:45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M824.7,326.9 L850.1,353.3 L912.8,293 L887.4,266.6 Z", cx:868.7, cy:310, label:"RF3", angle:45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M851.7,355 L877.1,381.4 L939.8,321.1 L914.4,294.7 Z", cx:895.7, cy:338, label:"RF2", angle:45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M878.7,383.1 L904.1,409.5 L966.8,349.2 L941.4,322.8 Z", cx:922.7, cy:366.1, label:"RF1", angle:45, fs:15 },
  { zone:"OF", fill:"#D9662F", path:"M533.9,179 L549.7,179 L549.7,112 L533.9,112 Z", cx:541.8, cy:145.5, fs:9.5 },
  { zone:"OF", fill:"#D9662F", path:"M549.7,179 L565.6,179 L565.6,112 L549.7,112 Z", cx:557.6, cy:145.5, fs:9.5 },
  { zone:"OF", fill:"#D9662F", path:"M640.4,179 L656.3,179 L656.3,112 L640.4,112 Z", cx:648.4, cy:145.5, fs:9.5 },
  { zone:"OF", fill:"#D9662F", path:"M656.3,179 L672.1,179 L672.1,112 L656.3,112 Z", cx:664.2, cy:145.5, fs:9.5 },
  { zone:"OF", fill:"#A9C43C", path:"M306,424 L427.5,297.6 L418.1,288.6 L296.6,415 Z", cx:362.1, cy:356.3, angle:-45, fs:9 },
  { zone:"OF", fill:"#A9C43C", path:"M427.5,297.6 L531,190 L521.6,181 L418.1,288.6 Z", cx:474.6, cy:239.3, angle:-45, fs:9 },
  { zone:"OF", fill:"#A9C43C", path:"M531,190 L675,190 L675,179 L531,179 Z", cx:603, cy:184.5, fs:9 },
  { zone:"OF", fill:"#A62B22", path:"M675,190 L900,424 L909.4,415 L684.4,181 Z", cx:792.2, cy:302.5, angle:45, fs:9 },
  { zone:"OF", fill:"#C9BF62", path:"M237.2,339.8 L345.2,227.5 L316.3,199.7 L208.3,312.1 Z", cx:276.7, cy:269.8, label:"외야패밀리석", angle:-45, fs:16 },
  { zone:"OF", fill:"#C9BF62", path:"M345.2,227.5 L444.2,124.5 L415.3,96.8 L316.3,199.7 Z", cx:380.2, cy:162.1, label:"외야패밀리석", angle:-45, fs:16 },
  { zone:"OF", fill:"#D9C23F", path:"M756.1,130 L864.1,242.4 L890,217.4 L782,105.1 Z", cx:823.1, cy:173.7, label:"외야테이블", angle:45, fs:16 },
  { zone:"OF", fill:"#D9C23F", path:"M864.1,242.4 L963.1,345.3 L989,320.4 L890,217.4 Z", cx:926.6, cy:281.4, label:"외야테이블", angle:45, fs:16 },
  { zone:"SB", fill:"#9C4088", path:"M439,810.4 L422.6,789.1 L400.4,806.1 L416.8,827.5 Z", cx:419.7, cy:808.3, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M421.6,787.7 L405.2,766.4 L383,783.4 L399.4,804.8 Z", cx:402.3, cy:785.6, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M404.1,765 L387.7,743.7 L365.5,760.7 L381.9,782.1 Z", cx:384.8, cy:762.9, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M386.7,742.3 L370.3,721 L348.1,738 L364.5,759.4 Z", cx:367.4, cy:740.2, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M369.2,719.6 L352.8,698.3 L330.6,715.3 L347,736.7 Z", cx:349.9, cy:717.5, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M351.8,696.9 L335.4,675.6 L313.2,692.6 L329.6,714 Z", cx:332.5, cy:694.8, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M334.3,674.2 L317.9,652.9 L295.7,669.9 L312.1,691.3 Z", cx:315, cy:672.1, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M316.9,651.5 L300.5,630.2 L278.3,647.2 L294.7,668.6 Z", cx:297.6, cy:649.4, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M299.4,628.8 L283,607.5 L260.8,624.5 L277.2,645.9 Z", cx:280.1, cy:626.7, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M282,606.1 L265.6,584.8 L243.4,601.8 L259.8,623.2 Z", cx:262.7, cy:604, fs:13 },
  { zone:"SB", fill:"#8A6A43", path:"M264.3,583.1 L240.7,552.4 L218.5,569.5 L242.1,600.2 Z", cx:241.4, cy:576.3, label:"파티플로어석", angle:-45, fs:12 },
  { zone:"SB", fill:"#8A6A43", path:"M239.2,550.4 L215.6,519.7 L193.4,536.8 L217,567.5 Z", cx:216.3, cy:543.6, angle:-45, fs:12 },
  { zone:"SB", fill:"#9C4088", path:"M1000.1,507.1 L980.2,532.9 L1002.4,550 L1022.3,524.2 Z", cx:1001.3, cy:528.6, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M979,534.6 L959.2,560.4 L981.4,577.4 L1001.2,551.6 Z", cx:980.2, cy:556, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M957.9,562 L938.1,587.8 L960.3,604.8 L980.1,579.1 Z", cx:959.1, cy:583.4, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M936.8,589.4 L917,615.2 L939.2,632.3 L959,606.5 Z", cx:938, cy:610.8, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M915.8,616.8 L895.9,642.6 L918.1,659.7 L938,633.9 Z", cx:916.9, cy:638.3, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M894.7,644.3 L874.9,670 L897.1,687.1 L916.9,661.3 Z", cx:895.9, cy:665.7, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M873.6,671.7 L853.8,697.5 L876,714.5 L895.8,688.8 Z", cx:874.8, cy:693.1, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M852.5,699.1 L832.7,724.9 L854.9,742 L874.7,716.2 Z", cx:853.7, cy:720.5, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M831.5,726.5 L811.6,752.3 L833.8,769.4 L853.7,743.6 Z", cx:832.6, cy:748, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M810.4,754 L790.6,779.7 L812.8,796.8 L832.6,771 Z", cx:811.6, cy:775.4, fs:13 },
  { zone:"SB", fill:"#9C4088", path:"M789.3,781.4 L769.5,807.2 L791.7,824.2 L811.5,798.5 Z", cx:790.5, cy:802.8, fs:13 },
  { zone:"SKY", fill:"#0D288C", path:"M417.1,827.8 L408.5,816.7 L338.7,870.3 L347.3,881.4 Z", cx:377.9, cy:849.1, angle:-45, fs:9 },
  { zone:"SKY", fill:"#0D288C", path:"M408,816 L399.4,804.9 L329.7,858.5 L338.2,869.6 Z", cx:368.8, cy:837.2, angle:-45, fs:9 },
  { zone:"SKY", fill:"#0D288C", path:"M398.9,804.2 L390.4,793.1 L320.6,846.7 L329.1,857.8 Z", cx:359.7, cy:825.4, angle:-45, fs:9 },
  { zone:"SKY", fill:"#0D288C", path:"M389.8,792.4 L381.3,781.2 L311.5,834.9 L320,846 Z", cx:350.7, cy:813.6, angle:-45, fs:9 },
  { zone:"SKY", fill:"#0D288C", path:"M380.7,780.5 L372.2,769.4 L302.4,823.1 L311,834.2 Z", cx:341.6, cy:801.8, angle:-45, fs:9 },
  { zone:"SKY", fill:"#55A3EB", path:"M371.7,768.8 L364,758.8 L294.3,812.4 L301.9,822.4 Z", cx:333, cy:790.6, angle:-45, fs:9 },
  { zone:"SKY", fill:"#55A3EB", path:"M363.6,758.2 L355.9,748.2 L286.1,801.9 L293.8,811.8 Z", cx:324.8, cy:780, angle:-45, fs:9 },
  { zone:"SKY", fill:"#55A3EB", path:"M355.4,747.6 L347.8,737.7 L278,791.3 L285.6,801.2 Z", cx:316.7, cy:769.5, angle:-45, fs:9 },
  { zone:"SKY", fill:"#55A3EB", path:"M347.3,737 L339.7,727.1 L269.9,780.7 L277.5,790.7 Z", cx:308.6, cy:758.9, angle:-45, fs:9 },
  { zone:"SKY", fill:"#55A3EB", path:"M339.2,726.5 L331.5,716.5 L261.8,770.1 L269.4,780.1 Z", cx:300.5, cy:748.3, angle:-45, fs:9 },
  { zone:"SKY", fill:"#0D288C", path:"M330.7,715.4 L311.1,689.9 L241.3,743.5 L260.9,769 Z", cx:286, cy:729.5, label:"25", angle:-45, fs:19.3 },
  { zone:"SKY", fill:"#0D288C", path:"M309.8,688.3 L290.3,662.8 L220.5,716.4 L240.1,741.9 Z", cx:265.2, cy:702.4, label:"26", angle:-45, fs:19.3 },
  { zone:"SKY", fill:"#0D288C", path:"M289,661.2 L269.4,635.7 L199.7,689.3 L219.2,714.8 Z", cx:244.3, cy:675.3, label:"27", angle:-45, fs:19.3 },
  { zone:"SKY", fill:"#0D288C", path:"M268.2,634.1 L248.6,608.6 L178.8,662.2 L198.4,687.7 Z", cx:223.5, cy:648.2, label:"28", angle:-45, fs:19.3 },
  { zone:"SKY", fill:"#0D288C", path:"M247.4,607 L227.8,581.5 L158,635.1 L177.6,660.6 Z", cx:202.7, cy:621.1, label:"29", angle:-45, fs:19.3 },
  { zone:"SKY", fill:"#0D288C", path:"M226.5,579.9 L207,554.4 L137.2,608 L156.8,633.5 Z", cx:181.9, cy:594, label:"30", angle:-45, fs:19.3 },
  { zone:"SKY", fill:"#0D288C", path:"M205.7,552.8 L186.1,527.3 L116.3,580.9 L135.9,606.4 Z", cx:161, cy:566.9, label:"31", angle:-45, fs:19.3 },
  { zone:"SKY", fill:"#0D288C", path:"M1022.4,524 L1007.2,543.8 L1077,597.5 L1092.2,577.6 Z", cx:1049.7, cy:560.7, label:"1", angle:45, fs:15 },
  { zone:"SKY", fill:"#0D288C", path:"M1006.2,545.1 L991,564.9 L1060.8,618.5 L1076,598.7 Z", cx:1033.5, cy:581.8, label:"2", angle:45, fs:15 },
  { zone:"SKY", fill:"#0D288C", path:"M990,566.2 L974.8,586 L1044.6,639.6 L1059.8,619.8 Z", cx:1017.3, cy:602.9, label:"3", angle:45, fs:15 },
  { zone:"SKY", fill:"#0D288C", path:"M973.8,587.3 L958.6,607.1 L1028.4,660.7 L1043.6,640.9 Z", cx:1001.1, cy:624, label:"4", angle:45, fs:15 },
  { zone:"SKY", fill:"#0D288C", path:"M957.6,608.3 L942.4,628.1 L1012.2,681.8 L1027.4,662 Z", cx:984.9, cy:645.1, label:"5", angle:45, fs:15 },
  { zone:"SKY", fill:"#0D288C", path:"M941.4,629.4 L926.2,649.2 L996,702.8 L1011.2,683 Z", cx:968.7, cy:666.1, label:"6", angle:45, fs:15 },
  { zone:"SKY", fill:"#0D288C", path:"M925.2,650.5 L910,670.3 L979.8,723.9 L995,704.1 Z", cx:952.5, cy:687.2, label:"7", angle:45, fs:15 },
  { zone:"SKY", fill:"#0D288C", path:"M909,671.6 L893.8,691.4 L963.6,745 L978.8,725.2 Z", cx:936.3, cy:708.3, label:"8", angle:45, fs:15 },
  { zone:"SKY", fill:"#0D288C", path:"M892.8,692.6 L877.6,712.5 L947.4,766.1 L962.6,746.3 Z", cx:920.1, cy:729.4, label:"9", angle:45, fs:15 },
  { zone:"C", fill:"#C6D45B", path:"M552,778 L586,778 L579.3,822 L532,822 Z", cx:562.3, cy:800, label:"3", fs:18, plain:true },
  { zone:"C", fill:"#C6D45B", path:"M586,778 L620,778 L626.7,822 L579.3,822 Z", cx:603, cy:800, label:"2", fs:18, plain:true },
  { zone:"C", fill:"#C6D45B", path:"M620,778 L654,778 L674,822 L626.7,822 Z", cx:643.7, cy:800, label:"1", fs:18, plain:true },
  { zone:"C", fill:"#EFC24F", path:"M532,822 L579.3,822 L564.7,950 L486,950 Z", cx:540.5, cy:886, label:"3", fs:24, plain:true },
  { zone:"C", fill:"#EFC24F", path:"M579.3,822 L626.7,822 L643.3,950 L564.7,950 Z", cx:603.5, cy:886, label:"2", fs:24, plain:true },
  { zone:"C", fill:"#EFC24F", path:"M626.7,822 L674,822 L722,950 L643.3,950 Z", cx:666.5, cy:886, label:"1", fs:24, plain:true },
  { zone:"C", fill:"#A32C87", path:"M500,988 L602,988 L602,954 L500,954 Z", cx:551, cy:971, label:"VIP", fs:20, plain:true },
  { zone:"C", fill:"#A32C87", path:"M606,988 L708,988 L708,954 L606,954 Z", cx:657, cy:971, label:"VIP", fs:20, plain:true },
  { zone:"SKY", fill:"#0D288C", path:"M470,992 L523.2,992 L517.2,1030 L460,1030 Z", cx:492.6, cy:1011, label:"14", fs:20, plain:true },
  { zone:"SKY", fill:"#0D288C", path:"M523.2,992 L576.4,992 L574.4,1030 L517.2,1030 Z", cx:547.8, cy:1011, label:"13", fs:20, plain:true },
  { zone:"SKY", fill:"#0D288C", path:"M576.4,992 L629.6,992 L631.6,1030 L574.4,1030 Z", cx:603, cy:1011, label:"12", fs:20, plain:true },
  { zone:"SKY", fill:"#0D288C", path:"M629.6,992 L682.8,992 L688.8,1030 L631.6,1030 Z", cx:658.2, cy:1011, label:"11", fs:20, plain:true },
  { zone:"SKY", fill:"#0D288C", path:"M682.8,992 L736,992 L746,1030 L688.8,1030 Z", cx:713.4, cy:1011, label:"10", fs:20, plain:true },
  { zone:"SKY", fill:"#F2A93B", path:"M518,1054 L688,1054 L688,1032 L518,1032 Z", cx:603, cy:1047, label:"SKY박스", fs:12, plain:true },
  { zone:"OF", fill:"#2E6B34", path:"M1030,410 L1062,410 L1062,700 L1030,700 Z", cx:1046, cy:555, label:"잔디그린존", angle:90, fs:18, plain:true },
  { zone:"OF", fill:"#8DBB5A", path:"M1066,410 L1090,410 L1090,700 L1066,700 Z", cx:1078, cy:555, label:"캠핑존", angle:90, fs:13, plain:true },
];

export interface Label {
  x: number;
  y: number;
  text: string;
  size: number;
  fill: string;
  weight?: number;
  angle?: number;
  zone?: string;
}

export const LABELS: Label[] = [
  { x:452, y:468, text:"3루", size:30, fill:"#FFFFFF", weight:800, zone:"BZ" },
  { x:452, y:502, text:"(HOME)", size:23, fill:"#FFFFFF", weight:800, zone:"BZ" },
  { x:744, y:468, text:"1루", size:30, fill:"#FFFFFF", weight:800, zone:"I1" },
  { x:744, y:502, text:"(AWAY)", size:23, fill:"#FFFFFF", weight:800, zone:"I1" },
  { x:452, y:742, text:"DUGOUT", size:14, fill:"#AEB9C6", weight:800, angle:-45 },
  { x:752, y:742, text:"DUGOUT", size:14, fill:"#AEB9C6", weight:800, angle:45 },
  { x:372, y:546, text:"BULLPEN", size:13, fill:"#AEB9C6", weight:800, angle:-45 },
  { x:836, y:546, text:"BULLPEN", size:13, fill:"#AEB9C6", weight:800, angle:45 },
  { x:452, y:782, text:"테이블석", size:14, fill:"#F6DFD5", weight:800, angle:-45, zone:"T3" },
  { x:676, y:782, text:"테이블석", size:14, fill:"#F6DFD5", weight:800, angle:45, zone:"T1" },
  { x:430, y:692, text:"블루존", size:16, fill:"#DCE8F6", weight:800, angle:-45, zone:"BZ" },
  { x:736, y:676, text:"원정응원석", size:12, fill:"#DCE8F6", weight:800, angle:45, zone:"I1" },
  { x:408, y:604, text:"익사이팅석", size:10, fill:"#6E3244", weight:800, angle:-45, zone:"BZ" },
  { x:760, y:626, text:"익사이팅석", size:10, fill:"#6E3244", weight:800, angle:45, zone:"I1" },
  { x:340, y:516, text:"내야지정석", size:14, fill:"#D9CCEC", weight:800, angle:-45, zone:"BZ" },
  { x:852, y:536, text:"1·3루지정석", size:11, fill:"#D9CCEC", weight:800, angle:45, zone:"I1" },
  { x:603, y:846, text:"중앙테이블석", size:14, fill:"#7A5A0E", weight:800, zone:"C" },
  { x:276, y:288, text:"외야패밀리석", size:13, fill:"#5D5516", weight:800, angle:-45, zone:"OF" },
  { x:952, y:236, text:"외야테이블", size:12, fill:"#5D5516", weight:800, angle:45, zone:"OF" },
  { x:706, y:300, text:"외야루프탑", size:10, fill:"#F3D2CC", weight:800, angle:45, zone:"OF" },
  { x:250, y:434, text:"파티플로어석", size:10, fill:"#F0E2CE", weight:800, angle:-45, zone:"SB" },
  { x:196, y:600, text:"SKY자유석", size:14, fill:"#C9D4F2", weight:800, angle:-90, zone:"SKY" },
  { x:872, y:700, text:"SKY지정석", size:13, fill:"#C9D4F2", weight:800, angle:45, zone:"SKY" },
  { x:330, y:762, text:"SKY지정석", size:13, fill:"#C9D4F2", weight:800, angle:-45, zone:"SKY" },
];

export interface Gate {
  x: number;
  y: number;
  text: string;
  sub: string;
}

export const GATES: Gate[] = [
  { x:740, y:52, text:"GATE 2", sub:"외야 출입구" },
  { x:218, y:928, text:"GATE 21", sub:"3루 출입구" },
  { x:986, y:928, text:"GATE 1", sub:"1루 출입구" },
];

export const OUTER_WALL = "M373.9,38.9 L531,64 L675,64 L823.5,47.2 L1048.5,281.2 L1110.9,586.1 L871.9,897.1 L661,1053 L545,1053 L334.1,897.1 L95.1,586.1 L148.9,272.9 Z";
export const CONCOURSE = "M386.8,51.4 L531,80 L675,80 L809.1,61.1 L1034.1,295.1 L1095.1,573.9 L856.1,884.9 L661,1035 L545,1035 L349.9,884.9 L110.9,573.9 L161.8,285.4 Z";

export const FIELD = {
  track: "M531,190 L675,190 L900,424 L661,735 L545,735 L306,424 Z",
  grass: "M549,207.3 L531,215 L675,215 L657,207.3 L882,441.3 L880.2,408.8 L641.2,719.8 L661,710 L545,710 L564.8,719.8 L325.8,408.8 L324,441.3 Z",
  infieldBand: "M603,726 L486,650 L486,602 A117,117 0 0 1 720,602 L720,650 L603,726",
  mound: { x: 603, y: 552, r: 26 } as const,
  homePlate: "M594,722 h18 v-8 l-9,-7 l-9,7 Z",
  bases: [[519,642],[603,574],[687,642]] as Pt[],
};

/** 도면 중심축 (잔디 스트라이프) */
export const CENTER_X = 603;
