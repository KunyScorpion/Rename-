import React, { useState, useRef } from 'react';
import { Part, WrapperType } from '../types';

interface PartItemProps {
  part: Part;
  onWrapperChange: (partId: string, newWrapper: WrapperType) => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, partId: string) => void;
}

const PartItem: React.FC<PartItemProps> = ({ part, onWrapperChange, isDragging, onDragStart }) => {
  const handleWrapperChange = () => {
    const wrappers = [WrapperType.NONE, WrapperType.PARENS, WrapperType.BRACKETS];
    const currentIndex = wrappers.indexOf(part.currentWrapper);
    const nextIndex = (currentIndex + 1) % wrappers.length;
    onWrapperChange(part.id, wrappers[nextIndex]);
  };

  const getWrapperDisplay = (wrapper: WrapperType, content: string) => {
    switch (wrapper) {
      case WrapperType.PARENS:
        return `(${content})`;
      case WrapperType.BRACKETS:
        return `[${content}]`;
      default:
        return content;
    }
  };

  const typeClasses = {
    [WrapperType.NONE]: 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200',
    [WrapperType.PARENS]: 'text-green-800 bg-green-100 hover:bg-green-200 dark:text-green-200 dark:bg-green-500/20 dark:hover:bg-green-500/30',
    [WrapperType.BRACKETS]: 'text-purple-800 bg-purple-100 hover:bg-purple-200 dark:text-purple-200 dark:bg-purple-500/20 dark:hover:bg-purple-500/30'
  };

  return (
    <div
      id={part.id}
      draggable
      onDragStart={(e) => onDragStart(e, part.id)}
      onClick={handleWrapperChange}
      className={`px-4 py-2 rounded-lg cursor-grab select-none transition-all duration-200 ease-in-out
        ${isDragging ? 'opacity-40 bg-blue-200 dark:bg-blue-900/50 scale-105' : typeClasses[part.currentWrapper]}
      `}
    >
      <span className="font-mono">{getWrapperDisplay(part.currentWrapper, part.content)}</span>
    </div>
  );
};


interface ArrangementAreaProps {
  parts: Part[];
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
  updatePartWrapper: (partId: string, newWrapper: WrapperType) => void;
  extension: string;
}

export const ArrangementArea: React.FC<ArrangementAreaProps> = ({ parts, setParts, updatePartWrapper, extension }) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, partId: string) => {
    setDraggingId(partId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, partId: string) => {
    e.preventDefault();
    dragOverItem.current = partId;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = () => {
    if (!draggingId || !dragOverItem.current || draggingId === dragOverItem.current) {
        setDraggingId(null);
        return;
    }

    const draggingIndex = parts.findIndex(p => p.id === draggingId);
    const dropIndex = parts.findIndex(p => p.id === dragOverItem.current);

    if (draggingIndex === -1 || dropIndex === -1) {
        setDraggingId(null);
        return;
    }

    const newParts = [...parts];
    const [draggedItem] = newParts.splice(draggingIndex, 1);
    newParts.splice(dropIndex, 0, draggedItem);
    
    setParts(newParts);
    setDraggingId(null);
    dragOverItem.current = null;
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  return (
    <div 
      className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg min-h-[60px]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      {parts.map(part => (
        <div
            key={part.id}
            onDragEnter={(e) => handleDragEnter(e, part.id)}
            className="flex-shrink-0"
        >
          <PartItem
            part={part}
            onWrapperChange={updatePartWrapper}
            isDragging={draggingId === part.id}
            onDragStart={handleDragStart}
          />
        </div>
      ))}
      {extension && (
        <div className="text-slate-500 dark:text-slate-400 font-mono pl-2">{extension}</div>
      )}
    </div>
  );
};