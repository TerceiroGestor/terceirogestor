import type { FormField, FormStep } from "@/components/FormEngine/types";
import type { FamilyMemberFormData } from "@/features/family-members/domain/types";

export const familyMemberFormFields: FormField<FamilyMemberFormData>[] = [
  { name: "name", label: "Nome", type: "text" },
  { name: "relationship", label: "Parentesco", type: "text" },
  { name: "livesTogether", label: "Mora junto", type: "boolean" },
  { name: "contributesIncome", label: "Compõe renda", type: "boolean" },
  { name: "income", label: "Renda", type: "money" },
  { name: "notes", label: "Observacoes", type: "textarea" },
];

export const familyMemberFormSteps: FormStep[] = [
  {
    title: "Familiar",
    fields: [
      "name",
      "relationship",
      "livesTogether",
      "contributesIncome",
      "income",
      "notes",
    ],
  },
];
