import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DebugPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const handleTestAPI = async () => {
    const token = localStorage.getItem('accessToken');
    console.log('Token:', token);
    
    if (!token) {
      console.log('No token found');
      return;
    }

    try {
      // Test get classrooms
      const response = await fetch('http://localhost:8000/classrooms', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Classrooms response status:', response.status);
      
      if (response.ok) {
        const classrooms = await response.json();
        console.log('Classrooms:', classrooms);
      } else {
        const error = await response.text();
        console.log('Error:', error);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  const handleTestJoin = async () => {
    const token = localStorage.getItem('accessToken');
    const classCode = 'W_Q1XKPN'; // Known class code from database
    
    try {
      const response = await fetch(`http://localhost:8000/classrooms/join/${classCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Join response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Join result:', result);
      } else {
        const error = await response.text();
        console.log('Join error:', error);
      }
    } catch (error) {
      console.error('Join request failed:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">User Info:</h2>
          <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          <p>User: {JSON.stringify(user, null, 2)}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Local Storage:</h2>
          <p>accessToken: {localStorage.getItem('accessToken') ? 'Present' : 'Missing'}</p>
          <p>user: {localStorage.getItem('user')}</p>
        </div>
        
        <div className="space-x-2">
          <button 
            onClick={handleTestAPI}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Test Get Classrooms
          </button>
          
          <button 
            onClick={handleTestJoin}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Test Join Classroom
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
