import { useState, useEffect } from 'react';
import { useTodoStore } from '../lib/store';
import UserBar from './UserBar';
import TodoList from './TodoList';

export default function TodoApp() {
  const {
    currentUser,
    tasks,
    joinUser,
    canEdit,
  } = useTodoStore();
  
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setShowNameInput(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      useTodoStore.getState().sendMouseMove(e.clientX, e.clientY);
    };

    const handleBeforeUnload = () => {
      // Socket will handle cleanup automatically on disconnect
    };

    const handleVisibilityChange = () => {
      // Socket will handle cleanup automatically on disconnect
    };

    if (currentUser) {
      document.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [currentUser]);

  const handleJoin = () => {
    const name = userName.trim();
    if (!name) {
      setNameError('Name is required');
      return;
    }
    if (name.length > 20) {
      setNameError('Name must be 20 characters or less');
      return;
    }
    
    try {
      joinUser(name);
      setNameError('');
    } catch (error) {
      setNameError('Name already taken');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-2xl max-w-sm w-full">
          <h1 className="text-xl font-semibold text-white mb-4 text-center">
            Join Workspace
          </h1>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-2 bg-gray-800/50 text-white rounded-lg border border-gray-600/50 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
              />
              {nameError && (
                <p className="text-red-400 text-xs mt-1">{nameError}</p>
              )}
            </div>
            
            <button
              onClick={handleJoin}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex flex-col">
      <UserBar />
      
      <div className="flex-1 max-w-full xl:max-w-[95%] 2xl:max-w-[90%] mx-auto w-full p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <TodoList
            listType="todo"
            title="Todo"
            tasks={tasks.todo}
          />
          
          <TodoList
            listType="done"
            title="Done"
            tasks={tasks.done}
          />
          
          <TodoList
            listType="ignored"
            title="Ignored"
            tasks={tasks.ignored}
          />
        </div>
      </div>
      
      {!canEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-gray-900/90 backdrop-blur border border-gray-700/50 p-6 rounded-xl shadow-2xl">
            <div className="text-white text-center">
              <div className="text-base font-medium mb-2">Edit in Progress</div>
              <div className="text-gray-300 text-sm">Another user is currently editing...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
