import { useLang } from "../reel/Film";

// Every word on screen in "Front Page", in English and Korean. Nothing here repeats the narration
// (scripts/reel-lint.mjs + seeker-echo.py check that). The stat is the research table's (reel-lint checks it):
// about 1 in 5 (19%) of jobs advertised on digital job boards in Q2 2026 were ghost jobs, i.e. received at least one
// application and led to no hiring activity. Greenhouse data, reported by The Wall Street Journal (Lauren Weber,
// "'Ghost Job' Ads Are Getting So Bad That Lawmakers Want to Ban Them", 2026-08-21).
export const STAT = {
  value: 19,
  source: { en: "Greenhouse data, The Wall Street Journal, Aug 2026", ko: "Greenhouse 데이터, 월스트리트저널, 2026년 8월" },
};

const COPY = {
  en: {
    masthead: "The Daily Listing",
    headline: ["Where did your", "application go?"],
    adTitle: "Marketing Coordinator",
    adMeta: "Juniper Row · Denver, CO",
    applied: "Applied",
    classifieds: "Classifieds",
    statLabel: ["of job board listings in Q2", "never led to a single hire"],
    boards: "Job boards",
    careers: "Careers",
    sitesLabel: "company career sites",
    rows: ["Brand Designer", "Account Manager", "Data Analyst"],
    checked: "Checked today",
    closed: "Closed",
    roles: "open roles",
    from: "from company career sites",
    trial: "Try it free for 7 days",
  },
  ko: {
    masthead: "일간 채용",
    headline: ["내 지원서는", "어디로 갔을까?"],
    adTitle: "마케팅 코디네이터",
    adMeta: "Juniper Row · 미국 덴버",
    applied: "지원 완료",
    classifieds: "구인 광고",
    statLabel: ["2분기 구인 사이트 공고 중", "채용이 한 명도 없었던 비율"],
    boards: "구인 사이트",
    careers: "채용",
    sitesLabel: "기업 채용 사이트",
    rows: ["브랜드 디자이너", "어카운트 매니저", "데이터 분석가"],
    checked: "오늘 확인함",
    closed: "마감",
    roles: "채용 공고",
    from: "기업 채용 사이트에서 직접",
    trial: "7일 무료 체험",
  },
};

export const useCopy = () => COPY[useLang()];
