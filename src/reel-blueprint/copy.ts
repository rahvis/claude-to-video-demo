import { useLang } from "../reel/Film";

// Every word on screen in "Blueprint", in English and Korean. Nothing here repeats the narration (reel-lint +
// seeker-echo.py). The stat is the research table's: 40% of US job seekers added skills or keywords they don't
// have (Greenhouse, 2026 Future of Hiring Candidate Report, 2026-10-20). Auto Apply facts follow the built feature
// (tahoe-frontend autoapply/): rewords and reorders the resume per job and never adds anything; fills the form on
// the employer's own site and shows where each answer came from; "Review each" before sending; one application per
// company every 30 days; a receipt with screenshots.
export const STAT = {
  value: 40,
  source: { en: "Greenhouse, Oct 2026", ko: "Greenhouse, 2026년 10월" },
};

const COPY = {
  en: {
    title: "Auto-apply",
    sheet: "How it works",
    statLabel: ["padded a resume with skills", "or keywords that aren't theirs"],
    step1: "Reorders and rewords",
    step1b: "Adds nothing",
    fake: "+ skill you never used",
    step2: "Employer's site, answers sourced",
    fields: ["Full name", "Work history", "Portfolio", "Start date"],
    srcs: ["Profile", "Resume, p.1", "Profile", "Your answer"],
    step3: "Your approval",
    approve: "Approve",
    step4: "1 per company / 30 days",
    receipt: "Receipt",
    screens: "3 screenshots",
    end: "You approve every application.",
  },
  ko: {
    title: "자동 지원",
    sheet: "작동 방식",
    statLabel: ["자기 것이 아닌 기술이나 키워드로", "이력서를 부풀린 비율"],
    step1: "순서를 바꾸고 표현을 다듬음",
    step1b: "새로 더하는 내용 없음",
    fake: "+ 써 본 적 없는 기술",
    step2: "고용주 사이트, 답마다 출처",
    fields: ["이름", "경력 사항", "포트폴리오", "입사 가능일"],
    srcs: ["프로필", "이력서 1쪽", "프로필", "직접 입력"],
    step3: "직접 승인",
    approve: "승인",
    step4: "회사당 30일에 1번",
    receipt: "제출 기록",
    screens: "스크린샷 3장",
    end: "모든 지원서는 직접 승인한 뒤에 나갑니다.",
  },
};

export const useCopy = () => COPY[useLang()];
