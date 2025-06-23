
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/components/shared/NotificationSystem';

interface WebSocketMessage {
  type: 'assignment_graded' | 'new_assignment' | 'comment_added' | 'submission_received';
  data: any;
}

export const useWebSocket = (userId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const { addNotification } = useNotifications();
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // In a real app, this would connect to your WebSocket server
    // For demo purposes, we'll simulate connection
    setIsConnected(true);
    
    // Simulate incoming notifications
    const interval = setInterval(() => {
      const notifications = [
        {
          type: 'assignment_graded' as const,
          data: { assignmentTitle: 'Math Assignment 1', grade: 85 }
        },
        {
          type: 'new_assignment' as const,
          data: { title: 'New Programming Task', dueDate: '2024-06-20' }
        }
      ];
      
      const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
      handleMessage(randomNotification);
    }, 30000); // Every 30 seconds for demo

    return () => {
      clearInterval(interval);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [userId]);

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'assignment_graded':
        addNotification({
          type: 'success',
          title: 'Assignment Graded',
          message: `${message.data.assignmentTitle} has been graded: ${message.data.grade}/100`
        });
        break;
      case 'new_assignment':
        addNotification({
          type: 'info',
          title: 'New Assignment',
          message: `${message.data.title} is due ${message.data.dueDate}`
        });
        break;
      case 'comment_added':
        addNotification({
          type: 'info',
          title: 'New Comment',
          message: `Teacher added feedback to your submission`
        });
        break;
    }
  };

  return { isConnected };
};
