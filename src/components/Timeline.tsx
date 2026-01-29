import { useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { TimelineItem } from './TimelineItem';
import {
  assignLanes,
  getDateRange,
  addDays,
  type TimelineItem as TimelineItemType,
} from '../utils/assignLanes';

interface TimelineProps {
  items: TimelineItemType[];
  onUpdateItem: (id: string, updates: { name?: string; startDate?: string; endDate?: string }) => void;
}

export function Timeline({ items, onUpdateItem }: TimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const { min: minDate, max: maxDate } = useMemo(() => getDateRange(items), [items]);

  const padding = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) * 0.05);
  const paddedStart = addDays(minDate, -padding);
  const paddedEnd = addDays(maxDate, padding);

  const zoomedStart = useMemo(() => {
    const totalDays = (paddedEnd.getTime() - paddedStart.getTime()) / (1000 * 60 * 60 * 24);
    const zoomedDays = totalDays / zoom;
    const center = new Date((paddedStart.getTime() + paddedEnd.getTime()) / 2);
    return new Date(center.getTime() - (zoomedDays / 2) * 24 * 60 * 60 * 1000);
  }, [paddedStart, paddedEnd, zoom]);

  const zoomedEnd = useMemo(() => {
    const totalDays = (paddedEnd.getTime() - paddedStart.getTime()) / (1000 * 60 * 60 * 24);
    const zoomedDays = totalDays / zoom;
    const center = new Date((paddedStart.getTime() + paddedEnd.getTime()) / 2);
    return new Date(center.getTime() + (zoomedDays / 2) * 24 * 60 * 60 * 1000);
  }, [paddedStart, paddedEnd, zoom]);

  const totalDays = Math.ceil((zoomedEnd.getTime() - zoomedStart.getTime()) / (1000 * 60 * 60 * 24));

  const assignedItems = useMemo(() => assignLanes(items), [items]);
  const numLanes = assignedItems.length > 0 ? Math.max(...assignedItems.map((i) => i.lane)) + 1 : 0;

  const laneHeight = 80;
  const timelineHeight = numLanes * laneHeight + 80;

  const monthMarkers = useMemo(() => {
    const markers: { date: Date; label: string; position: number }[] = [];
    const current = new Date(zoomedStart);
    current.setDate(1);

    while (current <= zoomedEnd) {
      const position =
        ((current.getTime() - zoomedStart.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;

      if (position >= 0 && position <= 100) {
        markers.push({
          date: new Date(current),
          label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          position,
        });
      }

      current.setMonth(current.getMonth() + 1);
    }

    return markers;
  }, [zoomedStart, zoomedEnd, totalDays]);

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.5, 10));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.5, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timeline View</h1>
          <p className="text-sm text-gray-500 mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} across {numLanes}{' '}
            {numLanes === 1 ? 'lane' : 'lanes'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={20} />
          </button>
          <div className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Reset zoom"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="relative" style={{ height: `${timelineHeight}px`, minWidth: '800px' }}>
            <div className="absolute top-0 left-0 right-0 h-16 border-b border-gray-200 bg-gray-50">
              {monthMarkers.map((marker, index) => (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 border-l border-gray-300"
                  style={{ left: `${marker.position}%` }}
                >
                  <div className="px-2 py-2 text-xs font-medium text-gray-600">
                    {marker.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute top-16 left-0 right-0 bottom-0">
              {Array.from({ length: numLanes }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute left-0 right-0 border-b border-gray-100 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                  style={{
                    top: `${i * laneHeight}px`,
                    height: `${laneHeight}px`,
                  }}
                />
              ))}

              <div className="relative w-full h-full group">
                {assignedItems.map((item) => (
                  <TimelineItem
                    key={item.id}
                    item={item}
                    startDate={zoomedStart}
                    endDate={zoomedEnd}
                    totalDays={totalDays}
                    laneHeight={laneHeight}
                    onUpdate={onUpdateItem}
                    isDragging={draggedItemId === item.id}
                    onDragStart={setDraggedItemId}
                    onDragEnd={() => setDraggedItemId(null)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Interactive Features:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Drag items</strong> to move them in time</li>
            <li>• <strong>Drag edges</strong> to resize start/end dates</li>
            <li>• <strong>Click the edit icon</strong> to rename items inline</li>
            <li>• <strong>Use zoom controls</strong> to adjust the view</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
