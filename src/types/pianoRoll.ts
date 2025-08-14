export interface Cell {
  id: string;
  row: number;
  column: number;
  isSelected: boolean;
  note?: string;
}

export interface Measure {
  id: string;
  name: string;
  index: number;
  isSelected: boolean;
}