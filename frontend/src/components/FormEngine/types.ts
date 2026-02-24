import type { ComponentType, ReactNode } from "react";

/* ======================================================
 * FIELD TYPES
 * ====================================================== */


export type FieldType =
  | "text"
  | "password"
  | "email"
  | "phone"
  | "number"
  | "money"
  | "number_range"
  | "currency_range"
  | "cpf"
  | "boolean"
  | "select"
  | "multiselect"
  | "tags"
  | "richtext"
  | "textarea"
  | "date"
  | "date_range"
  | "file"
  | "image"
  | "color"
  | "url";

/* ======================================================
 * BASE FIELD
 * ====================================================== */

export interface BaseField<T = any> {
  /** Nome da propriedade no objeto final */
  name: keyof T & string;

  /** Label exibido no formulário */
  label: string;

  /** Tipo do campo */
  type: FieldType;

  /** Campo desabilitado */
  disabled?: boolean;

  /** Valor padrão (usado quando não há initialValues) */
  defaultValue?: any;

  /** Campo obrigatório */
  required?: boolean;

  /** Campo obrigatório condicional */
  requiredWhen?: (values: T) => boolean;

  /** Texto auxiliar (hint, help, description) */
  helperText?: string;

  /** Controla visibilidade do campo em função dos valores atuais */
  visibleWhen?: (values: T) => boolean;

  /** Oculta o campo em função dos valores atuais (tem precedência sobre visibleWhen) */
  hiddenWhen?: (values: T) => boolean;
}

/* ======================================================
 * SIMPLE INPUTS (text, number, money)
 * ====================================================== */

export interface TextField<T = any> extends BaseField<T> {
  type: "text" | "password" | "number" | "money" | "cpf" | "email" | "phone" | "url";
  placeholder?: string;
}

export interface DateField<T = any> extends BaseField<T> {
  type: "date";
}

export interface DateRangeField<T = any> extends BaseField<T> {
  type: "date_range";
  startPlaceholder?: string;
  endPlaceholder?: string;
}

export interface NumberRangeField<T = any> extends BaseField<T> {
  type: "number_range" | "currency_range";
  minPlaceholder?: string;
  maxPlaceholder?: string;
}

export interface TextareaField<T = any> extends BaseField<T> {
  type: "textarea";
  placeholder?: string;
  rows?: number;
}

export interface FileField<T = any> extends BaseField<T> {
  type: "file";
  accept?: string;
  multiple?: boolean;
}

export interface ImageField<T = any> extends BaseField<T> {
  type: "image";
  accept?: string;
}

export interface ColorField<T = any> extends BaseField<T> {
  type: "color";
}

/* ======================================================
 * BOOLEAN (checkbox / switch)
 * ====================================================== */

export interface BooleanField<T = any> extends BaseField<T> {
  type: "boolean";
  persistAs?: "boolean" | "number";
}

/* ======================================================
 * SELECT / MULTISELECT
 * ====================================================== */

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectField<T = any> extends BaseField<T> {
  type: "select" | "multiselect";
  options: ReadonlyArray<SelectOption>;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export interface TagsField<T = any> extends BaseField<T> {
  type: "tags";
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
}

/* ======================================================
 * RICHTEXT
 * ====================================================== */

export interface RichTextField<T = any> extends BaseField<T> {
  type: "richtext";
}

/* ======================================================
 * FORM FIELD UNION (CORE)
 * ====================================================== */

export type FormField<T = any> =
  | TextField<T>
  | BooleanField<T>
  | SelectField<T>
  | TagsField<T>
  | RichTextField<T>
  | DateField<T>
  | DateRangeField<T>
  | NumberRangeField<T>
  | TextareaField<T>
  | FileField<T>
  | ImageField<T>
  | ColorField<T>;

/* ======================================================
 * FORM STEPS
 * ====================================================== */

export interface FormStep {
  /** Título do step */
  title: string;

  /** Campos que pertencem ao step (por name) */
  fields: ReadonlyArray<string>;

  /** Ícone opcional (contextual) */
  icon?: ComponentType<{ className?: string }>;

  /** Conteúdo opcional (descrição, aviso, etc.) */
  description?: ReactNode;
}

/* ======================================================
 * FORM ENGINE PROPS
 * ====================================================== */

export type FormAction = {
  label?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export type FormActions = {
  submit?: FormAction;
  cancel?: FormAction;
};

export interface FormEngineProps<T = any> {
  id?: string;

  /** Lista de campos do formulário */
  fields: ReadonlyArray<FormField<T>>;

  /** Steps opcionais */
  steps?: ReadonlyArray<FormStep>;

  /** Valores iniciais (modo edição) */
  initialValues?: Partial<T>;

  /** Callback de submit */
  onSubmit: (values: T) => void;

  /**
   * Permite derivar/atualizar campos automaticamente quando um campo muda.
   * Retorne um patch (Partial<T>) para mesclar ao próximo estado.
   */
  onFieldChange?: (params: {
    name: keyof T & string;
    value: unknown;
    prevValues: T;
    nextValues: T;
  }) => Partial<T> | void;

  /** Renderização customizada de botões */
  /** Callback a cada mudança de valores */
  onValuesChange?: (values: T) => void;

  renderFooter?: ReactNode;

  /** Desabilita todo o formulário */
  disabled?: boolean;

  actions?: FormActions;
}
