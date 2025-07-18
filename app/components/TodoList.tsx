import { useState } from 'react';
import { useTodoStore } from '../lib/store';
import TodoItem from './TodoItem';
import type { Task } from '../lib/types';

interface TodoListProps {
  listType: 'todo' | 'done' | 'ignored';
  title: string;
  tasks: Task[];
}

const DropIndicator = ({ beforeId, column }: { beforeId: string | null; column: string }) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column}
      className="my-1 h-0.5 w-full bg-blue-400 opacity-0 transition-opacity duration-200 rounded-full"
    />
  );
};

export default function TodoList({ listType, title, tasks }: TodoListProps) {
  const { clearList, startDrag, endDrag, dragState, currentUser } = useTodoStore();
  const [active, setActive] = useState(false);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.setData("sourceList", listType);
    
    // Calculate relative position within the dragged element
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const relativePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Start drag in collaboration system
    startDrag(task.id, { x: e.clientX, y: e.clientY }, relativePos, listType);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const taskId = e.dataTransfer.getData("taskId");
    const sourceList = e.dataTransfer.getData("sourceList");

    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);

    const before = element.dataset.before || "-1";

    if (before !== taskId) {
      // Handle the actual task movement
      const { moveTask, tasks: currentTasks } = useTodoStore.getState();
      
      let targetTask = null;
      // Find the task in any list
      for (const list of Object.values(currentTasks)) {
        targetTask = list.find((t: Task) => t.id === taskId);
        if (targetTask) break;
      }

      if (targetTask && sourceList !== listType) {
        // Moving between lists
        moveTask(taskId, sourceList, listType);
      } else if (targetTask && sourceList === listType) {
        // Reordering within the same list - for now we'll just use the existing moveTask
        // In a full implementation, you'd handle reordering here
        console.log('Reordering within same list - feature can be added');
      }
    }

    // End drag in collaboration system
    endDrag(taskId, listType);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const clearHighlights = (els?: HTMLElement[]) => {
    const indicators = els || getIndicators();
    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e: React.DragEvent) => {
    const indicators = getIndicators();
    clearHighlights(indicators);
    const el = getNearestIndicator(e, indicators);
    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e: React.DragEvent, indicators: HTMLElement[]) => {
    const DISTANCE_OFFSET = 50;

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );

    return el;
  };

  const getIndicators = (): HTMLElement[] => {
    return Array.from(document.querySelectorAll(`[data-column="${listType}"]`));
  };

  const handleClear = () => {
    if (tasks.length === 0) return;
    if (confirm(`Clear all ${title.toLowerCase()} items?`)) {
      clearList(listType);
    }
  };

  const titleColors = {
    todo: 'text-blue-400',
    done: 'text-emerald-400',
    ignored: 'text-gray-400',
  };

  const accentColors = {
    todo: 'border-blue-500/20 bg-blue-500/5',
    done: 'border-emerald-500/20 bg-emerald-500/5',
    ignored: 'border-gray-500/20 bg-gray-500/5',
  };

  const dragActiveColors = {
    todo: 'bg-blue-500/10',
    done: 'bg-emerald-500/10', 
    ignored: 'bg-gray-500/10',
  };

  // Check if someone else is dragging to this list
  const isBeingDraggedTo = dragState && dragState.userId !== currentUser?.id;

  return (
    <div className={`flex-1 bg-gray-900/40 backdrop-blur-sm border ${accentColors[listType]} rounded-xl min-h-0 flex flex-col overflow-hidden transition-colors ${
      active ? dragActiveColors[listType] : ''
    }`}>
      <div className="p-4 border-b border-gray-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className={`text-base font-medium ${titleColors[listType]}`}>
              {title}
            </h2>
            <span className="bg-gray-700/50 text-gray-300 text-xs px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={handleClear}
            disabled={tasks.length === 0}
            className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-600/20 disabled:cursor-not-allowed text-red-400 disabled:text-gray-500 rounded-md text-xs transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div 
        className="flex-1 p-4 overflow-y-auto transition-colors" 
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isBeingDraggedTo && (
          <div className="mb-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-xs text-center">
            Another user is dragging to this list
          </div>
        )}
        
        <DropIndicator beforeId={null} column={listType} />
        
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            No {title.toLowerCase()} items
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <div key={task.id}>
                <TodoItem
                  task={task}
                  listType={listType}
                  index={index}
                  onDragStart={handleDragStart}
                />
                <DropIndicator beforeId={task.id} column={listType} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
