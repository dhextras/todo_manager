import { useState } from "react";
import { useTodoStore } from "../lib/store";
import TodoItem from "./TodoItem";
import type { Task } from "../lib/types";

interface TodoListProps {
  listType: "todo" | "done" | "ignored";
  title: string;
  tasks: Task[];
}

export default function TodoList({ listType, title, tasks }: TodoListProps) {
  const { clearList, dragState, currentUser } = useTodoStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClear = () => {
    if (tasks.length === 0) return;
    if (confirm(`Clear all ${title.toLowerCase()} items?`)) {
      clearList(listType);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set drag over to false if we're leaving the list container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const isDraggingToThisList = dragState && dragState.fromList !== listType;

  return (
    <div className="flex-1 bg-gray-900 min-h-0">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={handleClear}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        data-list-type={listType}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-4 h-full overflow-y-auto transition-all duration-200 ${
          isDragOver && isDraggingToThisList
            ? "bg-gray-800 border-2 border-dashed border-blue-500"
            : ""
        }`}
      >
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 text-sm italic mt-8">
            No items
          </div>
        ) : (
          <div className="space-y-0">
            {tasks.map((task, index) => (
              <TodoItem
                key={task.id}
                task={task}
                listType={listType}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Drag preview for other users */}
        {dragState && dragState.userId !== currentUser?.id && (
          <div
            className="fixed pointer-events-none z-50 bg-gray-800 border border-gray-600 rounded-md p-3 opacity-80"
            style={{
              left: dragState.currentPos.x - dragState.relativePos.x,
              top: dragState.currentPos.y - dragState.relativePos.y,
              transform: "rotate(2deg)",
            }}
          >
            <div className="text-white text-sm">
              {tasks.find((t) => t.id === dragState.taskId)?.title || "Task"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
