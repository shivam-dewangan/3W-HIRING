import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HomePage.css';

// Updated API URL for local backend
const API_URL = "http://localhost:5000/api"; // Change to your local backend URL

const HomePage = () => {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [claimHistory, setClaimHistory] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [error, setError] = useState(null); // Added error state for better error handling

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/users`);
        if (Array.isArray(response.data.data)) {
          setUsers(response.data.data);
        } else {
          console.error("Expected an array, but got:", response.data);
          setUsers([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to fetch users.");
        setUsers([]); // Set an empty array if there's an error
      }
    };

    fetchUsers();
  }, []);

  // Fetch claim history
  useEffect(() => {
    axios.get(`${API_URL}/history`)
      .then(response => setClaimHistory(response.data.data))
      .catch(error => {
        console.error("Error fetching history:", error);
        setError("Failed to fetch claim history.");
      });
  }, []);

  const handleClaimPoints = () => {
    if (!userId) {
      alert("Please select a user.");
      return;
    }

    axios.post(`${API_URL}/claim`, { userId })
      .then(response => {
        alert(`Successfully claimed ${response.data.points} points`);

        const updatedUser = response.data.data.updatedUser;
        const updatedHistory = response.data.data.historyData;

        setUsers(prevUsers => prevUsers.map(user => 
          user._id === updatedUser._id ? updatedUser : user
        ));

        setClaimHistory(updatedHistory);
      })
      .catch(error => {
        console.error("Error claiming points:", error);
        alert("Something went wrong!");
      });
  };

  const handleAddUser = () => {
    if (!newUserName) {
      alert("Please enter a user name.");
      return;
    }

    axios.post(`${API_URL}/users`, { name: newUserName })
      .then(response => {
        alert("User added successfully!");
        setUsers([...users, response.data.data]);
        setNewUserName('');
      })
      .catch(error => {
        console.error("Error adding user:", error);
        alert("Something went wrong while adding the user!");
      });
  };

  return (
    <div className="home-page">
      <header className="header">
        <h1>Leaderboard</h1>
      </header>

      <main className="main-content">
        <div className="add-user-form">
          <input 
            type="text" 
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="Enter new user name"
          />
          <button onClick={handleAddUser}>Add User</button>
        </div>

        <div className="user-selection">
          <label htmlFor="user-select">Select User:</label>
          <select id="user-select" onChange={(e) => setUserId(e.target.value)} value={userId}>
            <option value="">Select User</option>
            {Array.isArray(users) && users.length > 0 ? (
              users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} - {user.totalPoints} points
                </option>
              ))
            ) : (
              <option disabled>No users available</option>
            )}
          </select>
        </div>

        <div className="claim-button">
          <button onClick={handleClaimPoints}>Claim Points</button>
        </div>

        <div className="leaderboard">
          <h2>Leaderboard</h2>
          {error ? (
            <p className="error-message">{error}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User Name</th>
                  <th>Total Points</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.sort((a, b) => b.totalPoints - a.totalPoints).map((user, index) => (
                    <tr key={user._id}>
                      <td>{index + 1}</td>
                      <td>{user.name}</td>
                      <td>{user.totalPoints}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">No users available</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="claim-history">
          <h2>Claim History</h2>
          {claimHistory.length > 0 ? (
            <ul>
              {claimHistory.map((entry, index) => (
                <li key={index}>
                  {/* Check if entry.userId is not null and has a name */}
                  {entry.userId && entry.userId.name 
                    ? `${entry.userId.name} claimed ${entry.pointsAwarded} points on ${new Date(entry.timestamp).toLocaleString()}`
                    : "Unknown user claimed points"}
                </li>
              ))}
            </ul>
          ) : (
            <p>No claim history available</p>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>Leaderboard App - Powered by React</p>
      </footer>
    </div>
  );
};

export default HomePage;
