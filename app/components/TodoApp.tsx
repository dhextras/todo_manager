import { useState, useEffect } from "react";
import { useTodoStore } from "../lib/store";
import UserBar from "./UserBar";
import TodoList from "./TodoList";

export default function TodoApp() {
  const { currentUser, tasks, joinUser, addTask, sendMouseMove, canEdit } =
    useTodoStore();

  const [userName, setUserName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);
  const [nameError, setNameError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    if (currentUser) {
      setShowNameInput(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      sendMouseMove(e.clientX, e.clientY);
    };

    if (currentUser) {
      document.addEventListener("mousemove", handleMouseMove);
      return () => document.removeEventListener("mousemove", handleMouseMove);
    }
  }, [currentUser, sendMouseMove]);

  const handleJoin = () => {
    const name = userName.trim();
    if (!name) {
      setNameError("Name is required");
      return;
    }
    if (name.length > 20) {
      setNameError("Name must be 20 characters or less");
      return;
    }

    try {
      joinUser(name);
      setNameError("");
    } catch (error) {
      setNameError("Name already taken");
    }
  };

  const handleAddTask = () => {
    const title = newTitle.trim();
    if (!title) return;

    addTask(title, newDesc.trim());
    setNewTitle("");
    setNewDesc("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (showNameInput) {
        handleJoin();
      } else {
        handleAddTask();
      }
    }
  };

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Join Todo Manager
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
              />
              {nameError && (
                <p className="text-red-400 text-sm mt-1">{nameError}</p>
              )}
            </div>

            <button
              onClick={handleJoin}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <UserBar />

      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex space-x-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Task title (required, max 40 characters)"
              maxLength={40}
              disabled={!canEdit}
            />
            <span className="text-gray-400 text-sm flex items-center">
              {newTitle.length}/40
            </span>
          </div>

          <div className="flex space-x-3">
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Description (optional)"
              maxLength={200}
              disabled={!canEdit}
            />
            <button
              onClick={handleAddTask}
              disabled={!newTitle.trim() || !canEdit}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Add Task
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-3 gap-px bg-gray-700 min-h-0">
        <TodoList listType="todo" title="Todo" tasks={tasks.todo} />
        <TodoList listType="done" title="Done" tasks={tasks.done} />
        <TodoList listType="ignored" title="Ignored" tasks={tasks.ignored} />
      </div>

      {!canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <div className="text-white text-center">
              <div className="text-lg font-semibold mb-2">Edit in Progress</div>
              <div className="text-gray-300">
                Another user is currently editing. Please wait...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
