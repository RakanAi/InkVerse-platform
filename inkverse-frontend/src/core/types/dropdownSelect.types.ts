// DropdownSelect.types.ts
export interface DropdownOption<T = any> {
  value: T;
  label: string;
}

export interface DropdownSelectProps<T = any> {
  value: T;
  onChange?: (v: T) => void;
  options?: DropdownOption<T>[];
  renderLabel?: (option: DropdownOption<T>) => React.ReactNode;
  placeholder?: string;
  className?: string;
}