import { useLang } from "../reel/Film";

// Every word on screen in "Say It Plainly", in English and Korean. Nothing here repeats the narration (reel-lint +
// seeker-echo.py). Numbers are Tahoe's own (reel-lint checks them): 5M+ open roles (the owner's figure on the
// job-seeker page) and 220K+ career sites (the page's live count). "We understood" is the search screen's own label
// for the chips it reads from a plain-English query (tahoe-frontend search/Filters.tsx).
export const NUM = { roles: "5M+", sites: "220K+", rolesKo: "500만+" };

const COPY = {
  en: {
    filters: [
      "Job type", "Location", "Salary", "Experience", "Industry", "Company size", "Remote", "Date posted", "Benefits", "Education",
      "Schedule", "Seniority", "Department", "Travel", "Commute", "Shift", "Language", "Team", "Clearance", "Contract",
    ],
    query: ["product design, remote", "or Austin, at least 120K"],
    understood: "We understood",
    chips: ["Product design", "Remote or Austin, TX", "$120K+"],
    results: [
      { title: "Product Designer", meta: "Harbor Finch · Remote" },
      { title: "Senior Product Designer", meta: "Lumen & Pine · Austin, TX" },
      { title: "Product Designer, Growth", meta: "Brightarc · Remote" },
    ],
    rolesLabel: "jobs, open now",
    sitesLabel: "employer career sites",
    trial: "Try it free for 7 days",
  },
  ko: {
    filters: [
      "고용 형태", "지역", "연봉", "경력", "업종", "회사 규모", "원격", "게시일", "복지", "학력",
      "근무 시간", "직급", "부서", "출장", "통근", "교대", "언어", "학위", "자격증", "계약",
    ],
    query: ["프로덕트 디자인, 원격이나", "오스틴, 연봉 $120K 이상"],
    understood: "이해한 내용",
    chips: ["프로덕트 디자인", "원격 또는 미국 오스틴", "$120K+"],
    results: [
      { title: "프로덕트 디자이너", meta: "Harbor Finch · 원격" },
      { title: "시니어 프로덕트 디자이너", meta: "Lumen & Pine · 미국 오스틴" },
      { title: "프로덕트 디자이너, 그로스", meta: "Brightarc · 원격" },
    ],
    rolesLabel: "지금 열려 있는 공고",
    sitesLabel: "고용주 채용 사이트",
    trial: "7일 무료 체험",
  },
};

export const useCopy = () => COPY[useLang()];
