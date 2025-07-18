import { io, Socket } from 'socket.io-client';
import { decompressMessage } from './compression';
import type { SocketMessage } from './types';

export class SocketClient {
  private socket: Socket;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private mouseThrottle: number = 0;

  constructor() {
    // FIXME: Make sure to use the domain when we add that
    const wsUrl =  'http://localhost:5765' 
    this.socket = io(wsUrl);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('message', async (data: any) => {
      try {
        const message: SocketMessage = await decompressMessage(data);
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message.data);
        }
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    });

    // Direct event handlers for non-compressed messages
    this.socket.on('mouse-move', (data) => {
      const handler = this.messageHandlers.get('mouse-move');
      if (handler) handler(data);
    });

    this.socket.on('drag-move', (data) => {
      const handler = this.messageHandlers.get('drag-move');
      if (handler) handler(data);
    });

    this.socket.on('error', (data) => {
      console.error('Socket error:', data);
    });

    this.socket.on('editing-failed', (data) => {
      const handler = this.messageHandlers.get('editing-failed');
      if (handler) handler(data);
    });
  }

  on(event: string, handler: (data: any) => void): void {
    this.messageHandlers.set(event, handler);
  }

  off(event: string): void {
    this.messageHandlers.delete(event);
  }

  emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  joinUser(name: string): void {
    this.emit('user-join', { name });
  }

  sendMouseMove(x: number, y: number): void {
    const now = Date.now();
    if (now - this.mouseThrottle < 10) return; // 10ms throttle
    
    this.mouseThrottle = now;
    this.emit('mouse-move', { x, y });
  }

  startEditing(taskId: string, type: 'edit' | 'drag' | 'move' = 'edit'): void {
    this.emit('editing-start', { taskId, type });
  }

  endEditing(taskId: string): void {
    this.emit('editing-end', { taskId });
  }

  addTask(title: string, description: string): void {
    this.emit('task-add', { title, description });
  }

  updateTask(taskId: string, updates: any): void {
    this.emit('task-update', { taskId, updates });
  }

  moveTask(taskId: string, fromList: string, toList: string): void {
    this.emit('task-move', { taskId, fromList, toList });
  }

  deleteTask(taskId: string, fromList: string): void {
    this.emit('task-delete', { taskId, fromList });
  }

  clearList(listType: string): void {
    this.emit('list-clear', { listType });
  }

  startDrag(taskId: string, startPos: { x: number; y: number }, relativePos: { x: number; y: number }, fromList: string): void {
    this.emit('drag-start', { taskId, startPos, relativePos, fromList });
  }

  updateDrag(taskId: string, currentPos: { x: number; y: number }): void {
    this.emit('drag-move', { taskId, currentPos });
  }

  endDrag(taskId: string, dropList?: string): void {
    this.emit('drag-end', { taskId, dropList });
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}

export const socketClient = new SocketClient();
