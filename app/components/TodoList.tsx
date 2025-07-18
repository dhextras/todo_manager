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
      className="my-0.5 h-0.5 w-full bg-blue-400 opacity-0"
    />
  );
};

export default function TodoList({ listType, title, tasks }: TodoListProps) {
  const { clearList, tasks: allTasks, setTasks } = useTodoStore();
  const [active, setActive] = useState(false);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("taskId", task.id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const taskId = e.dataTransfer.getData("taskId");

    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);

    const before = element.dataset.before || "-1";

    if (before !== taskId) {
      let allTasksCopy = { ...allTasks };
      
      // Find the task in any list
      let taskToTransfer: Task | null = null;
      let sourceList: 'todo' | 'done' | 'ignored' | null = null;
      
      for (const [listName, taskList] of Object.entries(allTasksCopy) as [keyof typeof allTasksCopy, Task[]][]) {
        const foundTask = taskList.find((t) => t.id === taskId);
        if (foundTask) {
          taskToTransfer = foundTask;
          sourceList = listName;
          break;
        }
      }

      if (!taskToTransfer || !sourceList) return;

      // Remove task from source list
      allTasksCopy[sourceList] = allTasksCopy[sourceList].filter((t) => t.id !== taskId);

      // Add to target list
      const moveToBack = before === "-1";

      if (moveToBack) {
        allTasksCopy[listType].push(taskToTransfer);
      } else {
        const insertAtIndex = allTasksCopy[listType].findIndex((el) => el.id === before);
        if (insertAtIndex === -1) {
          allTasksCopy[listType].push(taskToTransfer);
        } else {
          allTasksCopy[listType].splice(insertAtIndex, 0, taskToTransfer);
        }
      }

      setTasks(allTasksCopy);
    }
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

  return (
    <div className={`flex-1 bg-gray-900/40 backdrop-blur-sm border ${accentColors[listType]} rounded-xl min-h-0 flex flex-col overflow-hidden transition-colors ${
      active ? "bg-neutral-800/50" : "bg-neutral-800/0"
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
        className="flex-1 p-4 overflow-y-auto" 
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >        
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            No {title.toLowerCase()} items
          </div>
        ) : (
          <>
            {tasks.map((task) => (
              <div key={task.id}>
                <DropIndicator beforeId={task.id} column={listType} />
                <TodoItem
                  task={task}
                  listType={listType}
                  index={tasks.findIndex(t => t.id === task.id)}
                  onDragStart={handleDragStart}
                />
              </div>
            ))}
            <DropIndicator beforeId={null} column={listType} />
          </>
        )}
      </div>
    </div>
  );
}
