import React, { useState, useEffect } from 'react';
import './Admin.css';

function Admin() {
  const [activeTab, setActiveTab] = useState(localStorage.getItem('role') === 'sadmin' ? 'analytics' : 'dashboard');
  const [bookings, setBookings] = useState([]);
  const [viewModal, setViewModal] = useState(null); // 'details' or 'bill'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Filters ke liye naye states
  const [filterStatus, setFilterStatus] = useState('All'); // All, Active, CheckedOut
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Staff Management State (Local Storage for Persistence)
  const [staffList, setStaffList] = useState(() => {
    const savedStaff = localStorage.getItem('hotel_staff');
    return savedStaff ? JSON.parse(savedStaff) : [
      { id: 1, staffId: 'EMP-101', name: 'Ramesh', role: 'Housekeeping', shift: '08:00 AM - 04:00 PM', status: 'Present', stats: { P: 22, A: 1, L: 0, H: 1 }, history: { '2026-05-28': 'Present', '2026-05-29': 'Present' } },
      { id: 2, staffId: 'EMP-102', name: 'Suresh', role: 'Reception', shift: '02:00 PM - 10:00 PM', status: 'Present', stats: { P: 24, A: 0, L: 0, H: 0 }, history: { '2026-05-28': 'Present', '2026-05-29': 'Present' } },
      { id: 3, staffId: 'EMP-103', name: 'Amit', role: 'Security', shift: '10:00 PM - 06:00 AM', status: 'Absent', stats: { P: 20, A: 3, L: 1, H: 0 }, history: { '2026-05-28': 'Present', '2026-05-29': 'Absent' } },
      { id: 4, staffId: 'EMP-104', name: 'Priya', role: 'Manager', shift: '09:00 AM - 05:00 PM', status: 'Leave', stats: { P: 21, A: 0, L: 3, H: 0 }, history: { '2026-05-28': 'Leave', '2026-05-29': 'Leave' } }
    ];
  });

  // Aaj ki date string (YYYY-MM-DD) history save karne ke liye
  const todayStr = new Date().toISOString().split('T')[0];

  const currentUserRole = localStorage.getItem('role'); // Sadmin check karne ke liye

  useEffect(() => {
    // Admin Dashboard page par aate hi global Navbar aur Footer ko hide karna
    const navbar = document.querySelector('.navbar');
    const footer = document.querySelector('.footer');
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';

    // Sadmin ke liye direct Analytics tab open karne ka logic
    if (localStorage.getItem('role') === 'sadmin') {
      setActiveTab('analytics');
    }

    // Load bookings from VIP Portal LocalStorage logic to show actual dynamic data
    const localBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
    const bookingsArray = Object.keys(localBookings).map(id => ({
      id,
      ...localBookings[id]
    }));
    
    setBookings(bookingsArray.reverse()); // Nayi booking upar dikhe

    return () => {
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    window.location.href = '/';
  };

  const handleAdminCheckIn = (id) => {
    if(window.confirm('Are you sure you want to Check-In this guest?')) {
      const now = new Date();
      const currentTime = now.toLocaleDateString('en-GB') + ' at ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      const allBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
      if(allBookings[id]) {
         allBookings[id].status = 'Checked-In';
         allBookings[id].actualCheckIn = currentTime;
         localStorage.setItem('vip_bookings', JSON.stringify(allBookings));
         setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Checked-In', actualCheckIn: currentTime } : b));
      }
    }
  };

  const handleAdminCheckOut = (id) => {
    if(window.confirm('Are you sure you want to Check-Out this guest?')) {
      const now = new Date();
      const currentTime = now.toLocaleDateString('en-GB') + ' at ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      const allBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
      if(allBookings[id]) {
         allBookings[id].status = 'Checked-Out';
         allBookings[id].actualCheckOut = currentTime;
         localStorage.setItem('vip_bookings', JSON.stringify(allBookings));
         setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Checked-Out', actualCheckOut: currentTime } : b));
      }
    }
  };

  // Deep System Reset Logic: Saara Data hatane ke liye (Nuclear Wipe)
  const handleResetData = () => {
    if (window.confirm("⚠️ WARNING: This will delete ALL bookings and make all rooms available again. Are you completely sure?")) {
      if (window.confirm("Are you REALLY sure? This action cannot be undone!")) {
        
        // Auth (Login) details ko save kar lete hain taaki admin logout na ho
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const userId = localStorage.getItem('userId');
        
        // Poora local storage saaf (Clear everything)
        localStorage.clear();
        
        // Auth wapas set kar do
        if(token) localStorage.setItem('token', token);
        if(role) localStorage.setItem('role', role);
        if(userId) localStorage.setItem('userId', userId);

        alert("All booking data has been permanently cleared. System is refreshing...");
        window.location.reload();
      }
    }
  };

  // Booking ko specifically delete karne ka logic
  const handleDeleteBooking = (id) => {
    if(window.confirm('Are you sure you want to permanently delete this booking?')) {
      const allBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
      delete allBookings[id];
      localStorage.setItem('vip_bookings', JSON.stringify(allBookings));
      setBookings(bookings.filter(b => b.id !== id));
    }
  };

  // Staff Attendance Update & Daily Record Logic
  const updateStaffStatus = (id, newStatus) => {
    const updatedStaff = staffList.map(staff => {
      if (staff.id === id) {
        const history = { ...(staff.history || {}) };
        const oldStatus = history[todayStr];
        const stats = { ...(staff.stats || { P: 0, A: 0, L: 0, H: 0 }) };

        // Agar aaj ki attendance pehle hi lag chuki hai, to purana status minus karein
        if (oldStatus === 'Present') stats.P -= 1;
        else if (oldStatus === 'Absent') stats.A -= 1;
        else if (oldStatus === 'Leave') stats.L -= 1;
        else if (oldStatus === 'Half Day') stats.H -= 1;

        // Naya status add karein
        if (newStatus === 'Present') stats.P += 1;
        else if (newStatus === 'Absent') stats.A += 1;
        else if (newStatus === 'Leave') stats.L += 1;
        else if (newStatus === 'Half Day') stats.H += 1;

        history[todayStr] = newStatus; // Aaj ke record me save karein
        return { ...staff, status: newStatus, stats, history };
      }
      return staff;
    });
    setStaffList(updatedStaff);
    localStorage.setItem('hotel_staff', JSON.stringify(updatedStaff));
  };

  // Guest ko portal par alert send karne ka logic
  const sendCheckoutReminder = (id) => {
    const allBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
    if(allBookings[id]) {
       allBookings[id].checkoutAlert = true;
       localStorage.setItem('vip_bookings', JSON.stringify(allBookings));
       setBookings(bookings.map(b => b.id === id ? { ...b, checkoutAlert: true } : b));
       alert(`Check-out reminder sent successfully to Guest (ID: ${id})!`);
    }
  };

  // Manual ID daal kar Alert send karne ka logic
  const handleManualAlert = () => {
    const targetId = window.prompt("Enter Reservation ID (e.g., VSW-123456) to send Check-Out Alert:");
    if (targetId) {
      const id = targetId.trim().toUpperCase();
      const allBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
      if(allBookings[id]) {
         allBookings[id].checkoutAlert = true;
         localStorage.setItem('vip_bookings', JSON.stringify(allBookings));
         setBookings(bookings.map(b => b.id === id ? { ...b, checkoutAlert: true } : b));
         alert(`Check-out reminder sent successfully to Guest (ID: ${id})!`);
      } else {
         alert('Error: No booking found with this Reservation ID.');
      }
    }
  };

  // Staff ko delete karne ka logic
  const deleteStaff = (id) => {
    if(window.confirm('Are you sure you want to permanently remove this staff member?')) {
      const updatedStaff = staffList.filter(staff => staff.id !== id);
      setStaffList(updatedStaff);
      localStorage.setItem('hotel_staff', JSON.stringify(updatedStaff));
    }
  };

  // Bookings filter karne ka logic
  const displayedBookings = bookings.filter(b => {
    const st = b.status || (b.actualCheckOut ? 'Checked-Out' : 'Checked-In');
    // Status Filter
    if (filterStatus === 'Active' && st === 'Checked-Out') return false;
    if (filterStatus === 'CheckedOut' && st !== 'Checked-Out') return false;
    
    // Date Filter (Naye datetime-local ya purane date ke aadhar par)
    const bDate = b.rawCheckIn ? b.rawCheckIn.split('T')[0] : (b.checkIn ? b.checkIn.split('T')[0] : '');
    if (dateFrom && bDate < dateFrom) return false;
    if (dateTo && bDate > dateTo) return false;
    
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Booking ID', 'Guest Name', 'Mobile', 'Room', 'Check-In', 'Check-Out', 'Actual Check-Out', 'Total Amount (Rs)', 'Advance (Rs)', 'Payment Method'];
    const rows = displayedBookings.map(b => [b.id, `"${b.name}"`, b.mobile, `"${b.room}"`, b.checkIn, b.checkOut, b.actualCheckOut || 'Pending', b.totalAmount, b.advance, b.paymentMethod]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Viswa_Bookings_${new Date().toLocaleDateString('en-GB')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics Logic (Revenue, Expenses & Profit)
  const totalRev = displayedBookings.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
  const todayRev = displayedBookings.filter(b => {
    const dStr = b.rawCheckIn ? b.rawCheckIn.split('T')[0] : (b.checkIn ? b.checkIn.split('T')[0] : '');
    return dStr === todayStr;
  }).reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
  
  const lastWeek = new Date(); 
  lastWeek.setDate(lastWeek.getDate() - 7);
  const weekRev = displayedBookings.filter(b => {
    const dStr = b.rawCheckIn ? b.rawCheckIn : b.checkIn;
    return new Date(dStr) >= lastWeek;
  }).reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);

  const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const monthRev = displayedBookings.filter(b => {
    const dStr = b.rawCheckIn ? b.rawCheckIn : (b.checkIn || '');
    return dStr.startsWith(thisMonthStr);
  }).reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);

  const totalBills = displayedBookings.length;
  const totalGuests = displayedBookings.reduce((acc, curr) => acc + (Number(curr.guests) || 1), 0);
  const avgBookingValue = totalBills > 0 ? Math.round(monthRev / totalBills) : 0;
  
  const activeOccupancyCount = bookings.filter(b => {
    const st = b.status || (b.actualCheckOut ? 'Checked-Out' : 'Checked-In');
    return st === 'Checked-In' || st === 'Pending';
  }).length;
  const estOccupancy = Math.min(100, Math.round((activeOccupancyCount / 35) * 100) || 0);

  // Mocking realistic expenses based on revenue
  const totalExp = monthRev > 0 ? Math.floor(monthRev * 0.35) + 15000 : 15000;
  const netProfit = monthRev - totalExp;
  const profitMargin = monthRev > 0 ? Math.round((netProfit / monthRev) * 100) : 0;

  const expensesBreakdown = [
    { category: 'Staff Salary', amount: Math.floor(totalExp * 0.40), color: '#3498db' },
    { category: 'Maintenance & Repairs', amount: Math.floor(totalExp * 0.25), color: '#e67e22' },
    { category: 'Electricity & Water', amount: Math.floor(totalExp * 0.20), color: '#f1c40f' },
    { category: 'Marketing & Ads', amount: Math.floor(totalExp * 0.15), color: '#9b59b6' },
  ];

  const revenueSources = [
    { category: 'Room Bookings', amount: Math.floor(monthRev * 0.75), color: '#2ecc71' },
    { category: 'Food & Dining', amount: Math.floor(monthRev * 0.15), color: '#f39c12' },
    { category: 'Spa & Extra Services', amount: Math.floor(monthRev * 0.10), color: '#9b59b6' },
  ];

  // New Advanced Analytics Data Calculations
  const roomStats = {};
  displayedBookings.forEach(b => {
    const type = b.room ? b.room.split(' (')[0] : 'Other';
    roomStats[type] = (roomStats[type] || 0) + 1;
  });
  const roomPopularity = Object.keys(roomStats).map(key => ({ name: key, count: roomStats[key] })).sort((a,b) => b.count - a.count).slice(0, 4);
  const maxRoomCount = Math.max(...roomPopularity.map(r => r.count), 1);

  const paymentStats = { 'UPI': 0, 'Card': 0, 'Cash': 0 };
  displayedBookings.forEach(b => {
    if (b.paymentMethod && b.paymentMethod.toUpperCase().includes('UPI')) paymentStats['UPI']++;
    else if (b.paymentMethod && (b.paymentMethod.toUpperCase().includes('CARD') || b.paymentMethod.toUpperCase().includes('DEBIT'))) paymentStats['Card']++;
    else paymentStats['Cash']++;
  });
  const totalPayments = displayedBookings.length || 1;

  const daysWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mockOccupancy = [45, 55, 60, 50, 85, 95, 80]; // Mock week data

  return (
    <div className="admin-layout">
      {/* Left Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/logo.png" alt="Visawa Logo" />
          <h2>Admin Panel</h2>
        </div>
        
        <nav className="admin-nav">
          {currentUserRole === 'sadmin' && (
            <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
              📈 Business Analytics
            </button>
          )}
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            📊 Dashboard Overview
          </button>
          <button className={activeTab === 'bookings' ? 'active' : ''} onClick={() => setActiveTab('bookings')}>
            🧾 All Bookings
          </button>
          <button className={activeTab === 'rooms' ? 'active' : ''} onClick={() => setActiveTab('rooms')}>
            🛏️ Manage Rooms
          </button>
          <button className={activeTab === 'guests' ? 'active' : ''} onClick={() => setActiveTab('guests')}>
            👥 VIP Guests
          </button>
          <button className={activeTab === 'staff' ? 'active' : ''} onClick={() => setActiveTab('staff')}>
            👔 Staff Management
          </button>
          
          <div style={{ flex: 1 }}></div>
          
          <button onClick={handleLogout} style={{ color: '#e74c3c', border: '1px solid #e74c3c', justifyContent: 'center', fontWeight: 'bold' }}>
            🚪 Secure Logout
          </button>
        </nav>
      </aside>

      {/* Right Main Content */}
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1>Welcome, Administrator</h1>
            <p style={{ color: '#aaa', fontFamily: 'sans-serif', margin: '5px 0 0 0' }}>Here is what's happening at Viswa Hotel & Resorts today.</p>
          </div>
          <div className="admin-profile">
            <img src="/logo.png" alt="Admin" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff' }} />
            <div>
              <strong style={{ display: 'block', color: '#d4af37', fontSize: '0.95rem', textShadow: currentUserRole === 'sadmin' ? '0 0 10px rgba(212,175,55,0.8)' : 'none' }}>{currentUserRole === 'sadmin' ? '👑 Executive Owner' : 'Hotel Admin'}</strong>
              <span style={{ color: '#2ecc71', fontSize: '0.8rem', fontWeight: 'bold' }}>● Online</span>
            </div>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {/* Premium Quick Actions */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '35px', flexWrap: 'wrap' }}>
              <button onClick={() => setActiveTab('bookings')} style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37', padding: '20px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s' }}>
                📅 Manage Bookings
              </button>
              <button onClick={() => setActiveTab('staff')} style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.15), rgba(52, 152, 219, 0.05))', border: '1px solid rgba(52, 152, 219, 0.3)', color: '#3498db', padding: '20px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s' }}>
                👔 Manage Staff
              </button>
              <button onClick={handleManualAlert} style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.15), rgba(243, 156, 18, 0.05))', border: '1px solid rgba(243, 156, 18, 0.3)', color: '#f39c12', padding: '20px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s' }}>
                🔔 Send Guest Alert
              </button>
              <button onClick={handleResetData} style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.15), rgba(231, 76, 60, 0.05))', border: '1px solid rgba(231, 76, 60, 0.3)', color: '#e74c3c', padding: '20px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s' }}>
                ⚠️ Reset Data
              </button>
            </div>

            {/* Live Performance / Progress Bars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '35px' }}>
              <div className="stat-card" style={{ padding: '30px' }}>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom: '20px', color: '#fff' }}>Hotel Occupancy</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '2.5rem', color: '#fff', fontWeight: 'bold' }}>{Math.min(100, Math.round((bookings.filter(b => !b.actualCheckOut).length / 35) * 100) || 0)}<small style={{fontSize:'1.2rem', color:'#888'}}>%</small></span>
                  <span style={{ color: '#aaa', fontSize: '1rem', marginBottom: '8px', fontWeight: 'bold' }}>{activeOccupancyCount} / 35 Rooms</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.5)', height: '10px', borderRadius: '5px', marginTop: '15px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ background: 'linear-gradient(90deg, #d4af37, #f3e5ab)', height: '100%', width: `${estOccupancy}%`, borderRadius: '5px', boxShadow: '0 0 10px rgba(212,175,55,0.5)' }}></div>
                </div>
              </div>

              <div className="stat-card" style={{ padding: '30px' }}>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom: '20px', color: '#fff' }}>Staff Availability</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '2.5rem', color: '#fff', fontWeight: 'bold' }}>{Math.round((staffList.filter(s => s.status === 'Present').length / staffList.length) * 100) || 0}<small style={{fontSize:'1.2rem', color:'#888'}}>%</small></span>
                  <span style={{ color: '#aaa', fontSize: '1rem', marginBottom: '8px', fontWeight: 'bold' }}>{staffList.filter(s => s.status === 'Present').length} / {staffList.length} Present</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.5)', height: '10px', borderRadius: '5px', marginTop: '15px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ background: 'linear-gradient(90deg, #2ecc71, #27ae60)', height: '100%', width: `${Math.round((staffList.filter(s => s.status === 'Present').length / staffList.length) * 100) || 0}%`, borderRadius: '5px', boxShadow: '0 0 10px rgba(46,204,113,0.5)' }}></div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Bookings</h3>
                <p className="value">{bookings.length}</p>
              </div>
              <div className="stat-card">
                <h3>Available Rooms</h3>
                <p className="value">12</p>
              </div>
              <div className="stat-card">
                <h3>Pending Check-outs</h3>
                <p className="value" style={{ color: '#e74c3c' }}>{bookings.filter(b => {
                  const st = b.status || (b.actualCheckOut ? 'Checked-Out' : 'Checked-In');
                  return st === 'Checked-In';
                }).length}</p>
              </div>
              <div className="stat-card">
                <h3>Active Staff</h3>
                <p className="value" style={{ color: '#3498db' }}>{staffList.filter(s => s.status === 'Present').length}</p>
              </div>
            </div>

            {/* Recent Bookings Table */}
            <h2 style={{ color: '#d4af37', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '15px', marginBottom: '20px' }}>Recent VIP Bookings</h2>
            <table className="admin-table">
              <thead>
                <tr style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', textAlign: 'left' }}>
                  <th style={{ padding: '15px 20px' }}>Booking ID</th>
                  <th style={{ padding: '15px 20px' }}>Guest Name</th>
                  <th style={{ padding: '15px 20px' }}>Room details</th>
                  <th style={{ padding: '15px 20px' }}>Check-In</th>
                  <th style={{ padding: '15px 20px' }}>Status</th>
                  <th style={{ padding: '15px 20px' }}>Amount</th>
                  <th style={{ padding: '15px 20px', textAlign: 'center' }}>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? bookings.slice(0, 5).map((booking, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ccc' }}>
                    <td style={{ padding: '15px 20px', fontFamily: 'monospace', color: '#fff' }}>{booking.id}</td>
                    <td style={{ padding: '15px 20px' }}>{booking.name}</td>
                    <td style={{ padding: '15px 20px' }}>{booking.room}</td>
                    <td style={{ padding: '15px 20px' }}>{booking.checkIn}</td>
                    <td style={{ padding: '15px 20px' }}>
                      {(() => {
                        const st = booking.status || (booking.actualCheckOut ? 'Checked-Out' : 'Checked-In');
                        let bg = 'rgba(39, 174, 96, 0.2)', col = '#27ae60';
                        if (st === 'Pending') { bg = 'rgba(241, 196, 15, 0.2)'; col = '#f1c40f'; }
                        else if (st === 'Checked-Out') { bg = 'rgba(231, 76, 60, 0.2)'; col = '#e74c3c'; }
                        return (
                          <span style={{ background: bg, color: col, padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>{st}</span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '15px 20px', color: '#d4af37', fontWeight: 'bold' }}>₹{booking.totalAmount}</td>
                    <td style={{ padding: '15px 20px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {(() => {
                        const st = booking.status || (booking.actualCheckOut ? 'Checked-Out' : 'Checked-In');
                        if (st === 'Pending') {
                          return <button onClick={() => handleAdminCheckIn(booking.id)} style={{background: 'rgba(39, 174, 96, 0.1)', color: '#27ae60', border: '1px solid #27ae60', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s'}}>✅ Check-In</button>;
                        } else if (st === 'Checked-In') {
                          return <button onClick={() => handleAdminCheckOut(booking.id)} style={{background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s'}}>🚪 Check-Out</button>;
                        } else {
                          return <span style={{color: '#888', fontSize: '0.85rem'}}>Completed</span>;
                        }
                      })()}
                      <button onClick={() => handleDeleteBooking(booking.id)} style={{background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', transition: '0.3s'}} title="Delete Booking">🗑️</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No recent bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'bookings' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ color: '#d4af37', margin: 0 }}>All Bookings Record</h2>
              <button onClick={handleManualAlert} style={{ background: 'rgba(243, 156, 18, 0.2)', color: '#f39c12', border: '1px solid #f39c12', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}>
                🔔 Send Alert by ID
              </button>
            </div>
            
            {/* Premium Filter Controls */}
            <div style={{ background: 'rgba(20,20,20,0.8)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '25px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setFilterStatus('All')} style={{ background: filterStatus === 'All' ? 'rgba(52, 152, 219, 0.2)' : 'transparent', color: filterStatus === 'All' ? '#3498db' : '#aaa', border: '1px solid #3498db', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>All Bookings</button>
                <button onClick={() => setFilterStatus('Active')} style={{ background: filterStatus === 'Active' ? 'rgba(231, 76, 60, 0.2)' : 'transparent', color: filterStatus === 'Active' ? '#e74c3c' : '#aaa', border: '1px solid #e74c3c', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Active (In-Hotel)</button>
                <button onClick={() => setFilterStatus('CheckedOut')} style={{ background: filterStatus === 'CheckedOut' ? 'rgba(39, 174, 96, 0.2)' : 'transparent', color: filterStatus === 'CheckedOut' ? '#27ae60' : '#aaa', border: '1px solid #27ae60', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Checked-Out</button>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#888', fontSize: '0.85rem', fontWeight: 'bold' }}>FROM:</span><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #555', background: '#111', color: '#fff', outline: 'none' }} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#888', fontSize: '0.85rem', fontWeight: 'bold' }}>TO:</span><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #555', background: '#111', color: '#fff', outline: 'none' }} /></div>
                <button onClick={exportToCSV} style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(39, 174, 96, 0.3)', transition: '0.3s' }}>
                  📥 Download Excel / CSV
                </button>
              </div>
            </div>

            <table className="admin-table">
              <thead>
                <tr style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', textAlign: 'left' }}>
                  <th style={{ padding: '15px' }}>ID</th>
                  <th style={{ padding: '15px' }}>Guest Name</th>
                  <th style={{ padding: '15px' }}>Room</th>
                  <th style={{ padding: '15px' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedBookings.length > 0 ? displayedBookings.map((booking, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ccc' }}>
                    <td style={{ padding: '15px', fontFamily: 'monospace', color: '#fff' }}>{booking.id}</td>
                    <td style={{ padding: '15px' }}>{booking.name}<br/><small style={{color:'#888'}}>{booking.mobile}</small></td>
                    <td style={{ padding: '15px' }}>{booking.room}</td>
                    <td style={{ padding: '15px' }}>
                      {(() => {
                        const st = booking.status || (booking.actualCheckOut ? 'Checked-Out' : 'Checked-In');
                        let col = '#27ae60';
                        if (st === 'Pending') col = '#f1c40f';
                        else if (st === 'Checked-Out') col = '#e74c3c';
                        return <span style={{ color: col, fontSize: '0.85rem', fontWeight: 'bold' }}>{st}</span>;
                      })()}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {(() => {
                        const st = booking.status || (booking.actualCheckOut ? 'Checked-Out' : 'Checked-In');
                        const isCheckoutPastOrToday = booking.rawCheckOut ? booking.rawCheckOut.split('T')[0] <= todayStr : booking.checkOut <= todayStr;
                        return (
                          <>
                            <button className="admin-btn-action view" onClick={() => { setSelectedBooking(booking); setViewModal('details'); }}>👁️ View</button>
                            <button className="admin-btn-action bill" onClick={() => { setSelectedBooking(booking); setViewModal('bill'); }}>📄 Bill</button>
                            {st === 'Pending' && (
                              <button className="admin-btn-action" style={{background: 'rgba(39, 174, 96, 0.1)', color: '#27ae60', border: '1px solid #27ae60'}} onClick={() => handleAdminCheckIn(booking.id)}>✅ Check-In</button>
                            )}
                            {st === 'Checked-In' && (
                              <button className="admin-btn-action checkout" onClick={() => handleAdminCheckOut(booking.id)}>🚪 Check-Out</button>
                            )}
                            {(st === 'Pending' || st === 'Checked-In') && isCheckoutPastOrToday && (
                              <button className="admin-btn-action" style={{ background: 'rgba(243, 156, 18, 0.2)', color: '#f39c12', border: '1px solid #f39c12' }} onClick={() => sendCheckoutReminder(booking.id)}>
                                 {booking.checkoutAlert ? '🔔 Reminder Sent' : '🔔 Send Alert'}
                              </button>
                            )}
                            <button className="admin-btn-action" style={{background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid #e74c3c'}} onClick={() => handleDeleteBooking(booking.id)}>🗑️ Delete</button>
                          </>
                        );
                      })()}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ padding: '25px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>No bookings found for the selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'staff' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ color: '#d4af37', margin: 0 }}>Staff Management</h2>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => setViewModal('report')} style={{ background: 'rgba(52, 152, 219, 0.2)', color: '#3498db', border: '1px solid #3498db', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📊 View Monthly Report
                </button>
                <button style={{ background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#111', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  + Add New Staff
                </button>
              </div>
            </div>

            {/* Staff Attendance Table */}
            <table className="admin-table">
              <thead>
                <tr style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', textAlign: 'left' }}>
                  <th style={{ padding: '15px' }}>Staff Name</th>
                  <th style={{ padding: '15px' }}>Role</th>
                  <th style={{ padding: '15px' }}>Shift Timings</th>
                  <th style={{ padding: '15px' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Mark Attendance</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ccc' }}>
                    <td style={{ padding: '15px', color: '#fff', fontWeight: 'bold' }}>
                      👔 {staff.name}<br/>
                      <small style={{ color: '#888', fontWeight: 'normal' }}>ID: {staff.staffId}</small>
                    </td>
                    <td style={{ padding: '15px', color: '#d4af37' }}>{staff.role}</td>
                    <td style={{ padding: '15px' }}>{staff.shift}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ background: staff.status === 'Present' ? 'rgba(39, 174, 96, 0.2)' : staff.status === 'Absent' ? 'rgba(231, 76, 60, 0.2)' : staff.status === 'Half Day' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(241, 196, 15, 0.2)', color: staff.status === 'Present' ? '#27ae60' : staff.status === 'Absent' ? '#e74c3c' : staff.status === 'Half Day' ? '#3498db' : '#f1c40f', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {staff.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => updateStaffStatus(staff.id, 'Present')} style={{ background: 'rgba(39, 174, 96, 0.2)', color: '#27ae60', border: '1px solid #27ae60', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Present</button>
                      <button onClick={() => updateStaffStatus(staff.id, 'Half Day')} style={{ background: 'rgba(52, 152, 219, 0.2)', color: '#3498db', border: '1px solid #3498db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Half Day</button>
                      <button onClick={() => updateStaffStatus(staff.id, 'Absent')} style={{ background: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Absent</button>
                      <button onClick={() => updateStaffStatus(staff.id, 'Leave')} style={{ background: 'rgba(241, 196, 15, 0.2)', color: '#f1c40f', border: '1px solid #f1c40f', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Leave</button>
                      <button onClick={() => { setSelectedStaff(staff); setViewModal('staff_history'); }} style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid #666', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>📜 Record</button>
                      <button onClick={() => deleteStaff(staff.id)} style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>🗑️ Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'analytics' && currentUserRole === 'sadmin' && (
          <div style={{ animation: 'slideUpFade 0.4s ease' }} id="printable-analytics">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }} className="analytics-header">
              <div>
                <h2 style={{ color: '#d4af37', margin: 0, fontSize: '2.4rem', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 2px 10px rgba(212,175,55,0.3)' }}>Business Intelligence</h2>
                <p style={{ color: '#aaa', margin: '5px 0 0 0', fontSize: '1rem', letterSpacing: '1px' }}>Executive Financial & Operations Overview</p>
              </div>
              <button className="print-btn" onClick={() => window.print()} style={{ background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#111', border: 'none', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 5px 15px rgba(212,175,55,0.3)', fontSize: '1.1rem' }}>
                📥 Download Report
              </button>
            </div>

            {/* Premium KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div className="sadmin-kpi-card">
                <span className="kpi-icon">🧾</span>
                <div><p>Total Bookings</p><h3>{totalBills}</h3></div>
              </div>
              <div className="sadmin-kpi-card">
                <span className="kpi-icon">👥</span>
                <div><p>Total Guests Hosted</p><h3>{totalGuests}</h3></div>
              </div>
              <div className="sadmin-kpi-card">
                <span className="kpi-icon">🏨</span>
                <div><p>Est. Occupancy</p><h3>{estOccupancy}%</h3></div>
              </div>
              <div className="sadmin-kpi-card">
                <span className="kpi-icon">💳</span>
                <div><p>Avg. Booking Value</p><h3>₹{avgBookingValue.toLocaleString()}</h3></div>
              </div>
            </div>

            {/* Master Finance Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', marginBottom: '40px' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(39, 174, 96, 0.15), rgba(15,15,15,0.9))', border: '1px solid rgba(39, 174, 96, 0.3)', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <p style={{ color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>Monthly Revenue</p>
                <h3 style={{ color: '#2ecc71', fontSize: '2.2rem', margin: 0 }}>₹{monthRev.toLocaleString()} <span style={{fontSize: '0.9rem', color: '#2ecc71', background: 'rgba(46, 204, 113, 0.2)', padding: '4px 10px', borderRadius: '20px', verticalAlign: 'middle', marginLeft: '10px'}}>+14.2% 📈</span></h3>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.15), rgba(15,15,15,0.9))', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <p style={{ color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>Total Expenses (Kharcha)</p>
                <h3 style={{ color: '#e74c3c', fontSize: '2.2rem', margin: 0 }}>₹{totalExp.toLocaleString()}</h3>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(15,15,15,0.9))', border: '1px solid rgba(212, 175, 55, 0.5)', padding: '30px', borderRadius: '15px', boxShadow: '0 15px 40px rgba(212,175,55,0.15)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '8rem', opacity: '0.1' }}>💰</div>
                <p style={{ color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0', fontWeight: 'bold' }}>Net Monthly Profit</p>
                <h3 style={{ color: '#fff', fontSize: '2.8rem', margin: 0, textShadow: '0 2px 10px rgba(212,175,55,0.5)' }}>₹{netProfit.toLocaleString()}</h3>
              </div>
            </div>

            {/* Graphical Analysis Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px', marginBottom: '40px' }}>
              
              {/* Timeline Bar Chart */}
              <div style={{ background: 'rgba(20,20,20,0.8)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginTop: 0, display: 'flex', justifyContent: 'space-between' }}><span>Revenue Timeline Analysis</span> <span style={{fontSize:'1rem', color:'#888'}}>📊</span></h3>
                <div className="chart-container" style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '20px', marginTop: '30px', paddingBottom: '10px' }}>
                  {/* Today Bar */}
                  <div className="chart-bar-group">
                    <div className="chart-val">₹{todayRev.toLocaleString()}</div>
                    <div className="chart-bar" style={{ height: `${Math.max(15, Math.min(100, (todayRev/monthRev)*100 || 0))}%`, background: '#3498db' }}></div>
                    <div className="chart-label">Daily (Today)</div>
                  </div>
                  {/* Week Bar */}
                  <div className="chart-bar-group">
                    <div className="chart-val">₹{weekRev.toLocaleString()}</div>
                    <div className="chart-bar" style={{ height: `${Math.max(25, Math.min(100, (weekRev/monthRev)*100 || 0))}%`, background: '#9b59b6' }}></div>
                    <div className="chart-label">Weekly</div>
                  </div>
                  {/* Month/Total Bar */}
                  <div className="chart-bar-group">
                    <div className="chart-val">₹{monthRev.toLocaleString()}</div>
                    <div className="chart-bar" style={{ height: '100%', background: 'linear-gradient(to top, #27ae60, #2ecc71)' }}></div>
                    <div className="chart-label">Monthly</div>
                  </div>
                  {/* Total Bar */}
                  <div className="chart-bar-group">
                    <div className="chart-val">₹{totalRev.toLocaleString()}</div>
                    <div className="chart-bar" style={{ height: '100%', background: 'linear-gradient(to top, #b5952f, #d4af37)', opacity: 0.9 }}></div>
                    <div className="chart-label">Total All-Time</div>
                  </div>
                </div>
              </div>

              {/* Expenses Breakdown Horizontal Bars */}
              <div style={{ background: 'rgba(20,20,20,0.8)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginTop: 0, display: 'flex', justifyContent: 'space-between' }}><span>Expense Breakdown (Kharcha)</span> <span style={{fontSize:'1rem', color:'#888'}}>📉</span></h3>
                <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {expensesBreakdown.map((exp, i) => {
                    const percentage = Math.round((exp.amount / totalExp) * 100) || 0;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#ccc', fontWeight: 'bold' }}>{exp.category}</span>
                          <span style={{ color: '#fff' }}>₹{exp.amount.toLocaleString()} ({percentage}%)</span>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.5)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ background: exp.color, width: `${percentage}%`, height: '100%', borderRadius: '6px', boxShadow: `0 0 10px ${exp.color}88` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Profit Margin Donut Chart */}
              <div style={{ background: 'rgba(20,20,20,0.8)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3 style={{ color: '#fff', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginTop: 0, display: 'flex', justifyContent: 'space-between' }}><span>Profit Margin Health</span> <span style={{fontSize:'1rem', color:'#888'}}>🎯</span></h3>
                <div style={{ display: 'flex', gap: '40px', alignItems: 'center', marginTop: '20px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {/* CSS Conic Gradient Donut Chart */}
                  <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: `conic-gradient(#d4af37 ${profitMargin}%, rgba(255,255,255,0.05) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(212,175,55,0.15)' }}>
                    <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: '#141414', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)' }}>
                      <span style={{ fontSize: '2.5rem', color: '#fff', fontWeight: 'bold' }}>{profitMargin}%</span>
                      <span style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Margin</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ background: 'rgba(212,175,55,0.1)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #d4af37' }}>
                      <small style={{ color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Net Profit</small><br/>
                      <strong style={{ color: '#fff', fontSize: '1.2rem' }}>₹{netProfit.toLocaleString()}</strong>
                    </div>
                    <div style={{ background: 'rgba(231,76,60,0.1)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
                      <small style={{ color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Expense</small><br/>
                      <strong style={{ color: '#fff', fontSize: '1.2rem' }}>₹{totalExp.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Sources Breakdown */}
              <div style={{ background: 'rgba(20,20,20,0.8)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginTop: 0, display: 'flex', justifyContent: 'space-between' }}><span>Revenue Sources</span> <span style={{fontSize:'1rem', color:'#888'}}>💸</span></h3>
                <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {revenueSources.map((source, i) => {
                    const percentage = Math.round((source.amount / monthRev) * 100) || 0;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#ccc', fontWeight: 'bold' }}>{source.category}</span>
                          <span style={{ color: '#fff' }}>₹{source.amount.toLocaleString()} ({percentage}%)</span>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.5)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ background: source.color, width: `${percentage}%`, height: '100%', borderRadius: '6px', boxShadow: `0 0 10px ${source.color}88` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Advanced Graphical Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '40px' }}>
              
              {/* 7-Day Occupancy Trend */}
              <div style={{ background: 'rgba(20,20,20,0.8)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginTop: 0, display: 'flex', justifyContent: 'space-between' }}><span>7-Day Occupancy Trend</span> <span style={{fontSize:'1rem', color:'#888'}}>📈</span></h3>
                <div className="chart-container" style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '10px', marginTop: '30px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {daysWeek.map((day, i) => (
                    <div key={day} className="chart-bar-group" style={{ gap: '5px' }}>
                      <div className="chart-val" style={{fontSize: '0.75rem', color: '#ccc', marginBottom: 0}}>{mockOccupancy[i]}%</div>
                      <div className="chart-bar" style={{ height: `${mockOccupancy[i]}%`, background: i > 4 ? 'linear-gradient(to top, #c0392b, #e74c3c)' : 'linear-gradient(to top, #2980b9, #3498db)', width: '25px', opacity: 0.85, borderRadius: '4px 4px 0 0' }}></div>
                      <div className="chart-label" style={{fontSize: '0.7rem', marginTop: '5px'}}>{day}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Type Popularity */}
              <div style={{ background: 'rgba(20,20,20,0.8)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginTop: 0, display: 'flex', justifyContent: 'space-between' }}><span>Room Popularity</span> <span style={{fontSize:'1rem', color:'#888'}}>🛏️</span></h3>
                <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {roomPopularity.map((room, i) => {
                    const percentage = Math.round((room.count / maxRoomCount) * 100);
                    const colors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#ccc', fontWeight: 'bold', fontSize: '0.9rem' }}>{room.name}</span>
                          <span style={{ color: '#fff', fontSize: '0.9rem' }}>{room.count} Bookings</span>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.5)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ background: colors[i%colors.length], width: `${percentage}%`, height: '100%', borderRadius: '5px', boxShadow: `0 0 10px ${colors[i%colors.length]}88` }}></div>
                        </div>
                      </div>
                    )
                  })}
                  {roomPopularity.length === 0 && <p style={{color: '#888', textAlign: 'center', marginTop: '20px'}}>No booking data available.</p>}
                </div>
              </div>

              {/* Payment Methods */}
              <div style={{ background: 'rgba(20,20,20,0.8)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginTop: 0, display: 'flex', justifyContent: 'space-between' }}><span>Payment Modes</span> <span style={{fontSize:'1rem', color:'#888'}}>💳</span></h3>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: 'auto', marginBottom: 'auto', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                  {Object.keys(paymentStats).map((key) => {
                    const pct = Math.round((paymentStats[key] / totalPayments) * 100) || 0;
                    const colors = { 'UPI': '#3498db', 'Card': '#9b59b6', 'Cash': '#2ecc71' };
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `conic-gradient(${colors[key]} ${pct}%, rgba(255,255,255,0.05) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 15px ${colors[key]}44` }}>
                          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)' }}>
                            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{pct}%</span>
                          </div>
                        </div>
                        <span style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>{key}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modals for Details and Bill */}
        {viewModal && selectedBooking && (
          <div className="admin-modal-overlay" onClick={() => setViewModal(null)}>
            <div className={`admin-modal ${viewModal === 'bill' || viewModal === 'report' ? 'bill-mode' : ''}`} onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setViewModal(null)}>&times;</button>
              
              {viewModal === 'details' && (
                <>
                  <h2 style={{ color: '#d4af37', borderBottom: '1px solid #333', paddingBottom: '15px', marginTop: 0 }}>Guest Details & Documents</h2>
                  <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginTop: '20px' }}>
                    <div style={{ flex: '1 1 250px' }}>
                      <img src={selectedBooking.photo || '/logo.png'} alt="Document" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '12px', border: '2px dashed #d4af37', background: '#111' }} />
                      <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginTop: '10px' }}>Guest Photo / ID Scan</p>
                    </div>
                    <div style={{ flex: '2 1 400px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', alignContent: 'start' }}>
                      <div><small style={{ color: '#777' }}>Booking ID</small><br/><strong style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedBooking.id}</strong></div>
                      <div><small style={{ color: '#777' }}>Guest Name</small><br/><strong style={{ color: '#fff' }}>{selectedBooking.name}</strong></div>
                      <div><small style={{ color: '#777' }}>Mobile</small><br/><strong style={{ color: '#fff' }}>{selectedBooking.mobile}</strong></div>
                      <div><small style={{ color: '#777' }}>Total Guests</small><br/><strong style={{ color: '#fff' }}>{selectedBooking.guests}</strong></div>
                      <div style={{ gridColumn: '1 / -1' }}><small style={{ color: '#777' }}>Address</small><br/><strong style={{ color: '#ccc' }}>{selectedBooking.address}</strong></div>
                      <div style={{ gridColumn: '1 / -1' }}><small style={{ color: '#777' }}>Room</small><br/><strong style={{ color: '#d4af37' }}>{selectedBooking.room}</strong></div>
                      <div><small style={{ color: '#777' }}>Check-In</small><br/><strong style={{ color: '#fff' }}>{selectedBooking.checkIn}</strong></div>
                      <div><small style={{ color: '#777' }}>Check-Out</small><br/><strong style={{ color: '#fff' }}>{selectedBooking.actualCheckOut || selectedBooking.checkOut}</strong></div>
                    </div>
                  </div>
                </>
              )}

              {viewModal === 'bill' && (
                <div className="invoice-container" id="printable-invoice">
                  <div className="invoice-header">
                    <img src="/logo.png" alt="Viswa Hotel" />
                    <div>
                      <h1>VISWA HOTEL & RESORTS</h1>
                      <p>30, Zone-II, Maharana Pratap Nagar, Bhopal<br/>Phone: +91 93017 83278</p>
                    </div>
                  </div>
                  <div className="invoice-title">GUEST INVOICE</div>
                  
                  <div className="invoice-details">
                    <div>
                      <strong>Billed To:</strong><br/>
                      {selectedBooking.name}<br/>
                      Phone: {selectedBooking.mobile}<br/>
                      Address: {selectedBooking.address}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong>Invoice No:</strong> {selectedBooking.id.replace('VSW', 'INV')}<br/>
                      <strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}<br/>
                      <strong>Status:</strong> {selectedBooking.actualCheckOut ? 'Paid & Closed' : 'Active Stay'}
                    </div>
                  </div>

                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Guests</th>
                        <th>Dates</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{selectedBooking.room} Room Charges</td>
                        <td>{selectedBooking.guests}</td>
                        <td>{selectedBooking.checkIn} to {selectedBooking.checkOut}</td>
                        <td style={{ textAlign: 'right' }}>₹{selectedBooking.totalAmount}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="invoice-totals">
                    <p>Subtotal: <span>₹{selectedBooking.totalAmount}</span></p>
                    <p>Advance Paid: <span style={{ color: 'green' }}>- ₹{selectedBooking.advance}</span></p>
                    <h3>Total Due: <span>₹{Math.max(0, selectedBooking.totalAmount - selectedBooking.advance)}</span></h3>
                    <small>Payment Method: {selectedBooking.paymentMethod}</small>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '40px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                    <p>Thank you for choosing Viswa Hotel & Resorts.</p>
                    <button className="print-btn" onClick={() => window.print()}>🖨️ Print Invoice</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal for Staff Report */}
        {viewModal === 'report' && (
          <div className="admin-modal-overlay" onClick={() => setViewModal(null)}>
            <div className="admin-modal bill-mode" id="printable-report" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setViewModal(null)}>&times;</button>
              <h2 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '15px', marginTop: 0 }}>Staff Monthly Attendance Report</h2>
              <p style={{ color: '#666', marginBottom: '25px' }}>Attendance summary and statistics for the current month.</p>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Staff Name</th>
                    <th style={{ textAlign: 'center' }}>Present (P)</th>
                    <th style={{ textAlign: 'center' }}>Half Day (H)</th>
                    <th style={{ textAlign: 'center' }}>Absent (A)</th>
                    <th style={{ textAlign: 'center' }}>Leave (L)</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff.id}>
                      <td style={{ fontFamily: 'monospace', color: '#555' }}>{staff.staffId}</td>
                      <td><strong>{staff.name}</strong> <br/><small style={{ color: '#888' }}>{staff.role}</small></td>
                      <td style={{ textAlign: 'center', color: '#27ae60', fontWeight: 'bold' }}>{staff.stats?.P || 0}</td>
                      <td style={{ textAlign: 'center', color: '#3498db', fontWeight: 'bold' }}>{staff.stats?.H || 0}</td>
                      <td style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 'bold' }}>{staff.stats?.A || 0}</td>
                      <td style={{ textAlign: 'center', color: '#f1c40f', fontWeight: 'bold' }}>{staff.stats?.L || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'right', marginTop: '30px' }}>
                <button className="print-btn" onClick={() => window.print()}>🖨️ Print Report</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Individual Staff History */}
        {viewModal === 'staff_history' && selectedStaff && (
          <div className="admin-modal-overlay" onClick={() => setViewModal(null)}>
            <div className="admin-modal bill-mode" id="printable-report" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setViewModal(null)}>&times;</button>
              <h2 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '15px', marginTop: 0 }}>Daily Attendance Record</h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <div>
                  <strong style={{ fontSize: '1.2rem', color: '#111' }}>{selectedStaff.name}</strong><br/>
                  <small style={{ color: '#666' }}>ID: {selectedStaff.staffId} | Role: {selectedStaff.role}</small>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#555' }}>
                   P: <span style={{color: '#27ae60'}}>{selectedStaff.stats?.P || 0}</span> | A: <span style={{color: '#e74c3c'}}>{selectedStaff.stats?.A || 0}</span> | H: <span style={{color: '#3498db'}}>{selectedStaff.stats?.H || 0}</span> | L: <span style={{color: '#f1c40f'}}>{selectedStaff.stats?.L || 0}</span>
                </div>
              </div>

              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(selectedStaff.history || {}).length > 0 ? (
                    Object.keys(selectedStaff.history).sort((a,b) => new Date(b) - new Date(a)).map(date => (
                      <tr key={date}>
                        <td>{new Date(date).toLocaleDateString('en-GB')}</td>
                        <td>
                           <span style={{ color: selectedStaff.history[date] === 'Present' ? '#27ae60' : selectedStaff.history[date] === 'Absent' ? '#e74c3c' : selectedStaff.history[date] === 'Half Day' ? '#3498db' : '#f1c40f', fontWeight: 'bold' }}>
                             {selectedStaff.history[date]}
                           </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No daily records found.</td></tr>
                  )}
                </tbody>
              </table>
              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button className="print-btn" onClick={() => window.print()}>🖨️ Print Record</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default Admin;