export interface GridConfigBasics {
  cellWidth: number;
  cellHeight: number;
  cellsPerMeasure: number;
}

export const colFromX = (x: number, cellWidth: number): number => Math.floor(x / cellWidth);
export const rowFromY = (y: number, cellHeight: number): number => Math.floor(y / cellHeight);
export const snapCol = (rawCol: number): number => Math.round(rawCol);

export const measureIndexFromStartTime = (startTime: number, cellsPerMeasure: number): number => {
  return Math.floor(startTime / cellsPerMeasure);
};

export const startTimeFromMeasureIndex = (measureIndex: number, cellsPerMeasure: number): number => {
  return measureIndex * cellsPerMeasure;
};

export const clampMidiPitch = (pitch: number): number => Math.max(21, Math.min(108, pitch));