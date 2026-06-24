import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Rooms.css';
import RoomCard from '../components/RoomCard';
import toast from 'react-hot-toast';

// Naye Room Cards jo UI mein automatically dikhenge
const defaultRooms = [
  // Floor 1
  {
    _id: 'dummy_101',
    roomNumber: '101',
    roomType: 'Standard Single Room',
    capacity: 1,
    pricePerNight: 900,
    status: 'Available',
    description: 'A cozy and affordable room, perfect for solo travelers.',
    amenities: ['Free WiFi', 'AC', 'Smart TV', 'Room Service'],
    image: '/p1.png'
  },
  {
    _id: 'dummy_102',
    roomNumber: '102',
    roomType: 'Comfort Double Room',
    capacity: 2,
    pricePerNight: 1150,
    status: 'Available',
    description: 'Spacious double room, perfectly comfortable for couples or two guests.',
    amenities: ['Free WiFi', 'AC', 'Balcony', 'Restaurant'],
    image: '/p2.png'
  },
  {
    _id: 'dummy_103',
    roomNumber: '103',
    roomType: 'Couple Hourly (3-4 Hrs)',
    capacity: 2,
    pricePerNight: 600,
    status: 'Available',
    description: 'Short stay room. Perfect for resting and absolute privacy for 3-4 hours.',
    amenities: ['AC', 'Shower', 'Total Privacy', 'In-room Dining'],
    image: '/p3.png'
  },
  {
    _id: 'dummy_104',
    roomNumber: '104',
    roomType: 'Premium Double',
    capacity: 3,
    pricePerNight: 1150,
    status: 'Available',
    description: 'Extra space with an additional bed, ideal for small families.',
    amenities: ['Free WiFi', 'AC', 'Mini Bar', 'Restaurant'],
    image: '/p4.png'
  },
  {
    _id: 'dummy_105',
    roomNumber: '105',
    roomType: 'Deluxe Suite',
    capacity: 2,
    pricePerNight: 1150,
    status: 'Available',
    description: 'Luxury experience with a spacious living area and premium amenities.',
    amenities: ['AC', 'Jacuzzi', 'Balcony', 'Restaurant', 'Hot Water'],
    image: '/p5.png'
  },
  // Floor 2
  {
    _id: 'dummy_201',
    roomNumber: '201',
    roomType: 'Standard Single Room',
    capacity: 1,
    pricePerNight: 900,
    status: 'Available',
    description: 'A cozy and affordable room, perfect for solo travelers.',
    amenities: ['Free WiFi', 'AC', 'Smart TV', 'Room Service'],
    image: '/p6.png'
  },
  {
    _id: 'dummy_202',
    roomNumber: '202',
    roomType: 'Comfort Double Room',
    capacity: 2,
    pricePerNight: 1150,
    status: 'Available',
    description: 'Spacious double room, perfectly comfortable for couples or two guests.',
    amenities: ['Free WiFi', 'AC', 'Balcony', 'Restaurant'],
    image: '/hero2.png'
  },
  {
    _id: 'dummy_203',
    roomNumber: '203',
    roomType: 'Couple Hourly (3-4 Hrs)',
    capacity: 2,
    pricePerNight: 600,
    status: 'Available',
    description: 'Short stay room. Perfect for resting and absolute privacy for 3-4 hours.',
    amenities: ['AC', 'Shower', 'Total Privacy', 'In-room Dining'],
    image: '/hero3.png'
  },
  {
    _id: 'dummy_204',
    roomNumber: '204',
    roomType: 'Premium Double',
    capacity: 3,
    pricePerNight: 1150,
    status: 'Available',
    description: 'Extra space with an additional bed, ideal for small families.',
    amenities: ['Free WiFi', 'AC', 'Mini Bar', 'Restaurant'],
    image: '/hero4.png'
  },
  {
    _id: 'dummy_205',
    roomNumber: '205',
    roomType: 'Deluxe Suite',
    capacity: 2,
    pricePerNight: 1150,
    status: 'Available',
    description: 'Luxury experience with a spacious living area and premium amenities.',
    amenities: ['AC', 'Jacuzzi', 'Balcony', 'Restaurant', 'Hot Water'],
    image: '/hero5.png'
  }
];

const getBookingStatus = (booking) => booking.status || (booking.actualCheckOut ? 'Checked-Out' : 'Checked-In');
const isClosedBooking = (booking) => {
  const status = getBookingStatus(booking);
  return status === 'Checked-Out' || status === 'Cancelled';
};
const getBookedRoomNumbers = (booking) => (
  booking.roomNumbers || (String(booking.room || '').match(/\b\d{3}\b/g) || [])
).map(String);
const bookingHasRoomNumber = (booking, roomNumber) => getBookedRoomNumbers(booking).includes(String(roomNumber));

function Rooms({ isLoggedIn }) {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]); // State to hold all bookings
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
    selectedRoomNumber: '',
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

  const fetchRooms = useCallback(async () => {
    try {
      // Fetch both rooms and bookings
      const bookingsRes = await axios.get('/api/bookings/availability');
      setBookings(bookingsRes.data);

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
      
      // Fetch all bookings from the server to determine room status
      const now = new Date();
      const activeBookings = bookingsRes.data.filter(b => {
        return !isClosedBooking(b);
      });
      
      allRooms = allRooms.map(room => {
        const matchingBooking = activeBookings.find(b => { // Use fetched bookings
          if (!bookingHasRoomNumber(b, room.roomNumber)) return false;
          const status = getBookingStatus(b);
          const checkIn = new Date(b.rawCheckIn);
          const checkOut = new Date(b.rawCheckOut);
          if (status === 'Checked-In') return isNaN(checkOut.getTime()) || now < checkOut;
          if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return false;
          return now >= checkIn && now < checkOut;
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
      // Fallback to default rooms if API fails
      let allRooms = [...defaultRooms];
      allRooms = allRooms.map(room => {
        return { ...room, status: 'Available', bookedFrom: null, bookedTo: null };
      });

      setRooms(allRooms);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    // No longer need to listen to localStorage changes
  }, [fetchRooms]);

  const handleMultiBookingSubmit = async (e) => {
    e.preventDefault();
    const newBooking = {
      name: multiBookingData.guestName,
      companyName: multiBookingData.companyName,
      room: multiBookingData.room,
      roomCount: multiBookingData.roomCount,
      photo: '',
      checkIn: new Date(multiBookingData.checkIn).toLocaleDateString('en-GB'),
      checkOut: new Date(multiBookingData.checkOut).toLocaleDateString('en-GB'),
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

    try {
      const response = await axios.post('/api/bookings', newBooking);
      const savedBooking = response.data;
      showSuccessModal(savedBooking);
      setShowMultiBookingForm(false);
      setMultiBookingData({ companyName: '', guestName: '', mobile: '', address: '', guestGstin: '', room: '', roomCount: 2, checkIn: new Date().toISOString().split('T')[0], checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0], guests: 2, totalAmount: '', advance: '', paymentMethod: 'Pay at Hotel' });
      fetchRooms();
      toast.success('Corporate booking confirmed!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Multi-booking failed!');
    }
  };

  const showSuccessModal = (booking) => {
    setSuccessData({
      bookingId: booking.id,
      name: booking.name,
      companyName: booking.companyName,
      roomName: booking.room,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      photo: '',
      mobile: booking.mobile || '0000000000',
      date: new Date().toLocaleDateString('en-GB')
    });
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
    setBookingData(prev => ({ ...prev, selectedRoomNumber: '' }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    const guestName = bookingData.name || 'Guest User';
    if (!bookingData.selectedRoomNumber) {
      toast.error('Please select an available room number.');
      return;
    }

    const roomDetails = `${selectedRoom.roomType} (Room ${bookingData.selectedRoomNumber})`;
    
    // --- NAYA LOGIC: Check Overlapping Dates/Times ---
    const reqStart = new Date(bookingData.checkInDate);
    const reqEnd = new Date(bookingData.checkOutDate);

    if (reqEnd <= reqStart) {
      toast.error('Error: Check-out time must be after the check-in time!');
      return;
    }

    // Use the 'bookings' state which is fetched from the server
    const hasConflict = bookings.some(b => {
      if (isClosedBooking(b)) return false; // Ignore past/cancelled
      if (!bookingHasRoomNumber(b, bookingData.selectedRoomNumber)) return false; // Ignore other rooms

      const exStart = new Date(b.rawCheckIn);
      const exEnd = new Date(b.rawCheckOut);
      if (isNaN(exStart.getTime()) || isNaN(exEnd.getTime())) return true;

      // Overlap formula: (Start A < End B) AND (End A > Start B)
      return (reqStart < exEnd && reqEnd > exStart);
    });

    if (hasConflict) {
      toast.error(`This room is already booked for the selected dates. Please choose different dates or another room.`);
      return;
    }
    // --------------------------------------------------

    // Helper logic to finalize booking after payment check
    const finalizeBookingProcess = async (paymentId = null) => {
      const formatDt = (dt) => {
        if (!dt) return '';
        const d = new Date(dt);
        return isNaN(d.getTime()) ? dt : d.toLocaleString('en-IN', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true});
      };

      const newBookingData = {
        // id will be generated by backend
        name: guestName,
        room: roomDetails,
        photo: bookingData.photoPreview || '',
        checkIn: formatDt(bookingData.checkInDate),
        checkOut: formatDt(bookingData.checkOutDate),
        rawCheckIn: bookingData.checkInDate,
        rawCheckOut: bookingData.checkOutDate,
        mobile: bookingData.mobile || '',
        roomNumbers: [bookingData.selectedRoomNumber],
        address: bookingData.address || 'Not provided',
        guests: bookingData.numberOfGuests || 1,
        paymentMethod: bookingData.paymentMethod || 'Pay at Hotel',
        advance: bookingData.advancePayment || 0,
        totalAmount: calculateTotalAmount(),
        status: 'Pending',
        paymentStatus: paymentId ? 'Completed' : 'Pending',
        razorpayPaymentId: paymentId
      };

      try {
        const response = await axios.post('/api/bookings', newBookingData);
        const savedBooking = response.data;

        toast.success(`Booking Confirmed! ID: ${savedBooking.id}`);
        showSuccessModal(savedBooking);
        setSelectedRoom(null);
        fetchRooms();
      } catch (error) {
        toast.error('Booking failed: ' + (error.response?.data?.message || error.message));
      }
    };

    const totalAmountValue = calculateTotalAmount();
    const amountToPay = parseFloat(bookingData.advancePayment) > 0 ? parseFloat(bookingData.advancePayment) : totalAmountValue;

    if (bookingData.paymentMethod === 'Pay Online' && amountToPay > 0) {
      const res = await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        return;
      }

      try {
        const orderRes = await fetch('/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amountToPay })
        });
        const orderData = await orderRes.json();
        if (!orderData.id) {
            toast.error('Failed to create payment order: ' + (orderData.message || 'Unknown error'));
            return;
        }

        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_T17mWs6lrO5aNR',
          amount: Math.round(amountToPay * 100).toString(),
          currency: orderData.currency || 'INR',
          name: "Viswa Hotel & Resorts",
          description: "Room Booking Reservation",
          image: "/logo.png",
          order_id: orderData.id,
          handler: async function (response) {
            try {
              const verifyRes = await fetch('/api/payments/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })});
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                finalizeBookingProcess(response.razorpay_payment_id);
              }
            } catch (error) {
              toast.error('Payment verification failed!');
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
            toast.error('Payment Failed: ' + response.error.description);
        });
        paymentObject.open();
      } catch (error) {
        toast.error('Could not initiate payment: ' + (error.response?.data?.message || error.message));
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
  const roomNumbersList = [
    ...Array.from({ length: 5 }, (_, i) => String(101 + i)),
    ...Array.from({ length: 5 }, (_, i) => String(201 + i))
  ];

  const bookingRoomOptions = roomNumbersList.map(roomNumber => {
    let isBooked = false;

    if (selectedRoom && bookingData.checkInDate && bookingData.checkOutDate) {
      const reqStart = new Date(bookingData.checkInDate);
      const reqEnd = new Date(bookingData.checkOutDate);
      
      isBooked = bookings.some(b => {
        if (isClosedBooking(b)) return false;
        if (!getBookedRoomNumbers(b).includes(roomNumber)) return false;

        const exStart = new Date(b.rawCheckIn);
        const exEnd = new Date(b.rawCheckOut);
        if (isNaN(exStart.getTime()) || isNaN(exEnd.getTime())) return true;
        return reqStart < exEnd && reqEnd > exStart;
      });
    }

    return { roomNumber, isBooked };
  });

  // Copy ID function jo HTTP aur Mobile IP address dono par kaam karega (Fallback approach)
  const handleCopyId = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => toast.success('Certificate ID Copied!'));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) toast.success('Certificate ID Copied!');
        else toast.error('Copy failed! Please select and copy manually.');
      } catch (err) {
        toast.error('Copy failed! Please select and copy manually.');
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
            <p style={{ fontSize: '1rem', margin: '0 0 20px 0', letterSpacing: '3px', textTransform: 'uppercase', color: '#d4af37' }}>Select Room 101-110</p>
            
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
                    <label style={labelStyle}>Scan ID (Front & Back)</label>
                    <input type="file" multiple accept="image/*,.pdf" capture="environment" style={{ ...inputStyle, padding: '11px 14px', cursor: 'pointer', color: '#555' }} title="Scan Front and Back of Document" />
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
                    <label style={labelStyle}>Available Room Number *</label>
                    <select required value={bookingData.selectedRoomNumber} onChange={(e) => setBookingData({ ...bookingData, selectedRoomNumber: e.target.value })} style={inputStyle}>
                      <option value="">Select room number</option>
                      {bookingRoomOptions.map(room => (
                        <option key={room.roomNumber} value={room.roomNumber} disabled={room.isBooked}>
                          Room {room.roomNumber}{room.isBooked ? ' - Booked' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

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

      {/*
      {showEntryForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: `linear-gradient(to right, rgba(26, 26, 26, 0.95) 0%, rgba(26, 26, 26, 0.55) 100%), url(${selectedEntryRoom?.image || 'https://images.unsplash.com/photo-1542314831-c53cd3816002?auto=format&fit=crop&w=1600&q=80'}) center/cover no-repeat fixed`, zIndex: 9999, display: 'flex', flexWrap: 'wrap', overflowX: 'hidden', overflowY: 'auto' }}>
          <style>
            {`
              @keyframes premiumLogoPulse {
                0% { transform: scale(1) translateY(0); filter: drop-shadow(0px 0px 15px rgba(212,175,55,0.4)); }
                50% { transform: scale(1.08) translateY(-10px); filter: drop-shadow(0px 0px 45px rgba(212,175,55,1)); }
                100% { transform: scale(1) translateY(0); filter: drop-shadow(0px 0px 15px rgba(212,175,55,0.4)); }
              }
            `}
          </style>

          <div style={{ flex: '1 1 40%', minWidth: '350px', padding: '80px 40px', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '100vh' }}>
            <img src="/logo.png" alt="Visawa Logo" style={{ width: '180px', height: '180px', objectFit: 'contain', marginBottom: '20px', animation: 'premiumLogoPulse 4s ease-in-out infinite' }} />
            <p style={{ fontSize: '1rem', fontStyle: 'italic', color: '#d4af37', marginBottom: '25px', letterSpacing: '1px', borderBottom: '1px solid rgba(212,175,55,0.3)', paddingBottom: '15px' }}>
              "Front Desk Guest Entry"
            </p>
            <h2 style={{ fontSize: '2.2rem', margin: '0 0 5px 0', fontFamily: 'Georgia, serif', color: '#fff' }}>{selectedEntryRoom?.roomType || 'Select Room'}</h2>
            <p style={{ fontSize: '1rem', margin: '0 0 20px 0', letterSpacing: '3px', textTransform: 'uppercase', color: '#d4af37' }}>
              {selectedEntryRoom ? `Room ${selectedEntryRoom.roomNumber}` : 'Available room number'}
            </p>
            <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '30px', color: '#ddd', maxWidth: '95%' }}>
              {selectedEntryRoom?.description || 'Choose an available room, enter guest ID details, stay duration, total price, and down payment from one place.'}
            </p>

            <div style={{ marginTop: '10px', background: 'rgba(212,175,55,0.1)', padding: '20px 30px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.3)', width: '100%', maxWidth: '350px', boxSizing: 'border-box', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Tariff / Selected Price</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#d4af37' }}>Rs. {entryTotalAmount}</p>
            </div>
          </div>

          <div style={{ flex: '1 1 60%', minWidth: '350px', padding: '40px 20px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={() => setShowEntryForm(false)} style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '28px', background: '#fff', border: 'none', color: '#333', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: 10, paddingBottom: '4px' }} title="Close Form">&times;</button>

            <div style={{ width: '100%', maxWidth: '720px', backgroundColor: '#ffffff', padding: '45px', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.4)', boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 8px rgba(255,255,255,0.15)', margin: 'auto 0', position: 'relative' }}>
              <h3 style={{ fontSize: '2.2rem', margin: '0 0 10px 0', color: '#1a1a1a', fontFamily: 'Georgia, serif', textAlign: 'center' }}>Entry Registration</h3>
              <div style={{ width: '60px', height: '3px', backgroundColor: '#d4af37', margin: '0 auto 15px auto', borderRadius: '2px' }}></div>
              <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '0.95rem' }}>Create a direct room entry with ID proof and payment details.</p>

              <form onSubmit={handleEntrySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Full Name *</label>
                    <input type="text" required value={entryData.name} onChange={(e) => setEntryData({...entryData, name: e.target.value})} style={inputStyle} placeholder="Guest full name" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Mobile Number *</label>
                    <input type="tel" required value={entryData.mobile} onChange={(e) => setEntryData({...entryData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} style={inputStyle} placeholder="10-digit number" maxLength="10" pattern="[0-9]{10}" />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Complete Address *</label>
                  <textarea required value={entryData.address} onChange={(e) => setEntryData({...entryData, address: e.target.value})} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Address, city, state..."></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Guest Photo</label>
                    <input type="file" accept="image/*" capture="user" onChange={handleEntryPhotoChange} style={{ ...inputStyle, padding: '11px 14px', cursor: 'pointer', color: '#555' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>ID Upload *</label>
                    <input type="file" required multiple accept="image/*,.pdf" capture="environment" style={{ ...inputStyle, padding: '11px 14px', cursor: 'pointer', color: '#555' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Available Room Number *</label>
                    <select required value={entryData.roomId} onChange={(e) => {
                      const room = entryRoomOptions.find(item => String(item.roomNumber) === String(e.target.value));
                      setEntryData(prev => ({ ...prev, roomId: e.target.value, totalAmount: prev.totalAmount || String(room?.pricePerNight || '') }));
                    }} style={inputStyle}>
                      <option value="">Select available room</option>
                      {entryRoomOptions.map(room => (
                        <option key={room.roomNumber} value={room.roomNumber}>
                          Room {room.roomNumber} - {room.roomType}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Total Guests *</label>
                    <input type="number" min="1" required value={entryData.guests} onChange={(e) => setEntryData({...entryData, guests: e.target.value})} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Booking From *</label>
                    <input type="datetime-local" required value={entryData.checkInDate} onChange={(e) => setEntryData({...entryData, checkInDate: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Stay Duration *</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="number" min="1" required value={entryData.durationValue} onChange={(e) => setEntryData({...entryData, durationValue: e.target.value})} style={{ ...inputStyle, flex: '1' }} />
                      <select value={entryData.durationUnit} onChange={(e) => setEntryData({...entryData, durationUnit: e.target.value})} style={{ ...inputStyle, flex: '1', padding: '14px 10px' }}>
                        <option value="Hours">Hour(s)</option>
                        <option value="Days">Day(s)</option>
                      </select>
                    </div>
                    {entryData.checkOutDate && (
                      <span style={{ fontSize: '0.8rem', color: '#27ae60', marginTop: '6px', fontWeight: 'bold' }}>
                        Till: {new Date(entryData.checkOutDate).toLocaleString('en-IN', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:true})}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Total Price *</label>
                    <input type="number" min="0" required value={entryData.totalAmount} onChange={(e) => setEntryData({...entryData, totalAmount: e.target.value})} style={inputStyle} placeholder="Enter total amount" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Down Payment *</label>
                    <input type="number" min="0" max={entryTotalAmount} required value={entryData.downPayment} onChange={(e) => setEntryData({...entryData, downPayment: e.target.value})} style={inputStyle} placeholder="Advance amount" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Payment Method *</label>
                    <select required value={entryData.paymentMethod} onChange={(e) => setEntryData({...entryData, paymentMethod: e.target.value})} style={inputStyle}>
                      <option value="Pay at Hotel">Cash / Counter</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #111, #222)', padding: '22px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap', color: '#fff' }}>
                    <span>Total Amount</span>
                    <strong style={{ color: '#d4af37', fontSize: '1.35rem' }}>Rs. {entryTotalAmount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap', color: '#aaa' }}>
                    <span>Down Payment</span>
                    <strong style={{ color: '#27ae60' }}>Rs. {entryDownPayment}</strong>
                  </div>
                  <div style={{ height: '1px', background: '#333' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <strong>Pending</strong>
                    <strong style={{ fontSize: '1.35rem' }}>Rs. {entryPendingAmount}</strong>
                  </div>
                </div>

                <button type="submit" style={{ padding: '18px', fontSize: '1.05rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#1a1a1a', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s ease', boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)' }}>
                  Confirm Entry
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      */}

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
                {/* This was the broken part */}
              </div>
            </form>
          </div>
        </div>
      )}

      {successData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'linear-gradient(135deg, #1a1a1a, #0a0a0a)', padding: '40px', borderRadius: '20px', maxWidth: '550px', width: '100%', textAlign: 'center', border: '1px solid #d4af37', boxShadow: '0 20px 50px rgba(0,0,0,0.7)' }}>
            <img src="/logo.png" alt="Success" style={{ width: '100px', marginBottom: '20px', filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.6))' }} />
            <h2 style={{ color: '#d4af37', fontSize: '2rem', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Booking Confirmed!</h2>
            <p style={{ color: '#aaa', marginBottom: '25px', fontSize: '1rem' }}>Your VIP Pass has been generated. Please use the ID below to login to the Guest Portal.</p>
            
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px dashed rgba(212,175,55,0.3)', textAlign: 'left' }}>
              <p style={{ margin: '0 0 10px 0' }}><strong style={{ color: '#aaa', width: '120px', display: 'inline-block' }}>Guest Name:</strong> <span style={{ color: '#fff' }}>{successData.name}</span></p>
              <p style={{ margin: '0 0 10px 0' }}><strong style={{ color: '#aaa', width: '120px', display: 'inline-block' }}>Room Details:</strong> <span style={{ color: '#fff' }}>{successData.roomName}</span></p>
              <p style={{ margin: '0 0 10px 0' }}><strong style={{ color: '#aaa', width: '120px', display: 'inline-block' }}>Check-in:</strong> <span style={{ color: '#fff' }}>{successData.checkIn}</span></p>
              <p style={{ margin: '0' }}><strong style={{ color: '#aaa', width: '120px', display: 'inline-block' }}>Check-out:</strong> <span style={{ color: '#fff' }}>{successData.checkOut}</span></p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Reservation ID</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '8px' }}>
                <strong style={{ color: '#d4af37', fontSize: '1.5rem', letterSpacing: '3px', fontFamily: 'monospace' }}>{successData.bookingId}</strong>
                <button onClick={() => handleCopyId(successData.bookingId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d4af37' }} title="Copy ID">
                  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            </div>

            <button onClick={() => setSuccessData(null)} style={{ background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#111', padding: '14px 30px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Rooms;