export interface TimelineItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  color?: string;
}

export interface LaneAssignment extends TimelineItem {
  lane: number;
}

export function assignLanes(items: TimelineItem[]): LaneAssignment[] {
  const sortedItems = [...items].sort((a, b) => {
    const startCompare = a.startDate.localeCompare(b.startDate);
    if (startCompare !== 0)
      return startCompare;
    return a.endDate.localeCompare(b.endDate);
  });

  const laneEndDates: string[] = [];
  const result: LaneAssignment[] = [];

  for (const item of sortedItems) {
    let assignedLane = -1;

    for (let i = 0; i < laneEndDates.length; i++) {
      if (laneEndDates[i] < item.startDate) {
        assignedLane = i;
        laneEndDates[i] = item.endDate;
        break;
      }
    }

    if (assignedLane === -1) {
      assignedLane = laneEndDates.length;
      laneEndDates.push(item.endDate);
    }

    result.push({
      ...item,
      lane: assignedLane,
    });
  }

  return result;
}

export function getDateRange(items: TimelineItem[]): { min: Date; max: Date } {
  if (items.length === 0) {
    const now = new Date();
    return { min: now, max: now };
  }

  let min = new Date(items[0].startDate);
  let max = new Date(items[0].endDate);

  items.forEach((item) => {
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);
    if (start < min) min = start;
    if (end > max) max = end;
  });

  return { min, max };
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function daysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
