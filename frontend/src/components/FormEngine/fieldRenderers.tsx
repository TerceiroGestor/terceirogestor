import React from "react";
import { FormField } from "./types";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RichText } from "@/components/ui/richtext/RichText";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";

interface FieldRendererProps<T = any> {
  field: FormField<T>;
  value: any;
  disabled?: boolean;
  required?: boolean;
  onChange: (value: any) => void;
}

function normalizeChange(onChange: (value: any) => void) {
  return (arg: any) => {
    // Caso seja evento do React
    if (arg && arg.target) {
      onChange(arg.target.value);
      return;
    }

    // Caso ja seja valor
    onChange(arg);
  };
}

function parseNumberValue(value: string) {
  if (value === "") return "";
  const parsed = Number(value);
  return Number.isNaN(parsed) ? "" : parsed;
}

function toDateInputValue(value: unknown) {
  if (!value) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value);
}

export function FieldRenderer<T>({
  field,
  value,
  disabled,
  required = false,
  onChange,
}: FieldRendererProps<T>) {
  const isDisabled = disabled || field.disabled;
  const handleChange = normalizeChange(onChange);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (field.type !== "image") return undefined;

    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }

    if (typeof value === "string" && value.length > 0) {
      setImagePreview(value);
      return undefined;
    }

    setImagePreview(null);
    return undefined;
  }, [field.type, value]);

  const renderHelperText = () =>
    field.helperText ? (
      <p className="text-muted-foreground text-xs">{field.helperText}</p>
    ) : null;

  const renderLabeledField = (content: React.ReactNode) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {field.label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {content}
      {renderHelperText()}
    </div>
  );

  switch (field.type) {
    case "text":
    case "email":
    case "phone":
    case "url":
    case "number":
      return renderLabeledField(
        <Input
          type={
            field.type === "number"
              ? "number"
              : field.type === "email"
                ? "email"
                : field.type === "phone"
                  ? "tel"
                  : field.type === "url"
                    ? "url"
                    : "text"
          }
          value={value ?? ""}
          placeholder={"placeholder" in field ? field.placeholder : undefined}
          disabled={isDisabled}
          onChange={(event) => {
            const raw = event.target.value;
            if (field.type === "number") {
              onChange(parseNumberValue(raw));
              return;
            }
            handleChange(event);
          }}
        />
      );

    case "money":
      return renderLabeledField(
        <Input
          type="text"
          inputMode="decimal"
          value={value ?? ""}
          disabled={isDisabled}
          onChange={(event) => onChange(parseNumberValue(event.target.value))}
        />
      );

    case "cpf":
      return renderLabeledField(
        <Input
          type="text"
          inputMode="numeric"
          value={value ?? ""}
          disabled={isDisabled}
          onChange={handleChange}
        />
      );

    case "textarea":
      return renderLabeledField(
        <Textarea
          value={value ?? ""}
          placeholder={"placeholder" in field ? field.placeholder : undefined}
          rows={"rows" in field ? field.rows : undefined}
          disabled={isDisabled}
          onChange={handleChange}
        />
      );

    case "file":
      return renderLabeledField(
        <Input
          type="file"
          disabled={isDisabled}
          accept={field.accept}
          multiple={field.multiple}
          onChange={(event) => {
            const files = event.target.files;
            if (field.multiple) {
              onChange(files ? Array.from(files) : []);
              return;
            }
            onChange(files?.[0] ?? null);
          }}
        />
      );

    case "image":
      return renderLabeledField(
        <div className="flex items-center gap-4">
          <div className="bg-muted text-muted-foreground flex size-16 items-center justify-center overflow-hidden rounded-full border">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt={field.label} className="size-full object-cover" />
            ) : (
              <span className="text-xs">Sem foto</span>
            )}
          </div>
          <Input
            type="file"
            accept={field.accept ?? "image/*"}
            disabled={isDisabled}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onChange(file);
            }}
          />
        </div>
      );

    case "color":
      return renderLabeledField(
        <Input
          type="color"
          value={value ?? "#000000"}
          disabled={isDisabled}
          onChange={handleChange}
        />
      );

    case "boolean": {
      const persistAs = field.persistAs ?? "boolean";
      const switchId = `${field.name}-switch`;
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              id={switchId}
              checked={Boolean(value)}
              disabled={isDisabled}
              onCheckedChange={(checked) =>
                onChange(persistAs === "number" ? (checked ? 1 : 0) : checked)
              }
            />
            <Label htmlFor={switchId}>{field.label}</Label>
          </div>
          {renderHelperText()}
        </div>
      );
    }

    case "select":
      return renderLabeledField(
        <Select value={value ?? ""} onValueChange={onChange} disabled={isDisabled}>
          <SelectTrigger>
            <SelectValue placeholder={field.label} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "multiselect": {
      const selectedValues = Array.isArray(value) ? value : [];
      return renderLabeledField(
        <div className="space-y-2">
          {field.options.map((option) => {
            const checkboxId = `${field.name}-${option.value}`;
            const checked = selectedValues.includes(option.value);
            return (
              <div key={option.value} className="flex items-center gap-2">
                <Checkbox
                  id={checkboxId}
                  checked={checked}
                  disabled={isDisabled}
                  onCheckedChange={(nextChecked) => {
                    const isChecked = Boolean(nextChecked);
                    const nextValues = isChecked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((item) => item !== option.value);
                    onChange(nextValues);
                  }}
                />
                <Label htmlFor={checkboxId}>{option.label}</Label>
              </div>
            );
          })}
        </div>
      );
    }

    case "tags": {
      const tagsValue = Array.isArray(value) ? value : [];
      return renderLabeledField(
        <TagInput
          value={tagsValue}
          onChange={onChange}
          disabled={isDisabled}
          placeholder={"placeholder" in field ? field.placeholder : undefined}
          maxTags={"maxTags" in field ? field.maxTags : undefined}
          suggestions={"suggestions" in field ? field.suggestions : undefined}
        />
      );
    }

    case "richtext":
      return renderLabeledField(
        <RichText value={value ?? ""} disabled={isDisabled} onChange={handleChange} />
      );

    case "date":
      return renderLabeledField(
        <Input
          type="date"
          value={toDateInputValue(value)}
          disabled={isDisabled}
          onChange={handleChange}
        />
      );

    case "date_range": {
      const rangeValue = value && typeof value === "object" ? value : { start: "", end: "" };
      return renderLabeledField(
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="date"
            value={toDateInputValue(rangeValue.start)}
            disabled={isDisabled}
            placeholder={"startPlaceholder" in field ? field.startPlaceholder : undefined}
            onChange={(event) =>
              onChange({
                ...rangeValue,
                start: event.target.value,
              })
            }
          />
          <Input
            type="date"
            value={toDateInputValue(rangeValue.end)}
            disabled={isDisabled}
            placeholder={"endPlaceholder" in field ? field.endPlaceholder : undefined}
            onChange={(event) =>
              onChange({
                ...rangeValue,
                end: event.target.value,
              })
            }
          />
        </div>
      );
    }

    case "number_range":
    case "currency_range": {
      const rangeValue = value && typeof value === "object" ? value : { min: "", max: "" };
      const isCurrency = field.type === "currency_range";
      return renderLabeledField(
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type={isCurrency ? "text" : "number"}
            inputMode={isCurrency ? "decimal" : undefined}
            value={rangeValue.min ?? ""}
            disabled={isDisabled}
            placeholder={"minPlaceholder" in field ? field.minPlaceholder : undefined}
            onChange={(event) => {
              const raw = event.target.value;
              onChange({
                ...rangeValue,
                min: parseNumberValue(raw),
              });
            }}
          />
          <Input
            type={isCurrency ? "text" : "number"}
            inputMode={isCurrency ? "decimal" : undefined}
            value={rangeValue.max ?? ""}
            disabled={isDisabled}
            placeholder={"maxPlaceholder" in field ? field.maxPlaceholder : undefined}
            onChange={(event) => {
              const raw = event.target.value;
              onChange({
                ...rangeValue,
                max: parseNumberValue(raw),
              });
            }}
          />
        </div>
      );
    }

    default:
      return null;
  }
}
