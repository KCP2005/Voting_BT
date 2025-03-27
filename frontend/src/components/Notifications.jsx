import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../context/Web3Context';
import axios from 'axios';

const Notifications = () => {
  const { account, isAuthenticated } = useContext(Web3Context);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (account) {
      fetchNotifications();
    }
  }, [account]);

  const fetchNotifications = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5001/api/notifications/${account}`);
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateResponse = async (notificationId, sessionId, accept) => {
    try {
      await axios.post(`http://localhost:5001/api/voting/candidateResponse`, {
        notificationId,
        sessionId,
        userAddress: account,
        accept
      });
      
      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error("Error responding to nomination:", error);
    }
  };

  if (!isAuthenticated || notifications.length === 0) {
    return null;
  }

  const pendingNominations = notifications.filter(
    n => n.type === 'candidate_nomination' && n.status === 'pending'
  );

  if (pendingNominations.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ width: expanded ? '350px' : 'auto' }}>
        <div 
          className="bg-blue-600 text-white p-3 flex justify-between items-center cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            <span className="mr-2">🔔</span>
            <span>{pendingNominations.length} Pending Nomination{pendingNominations.length !== 1 ? 's' : ''}</span>
          </div>
          <span>{expanded ? '▼' : '▲'}</span>
        </div>
        
        {expanded && (
          <div className="p-3 max-h-80 overflow-y-auto">
            {pendingNominations.map(notification => (
              <div key={notification._id} className="border-b pb-3 mb-3 last:border-b-0 last:mb-0 last:pb-0">
                <p className="font-medium mb-2">{notification.message}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCandidateResponse(
                      notification._id, 
                      notification.data.sessionId, 
                      true
                    )}
                    className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleCandidateResponse(
                      notification._id, 
                      notification.data.sessionId, 
                      false
                    )}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 text-sm"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;