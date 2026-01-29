import { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import type { LaneAssignment } from '../utils/assignLanes';

interface TimelineItemProps {
  item: LaneAssignment;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  laneHeight: number;
  onUpdate: (id: string, updates: { name?: string; startDate?: string; endDate?: string }) => void;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

export function TimelineItem({
  item,
  startDate,
  totalDays,
  laneHeight,
  onUpdate,
  isDragging,
  onDragStart,
  onDragEnd,
}: TimelineItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalDates, setOriginalDates] = useState({ start: '', end: '' });
  const itemRef = useRef<HTMLDivElement>(null);
  const formatDate = (date: string) =>
    new Date(date).toISOString().split('T')[0];
  
  const itemStart = new Date(item.startDate);
  const itemEnd = new Date(item.endDate);

  const daysFromStart = Math.floor(
    (itemStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const itemDuration = Math.max(
    1,
    Math.ceil((itemEnd.getTime() - itemStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const left = (daysFromStart / totalDays) * 100;
  const width = (itemDuration / totalDays) * 100;

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(item.name);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    if (editName.trim() && editName !== item.name) {
      onUpdate(item.id, { name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditName(item.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    e.stopPropagation();
    setDragMode(mode);
    setDragStartX(e.clientX);
    setOriginalDates({ start: item.startDate, end: item.endDate });
    onDragStart(item.id);
  };

  useEffect(() => {
    if (!dragMode)
      return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!itemRef.current)
        return;

      const containerWidth = itemRef.current.parentElement?.offsetWidth || 1;
      const deltaX = e.clientX - dragStartX;
      const deltaDays = Math.round((deltaX / containerWidth) * totalDays);

      if (dragMode === 'move') {
        const newStart = new Date(originalDates.start);
        newStart.setDate(newStart.getDate() + deltaDays);
        const newEnd = new Date(originalDates.end);
        newEnd.setDate(newEnd.getDate() + deltaDays);

        const newStartStr = newStart.toISOString().split('T')[0];
        const newEndStr = newEnd.toISOString().split('T')[0];

        if (newStartStr !== item.startDate || newEndStr !== item.endDate) {
          onUpdate(item.id, { startDate: newStartStr, endDate: newEndStr });
        }
      } else if (dragMode === 'resize-start') {
        const newStart = new Date(originalDates.start);
        newStart.setDate(newStart.getDate() + deltaDays);

        if (newStart < new Date(item.endDate)) {
          const newStartStr = newStart.toISOString().split('T')[0];
          if (newStartStr !== item.startDate) {
            onUpdate(item.id, { startDate: newStartStr });
          }
        }
      } else if (dragMode === 'resize-end') {
        const newEnd = new Date(originalDates.end);
        newEnd.setDate(newEnd.getDate() + deltaDays);

        if (newEnd > new Date(item.startDate)) {
          const newEndStr = newEnd.toISOString().split('T')[0];
          if (newEndStr !== item.endDate) {
            onUpdate(item.id, { endDate: newEndStr });
          }
        }
      }
    };

    const handleMouseUp = () => {
      setDragMode(null);
      onDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, dragStartX, item, originalDates, totalDays, onUpdate, onDragEnd]);

  const backgroundColor = item.color || '#3b82f6';
  const minWidthForText = 8;

  return (
    <div
      ref={itemRef}
      className={`group absolute rounded-lg shadow-md transition-all ${isDragging ? 'opacity-50 cursor-grabbing' : 'hover:shadow-lg cursor-grab'
        }`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        top: `${item.lane * laneHeight + 8}px`,
        height: `${laneHeight - 16}px`,
        backgroundColor,
        minWidth: '40px',
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black hover:bg-opacity-20 rounded-l-lg"
        onMouseDown={(e) => handleMouseDown(e, 'resize-start')}
      />

      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black hover:bg-opacity-20 rounded-r-lg"
        onMouseDown={(e) => handleMouseDown(e, 'resize-end')}
      />

      <div className="px-3 py-2 h-full flex flex-col justify-center text-white text-xs leading-tight">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-2 py-1 text-xs bg-white text-gray-900 rounded border-none outline-none"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={handleEditSave}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleEditCancel}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex flex-col min-w-0">
              <span
                className={`font-medium truncate ${width < minWidthForText ? 'text-xs' : 'text-sm'
                  }`}
              >
                {item.name}
              </span>

              <span className="opacity-80 text-[11px] truncate">
                {formatDate(item.startDate)} – {formatDate(item.endDate)}
              </span>
            </div>

            {width >= minWidthForText && (
              <button
                onClick={handleEditStart}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1 opacity-0 group-hover:opacity-100
                 hover:bg-white hover:bg-opacity-20 rounded
                 transition-opacity shrink-0"
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
