import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register'; // Changed from './pages/register' to './pages/Register'
import Vote from './pages/Vote';
import Results from './pages/Results';
import Admin from './pages/Admin';
import HostVoting from './pages/HostVoting';
import './App.css';
import Notifications from './components/Notifications';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/vote" element={<Vote />} />
              <Route path="/results" element={<Results />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/host" element={<HostVoting />} />
            </Routes>
          </div>
          <Notifications />
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;