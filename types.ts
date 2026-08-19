
export enum WrapperType {
  NONE = 'none',
  PARENS = 'parens',
  BRACKETS = 'brackets',
}

export interface Part {
  id: string;
  originalIndex: number;
  originalValue: string;
  content: string;
  originalWrapper: WrapperType;
  currentWrapper: WrapperType;
}
