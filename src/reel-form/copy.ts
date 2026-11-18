import { useLang } from "../reel/Film";

// Every word on screen in "The Form", in English and Korean. Nothing here repeats the narration (reel-lint +
// seeker-echo.py). The stat is the research table's: job seekers sent 62.6 applications on average, about 44 minutes
// each, 46.2 hours in all (United Way of the National Capital Area survey of 1,000 US job seekers, 2026-05-05).
// Auto Apply strings follow the built feature (tahoe-frontend autoapply/): answers show where they came from,
// "Needs you" for a question it can't answer, "Ready for review" before anything is sent.
export const STAT = {
  minutes: 44,
  apps: 62.6,
  hours: 46,
  source: { en: "United Way NCA survey, May 2026", ko: "United Way NCA 설문, 2026년 5월" },
};

const COPY = {
  en: {
    upload: "Upload resume",
    file: "resume.pdf",
    history: "Work history",
    required: "Required",
    fields: [
      { label: "First name", value: "Sam" },
      { label: "Last name", value: "Rivera" },
      { label: "Email", value: "sam.rivera@email.com" },
      { label: "Employer 1", value: "Cedarline, 2021 to now" },
      { label: "Employer 2", value: "Brightarc, 2018 to 2021" },
      { label: "Employer 3", value: "Harbor Finch, 2016 to 2018" },
    ],
    per: "min per application",
    times: "applications",
    total: "hours",
    company: "Juniper Row · Careers",
    autoApply: "Auto-apply",
    fromResume: "From your resume",
    fromProfile: "From your profile",
    question: "Why do you want to work here?",
    needsYou: "Needs you",
    ready: "Ready for review",
    send: "Send",
    sent: "Sent",
    end: "You review every application before it goes.",
  },
  ko: {
    upload: "이력서 업로드",
    file: "resume.pdf",
    history: "경력 사항",
    required: "필수",
    fields: [
      { label: "이름", value: "Sam" },
      { label: "성", value: "Rivera" },
      { label: "이메일", value: "sam.rivera@email.com" },
      { label: "회사 1", value: "Cedarline, 2021년부터 현재" },
      { label: "회사 2", value: "Brightarc, 2018년~2021년" },
      { label: "회사 3", value: "Harbor Finch, 2016년~2018년" },
    ],
    per: "분, 지원서 1건당",
    times: "건 지원",
    total: "시간",
    company: "Juniper Row · 채용",
    autoApply: "자동 지원",
    fromResume: "이력서에서 가져옴",
    fromProfile: "프로필에서 가져옴",
    question: "이 회사에 지원한 이유는 무엇인가요?",
    needsYou: "확인 필요",
    ready: "검토 대기",
    send: "보내기",
    sent: "보냄",
    end: "보내기 전에 지원서를 하나하나 직접 검토합니다.",
  },
};

export const useCopy = () => COPY[useLang()];
