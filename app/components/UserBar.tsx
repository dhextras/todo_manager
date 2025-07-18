import { useTodoStore } from "../lib/store";
import FloatingTooltip from "./FloatingTooltip";

export default function UserBar() {
  const { currentUser, connectedUsers, mousePositions } = useTodoStore();

  const getAvatarStyle = (avatar: string) => {
    const [color, shape] = avatar.split("-");
    return {
      backgroundColor: color,
      borderRadius: shape === "circle" ? "50%" : "4px",
    };
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Todo Manager</h1>

        <div className="flex items-center space-x-3">
          <span className="text-gray-400 text-sm">
            {connectedUsers.length} user{connectedUsers.length !== 1 ? "s" : ""}{" "}
            online
          </span>

          <div className="flex items-center space-x-2">
            {connectedUsers.map((user) => (
              <FloatingTooltip
                key={user.id}
                content={`${user.name}${user.editing ? " (editing)" : ""}`}
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center text-white text-xs font-medium relative ${
                    user.editing
                      ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-800"
                      : ""
                  }`}
                  style={getAvatarStyle(user.avatar)}
                >
                  {user.name.charAt(0).toUpperCase()}
                  {user.editing && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full"></div>
                  )}
                </div>
              </FloatingTooltip>
            ))}
          </div>
        </div>
      </div>

      {/* Mouse cursors */}
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
                className="w-4 h-4 rotate-45 transform"
                style={{ backgroundColor: user.avatar.split("-")[0] }}
              >
                <div className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5"></div>
              </div>
              <span className="text-xs text-white bg-gray-800 px-1 py-0.5 rounded whitespace-nowrap">
                {user.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
