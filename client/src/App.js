import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import GuestPortal from './pages/GuestPortal';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role || 'user');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    setUserRole('user');
    setIsNavOpen(false);
  };

  const closeNav = () => setIsNavOpen(false);

  return (
    <Router>
      <div className="app">
        <header>
          <nav className="navbar" aria-label="Primary navigation">
            <div className="nav-container">
              <Link to="/" className="logo" aria-label="Visawa Hotel & Resorts home">
                <img src="/logo.png" alt="Visawa Hotel & Resorts logo" width="48" height="48" loading="eager" decoding="async" />
                <span>
                  <strong>Visawa Hotel & Resorts</strong>
                  <small>Luxury Hotel & Resorts</small>
                </span>
              </Link>
              <ul className={`nav-menu ${isNavOpen ? 'open' : ''}`}>
                <li><Link to="/" onClick={closeNav}>Home</Link></li>
                <li><a href="/#facilities" onClick={closeNav}>Services</a></li>
                <li><a href="/#gallery" onClick={closeNav}>Gallery</a></li>
                {!isLoggedIn && <li><Link to="/login" onClick={closeNav}>Login</Link></li>}
                {isLoggedIn && <li><Link to="/bookings" onClick={closeNav}>My Bookings</Link></li>}
                {isLoggedIn && <li><Link to="/portal" onClick={closeNav}>VIP Portal</Link></li>}
                {isLoggedIn && (userRole === 'admin' || userRole === 'sadmin') && <li><Link to="/admin" onClick={closeNav}>Admin</Link></li>}
                {isLoggedIn && <li className="mobile-auth"><button onClick={handleLogout} className="btn-logout">Logout</button></li>}
              </ul>

              <div className="nav-actions">
                <a href="tel:+919301783278" className="phone-pill">+91 93017 83278</a>
                {isLoggedIn && <button onClick={handleLogout} className="btn-logout">Logout</button>}
                <button
                  className={`menu-toggle ${isNavOpen ? 'open' : ''}`}
                  type="button"
                  aria-label="Toggle navigation menu"
                  aria-expanded={isNavOpen}
                  onClick={() => setIsNavOpen((open) => !open)}
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
              </div>
            </div>
          </nav>
        </header>

        <main id="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rooms" element={<Rooms isLoggedIn={isLoggedIn} />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />} />
            <Route path="/register" element={<Register />} />
            {(userRole === 'admin' || userRole === 'sadmin') && <Route path="/admin" element={<Admin />} />}
            <Route path="/portal" element={<GuestPortal />} />
          </Routes>
        </main>

        <footer className="footer" aria-label="Footer">
          <div className="footer-content">
            <p>&copy; 2024 Visawa Hotel & Resorts. All rights reserved.</p>
            <div className="footer-links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#contact">Contact Us</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
