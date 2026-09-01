import type { Q1Answer, ExperienceAnswer } from "@/lib/domain/types";

/** 진단 문항 정의 (design §6.2 / AC-1.3, AC-1.4) */

export interface Q1Option {
  value: Q1Answer;
  label: string;
}
export interface ExpOption {
  value: ExperienceAnswer;
  label: string;
}

export const Q1_QUESTION = "Claude로 주로 어떤 일을 하시나요?";
export const Q1_OPTIONS: Q1Option[] = [
  { value: "writing", label: "글쓰기·자료조사" },
  { value: "documents", label: "문서·데이터 작업" },
  { value: "coding", label: "코딩" },
  { value: "automation", label: "업무 자동화" },
];

export const EXP_OPTIONS: ExpOption[] = [
  { value: "built", label: "만들어봤다" },
  { value: "heard", label: "들어는 봤다" },
  { value: "unknown", label: "모른다" },
];

export const EXP_QUESTIONS: { key: "q2" | "q3" | "q4" | "q5"; question: string }[] = [
  { key: "q2", question: "Artifact를 만들어본 적 있나요?" },
  { key: "q3", question: "Skill을 만들거나 설치해본 적 있나요?" },
  { key: "q4", question: "Cowork나 Claude Code로 내 파일을 다뤄본 적 있나요?" },
  { key: "q5", question: "MCP·커넥터로 외부 서비스를 연결해본 적 있나요?" },
];

export const TOTAL_QUESTIONS = 5;
