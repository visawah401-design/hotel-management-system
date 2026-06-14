import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Rooms.css';
import RoomCard from '../components/RoomCard';

// Naye Room Cards jo UI mein automatically dikhenge
const defaultRooms = [
  {
    _id: 'dummy_1',
    roomNumber: '101',
    roomType: 'Standard Single Room',
    capacity: 1,
    pricePerNight: 900,
    status: 'Available',
    description: 'A cozy and affordable room, perfect for solo travelers.',
    amenities: ['Free WiFi', 'AC', 'TV', 'Room Service'],
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'
  },
  {
    _id: 'dummy_2',
    roomNumber: '102',
    roomType: 'Comfort Double Room',
    capacity: 2,
    pricePerNight: 1150,
    status: 'Available',
    description: 'Spacious double room, perfectly comfortable for couples or two guests.',
    amenities: ['Free WiFi', 'AC', 'Balcony', 'Restaurant', 'Smart TV'],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'
  },
  {
    _id: 'dummy_3',
    roomNumber: '103',
    roomType: 'Couple Hourly (3-4 Hrs)',
    capacity: 2,
    pricePerNight: 600,
    status: 'Available',
    description: 'Short stay room. Perfect for resting and absolute privacy for 3-4 hours.',
    amenities: ['Free WiFi', 'AC', 'Shower', 'Total Privacy', 'In-room Dining'],
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80'
  },
  {
    _id: 'dummy_4',
    roomNumber: '104',
    roomType: 'Premium Double',
    capacity: 3,
    pricePerNight: 1150,
    status: 'Available',
    description: 'Extra space with an additional bed, ideal for small families.',
    amenities: ['Free WiFi', 'AC', 'Mini Bar', 'Restaurant', 'Room Service'],
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80'
  },
  {
    _id: 'dummy_5',
    roomNumber: '105',
    roomType: 'Deluxe Suite',
    capacity: 2,
    pricePerNight: 1150,
    status: 'Available',
    description: 'Luxury experience with a spacious living area and premium amenities.',
    amenities: ['AC', 'Jacuzzi', 'Balcony', 'Restaurant', 'Hot Water', 'Room Service'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
  },
  {
    _id: 'dummy_6',
    roomNumber: '106',
    roomType: 'Standard Single Room',
    capacity: 1,
    pricePerNight: 900,
    status: 'Available',
    description: 'A cozy and affordable room, perfect for solo travelers.',
    amenities: ['Free WiFi', 'AC', 'Smart TV', 'Water Cooler', 'Restaurant Menu'],
    image: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=800&q=80'
  }
];

function Rooms({ isLoggedIn }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [successData, setSuccessData] = useState(null); // Welcome card dikhane ke liye naya state
  
  // Multi Booking Modal State
  const [showMultiBookingForm, setShowMultiBookingForm] = useState(false);
  const [multiBookingData, setMultiBookingData] = useState({
    companyName: '', guestName: '', mobile: '', address: '', guestGstin: '', room: '', roomCount: 2, checkIn: new Date().toISOString().split('T')[0], checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0], guests: 2, totalAmount: '', advance: '', paymentMethod: 'Pay at Hotel'
  });
  const [bookingData, setBookingData] = useState({
    checkInDate: '',
    checkOutDate: '',
    durationValue: 1,
    durationUnit: 'Days',
    numberOfGuests: 1,
    name: '',
    mobile: '',
    address: '',
    paymentMethod: 'Pay at Hotel',
    advancePayment: '',
    photoPreview: null, // Photo preview store karne ke liye
  });

  // Auto-calculate check-out date based on duration
  useEffect(() => {
    if (bookingData.checkInDate && bookingData.durationValue && bookingData.durationUnit) {
      const start = new Date(bookingData.checkInDate);
      if (!isNaN(start.getTime())) {
        let end = new Date(start);
        if (bookingData.durationUnit === 'Hours') {
          end.setHours(end.getHours() + parseInt(bookingData.durationValue || 1, 10));
        } else if (bookingData.durationUnit === 'Days') {
          end.setDate(end.getDate() + parseInt(bookingData.durationValue || 1, 10));
        }
        
        // Convert back to local datetime-local string format (YYYY-MM-DDThh:mm)
        const offset = end.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(end - offset)).toISOString().slice(0,16);
        
        if (bookingData.checkOutDate !== localISOTime) {
          setBookingData(prev => ({ ...prev, checkOutDate: localISOTime }));
        }
      }
    }
  }, [bookingData.checkInDate, bookingData.durationValue, bookingData.durationUnit, bookingData.checkOutDate]);

  useEffect(() => {
    fetchRooms();

    // Real-time tab sync: Agar admin kisi room ko update karta hai, toh auto-refresh bina page load ke hoga
    const handleStorageChange = (e) => {
      if (e.key === 'vip_bookings') {
        fetchRooms();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchRooms]);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await axios.get('/api/rooms');
      
      // Database se aane wale rooms me alag-alag photos set kar rahe hain (agar unme pehle se na ho)
      const dbRooms = response.data.map((room, index) => {
        if (!room.image && (!room.images || room.images.length === 0)) {
          const randomPics = [
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'
          ];
          room.image = randomPics[index % randomPics.length];
        }
      
      // Strict pricing rule as per requirement
      if (room.roomType && (room.roomType.toLowerCase().includes('couple') || room.roomType.toLowerCase().includes('hour'))) {
        room.pricePerNight = 600;
      } else if (room.pricePerNight > 1150) {
        room.pricePerNight = 1150;
      }

        return room;
      });

      let allRooms = [...dbRooms, ...defaultRooms];
      
      // Naya Logic: Local active bookings ko check karke rooms ko 'Booked' aur dates assign karna
      const now = new Date();
      const localBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
      const activeBookings = Object.values(localBookings).filter(b => {
        const st = b.status || (b.actualCheckOut ? 'Checked-Out' : 'Checked-In');
        return st === 'Pending' || st === 'Checked-In';
      });
      
      allRooms = allRooms.map(room => {
        const matchingBooking = activeBookings.find(b => {
          if (!b.room || !b.room.includes(`Room ${room.roomNumber}`)) return false;
          if (b.status === 'Checked-In') return true;
          if (b.status === 'Pending') {
            const checkIn = new Date(b.rawCheckIn);
            const checkOut = new Date(b.rawCheckOut);
            if (now >= checkIn && now <= checkOut) return true;
          }
          return false;
        });

        if (matchingBooking) {
          return {
            ...room,
            status: 'Booked',
            bookedFrom: matchingBooking.rawCheckIn || matchingBooking.checkIn,
            bookedTo: matchingBooking.rawCheckOut || matchingBooking.checkOut
          };
        }
        // Database ka purana status ignore karke sabko Available force kar rahe hain
        return { ...room, status: 'Available', bookedFrom: null, bookedTo: null };
      });

      setRooms(allRooms);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      
      let allRooms = [...defaultRooms];
      const now = new Date();
      const localBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
      const activeBookings = Object.values(localBookings).filter(b => {
        const st = b.status || (b.actualCheckOut ? 'Checked-Out' : 'Checked-In');
        return st === 'Pending' || st === 'Checked-In';
      });
      
      allRooms = allRooms.map(room => {
        const matchingBooking = activeBookings.find(b => {
          if (!b.room || !b.room.includes(`Room ${room.roomNumber}`)) return false;
          if (b.status === 'Checked-In') return true;
          if (b.status === 'Pending') {
            const checkIn = new Date(b.rawCheckIn);
            const checkOut = new Date(b.rawCheckOut);
            if (now >= checkIn && now <= checkOut) return true;
          }
          return false;
        });

        if (matchingBooking) {
          return { ...room, status: 'Booked', bookedFrom: matchingBooking.rawCheckIn || matchingBooking.checkIn, bookedTo: matchingBooking.rawCheckOut || matchingBooking.checkOut };
        }
        return { ...room, status: 'Available', bookedFrom: null, bookedTo: null };
      });

      setRooms(allRooms);
      setLoading(false);
    }
  }, []);

  const handleMultiBookingSubmit = (e) => {
    e.preventDefault();
    const newId = 'VSW-' + Math.floor(100000 + Math.random() * 900000);
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB');
    };

    const existingBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
    
    existingBookings[newId] = {
      name: multiBookingData.guestName,
      companyName: multiBookingData.companyName,
      room: multiBookingData.room,
      roomCount: multiBookingData.roomCount,
      photo: '',
      checkIn: formatDate(multiBookingData.checkIn),
      checkOut: formatDate(multiBookingData.checkOut),
      rawCheckIn: multiBookingData.checkIn,
      rawCheckOut: multiBookingData.checkOut,
      mobile: multiBookingData.mobile || '',
      address: multiBookingData.address || 'Corporate Booking',
      guestGstin: multiBookingData.guestGstin || '',
      guests: multiBookingData.guests || 2,
      paymentMethod: multiBookingData.paymentMethod || 'Pay at Hotel',
      advance: 0,
      totalAmount: multiBookingData.totalAmount,
      status: 'Pending'
    };
    
    localStorage.setItem('vip_bookings', JSON.stringify(existingBookings));

    setSuccessData({
      bookingId: newId,
      name: multiBookingData.guestName,
      companyName: multiBookingData.companyName,
      roomName: `${multiBookingData.roomCount} Rooms (${multiBookingData.room})`,
      checkIn: formatDate(multiBookingData.checkIn),
      checkOut: formatDate(multiBookingData.checkOut),
      photo: '',
      mobile: multiBookingData.mobile || '0000000000',
      date: new Date().toLocaleDateString('en-GB')
    });

    setShowMultiBookingForm(false);
    setMultiBookingData({ companyName: '', guestName: '', mobile: '', address: '', guestGstin: '', room: '', roomCount: 2, checkIn: new Date().toISOString().split('T')[0], checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0], guests: 2, totalAmount: '', advance: '', paymentMethod: 'Pay at Hotel' });
    fetchRooms();
  };

  // Photo select karne par uska preview banane ka function
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBookingData({ ...bookingData, photoPreview: url });
    }
  };

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    const guestName = bookingData.name || 'Guest User';
    const roomDetails = `${selectedRoom.roomType} (Room ${selectedRoom.roomNumber})`;
    
    // --- NAYA LOGIC: Check Overlapping Dates/Times ---
    const reqStart = new Date(bookingData.checkInDate);
    const reqEnd = new Date(bookingData.checkOutDate);

    if (reqEnd <= reqStart) {
      alert('Error: Check-out time must be after the check-in time!');
      return;
    }

    const existingBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
    const hasConflict = Object.values(existingBookings).some(b => {
      const st = b.status || (b.actualCheckOut ? 'Checked-Out' : 'Checked-In');
      if (st === 'Checked-Out' || st === 'Cancelled') return false; // Ignore past/cancelled
      if (b.room !== roomDetails) return false; // Ignore other rooms

      const exStart = new Date(b.rawCheckIn);
      const exEnd = new Date(b.rawCheckOut);

      // Overlap formula: (Start A < End B) AND (End A > Start B)
      return (reqStart < exEnd && reqEnd > exStart);
    });

    if (hasConflict) {
      alert(`⚠️ This room is already booked for the selected date and time!\n\nPlease choose a different time slot or book another room.`);
      return;
    }
    // --------------------------------------------------

    // Helper logic to finalize booking after payment check
    const finalizeBookingProcess = async (paymentId = null) => {
      // Naya Logic: Booking ID ke hisaab se specific user ki details save karna
      const saveToProfile = (bookingId) => {
        const existingBookings = JSON.parse(localStorage.getItem('vip_bookings') || '{}');
        
        const formatDt = (dt) => {
          if (!dt) return '';
          const d = new Date(dt);
          return isNaN(d.getTime()) ? dt : d.toLocaleString('en-IN', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true});
        };

      existingBookings[bookingId] = {
        name: guestName,
        room: roomDetails,
        photo: bookingData.photoPreview || '',
        checkIn: formatDt(bookingData.checkInDate),
        checkOut: formatDt(bookingData.checkOutDate),
        rawCheckIn: bookingData.checkInDate,
        rawCheckOut: bookingData.checkOutDate,
        mobile: bookingData.mobile || '',
        address: bookingData.address || 'Not provided',
        guests: bookingData.numberOfGuests || 1,
        paymentMethod: bookingData.paymentMethod || 'Pay at Hotel',
        advance: bookingData.advancePayment || 0,
        totalAmount: calculateTotalAmount(),
        status: 'Pending'
      };
      localStorage.setItem('vip_bookings', JSON.stringify(existingBookings));
      
      // Fallback old structure
      localStorage.setItem('vip_name', guestName);
      localStorage.setItem('vip_room', roomDetails);
      localStorage.setItem('vip_photo', bookingData.photoPreview || '');
      localStorage.setItem('vip_checkIn', formatDt(bookingData.checkInDate));
      localStorage.setItem('vip_checkOut', formatDt(bookingData.checkOutDate));
      localStorage.setItem('vip_mobile', bookingData.mobile || '');
    };

      // Demo rooms par book karne par ab premium Success Card dikhega
      if (selectedRoom._id.startsWith('dummy')) {
        const generatedId = 'VSW-' + Math.floor(100000 + Math.random() * 900000);
        saveToProfile(generatedId);
  
        const formatDt = (dt) => {
          if (!dt) return '';
          const d = new Date(dt);
          return isNaN(d.getTime()) ? dt : d.toLocaleString('en-IN', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true});
        };

      setSuccessData({
        bookingId: generatedId,
        name: guestName,
        roomName: roomDetails,
        checkIn: formatDt(bookingData.checkInDate),
        checkOut: formatDt(bookingData.checkOutDate),
        photo: bookingData.photoPreview,
        mobile: bookingData.mobile || '0000000000',
        date: new Date().toLocaleDateString('en-GB')
      });

      setSelectedRoom(null);
      fetchRooms(); // Auto update status via new logic
      return;
    }

      try {
        const userId = localStorage.getItem('userId') || 'guest_user'; // Agar user login nahi hai, toh bhi error na aaye
        const response = await axios.post('/api/bookings', {
          userId,
          roomId: selectedRoom._id,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          numberOfGuests: bookingData.numberOfGuests,
        });
        
        const generatedId = response.data.bookingId || 'VSW-' + Math.floor(100000 + Math.random() * 900000);
        saveToProfile(generatedId);

      const formatDt = (dt) => {
        if (!dt) return '';
        const d = new Date(dt);
        return isNaN(d.getTime()) ? dt : d.toLocaleString('en-IN', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true});
      };

      setSuccessData({
        bookingId: generatedId,
        name: guestName,
        roomName: roomDetails,
        checkIn: formatDt(bookingData.checkInDate),
        checkOut: formatDt(bookingData.checkOutDate),
        photo: bookingData.photoPreview,
        mobile: bookingData.mobile || '0000000000',
        date: new Date().toLocaleDateString('en-GB')
      });

      setSelectedRoom(null);
      fetchRooms();
      } catch (error) {
        alert('Booking failed: ' + (error.response?.data?.message || error.message));
      }
    };

    const advanceAmt = parseFloat(bookingData.advancePayment) || 0;
    const amountToPay = advanceAmt > 0 ? advanceAmt : totalAmount;

    if (bookingData.paymentMethod === 'Pay Online') {
      const res = await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      try {
        const orderData = await axios.post('/api/payments/create-order', { amount: amountToPay });
        const { id: order_id, currency } = orderData.data;

        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_T17mWs6lrO5aNR',
          amount: Math.round(amountToPay * 100).toString(),
          currency: currency,
          name: "Viswa Hotel & Resorts",
          description: "Room Booking Reservation",
          image: "/logo.png",
          order_id: order_id,
          handler: async function (response) {
            try {
              const verifyResult = await axios.post('/api/payments/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              if (verifyResult.data.success) {
                finalizeBookingProcess(response.razorpay_payment_id);
              }
            } catch (error) {
              alert('Payment verification failed!');
            }
          },
          prefill: {
            name: guestName,
            contact: bookingData.mobile || "",
          },
          theme: { color: "#d4af37" }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', function (response){
            alert('Payment Failed: ' + response.error.description);
        });
        paymentObject.open();
      } catch (error) {
        alert('Could not initiate payment: ' + (error.response?.data?.message || error.message));
      }
    } else {
      finalizeBookingProcess();
    }
  };

  // Rooms ko filter karne ka logic
  const filteredRooms = rooms.filter(room => {
    if (filterType === 'All') return true;
    if (filterType === 'Available') return room.status === 'Available';
    if (filterType === 'Booked') return room.status !== 'Available';
    if (filterType === 'Offers') return room.pricePerNight <= 3000; // Rs. 3000 se kam price wale rooms Offers me dikhenge
    return true;
  });

  // Filter Buttons ki behtareen design
  const filterButtonStyle = (isActive) => ({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#2c3e50' : '#e0e0e0',
    color: isActive ? '#fff' : '#333',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    boxShadow: isActive ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
  });

  // Total aur Pending Amount Calculate karne ka logic
  const calculateTotalAmount = () => {
    if (!selectedRoom) return 0;
    if (bookingData.checkInDate && bookingData.checkOutDate) {
      const diffTime = Math.max(0, new Date(bookingData.checkOutDate) - new Date(bookingData.checkInDate));
      const diffHours = diffTime / (1000 * 60 * 60);
      
      if (selectedRoom.roomType.toLowerCase().includes('hourly') || selectedRoom.roomType.toLowerCase().includes('transit')) {
        const slots = Math.max(1, Math.ceil(diffHours / 6));
        return slots * selectedRoom.pricePerNight;
      } else {
        const diffDays = Math.ceil(diffHours / 24);
        return Math.max(1, diffDays) * selectedRoom.pricePerNight;
      }
    }
    return selectedRoom.pricePerNight;
  };

  const totalAmount = calculateTotalAmount();
  const advanceAmount = parseFloat(bookingData.advancePayment) || 0;
  const pendingAmount = Math.max(0, totalAmount - advanceAmount);

  // Copy ID function jo HTTP aur Mobile IP address dono par kaam karega (Fallback approach)
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

  // Shared Styles (Mobile aur Desktop dono par form ko slim aur perfect rakhne ke liye)
  const labelStyle = { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#444', marginBottom: '8px', fontWeight: '700' };
  const inputStyle = { width: '100%', padding: '14px 16px', fontSize: '1rem', border: '1px solid #e0e4e8', borderRadius: '10px', backgroundColor: '#f8f9fa', outline: 'none', boxSizing: 'border-box', color: '#333', transition: 'all 0.3s ease', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)' };

  return (
    <main className="rooms-page">
      <h1>Available Rooms</h1>
      {loading ? (
        <p>Loading rooms...</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '30px', flexWrap: 'wrap' }}>
            <button style={filterButtonStyle(filterType === 'All')} onClick={() => setFilterType('All')}>All Rooms</button>
            <button style={filterButtonStyle(filterType === 'Available')} onClick={() => setFilterType('Available')}>Available Rooms</button>
            <button style={filterButtonStyle(filterType === 'Booked')} onClick={() => setFilterType('Booked')}>Booked / Unavailable</button>
            <button style={filterButtonStyle(filterType === 'Offers')} onClick={() => setFilterType('Offers')}>Special Offers</button>
            <button 
              style={{ ...filterButtonStyle(false), background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#111', boxShadow: '0 4px 10px rgba(212,175,55,0.4)', border: 'none' }} 
              onClick={() => {
                setShowMultiBookingForm(true);
              }}
            >
              🏢 Multi / Corp Booking
            </button>
          </div>
          <div className="rooms-grid">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => (
                <RoomCard
                  key={room._id}
                  room={room}
                  onBook={() => handleBookRoom(room)}
                  isLoggedIn={isLoggedIn}
                />
              ))
            ) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: '18px', color: '#777', padding: '40px 0' }}>
                Oops! Koi room nahi mila is category me.
              </p>
            )}
          </div>
        </>
      )}

      {selectedRoom && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: `linear-gradient(to right, rgba(26, 26, 26, 0.95) 0%, rgba(26, 26, 26, 0.5) 100%), url(${selectedRoom.image || 'https://images.unsplash.com/photo-1582719478250-c89af14cf758?auto=format&fit=crop&w=1200&q=80'}) center/cover no-repeat fixed`, zIndex: 9999, display: 'flex', flexWrap: 'wrap', overflowX: 'hidden', overflowY: 'auto' }}>
          
          {/* Premium Logo Animation Style */}
          <style>
            {`
              @keyframes premiumLogoPulse {
                0% { transform: scale(1) translateY(0); filter: drop-shadow(0px 0px 15px rgba(212,175,55,0.4)); }
                50% { transform: scale(1.08) translateY(-10px); filter: drop-shadow(0px 0px 45px rgba(212,175,55,1)); }
                100% { transform: scale(1) translateY(0); filter: drop-shadow(0px 0px 15px rgba(212,175,55,0.4)); }
              }
              @keyframes premiumSpin {
                100% { transform: rotate(360deg); }
              }
            `}
          </style>

          {/* Left Panel - Room Details (Premium Dark & Gold Look) */}
          <div style={{ flex: '1 1 40%', minWidth: '350px', padding: '80px 40px', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '100vh' }}>
            <img src="/logo.png" alt="Visawa Logo" style={{ width: '180px', height: '180px', objectFit: 'contain', marginBottom: '20px', animation: 'premiumLogoPulse 4s ease-in-out infinite' }} />
            
            <p style={{ fontSize: '1rem', fontStyle: 'italic', color: '#d4af37', marginBottom: '25px', letterSpacing: '1px', borderBottom: '1px solid rgba(212,175,55,0.3)', paddingBottom: '15px' }}>
              "Your Journey to Comfort Begins Here"
            </p>
            
            <h2 style={{ fontSize: '2.2rem', margin: '0 0 5px 0', fontFamily: 'Georgia, serif', color: '#fff' }}>{selectedRoom.roomType}</h2>
            <p style={{ fontSize: '1rem', margin: '0 0 20px 0', letterSpacing: '3px', textTransform: 'uppercase', color: '#d4af37' }}>Room {selectedRoom.roomNumber}</p>
            
            <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '30px', color: '#ddd', maxWidth: '95%' }}>{selectedRoom.description}</p>
            
            <div style={{ marginBottom: '30px', width: '100%', maxWidth: '350px' }}>
              <h4 style={{ color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid #444', paddingBottom: '8px', margin: '0 0 15px 0', fontSize: '0.9rem' }}>Room Amenities</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left' }}>
                {selectedRoom.amenities?.map((am, i) => (
                  <li key={i} style={{ color: '#eee', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#d4af37' }}>✦</span> {am}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '10px', background: 'rgba(212,175,55,0.1)', padding: '20px 30px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.3)', width: '100%', maxWidth: '350px', boxSizing: 'border-box', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Tariff Per Night</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#d4af37' }}>₹{selectedRoom.pricePerNight}</p>
            </div>
          </div>

          {/* Right Panel - Booking Form */}
          <div style={{ flex: '1 1 60%', minWidth: '350px', padding: '40px 20px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Mobile friendly rounded close button */}
            <button onClick={() => setSelectedRoom(null)} style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '28px', background: '#fff', border: 'none', color: '#333', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: 10, paddingBottom: '4px' }} title="Close Form">&times;</button>
            
            <div style={{ width: '100%', maxWidth: '680px', backgroundColor: '#ffffff', padding: '45px', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.4)', boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 8px rgba(255,255,255,0.15)', margin: 'auto 0', position: 'relative' }}>
              <h3 style={{ fontSize: '2.2rem', margin: '0 0 10px 0', color: '#1a1a1a', fontFamily: 'Georgia, serif', textAlign: 'center' }}>Guest Registration</h3>
              <div style={{ width: '60px', height: '3px', backgroundColor: '#d4af37', margin: '0 auto 15px auto', borderRadius: '2px' }}></div>
              <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '0.95rem' }}>Complete your details to finalize the reservation.</p>
              
              <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Full Name *</label>
                    <input type="text" required value={bookingData.name} onChange={(e) => setBookingData({...bookingData, name: e.target.value})} style={inputStyle} placeholder="Enter your full name" />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Mobile Number *</label>
                    <input type="tel" required value={bookingData.mobile} onChange={(e) => setBookingData({...bookingData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} style={inputStyle} placeholder="Enter 10-digit number" maxLength="10" pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Complete Address *</label>
                  <textarea required value={bookingData.address} onChange={(e) => setBookingData({...bookingData, address: e.target.value})} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Enter your city, state and zip code..."></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Guest Photo (Selfie / Gallery)</label>
                    <input type="file" accept="image/*" capture="user" onChange={handlePhotoChange} style={{ ...inputStyle, padding: '11px 14px', cursor: 'pointer', color: '#555' }} title="Take a Selfie or Choose from Gallery" />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Scan ID (Front & Back) *</label>
                    <input type="file" required multiple accept="image/*,.pdf" capture="environment" style={{ ...inputStyle, padding: '11px 14px', cursor: 'pointer', color: '#555' }} title="Scan Front and Back of Document" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Check-in Date *</label>
                <input type="datetime-local" required value={bookingData.checkInDate} onChange={(e) => setBookingData({ ...bookingData, checkInDate: e.target.value })} style={inputStyle} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Stay Duration *</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="number" min="1" required value={bookingData.durationValue} onChange={(e) => setBookingData({ ...bookingData, durationValue: e.target.value })} style={{...inputStyle, flex: '1'}} />
                      <select value={bookingData.durationUnit} onChange={(e) => setBookingData({ ...bookingData, durationUnit: e.target.value })} style={{...inputStyle, flex: '1', padding: '14px 10px'}}>
                        <option value="Hours">Hour(s)</option>
                        <option value="Days">Day(s)</option>
                      </select>
                    </div>
                    {bookingData.checkOutDate && (
                      <span style={{ fontSize: '0.8rem', color: '#27ae60', marginTop: '6px', fontWeight: 'bold' }}>Check-out: {new Date(bookingData.checkOutDate).toLocaleString('en-IN', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:true})}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Total Guests *</label>
                    <input type="number" min="1" max={selectedRoom.capacity} required value={bookingData.numberOfGuests} onChange={(e) => setBookingData({ ...bookingData, numberOfGuests: parseInt(e.target.value) })} style={inputStyle} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Payment Method *</label>
                    <select required value={bookingData.paymentMethod} onChange={(e) => setBookingData({ ...bookingData, paymentMethod: e.target.value })} style={inputStyle}>
                      <option value="Pay at Hotel">Pay at Hotel (Cash / Counter QR)</option>
                      <option value="Pay Online">Pay Online Now (UPI / Cards)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Advance Pay (Optional)</label>
                    <input type="number" min="0" max={totalAmount} value={bookingData.advancePayment} onChange={(e) => setBookingData({ ...bookingData, advancePayment: e.target.value })} style={inputStyle} placeholder={`Max: Rs. ${totalAmount}`} />
                  </div>
                </div>

                {/* Premium Price Calculation Box */}
                <div style={{ background: 'linear-gradient(135deg, #111, #222)', padding: '25px', borderRadius: '12px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 'normal' }}>Total Amount</h4>
                      <p style={{ margin: '3px 0 0 0', color: '#888', fontSize: '0.8rem' }}>Includes all taxes and fees</p>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: advanceAmount > 0 ? '#fff' : '#d4af37' }}>
                      Rs. {totalAmount}
                    </div>
                  </div>

                  {advanceAmount > 0 && (
                    <>
                      <div style={{ width: '100%', height: '1px', backgroundColor: '#333' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                        <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Advance Paid</div>
                        <div style={{ color: '#27ae60', fontSize: '1.1rem', fontWeight: 'bold' }}>- Rs. {advanceAmount}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                        <div style={{ color: '#d4af37', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending</div>
                        <div style={{ color: '#d4af37', fontSize: '1.5rem', fontWeight: 'bold' }}>Rs. {pendingAmount}</div>
                      </div>
                    </>
                  )}
                </div>

                <button type="submit" style={{ padding: '18px', fontSize: '1.05rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#1a1a1a', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '15px', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s ease', boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)' }}>
                  Confirm Reservation
                </button>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* Corporate / Multi Booking Modal for Guests */}
      {showMultiBookingForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #d4af37', maxWidth: '850px', width: '100%', position: 'relative', margin: 'auto', boxShadow: '0 15px 40px rgba(0,0,0,0.8)' }}>
            <button onClick={() => setShowMultiBookingForm(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer' }}>&times;</button>
            
            <h2 style={{ color: '#d4af37', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginTop: 0, fontSize: '2rem', fontFamily: 'Georgia, serif' }}>Corporate / Multi-Room Booking</h2>
            <p style={{ color: '#aaa', marginBottom: '25px' }}>Book multiple rooms together under a company or group name. A combined VIP Pass will be generated instantly.</p>
            
            <form onSubmit={handleMultiBookingSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Company / Group Name (Optional)</label>
                <input type="text" value={multiBookingData.companyName} onChange={(e) => setMultiBookingData({...multiBookingData, companyName: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="e.g. Garud Stacks Pvt. Ltd." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Primary Booker Name *</label>
                <input type="text" required value={multiBookingData.guestName} onChange={(e) => setMultiBookingData({...multiBookingData, guestName: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="Enter Name" />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Mobile Number *</label>
                <input type="tel" required value={multiBookingData.mobile} onChange={(e) => setMultiBookingData({...multiBookingData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="10-digit Mobile" maxLength="10" pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Company GSTIN (Optional)</label>
                <input type="text" value={multiBookingData.guestGstin} onChange={(e) => setMultiBookingData({...multiBookingData, guestGstin: e.target.value.toUpperCase()})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', outline: 'none', fontSize: '1rem', textTransform: 'uppercase' }} placeholder="e.g. 23XXXXX..." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Rooms Required (Category & Numbers) *</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '5px' }}>
                  {['Deluxe', 'Super Deluxe', 'Suite', 'Standard', 'Conference Hall'].map(cat => (
                    <button type="button" key={cat} onClick={() => setMultiBookingData(prev => ({...prev, room: prev.room ? prev.room + ', ' + cat : cat}))} style={{ background: 'rgba(212,175,55,0.1)', color: '#d4af37', border: '1px solid #d4af37', borderRadius: '20px', padding: '6px 14px', fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s', fontWeight: 'bold' }}>+ {cat}</button>
                  ))}
                  <button type="button" onClick={() => setMultiBookingData(prev => ({...prev, room: ''}))} style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '20px', padding: '6px 14px', fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s', fontWeight: 'bold' }}>Clear</button>
                </div>
                <input type="text" required value={multiBookingData.room} onChange={(e) => setMultiBookingData({...multiBookingData, room: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="e.g. 5 Deluxe Rooms & 1 Hall" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Total Rooms Booked *</label>
                <input type="number" min="1" required value={multiBookingData.roomCount} onChange={(e) => setMultiBookingData({...multiBookingData, roomCount: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', outline: 'none', fontSize: '1rem' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Check-In Date *</label>
                <input type="date" required value={multiBookingData.checkIn} onChange={(e) => setMultiBookingData({...multiBookingData, checkIn: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', outline: 'none', fontSize: '1rem', colorScheme: 'dark' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>Check-Out Date *</label>
                  <span style={{ color: '#27ae60', fontSize: '0.85rem', fontWeight: 'bold', background: 'rgba(39,174,96,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{Math.max(1, Math.ceil((new Date(multiBookingData.checkOut) - new Date(multiBookingData.checkIn)) / (1000 * 60 * 60 * 24)) || 1)} Night(s)</span>
                </div>
                <input type="date" required value={multiBookingData.checkOut} onChange={(e) => setMultiBookingData({...multiBookingData, checkOut: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', outline: 'none', fontSize: '1rem', colorScheme: 'dark' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Total Guests *</label>
                <input type="number" min="1" required value={multiBookingData.guests} onChange={(e) => setMultiBookingData({...multiBookingData, guests: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', outline: 'none', fontSize: '1rem' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Payment Method *</label>
                <select value={multiBookingData.paymentMethod} onChange={(e) => setMultiBookingData({...multiBookingData, paymentMethod: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', outline: 'none', fontSize: '1rem' }}>
                  <option value="Pay at Hotel">Pay at Hotel</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Expected Amount (Rs.) *</label>
                <input type="number" min="0" required value={multiBookingData.totalAmount} onChange={(e) => setMultiBookingData({...multiBookingData, totalAmount: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d4af37', background: 'rgba(212,175,55,0.05)', color: '#d4af37', outline: 'none', fontWeight: 'bold', fontSize: '1.2rem' }} placeholder="0" />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#111', padding: '18px', borderRadius: '10px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', border: 'none', boxShadow: '0 8px 20px rgba(212,175,55,0.3)', textTransform: 'uppercase', letterSpacing: '2px', transition: '0.3s' }}>
                  🏨 Confirm Multi-Booking & Get VIP Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIP Landscape Certificate & WhatsApp Share */}
      {successData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(10, 10, 10, 0.95)), url('https://images.unsplash.com/photo-1542314831-c53cd3816002?auto=format&fit=crop&w=1920&q=80') center/cover no-repeat fixed`, zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', backdropFilter: 'blur(8px)', padding: '60px 20px 80px 20px', overflowY: 'auto' }}>
          
          {/* Landscape Container */}
          <div style={{ background: '#0a0a0a', width: '100%', maxWidth: '850px', borderRadius: '8px', padding: '15px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.9), 0 0 80px rgba(212,175,55,0.35)', position: 'relative', margin: 'auto' }}>
            
            {/* Certificate Inner Border */}
            <div style={{ border: '2px solid #d4af37', outline: '4px solid #1a1a1a', outlineOffset: '-10px', padding: '40px 30px', position: 'relative', background: 'linear-gradient(135deg, #1a1a1a 0%, #080808 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
              
              {/* Royal Watermark Background */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/logo.png)', backgroundPosition: 'center', backgroundSize: '50%', backgroundRepeat: 'no-repeat', opacity: 0.04, pointerEvents: 'none', zIndex: 0 }}></div>
              
              {/* Content Wrapper to stay above watermark */}
              <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              <div style={{ position: 'absolute', top: '-25px', left: '-15px', background: 'linear-gradient(90deg, #d4af37, #f3e5ab, #d4af37)', color: '#000', padding: '6px 20px', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '0 5px 15px rgba(212,175,55,0.4)', borderRadius: '2px' }}>ELITE VIP PASS</div>
              
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
                <img src="/logo.png" alt="Visawa Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0px 0px 15px rgba(212,175,55,0.6))' }} />
                <div style={{ textAlign: 'left', borderLeft: '2px solid #d4af37', paddingLeft: '20px' }}>
                  <h1 style={{ color: '#d4af37', margin: 0, fontSize: '2.2rem', fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '4px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Viswa</h1>
                  <p style={{ color: '#aaa', margin: '4px 0 0 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '3px' }}>Hotel & Resorts</p>
                </div>
              </div>

              {/* Title */}
              <h2 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '1.8rem', fontFamily: 'Georgia, serif', letterSpacing: '3px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>WELCOME TO BHOPAL</h2>
              <p style={{ color: '#d4af37', fontStyle: 'italic', fontSize: '1.1rem', margin: '0 0 30px 0', letterSpacing: '2px', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif' }}>The City of Lakes</p>

              {/* Flex Container for Photo and Theory */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '35px', flexWrap: 'wrap', width: '100%', marginBottom: '35px', background: 'rgba(212,175,55,0.03)', padding: '25px', borderRadius: '15px', border: '1px dashed rgba(212,175,55,0.25)' }}>
                
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #fff, #d4af37)', zIndex: 0, animation: 'premiumSpin 5s linear infinite', opacity: 0.8 }}></div>
                  <img src={successData.photo || '/logo.png'} alt="Guest" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #111', backgroundColor: '#111', position: 'relative', zIndex: 1, padding: successData.photo ? '0' : '15px', boxShadow: '0 0 25px rgba(212,175,55,0.5)' }} />
                </div>
                
                <div style={{ textAlign: 'left', maxWidth: '480px' }}>
                  <p style={{ color: '#e0c070', fontStyle: 'italic', fontSize: '1.1rem', margin: '0 0 10px 0', lineHeight: '1.5', fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive' }}>
                    This proudly certifies and recognizes that
                  </p>
                  <h3 style={{ color: '#d4af37', margin: '0 0 12px 0', fontSize: '2.4rem', fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 2px 10px rgba(212,175,55,0.5)' }}>{successData.name}</h3>
                  <p style={{ color: '#bbb', fontSize: '0.95rem', margin: '0', lineHeight: '1.6', letterSpacing: '0.5px', fontFamily: 'Georgia, serif' }}>
                    is officially granted the status of an <strong style={{color: '#fff'}}>Elite VIP Guest</strong>. Prepare to experience unparalleled luxury, ultimate comfort, and truly Royal hospitality during your stay with us.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', padding: '0 10px', marginTop: '15px' }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Reservation Tracking</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#fff', fontSize: '1.1rem', letterSpacing: '2px', fontFamily: 'monospace' }}>{successData.bookingId}</strong>
                    <button onClick={() => handleCopyId(successData.bookingId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} title="Copy ID">
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                  <div style={{ color: '#d4af37', fontSize: '1.2rem', letterSpacing: '3px', marginTop: '5px', opacity: 0.6 }}>|| | |||| || | || ||| ||</div>
                  <p style={{ color: '#666', fontSize: '0.75rem', margin: '8px 0 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Issued on: {successData.date}</p>
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

          {/* Action Buttons below Certificate */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => setSuccessData(null)} style={{ background: 'transparent', color: '#fff', border: '1px solid #fff', padding: '14px 40px', borderRadius: '30px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s ease' }}>
              Close
            </button>

            <a 
              href={`https://wa.me/${successData.mobile.replace(/\D/g, '').length === 10 ? '91' + successData.mobile.replace(/\D/g, '') : successData.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(`🌟 *Viswa Hotel & Resorts* 🌟\n\nDear *${successData.name}*,\nWelcome to Bhopal - The City of Lakes! 🌊\n\nYour VIP Reservation is officially confirmed.\n\n*Booking ID:* ${successData.bookingId}\n*Room:* ${successData.roomName}\n\nWe look forward to hosting you with Royal hospitality!\n\n_Don't forget to take a screenshot of your VIP pass from the website to share with friends!_`)}`}
              target="_blank" 
              rel="noreferrer"
              style={{ background: '#25D366', color: '#fff', border: 'none', padding: '14px 40px', borderRadius: '30px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 6px 15px rgba(37,211,102,0.4)', transition: 'all 0.3s ease' }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Send VIP Pass on WhatsApp
            </a>

            <a href="/login" style={{ background: 'linear-gradient(135deg, #111, #222)', color: '#d4af37', border: '1px solid #d4af37', padding: '14px 40px', borderRadius: '30px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 6px 15px rgba(212,175,55,0.2)', transition: 'all 0.3s ease' }}>
              👤 VIP Profile Login
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

export default Rooms;
