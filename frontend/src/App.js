import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Signup from './pages/signup';
import Login from './pages/login';
import CardPage from './pages/Cardpage'; // Example of a protected route
import { UserContext } from './UserContext'; // Import your UserContext
import './App.css'; // Import your CSS styles
import Landing from './pages/Landing';

const App = () => {
    const [userId, setUserId] = useState(null); // State to hold the user ID

    return (
        <UserContext.Provider value={{ userId, setUserId }}>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/CardPage" element={<CardPage />} />
                        {/* Add more routes as needed */}
                    </Routes>
                </div>
            </Router>
        </UserContext.Provider>
    );
}

export default App;
