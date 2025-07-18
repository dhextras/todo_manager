import { useState, useEffect } from 'react';
import { useTodoStore } from "../lib/store";
import FloatingTooltip from "./FloatingTooltip";

export default function UserBar() {
  const { 
    currentUser, 
    connectedUsers, 
    mousePositions, 
    dragState, 
    tasks,
    addTask, 
    canEdit 
  } = useTodoStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const getAvatarStyle = (avatar: string) => {
    const [color, shape] = avatar.split("-");
    return {
      backgroundColor: color,
      borderRadius: shape === "circle" ? "50%" : "6px",
    };
  };

  const handleAddTask = () => {
    const title = newTitle.trim();
    if (!title) return;
    
    addTask(title, newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    } else if (e.key === 'Escape') {
      setShowAddModal(false);
    }
  };

  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowAddModal(false);
    }
  };

  // Add escape key listener
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddModal) {
        setShowAddModal(false);
      }
    };

    if (showAddModal) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [showAddModal]);

  // Get the task being dragged for display
  const getDraggedTaskTitle = (taskId: string) => {
    for (const list of Object.values(tasks)) {
      const task = list.find((t: any) => t.id === taskId);
      if (task) return task.title;
    }
    return 'Unknown task';
  };

  return (
    <>
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-white">Todo Manager</h1>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={!canEdit}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
            >
              Add Task
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-gray-400 text-xs">
              {connectedUsers.length} online
            </span>
            <div className="flex items-center space-x-1.5">
              {connectedUsers.map((user) => (
                <FloatingTooltip
                  key={user.id}
                  content={`${user.name}${user.editing ? " (editing)" : ""}`}
                >
                  <div
                    className={`w-7 h-7 flex items-center justify-center text-white text-xs font-medium relative transition-all ${
                      user.editing
                        ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900"
                        : ""
                    }`}
                    style={getAvatarStyle(user.avatar)}
                  >
                    {user.name.charAt(0).toUpperCase()}
                    {user.editing && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-400 rounded-full"></div>
                    )}
                  </div>
                </FloatingTooltip>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mouse cursors for other users */}
      {Array.from(mousePositions.entries()).map(([userId, pos]) => {
        const user = connectedUsers.find((u) => u.id === userId);
        if (!user || userId === currentUser?.id) return null;

        return (
          <div
            key={userId}
            className="fixed pointer-events-none z-40"
            style={{
              left: pos.x,
              top: pos.y,
              transform: "translate(-2px, -2px)",
            }}
          >
            <div className="flex items-center space-x-1">
              <div
                className="w-3 h-3 rotate-45 transform border border-white/20"
                style={{ backgroundColor: user.avatar.split("-")[0] }}
              />
              <span className="text-xs text-white bg-slate-800/80 backdrop-blur px-1.5 py-0.5 rounded-md whitespace-nowrap">
                {user.name}
              </span>
            </div>
          </div>
        );
      })}

      {/* Drag operation indicator for other users */}
      {dragState && dragState.userId !== currentUser?.id && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragState.currentPos.x,
            top: dragState.currentPos.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="bg-yellow-500/20 border border-yellow-400/50 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <div className="text-yellow-300 text-xs font-medium flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>
                {connectedUsers.find(u => u.id === dragState.userId)?.name} is dragging:
              </span>
            </div>
            <div className="text-white text-xs mt-1 max-w-[200px] truncate">
              {getDraggedTaskTitle(dragState.taskId)}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleModalBackdropClick}
        >
          <div className="bg-gray-900/90 backdrop-blur border border-gray-700/50 p-6 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Add New Task</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2 bg-gray-800/50 text-white rounded-lg border border-gray-600/50 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                  placeholder="Task title"
                  maxLength={40}
                  autoFocus
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {newTitle.length}/40
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 text-white rounded-lg border border-gray-600/50 focus:border-blue-500 focus:outline-none resize-none transition-colors text-sm"
                  placeholder="Optional description"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {newDesc.length}/200
                </div>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!newTitle.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
