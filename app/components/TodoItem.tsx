import { useState, useRef } from "react";
import { useTodoStore } from "../lib/store";
import FloatingTooltip from "./FloatingTooltip";
import type { Task } from "../lib/types";

interface TodoItemProps {
  task: Task;
  listType: "todo" | "done" | "ignored";
  index: number;
}

export default function TodoItem({ task, listType, index }: TodoItemProps) {
  const {
    currentUser,
    editingState,
    canEdit,
    moveTask,
    deleteTask,
    startEditing,
    endEditing,
    updateTask,
    startDrag,
    updateDrag,
    endDrag,
  } = useTodoStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [isDragging, setIsDragging] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const isBeingEdited = editingState.has(task.id);
  const editingUser = editingState.get(task.id);
  const isMyEdit = editingUser === currentUser?.id;

  const listColors = {
    todo: "border-l-blue-500",
    done: "border-l-green-500",
    ignored: "border-l-gray-500",
  };

  const numberColors = {
    todo: "bg-blue-500",
    done: "bg-green-500",
    ignored: "bg-gray-500",
  };

  const handleEdit = () => {
    if (listType !== "todo" || !canEdit || isBeingEdited) return;

    startEditing(task.id, "edit");
    setIsEditing(true);
    setEditTitle(task.title);
    setEditDesc(task.description);
  };

  const handleSave = () => {
    if (editTitle.trim()) {
      updateTask(task.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
      });
    }
    setIsEditing(false);
    endEditing(task.id);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(task.title);
    setEditDesc(task.description);
    endEditing(task.id);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!canEdit || isBeingEdited) {
      e.preventDefault();
      return;
    }

    setIsDragging(true);
    const rect = itemRef.current?.getBoundingClientRect();
    if (rect) {
      const relativePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      startDrag(task.id, { x: e.clientX, y: e.clientY }, relativePos, listType);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    const dropTarget = e.target as HTMLElement;
    const listElement = dropTarget.closest("[data-list-type]");
    const dropList = listElement?.getAttribute("data-list-type");

    endDrag(task.id, dropList || undefined);
  };

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX !== 0 && e.clientY !== 0) {
      updateDrag(task.id, { x: e.clientX, y: e.clientY });
    }
  };

  const getActionButtons = () => {
    if (listType === "todo") {
      return (
        <div className="flex space-x-1">
          <button
            onClick={() => moveTask(task.id, listType, "done")}
            className="w-6 h-6 bg-green-600 hover:bg-green-700 text-white rounded text-xs flex items-center justify-center transition-colors"
            title="Mark as done"
          >
            ✓
          </button>
          <button
            onClick={() => moveTask(task.id, listType, "ignored")}
            className="w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs flex items-center justify-center transition-colors"
            title="Ignore"
          >
            ✗
          </button>
        </div>
      );
    }

    return (
      <div className="flex space-x-1">
        <button
          onClick={() => moveTask(task.id, listType, "todo")}
          className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center justify-center transition-colors"
          title="Restore"
        >
          ↶
        </button>
        <button
          onClick={() => deleteTask(task.id, listType)}
          className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center justify-center transition-colors"
          title="Delete"
        >
          🗑
        </button>
      </div>
    );
  };

  if (isEditing) {
    return (
      <div
        ref={itemRef}
        className={`bg-gray-800 border ${listColors[listType]} border-gray-700 rounded-md p-3 mb-2 relative`}
      >
        <div
          className={`absolute left-0 top-0 w-6 h-6 ${numberColors[listType]} text-white text-xs flex items-center justify-center rounded-br-md`}
        >
          {index + 1}
        </div>

        <div className="ml-8 space-y-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            maxLength={40}
            autoFocus
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
            rows={3}
            maxLength={200}
            placeholder="Description (optional)"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={itemRef}
      draggable={listType === "todo" && canEdit && !isBeingEdited}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={handleDrag}
      className={`bg-gray-800 border ${
        listColors[listType]
      } border-gray-700 rounded-md p-3 mb-2 relative transition-all duration-200 ${
        isDragging ? "opacity-50 rotate-1" : "hover:bg-gray-750"
      } ${
        isBeingEdited && !isMyEdit
          ? "opacity-60 cursor-not-allowed"
          : "cursor-move"
      }`}
    >
      <div
        className={`absolute left-0 top-0 w-6 h-6 ${numberColors[listType]} text-white text-xs flex items-center justify-center rounded-br-md`}
      >
        {index + 1}
      </div>

      <div className="ml-8 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <FloatingTooltip content={task.description}>
            <div
              onClick={handleEdit}
              className={`text-white font-medium truncate ${
                listType === "todo" && canEdit && !isBeingEdited
                  ? "cursor-pointer hover:text-blue-400"
                  : ""
              }`}
            >
              {task.title}
            </div>
          </FloatingTooltip>
        </div>

        <div className="ml-3 flex-shrink-0">{getActionButtons()}</div>
      </div>

      {isBeingEdited && !isMyEdit && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center">
          <div className="text-white text-sm bg-gray-800 px-2 py-1 rounded">
            Being edited by another user
          </div>
        </div>
      )}
    </div>
  );
}
