import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Agar user pehle se logged in hai, toh Register page par aane par usey wapas dashboard par redirect kar do
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
    try {
      await axios.post('/api/users/register', formData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(10, 10, 10, 0.95)), url('https://images.unsplash.com/photo-1542314831-c53cd3816002?auto=format&fit=crop&w=1920&q=80') center/cover no-repeat fixed`, padding: '20px', fontFamily: 'Georgia, serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a1a, #0a0a0a)', padding: '40px 40px', borderRadius: '20px', width: '100%', maxWidth: '500px', border: '1px solid rgba(212,175,55,0.4)', boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.2)', position: 'relative' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <img src="/logo.png" alt="Visawa Logo" style={{ width: '80px', marginBottom: '10px', filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.5))' }} />
          <h2 style={{ color: '#d4af37', margin: '0 0 5px 0', fontSize: '1.8rem', textTransform: 'uppercase', letterSpacing: '3px' }}>Become a VIP</h2>
          <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem', letterSpacing: '1px', fontFamily: 'sans-serif' }}>Create your exclusive account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: 'sans-serif' }}>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <label style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} placeholder="Your name" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <label style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} placeholder="Your phone" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} placeholder="Enter your email" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} placeholder="Create a password" />
          </div>

          <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#111', padding: '15px', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer', marginTop: '5px', boxShadow: '0 5px 15px rgba(212,175,55,0.3)' }}>
            {loading ? 'Creating Account...' : 'Register Now'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#888', marginTop: '20px', fontSize: '0.9rem', fontFamily: 'sans-serif' }}>
          Already have an account? <Link to="/login" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 'bold', marginLeft: '5px' }}>Login Here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
