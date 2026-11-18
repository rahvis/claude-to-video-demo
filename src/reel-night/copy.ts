import { useLang } from "../reel/Film";

// Every word on screen in "Night Shift", in English and Korean. Nothing here repeats the narration (reel-lint +
// seeker-echo.py). The stat is the research table's: median duration of unemployment 11.9 weeks in October 2026
// (US Bureau of Labor Statistics, The Employment Situation, Table A-12, released 2026-11-06). Auto Apply strings
// follow the built feature: each morning it picks from your matches and fills them in; "Ready for review" until you
// send or skip.
export const STAT = {
  value: 11.9,
  source: { en: "US Bureau of Labor Statistics, Oct 2026", ko: "미국 노동통계국, 2026년 10월" },
};

const COPY = {
  en: {
    time: "11:48 PM",
    sentToday: "sent tonight",
    week: "Week",
    weeks: "weeks",
    statLabel: "median time out of work",
    jobs: [
      { title: "Product Designer", meta: "Harbor Finch · Remote" },
      { title: "UX Designer", meta: "Cedarline · Denver, CO" },
      { title: "Design Lead", meta: "Saltmarsh · Austin, TX" },
    ],
    strong: "Strong match",
    filled: "Filled in",
    ready: "Ready for review",
    send: "Send",
    skip: "Skip",
    sent: "Sent",
    morning: "7:05 AM",
    end: "Nothing goes out without your OK.",
  },
  ko: {
    time: "오후 11:48",
    sentToday: "오늘 밤 보낸 지원서",
    week: "주차",
    weeks: "주",
    statLabel: "실직 상태의 중간 기간",
    jobs: [
      { title: "프로덕트 디자이너", meta: "Harbor Finch · 원격" },
      { title: "UX 디자이너", meta: "Cedarline · 미국 덴버" },
      { title: "디자인 리드", meta: "Saltmarsh · 미국 오스틴" },
    ],
    strong: "아주 잘 맞음",
    filled: "작성 완료",
    ready: "검토 대기",
    send: "보내기",
    skip: "건너뛰기",
    sent: "보냄",
    morning: "오전 7:05",
    end: "확인하지 않은 지원서는 보내지 않아요.",
  },
};

export const useCopy = () => COPY[useLang()];
