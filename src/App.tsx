import { useState } from 'react';
import { Timeline } from './components/Timeline';
import { sampleTimelineItems } from './data/sampleData';
import type { TimelineItem } from './utils/assignLanes';

function App() {
  const [items, setItems] = useState<TimelineItem[]>(sampleTimelineItems);

  const handleUpdateItem = (
    id: string,
    updates: { name?: string; startDate?: string; endDate?: string }
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
            }
          : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Timeline items={items} onUpdateItem={handleUpdateItem} />
    </div>
  );
}

export default App;
