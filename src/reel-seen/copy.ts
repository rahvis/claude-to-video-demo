import { useLang } from "../reel/Film";

// Every word on screen in "Seen", in English and Korean. Lines are pre-broken (the chat bubbles size from them).
// Nothing here repeats the narration (reel-lint + seeker-echo.py). The stat is the research table's: 81% of US
// candidates were rejected in the past year without speaking to anyone at the company, human or AI (Greenhouse,
// 2026 Future of Hiring Candidate Report, 2026-10-20).
export const STAT = {
  value: 81,
  source: { en: "Greenhouse, Oct 2026", ko: "Greenhouse, 2026년 10월" },
};

const COPY = {
  en: {
    company: "Juniper Row Recruiting",
    active: "Active 3 weeks ago",
    m1: ["Hi! I just sent my application", "for the Product Designer role."],
    m2: ["Following up in case my", "portfolio link got lost."],
    m3: ["test"],
    delivered: "Delivered",
    day1: "Tue 9:41 AM",
    day2: "Fri 4:12 PM",
    day3: "2 weeks later",
    message: "Message",
    statLabel: ["of US candidates were rejected", "without speaking to anyone", "at the company"],
    tahoe: "Tahoe",
    online: "Your matches",
    t1: ["3 new matches today"],
    job: "Product Designer",
    jobMeta: "Harbor Finch · Remote",
    strong: "Strong match",
    whyTitle: "Why it fits",
    why: ["You led 3 design system launches", "$135K meets your pay floor", "Remote, as you asked"],
    more: [
      { job: "UX Designer", meta: "Cedarline · Denver, CO" },
      { job: "Product Designer II", meta: "Brightarc · Austin, TX" },
    ],
    good: "Good match",
    trial: "Try it free for 7 days",
  },
  ko: {
    company: "Juniper Row 채용팀",
    active: "3주 전 활동",
    m1: ["안녕하세요! 프로덕트 디자이너", "포지션에 지원서를 보냈습니다."],
    m2: ["혹시 포트폴리오 링크가", "누락됐을까 해서 연락드려요."],
    m3: ["테스트"],
    delivered: "전송됨",
    day1: "화 오전 9:41",
    day2: "금 오후 4:12",
    day3: "2주 후",
    message: "메시지",
    statLabel: ["미국 지원자가 회사의 누구와도", "이야기하지 못한 채", "탈락한 비율"],
    tahoe: "Tahoe",
    online: "추천 공고",
    t1: ["오늘의 새 추천 공고 3건"],
    job: "프로덕트 디자이너",
    jobMeta: "Harbor Finch · 원격",
    strong: "아주 잘 맞음",
    whyTitle: "잘 맞는 이유",
    why: ["디자인 시스템 출시 3회 주도", "연봉 $135K, 희망 하한 충족", "원하신 대로 원격 근무"],
    more: [
      { job: "UX 디자이너", meta: "Cedarline · 미국 덴버" },
      { job: "프로덕트 디자이너 II", meta: "Brightarc · 미국 오스틴" },
    ],
    good: "잘 맞음",
    trial: "7일 무료 체험",
  },
};

export const useCopy = () => COPY[useLang()];
