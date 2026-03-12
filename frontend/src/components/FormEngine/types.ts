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

export interface BaseField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Nome da propriedade no objeto final */
  name: keyof TValues & string;

  /** Label exibido no formulário */
  label: string;

  /** Tipo do campo */
  type: FieldType;

  /** Campo desabilitado */
  disabled?: boolean;

  /** Valor padrão (usado quando não há initialValues) */
  defaultValue?: unknown;

  /** Campo obrigatório */
  required?: boolean;

  /** Campo obrigatório condicional */
  requiredWhen?: (values: TValues) => boolean;

  /** Texto auxiliar (hint, help, description) */
  helperText?: string;

  /** Controla visibilidade do campo em função dos valores atuais */
  visibleWhen?: (values: TValues) => boolean;

  /** Oculta o campo em função dos valores atuais (tem precedência sobre visibleWhen) */
  hiddenWhen?: (values: TValues) => boolean;
}

/* ======================================================
 * SIMPLE INPUTS (text, number, money)
 * ====================================================== */

export interface TextField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<TValues> {
  type: "text" | "password" | "number" | "money" | "cpf" | "email" | "phone" | "url";
  placeholder?: string;
}

export interface DateField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<TValues> {
  type: "date";
}

export interface DateRangeField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<TValues> {
  type: "date_range";
  startPlaceholder?: string;
  endPlaceholder?: string;
}

export interface NumberRangeField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<TValues> {
  type: "number_range" | "currency_range";
  minPlaceholder?: string;
  maxPlaceholder?: string;
}

export interface TextareaField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<TValues> {
  type: "textarea";
  placeholder?: string;
  rows?: number;
}

export interface FileField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<TValues> {
  type: "file";
  accept?: string;
  multiple?: boolean;
}

export interface ImageField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<TValues> {
  type: "image";
  accept?: string;
}

export interface ColorField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<TValues> {
  type: "color";
}

/* ======================================================
 * BOOLEAN (checkbox / switch)
 * ====================================================== */

export interface BooleanField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<TValues> {
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

export interface SelectField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<TValues> {
  type: "select" | "multiselect";
  options: ReadonlyArray<SelectOption>;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export interface TagsField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<TValues> {
  type: "tags";
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
}

/* ======================================================
 * RICHTEXT
 * ====================================================== */

export interface RichTextField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<TValues> {
  type: "richtext";
}

/* ======================================================
 * FORM FIELD UNION (CORE)
 * ====================================================== */

export type FormField<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> =
  | TextField<TValues>
  | BooleanField<TValues>
  | SelectField<TValues>
  | TagsField<TValues>
  | RichTextField<TValues>
  | DateField<TValues>
  | DateRangeField<TValues>
  | NumberRangeField<TValues>
  | TextareaField<TValues>
  | FileField<TValues>
  | ImageField<TValues>
  | ColorField<TValues>;

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

export interface FormEngineProps<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> {
  id?: string;
  appearance?: "default" | "inline-detail";

  /** Lista de campos do formulário */
  fields: ReadonlyArray<FormField<TValues>>;

  /** Steps opcionais */
  steps?: ReadonlyArray<FormStep>;

  /** Valores iniciais (modo edição) */
  initialValues?: Partial<TValues>;

  /** Callback de submit */
  onSubmit: (values: TValues) => void;

  /**
   * Permite derivar/atualizar campos automaticamente quando um campo muda.
   * Retorne um patch (Partial<T>) para mesclar ao próximo estado.
   */
  onFieldChange?: (params: {
    name: keyof TValues & string;
    value: unknown;
    prevValues: TValues;
    nextValues: TValues;
  }) => Partial<TValues> | void;

  onFieldCommit?: (params: {
    name: keyof TValues & string;
    value: unknown;
    values: TValues;
  }) => void;

  /** Renderização customizada de botões */
  /** Callback a cada mudança de valores */
  onValuesChange?: (values: TValues) => void;

  renderFooter?: ReactNode;

  /** Desabilita todo o formulário */
  disabled?: boolean;

  actions?: FormActions;
}
