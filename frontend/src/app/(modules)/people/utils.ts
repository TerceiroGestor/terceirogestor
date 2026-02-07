export {
  formatDate,
  getAgeFromBirthDate,
  getInitials,
  isBirthdayInCurrentMonth,
  isBirthdayToday,
  resolveLabel,
  toDateInputValue,
} from "./people.helpers";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export {
  GENDER_LABELS,
  RACE_COLOR_LABELS,
  SEX_LABELS,
} from "./people.constants";
