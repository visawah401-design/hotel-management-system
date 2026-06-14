import React, { useState, useEffect } from 'react';
import './GuestPortal.css';

function GuestPortal() {
  const [reservationId, setReservationId] = useState('');
  const [loggedInGuest, setLoggedInGuest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    // Portal page par global Navbar aur Footer ko hide karne ka logic
    const navbar = document.querySelector('.navbar');
    const footer = document.querySelector('.footer');
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';

    return () => {
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  useEffect(() => {
    // Agar login page se aaya hai, toh direct dashboard open ho jayega
    if (localStorage.getItem('token') === 'vip-guest-token') {
      const id = localStorage.getItem('userId');
      const allBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
      const profile = allBookings[id] || {};

      setLoggedInGuest({
        id: id,
        name: profile.name || localStorage.getItem('vip_name') || 'VIP Guest',
        room: profile.room || localStorage.getItem('vip_room') || 'Assigned Suite',
        photo: profile.photo || localStorage.getItem('vip_photo') || '',
        checkIn: profile.checkIn || localStorage.getItem('vip_checkIn') || 'N/A',
        checkOut: profile.checkOut || localStorage.getItem('vip_checkOut') || 'N/A',
        mobile: profile.mobile || localStorage.getItem('vip_mobile') || 'N/A',
        address: profile.address || 'Not available',
        guests: profile.guests || 1,
        paymentMethod: profile.paymentMethod || 'Not available',
        advance: profile.advance || 0,
        totalAmount: profile.totalAmount || 0,
        actualCheckOut: profile.actualCheckOut || null,
        checkoutAlert: profile.checkoutAlert || false,
        status: profile.status || (profile.actualCheckOut ? 'Checked-Out' : 'Checked-In')
      });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      const id = reservationId.toUpperCase();
      const allBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
      const profile = allBookings[id];

      if (profile) {
        setLoggedInGuest({
          id: id,
          name: profile.name,
          room: profile.room,
          photo: profile.photo,
          checkIn: profile.checkIn,
          checkOut: profile.checkOut,
          mobile: profile.mobile,
          address: profile.address,
          guests: profile.guests,
          paymentMethod: profile.paymentMethod,
          advance: profile.advance,
          totalAmount: profile.totalAmount,
          actualCheckOut: profile.actualCheckOut || null,
          checkoutAlert: profile.checkoutAlert || false,
          status: profile.status || (profile.actualCheckOut ? 'Checked-Out' : 'Checked-In')
        });
        localStorage.setItem('token', 'vip-guest-token');
        localStorage.setItem('userId', id);
      } else {
        alert('Invalid Reservation ID! No booking found for this Certificate ID.');
      }
      setLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setLoggedInGuest(null);
    setReservationId('');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    window.location.href = '/';
  };

  // Copy ID function for Certificate
  const handleCopyId = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
      alert('Certificate ID Copied!');
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Certificate ID Copied!');
      } catch (err) {
        alert('Copy failed! Please select and copy manually.');
      }
      document.body.removeChild(textArea);
    }
  };

  const hotelServices = [
    {
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>,
      title: 'In-Room Dining',
      image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
      desc: 'Choose from our premium restaurants and cafes. Food delivered directly to your room.',
      providers: [
        { name: 'Viswa Grand Restaurant', desc: 'Multi-cuisine fine dining (Indian, Chinese, Continental)', phone: '+919301783278', action: 'Order Lunch/Dinner' },
        { name: 'Sunrise Cafe & Bakery', desc: 'Fresh coffee, sandwiches, and bakery items', phone: '+919301783279', action: 'Order Breakfast' },
        { name: 'Midnight Cravings', desc: 'Late night fast-food and snacks (11 PM - 4 AM)', phone: '+919301783280', action: 'Night Order' },
        { name: 'Healthy Bowl Diet', desc: 'Fresh salads, juices, and low-calorie meals', phone: '+919301783281', action: 'Order Healthy' }
      ]
    },
    {
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path></svg>,
      title: 'Housekeeping & RO',
      image: 'https://images.unsplash.com/photo-1582719478250-c89af14cf758?auto=format&fit=crop&w=1200&q=80',
      desc: '24/7 Housekeeping services to keep your room fresh and clean.',
      providers: [
        { name: 'Room Cleaning Service', desc: 'Request full room cleaning and sanitization', phone: '+918962069176', action: 'Call Cleaner' },
        { name: 'Fresh RO Water', desc: 'Get fresh RO drinking water bottles delivered', phone: '+918962069176', action: 'Request Water' },
        { name: 'Laundry & Dry Clean', desc: 'Same-day clothes washing and ironing', phone: '+918962069177', action: 'Call Laundry' },
        { name: 'Extra Bed & Towels', desc: 'Request extra blankets, pillows or mattress', phone: '+918962069178', action: 'Request Items' }
      ]
    },
    {
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
      title: 'Medical Emergency',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
      desc: 'Top hospitals and clinics near Viswa Hotel for any immediate medical emergency.',
      providers: [
        { name: 'City Care Hospital', desc: '24/7 Multi-speciality hospital (2 km away)', phone: '108', action: 'Call Ambulance' },
        { name: 'Apollo Care Clinic', desc: 'General physician and OPD (1.5 km away)', phone: '+919000022222', action: 'Call Clinic' },
        { name: 'Sanjeevani Blood Bank', desc: '24/7 Blood bank and emergency testing', phone: '+919000033333', action: 'Call Lab' },
        { name: 'Dr. R. Sharma (On-call)', desc: 'General Physician on-call directly to hotel room', phone: '+919000044444', action: 'Call Doctor' }
      ]
    },
    {
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
      title: 'Pharmacy & Essentials',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      desc: 'Nearby shops and pharmacies for medicines and your daily essentials.',
      providers: [
        { name: 'Viswa 24/7 Pharmacy', desc: 'All general medicines available (Ground Floor)', phone: '+919000055555', action: 'Order Medicine' },
        { name: 'Daily Needs Supermart', desc: 'Snacks, toiletries, and packaged foods', phone: '+919000066666', action: 'Call Shop' },
        { name: 'Baby Care Store', desc: 'Diapers, baby food, and kids essentials', phone: '+919000077777', action: 'Call Store' },
        { name: 'Tech Fix Mobile Shop', desc: 'Chargers, earphones, and power banks', phone: '+919000088888', action: 'Call Tech Shop' }
      ]
    },
    {
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="8" rx="2" ry="2"></rect><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle><path d="M3 11l2-5h14l2 5"></path></svg>,
      title: 'Travel & Cab Desk',
      image: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80',
      desc: 'Explore the City of Lakes or book a comfortable drop to your next destination.',
      providers: [
        { name: 'Uber / Ola Booking', desc: 'Direct pickup from hotel lobby', phone: '+918962069176', action: 'Request Cab' },
        { name: 'Airport VIP Shuttle', desc: 'Luxury AC car drop to Raja Bhoj Airport', phone: '+918962069180', action: 'Book Shuttle' },
        { name: 'Bhopal City Tour', desc: 'Full day sightseeing (Lakes, Temples, Museums)', phone: '+918962069181', action: 'Book Tour Guide' },
        { name: 'Rent a Bike/Scooty', desc: '2-wheeler rentals for personal local travel', phone: '+918962069182', action: 'Call Rental' }
      ]
    },
    {
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>,
      title: 'Free VIP WiFi',
      image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      desc: 'Connect to our high-speed premium internet networks for uninterrupted browsing.',
      providers: [
        { name: 'Network: Viswa_VIP_5G', desc: 'For ultra-fast streaming and meetings. (Pass: vip@viswa)', phone: '#', action: 'Connect 5G' },
        { name: 'Network: Viswa_Lounge', desc: 'Available in restaurant and lobby area. (Pass: viswa123)', phone: '#', action: 'Connect WiFi' },
        { name: 'IT Support Desk', desc: 'Facing issues connecting to the network?', phone: '+919301783278', action: 'Call Support' }
      ]
    }
  ];

  if (!loggedInGuest) {
    return (
      <div className="portal-page">
        <div className="portal-login-container">
          <img src="/logo.png" alt="Hotel Logo" />
          <h2>Guest Portal</h2>
          <p>Please enter your VIP Reservation ID from your certificate to access services.</p>
          <form onSubmit={handleLogin}>
            <input type="text" className="portal-input" placeholder="e.g. VSW-123456" value={reservationId} onChange={(e) => setReservationId(e.target.value)} required />
            <button type="submit" className="portal-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Access My Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeService = hotelServices.find(s => s.title === activeTab);

  return (
    <div className="portal-layout">
      <style>
        {`
          @keyframes premiumSpin {
            100% { transform: rotate(360deg); }
          }
          @keyframes slideUpFade {
            0% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      {/* Left Sidebar */}
      <aside className="portal-sidebar">
        <div className="sidebar-profile">
          <img src={loggedInGuest.photo || '/logo.png'} alt="Profile" />
          <h2>{loggedInGuest.name}</h2>
          <span className="vip-badge">Elite VIP</span>
        </div>
        
        <div className="sidebar-details">
          <p><span>Room:</span> <strong>{loggedInGuest.room}</strong></p>
          <p><span>Check-in:</span> <strong>{loggedInGuest.checkIn}</strong></p>
          <p><span>Check-out:</span> <strong>{loggedInGuest.checkOut}</strong></p>
          <p><span>ID:</span> <strong>{loggedInGuest.id}</strong></p>
        </div>

        <nav className="sidebar-nav">
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            My Profile
          </button>
          {hotelServices.map((srv, idx) => (
            <button key={idx} className={activeTab === srv.title ? 'active' : ''} onClick={() => setActiveTab(srv.title)}>
              {srv.icon} {srv.title}
            </button>
          ))}
          <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
        </nav>
      </aside>

      {/* Right Main Content */}
      <main className="portal-main">
        <div className="portal-main-content">

          {/* Guest Checkout Alert Notification */}
          {loggedInGuest.checkoutAlert && !loggedInGuest.actualCheckOut && (
            <div style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid #e74c3c', padding: '20px', borderRadius: '12px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 5px 15px rgba(231, 76, 60, 0.2)', animation: 'slideUpFade 0.4s ease-out forwards' }}>
              <span style={{ fontSize: '2.5rem' }}>⏰</span>
              <div>
                <h3 style={{ color: '#e74c3c', margin: '0 0 5px 0', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Check-Out Reminder</h3>
                <p style={{ color: '#ddd', margin: 0, fontSize: '0.95rem' }}>Dear <strong>{loggedInGuest.name}</strong>, your scheduled check-out time has arrived. Please process your check-out by clicking the "Check Out Now" button in your profile, or contact the front desk.</p>
              </div>
            </div>
          )}

          <div className="dashboard-header">
            <div>
              <h1>Your Royal Experience Awaits</h1>
              <p>Explore exclusive services tailored for your stay.</p>
            </div>
          </div>

          {/* Dynamic Right Area Content */}
          <div key={activeTab} style={{ animation: 'slideUpFade 0.4s ease-out forwards' }}>
          {activeTab === 'profile' ? (
            <div style={{ background: 'rgba(25, 25, 25, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '20px', padding: '40px', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <h2 style={{ color: '#d4af37', fontSize: '2rem', margin: '0 0 30px 0', fontFamily: 'Georgia, serif' }}>Your Reservation Details</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '25px', marginBottom: '35px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Full Name</span>
                  <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{loggedInGuest.name}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Mobile Number</span>
                  <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{loggedInGuest.mobile}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Complete Address</span>
                  <strong style={{ fontSize: '1.1rem', color: '#ccc', lineHeight: '1.5' }}>{loggedInGuest.address}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Booked Room</span>
                  <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{loggedInGuest.room}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Reservation ID</span>
                  <strong style={{ fontSize: '1.2rem', color: '#d4af37', fontFamily: 'monospace' }}>{loggedInGuest.id}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Total Guests</span>
                  <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{loggedInGuest.guests} Person(s)</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Check-In Date</span>
                  <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{loggedInGuest.checkIn}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Planned Check-Out</span>
                  <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{loggedInGuest.checkOut}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Actual Check-Out Time</span>
                  {loggedInGuest.status === 'Pending' ? (
                    <strong style={{ fontSize: '1.2rem', color: '#f1c40f' }}>Waiting for Check-In</strong>
                  ) : loggedInGuest.status === 'Checked-Out' || loggedInGuest.actualCheckOut ? (
                    <strong style={{ fontSize: '1.2rem', color: '#27ae60' }}>{loggedInGuest.actualCheckOut || 'Checked Out'}</strong>
                  ) : (
                    <strong style={{ fontSize: '1rem', color: '#f39c12' }}>Please contact Front Desk for Check-Out</strong>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '12px', border: '1px dashed rgba(212,175,55,0.4)', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>Payment Method</span>
                  <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{loggedInGuest.paymentMethod}</strong>
                </div>
                <div>
                  <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>Advance Paid</span>
                  <strong style={{ fontSize: '1.1rem', color: '#27ae60' }}>₹{loggedInGuest.advance}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>Total Amount</span>
                  <strong style={{ fontSize: '1.5rem', color: '#d4af37' }}>₹{loggedInGuest.totalAmount}</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.2)', paddingTop: '30px' }}>
                <button onClick={() => setShowCertificate(true)} style={{ background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#111', padding: '16px 35px', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(212,175,55,0.4)', textTransform: 'uppercase', letterSpacing: '1px', transition: 'transform 0.2s' }}>
                  📜 View & Download VIP Pass
                </button>
              </div>
            </div>
          ) : activeService ? (
            <div style={{ background: 'rgba(25, 25, 25, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '20px', textAlign: 'left', color: '#fff', boxShadow: '0 15px 40px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
              <div style={{ height: '300px', background: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(25,25,25,1)), url(${activeService.image}) center/cover no-repeat` }}></div>
              <div style={{ padding: '0 40px 40px 40px', marginTop: '-60px', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #d4af37, #f3e5ab)', color: '#111', padding: '12px', borderRadius: '50%', display: 'flex', boxShadow: '0 5px 15px rgba(212,175,55,0.4)' }}>{activeService.icon}</div>
                  <h2 style={{ color: '#d4af37', fontSize: '2.6rem', margin: '0', fontFamily: 'Georgia, serif', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{activeService.title}</h2>
                </div>
                <p style={{ fontSize: '1.1rem', color: '#ddd', lineHeight: '1.6', marginBottom: '40px', maxWidth: '800px' }}>{activeService.desc}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                {activeService.providers && activeService.providers.map((provider, i) => (
                  <div key={i} style={{ background: 'rgba(15,15,15,0.8)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(212, 175, 55, 0.15)', transition: 'all 0.3s ease', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }} onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(212, 175, 55, 0.2)';}} onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.15)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';}}>
                    <h3 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '1.25rem', letterSpacing: '1px' }}>{provider.name}</h3>
                    <p style={{ color: '#aaa', margin: '0 0 20px 0', fontSize: '0.9rem', lineHeight: '1.4' }}>{provider.desc}</p>
                    <a href={provider.phone.startsWith('+') || provider.phone.length > 3 ? `tel:${provider.phone}` : provider.phone} style={{ display: 'inline-block', background: 'transparent', border: '1px solid #d4af37', color: '#d4af37', padding: '8px 20px', borderRadius: '25px', fontSize: '0.85rem', fontWeight: 'bold', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.3s ease' }} onMouseEnter={(e) => {e.target.style.background = '#d4af37'; e.target.style.color = '#111'}} onMouseLeave={(e) => {e.target.style.background = 'transparent'; e.target.style.color = '#d4af37'}}>
                      📞 {provider.action}
                    </a>
                  </div>
                ))}
              </div>
            </div>
            </div>
          ) : null}
          </div>

        </div>
      </main>

      {/* VIP Certificate Modal */}
      {showCertificate && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: `linear-gradient(rgba(0, 0, 0, 0.85), rgba(10, 10, 10, 0.95))`, zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', backdropFilter: 'blur(10px)', padding: '60px 20px 80px 20px', overflowY: 'auto' }}>
          <div style={{ background: '#0a0a0a', width: '100%', maxWidth: '850px', borderRadius: '8px', padding: '15px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.9), 0 0 80px rgba(212,175,55,0.35)', position: 'relative', margin: 'auto' }}>
            <div style={{ border: '2px solid #d4af37', outline: '4px solid #1a1a1a', outlineOffset: '-10px', padding: '40px 30px', position: 'relative', background: 'linear-gradient(135deg, #1a1a1a 0%, #080808 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
              
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/logo.png)', backgroundPosition: 'center', backgroundSize: '50%', backgroundRepeat: 'no-repeat', opacity: 0.04, pointerEvents: 'none', zIndex: 0 }}></div>
              
              <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'absolute', top: '-25px', left: '-15px', background: 'linear-gradient(90deg, #d4af37, #f3e5ab, #d4af37)', color: '#000', padding: '6px 20px', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '0 5px 15px rgba(212,175,55,0.4)', borderRadius: '2px' }}>ELITE VIP PASS</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
                  <img src="/logo.png" alt="Visawa Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0px 0px 15px rgba(212,175,55,0.6))' }} />
                  <div style={{ textAlign: 'left', borderLeft: '2px solid #d4af37', paddingLeft: '20px' }}>
                    <h1 style={{ color: '#d4af37', margin: 0, fontSize: '2.2rem', fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '4px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Viswa</h1>
                    <p style={{ color: '#aaa', margin: '4px 0 0 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '3px' }}>Hotel & Resorts</p>
                  </div>
                </div>

                <h2 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '1.8rem', fontFamily: 'Georgia, serif', letterSpacing: '3px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>WELCOME TO BHOPAL</h2>
                <p style={{ color: '#d4af37', fontStyle: 'italic', fontSize: '1.1rem', margin: '0 0 30px 0', letterSpacing: '2px', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif' }}>The City of Lakes</p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '35px', flexWrap: 'wrap', width: '100%', marginBottom: '35px', background: 'rgba(212,175,55,0.03)', padding: '25px', borderRadius: '15px', border: '1px dashed rgba(212,175,55,0.25)' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #fff, #d4af37)', zIndex: 0, animation: 'premiumSpin 5s linear infinite', opacity: 0.8 }}></div>
                    <img src={loggedInGuest.photo || '/logo.png'} alt="Guest" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #111', backgroundColor: '#111', position: 'relative', zIndex: 1, padding: loggedInGuest.photo ? '0' : '15px', boxShadow: '0 0 25px rgba(212,175,55,0.5)' }} />
                  </div>
                  
                  <div style={{ textAlign: 'left', maxWidth: '480px' }}>
                    <p style={{ color: '#e0c070', fontStyle: 'italic', fontSize: '1.1rem', margin: '0 0 10px 0', lineHeight: '1.5', fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive' }}>
                      This proudly certifies and recognizes that
                    </p>
                    <h3 style={{ color: '#d4af37', margin: '0 0 12px 0', fontSize: '2.4rem', fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 2px 10px rgba(212,175,55,0.5)' }}>{loggedInGuest.name}</h3>
                    <p style={{ color: '#bbb', fontSize: '0.95rem', margin: '0', lineHeight: '1.6', letterSpacing: '0.5px', fontFamily: 'Georgia, serif' }}>
                      is officially granted the status of an <strong style={{color: '#fff'}}>Elite VIP Guest</strong>. Prepare to experience unparalleled luxury, ultimate comfort, and truly Royal hospitality during your stay with us.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', padding: '0 10px', marginTop: '15px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Reservation Tracking</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#fff', fontSize: '1.1rem', letterSpacing: '2px', fontFamily: 'monospace' }}>{loggedInGuest.id}</strong>
                      <button onClick={() => handleCopyId(loggedInGuest.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} title="Copy ID">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      </button>
                    </div>
                    <div style={{ color: '#d4af37', fontSize: '1.2rem', letterSpacing: '3px', marginTop: '5px', opacity: 0.6 }}>|| | |||| || | || ||| ||</div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '75px', height: '75px', border: '2px dashed #d4af37', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', transform: 'rotate(-15deg)', color: '#d4af37', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'inset 0 0 10px rgba(212,175,55,0.2)' }}>Valid<br/>Pass</div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive', color: '#fff', fontSize: '1.5rem', marginBottom: '5px', opacity: 0.85 }}>V. Sharma</div>
                    <div style={{ borderBottom: '1px solid #d4af37', width: '150px', margin: '0 auto 8px auto' }}></div>
                    <p style={{ color: '#888', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => setShowCertificate(false)} style={{ background: 'transparent', color: '#fff', border: '1px solid #fff', padding: '14px 40px', borderRadius: '30px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s ease', marginTop: '30px' }}>
            Close View
          </button>
        </div>
      )}
    </div>
  );
}

export default GuestPortal;