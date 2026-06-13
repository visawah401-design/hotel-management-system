import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login({ setIsLoggedIn, setUserRole }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Agar user pehle se logged in hai, toh Login page par aane par usey wapas dashboard par redirect kar do
    if (localStorage.getItem('token')) {
      const role = localStorage.getItem('role');
      if (role === 'admin' || role === 'sadmin') {
        navigate('/admin', { replace: true });
      } else if (localStorage.getItem('token') === 'vip-guest-token') {
        navigate('/portal', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
      return;
    }

    // Sirf specific buttons (Home, Services, Gallery, Login) ko hide karna
    const elements = document.querySelectorAll('.navbar a, .navbar button, .navbar li');
    const hiddenElements = [];
    
    elements.forEach(el => {
      const text = el.textContent.trim();
      if (['Home', 'Services', 'Gallery', 'Login'].includes(text)) {
        el.style.display = 'none';
        hiddenElements.push(el);
      }
    });

    return () => {
      hiddenElements.forEach(el => {
        el.style.display = '';
      });
    };
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // VIP Admin Direct Login
    if (formData.email === 'admin' && formData.password === '55555') {
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem('userId', 'admin');
      localStorage.setItem('role', 'admin');
      setIsLoggedIn(true);
      setUserRole('admin');
      setLoading(false);
      navigate('/admin'); // Direct Admin Dashboard par bheje
      return;
    }

    // Super Admin (Sadmin) Direct Login
    if (formData.email === 'sadmin' && formData.password === '66666') {
      localStorage.setItem('token', 'sadmin-token');
      localStorage.setItem('userId', 'sadmin');
      localStorage.setItem('role', 'sadmin');
      setIsLoggedIn(true);
      setUserRole('sadmin');
      setLoading(false);
      navigate('/admin'); // Direct Admin Dashboard par bheje
      return;
    }

    // VIP Guest Direct Login (Agar password 123456 hai toh bina error ke portal par le jayega)
    if (formData.password === '123456') {
      localStorage.setItem('token', 'vip-guest-token');
      localStorage.setItem('userId', formData.email); // Certificate ID email field me hai
      localStorage.setItem('role', 'user');
      setIsLoggedIn(true);
      setUserRole('user');
      setLoading(false);
      navigate('/portal'); // Direct VIP Dashboard/Portal par bheje
      return;
    }

    try {
      const response = await axios.post('/api/users/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.user.id);
      localStorage.setItem('role', response.data.user.role);
      setIsLoggedIn(true);
      setUserRole(response.data.user.role);
      alert('Login successful!');
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(10, 10, 10, 0.95)), url('https://images.unsplash.com/photo-1542314831-c53cd3816002?auto=format&fit=crop&w=1920&q=80') center/cover no-repeat fixed`, padding: '20px', fontFamily: 'Georgia, serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a1a, #0a0a0a)', padding: '50px 40px', borderRadius: '20px', width: '100%', maxWidth: '450px', border: '1px solid rgba(212,175,55,0.4)', boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.2)', position: 'relative' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <img src="/logo.png" alt="Visawa Logo" style={{ width: '90px', marginBottom: '15px', filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.5))' }} />
          <h2 style={{ color: '#d4af37', margin: '0 0 5px 0', fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '3px' }}>Welcome Back</h2>
          <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem', letterSpacing: '1px', fontFamily: 'sans-serif' }}>Login to your VIP account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#ccc', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Certificate ID / Admin Username</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              placeholder="e.g. VSW-123456"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#ccc', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#111', padding: '16px', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 5px 15px rgba(212,175,55,0.3)' }}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
