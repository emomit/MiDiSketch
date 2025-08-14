import React, { useState, useCallback, useRef, useEffect } from 'react';

interface GridResizeHandleProps {
  onResize: (newMeasures: number) => void;
  currentMeasures: number;
  cellWidth: number;
  cellsPerMeasure: number;
  noteNameWidth: number;
}

export const GridResizeHandle: React.FC<GridResizeHandleProps> = ({
  onResize,
  currentMeasures,
  cellWidth,
  cellsPerMeasure,
  noteNameWidth
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPill, setShowPill] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartMeasures, setDragStartMeasures] = useState(0);
  const [deltaMeasures, setDeltaMeasures] = useState(0);
  const handleRef = useRef<HTMLDivElement>(null);

  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    setDragStartMeasures(currentMeasures);
    setDeltaMeasures(0);
    setShowPill(true);
  }, [currentMeasures]);

  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const newDeltaMeasures = Math.round(deltaX / (cellWidth * cellsPerMeasure));
    setDeltaMeasures(newDeltaMeasures);
  }, [isDragging, dragStartX, cellWidth, cellsPerMeasure]);

  
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      const newMeasures = Math.max(1, dragStartMeasures + deltaMeasures);
      onResize(newMeasures);
    }
    setIsDragging(false);
    setShowPill(false);
    setDeltaMeasures(0);
  }, [isDragging, dragStartMeasures, deltaMeasures, onResize]);

  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <>
      <div 
        className="absolute z-50" 
        ref={handleRef}
        style={{
          left: `${noteNameWidth + currentMeasures * cellsPerMeasure * cellWidth}px`,
          top: '0px',
          bottom: '-26px'
        }}
      >
      
        <div
          className={`
            absolute right-(-6) top-0 bottom-0 w-6
            bg-slate-600
            cursor-e-resize hover:bg-slate-500
            transition-all duration-200 ease-in-out
            flex items-center justify-center
            ${isHovered ? 'w-4' : 'w-2'}
            ${isDragging ? 'bg-slate-600' : ''}
          `}
          onMouseEnter={() => {
            if (!isDragging) {
              setIsHovered(true);
            }
          }}
          onMouseLeave={() => {
            if (!isDragging) {
              setIsHovered(false);
            }
          }}
          onMouseDown={handleMouseDown}
        >
      
          <div className="flex flex-col items-center gap-1">
            <div className="w-1 h-1 bg-white rounded-full opacity-60"></div>
            <div className="w-1 h-1 bg-white rounded-full opacity-60"></div>
            <div className="w-1 h-1 bg-white rounded-full opacity-60"></div>
          </div>
        </div>


      </div>

      
      {showPill && (
        <div 
          className="fixed z-[9999] bg-slate-800 text-white px-4 py-1.5 rounded-l-full rounded-r-full shadow-lg border border-slate-600"
          style={{
            left: `${dragStartX - 100}px`,
            top: `${dragStartY}px`,
            transform: 'translate(-50%, -100%)',
            animation: 'slideInFromRight 0.3s ease-out'
          }}
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm font-medium">
              {deltaMeasures >= 0 ? '+' : ''}{deltaMeasures}小節
            </span>
            <span className="text-slate-400 text-xs">
              ({dragStartMeasures + deltaMeasures}小節)
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translate(-50%, -100%) translateX(50px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%) translateX(0);
          }
        }
      `}</style>
    </>
  );
}; 