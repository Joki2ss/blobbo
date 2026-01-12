import { PRO_TEMPLATES, type ProTemplateResult } from "../config/proTemplates";

export type ProOnboardingAnswers = {
  activityType: string;
  contactStyle: string;
  publishFrequency: string;
  teamSize: string;
};

function normKey(v: any) {
  return String(v || "").trim().toUpperCase();
}

export function resolveProTemplate(answers: ProOnboardingAnswers): ProTemplateResult {
  const key = normKey(answers?.activityType);
  return PRO_TEMPLATES[key] || PRO_TEMPLATES.OTHER;
}
