import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useTodoStore } from '../lib/store';
import type { Task } from '../lib/types';

interface TodoItemProps {
  task: Task;
  listType: 'todo' | 'done' | 'ignored';
  index: number;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDrag: (e: React.DragEvent) => void;
}

export default function TodoItem({ task, listType, index, onDragStart, onDrag }: TodoItemProps) {
  const {
    currentUser,
    connectedUsers,
    editingState,
    dragState,
    canEdit,
    endDrag,
    moveTask,
    deleteTask,
    startEditing,
    endEditing,
    updateTask,
  } = useTodoStore();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);

  const isBeingEdited = editingState.has(task.id);
  const editingUser = editingState.get(task.id);
  const isMyEdit = editingUser === currentUser?.id;
  const user = connectedUsers.find((u) => u.id === editingUser);


  const isBeingDragged = dragState &&  dragState.taskId === task.id;

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isMyEdit) {
        endEditing(task.id);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isMyEdit) {
        handleCancel();
      }
    };

    if (isMyEdit) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isMyEdit, task.id, endEditing]);

  useEffect(() => {
    return () => {
      if (isMyEdit) {
        endEditing(task.id);
      }
    };
  }, []);

  const listColors = {
    todo: {  bg: 'bg-blue-500' },
    done: {  bg: 'bg-emerald-500' },
    ignored: {  bg: 'bg-gray-500' },
  };

  const handleEdit = () => {
    if ( !canEdit || isBeingEdited) return;
    
    startEditing(task.id, 'edit');
    setEditTitle(task.title);
    setEditDesc(task.description);
    setShowEditModal(true);
  };

  const handleSave = () => {
    if (editTitle.trim()) {
      updateTask(task.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
      });
    }
    setShowEditModal(false);
    endEditing(task.id);
  };

  const handleCancel = () => {
    setShowEditModal(false);
    setEditTitle(task.title);
    setEditDesc(task.description);
    endEditing(task.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!canEdit || isBeingEdited) {
      e.preventDefault();
      return;
    }
    onDragStart(e, task);
  };

  const getActionButtons = () => {
    if (listType === 'todo') {
      return (
        <div className="flex space-x-1">
          <button
            onClick={() => moveTask(task.id, listType, 'done')}
            className="w-6 h-6 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-md text-xs flex items-center justify-center transition-all hover:scale-105"
            title="Mark as done"
          >
            ✓
          </button>
          <button
            onClick={() => moveTask(task.id, listType, 'ignored')}
            className="w-6 h-6 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded-md text-xs flex items-center justify-center transition-all hover:scale-105"
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
          onClick={() => moveTask(task.id, listType, 'todo')}
          className="w-6 h-6 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-md text-xs flex items-center justify-center transition-all hover:scale-105"
          title="Restore"
        >
          ↶
        </button>
        <button
          onClick={() => deleteTask(task.id, listType)}
          className="w-6 h-6 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-md text-xs flex items-center justify-center transition-all hover:scale-105"
          title="Delete"
        >
          🗑
        </button>
      </div>
    );
  };

  const modalContent = showEditModal ? (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={handleModalBackdropClick}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="bg-gray-900/90 backdrop-blur border border-gray-700/50 p-6 rounded-xl shadow-2xl max-w-4xl w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Edit Task</h3>
          <button
            onClick={handleCancel}
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
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full px-3 py-2 bg-gray-800/50 text-white rounded-lg border border-gray-600/50 focus:border-blue-500 focus:outline-none transition-colors text-sm"
              placeholder="Task title"
              maxLength={40}
              autoFocus
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {editTitle.length}/40
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full px-3 py-2 bg-gray-800/50 text-white rounded-lg border border-gray-600/50 focus:border-blue-500 focus:outline-none resize-none transition-colors text-sm"
              placeholder="Optional description"
              rows={10}
              maxLength={200}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {editDesc.length}/200
            </div>
          </div>
          
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editTitle.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  ) : null;

  return (
    <>
      <motion.div
        layout
        layoutId={task.id}
        initial={false}
        draggable={canEdit && !isBeingEdited}
        onDragStart={handleDragStart}
        onDrag={onDrag}
        onDragEnd={() => {endDrag(task.id)}}
        className={`bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 relative overflow-hidden group transition-all duration-200 hover:shadow-lg hover:bg-gray-900/80 ${
          isBeingEdited && !isMyEdit ? 'opacity-60 cursor-not-allowed' : ''
        } ${
          canEdit && !isBeingEdited ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${listColors[listType].bg} rounded-l-lg`}></div>
        <div className={`absolute left-0 top-0 w-6 h-6 ${listColors[listType].bg} text-white text-xs font-medium flex items-center justify-center rounded-br-md`}>
          {index + 1}
        </div>
        
        <div className="ml-8 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="relative z-50">
                <div
                  onClick={handleEdit}
                  className={`text-white font-medium cursor-pointer transition-colors duration-200 text-sm leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis ${
                    canEdit && !isBeingEdited ? 'hover:text-blue-500' : ''
                  }`}
                  style={{
                    maxWidth: '100%',
                  }}
                  title={task.title}
                >
                  {task.title}
                </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {getActionButtons()}
          </div>
        </div>
        
        {isBeingEdited && !isMyEdit && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
            <div className="text-white text-sm bg-gray-900/80 backdrop-blur px-3 py-2 rounded-md shadow-lg">
              {user ? user.name : "Another user"} is editing this...
            </div>
          </div>
        )}

        {isBeingDragged && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
            <div className="text-white text-sm bg-gray-900/80 backdrop-blur px-3 py-2 rounded-md shadow-lg">
              Currently Being dragged...
            </div>
          </div>
        )}

      </motion.div>

      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
