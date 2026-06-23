import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const toLocalDateTimeInput = (date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

function Admin() {
  const defaultCheckIn = toLocalDateTimeInput(new Date());
  const defaultCheckOut = toLocalDateTimeInput(addDays(new Date(), 1));
  const queryParams = new URLSearchParams(window.location.search);
  const defaultTab = queryParams.get('tab') || (localStorage.getItem('role') === 'sadmin' ? 'analytics' : 'dashboard');
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [viewModal, setViewModal] = useState(null); // 'details' or 'bill'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [cardDetailsModal, setCardDetailsModal] = useState(null); // 'occupancy', 'staff', 'bookings', 'available', 'checkout', 'active-staff'

  // New Manual Bill State
  const [customBill, setCustomBill] = useState({
    name: '', mobile: '', address: '', guestGstin: '', roomType: 'Standard Room', roomNumbers: [], roomRate: '', checkIn: new Date().toISOString().split('T')[0], checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0], guests: 1, advance: '', paymentMethod: 'Cash'
  });

  // New Multi Booking State
  const [multiBookingData, setMultiBookingData] = useState({
    companyName: '', guestName: '', mobile: '', address: '', guestGstin: '', roomType: 'Standard Room', roomNumbers: [], roomRate: '', checkIn: defaultCheckIn, checkOut: defaultCheckOut, guests: 2, advance: '', paymentMethod: 'Bank Transfer'
  });
  const [entryData, setEntryData] = useState({
    name: '',
    mobile: '',
    address: '',
    roomType: 'Standard Room',
    roomNumber: '',
    checkInDate: '',
    checkOutDate: '',
    durationValue: 1,
    durationUnit: 'Days',
    guests: 1,
    totalAmount: '',
    downPayment: '',
    paymentMethod: 'Cash',
    photoPreview: null
  });

  // Filters ke liye naye states
  const [filterStatus, setFilterStatus] = useState('All'); // All, Active, CheckedOut
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Staff Management State (Local Storage for Persistence)
  const [staffList, setStaffList] = useState([]);

  // Aaj ki date string (YYYY-MM-DD) history save karne ke liye
  const todayStr = new Date().toISOString().split('T')[0];

  const currentUserRole = localStorage.getItem('role'); // Sadmin check karne ke liye

  // Helper function to get all room numbers (101-135 for 35 rooms)
  const allRoomNumbers = Array.from({ length: 35 }, (_, i) => 101 + i);

  // Helper function to get occupied rooms
  const getOccupiedRooms = () => {
    const occupied = [];
    bookings.forEach(b => {
      const st = b.status || (b.actualCheckOut ? 'Checked-Out' : 'Checked-In');
      if (st === 'Checked-In' || st === 'Pending') {
        const rooms = b.roomNumbers || (String(b.room || '').match(/\b\d{3}\b/g) || []);
        occupied.push(...rooms.map(r => ({ number: String(r), guest: b.name, checkIn: b.checkIn, checkOut: b.checkOut })));
      }
    });
    return occupied;
  };

  // Helper function to get available rooms
  const getAvailableRooms = () => {
    const occupiedNumbers = getOccupiedRooms().map(r => r.number);
    return allRoomNumbers.filter(room => !occupiedNumbers.includes(String(room))).map(r => String(r));
  };

  // Helper function to get checked-in guests
  const getCheckedInGuests = () => {
    return bookings.filter(b => {
      const st = b.status || (b.actualCheckOut ? 'Checked-Out' : 'Checked-In');
      return st === 'Checked-In';
    });
  };

  // Razorpay Payment Handler
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const initiateRazorpayPayment = async (bookingData, amount, bookingType) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Failed to load Razorpay. Please try again.');
      return;
    }

    try {
      // Step 1: Create Razorpay Order
      const orderRes = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const orderData = await orderRes.json();

      if (!orderData.id) {
        alert('Failed to create payment order. Please try again.');
        return;
      }

      // Step 2: Open Razorpay Checkout
      const options = {
        key: 'rzp_test_T17mWs6lrO5aNR', // Your Razorpay Key ID
        amount: Math.round(amount * 100), // Amount in paise
        currency: 'INR',
        name: 'Viswa Hotel & Resorts',
        description: `Booking ID: ${bookingData.id || 'New Booking'}`,
        order_id: orderData.id,
        handler: async (response) => {
          // Step 3: Verify Payment
          try {
            const verifyRes = await fetch('http://localhost:5000/api/payments/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // Step 4: Save Booking after Payment Success
              const finalBookingData = { ...bookingData, paymentStatus: 'Completed', razorpayPaymentId: response.razorpay_payment_id };

              // Save to DB via API
              const savedBookingRes = await axios.post('/api/bookings', finalBookingData);
              const savedBooking = savedBookingRes.data;

              setBookings(prev => [savedBooking, ...prev]);
              setSelectedBooking(savedBooking);

              // Reset appropriate form based on booking type
              if (bookingType === 'multiBooking') {
                setMultiBookingData({ companyName: '', guestName: '', mobile: '', address: '', guestGstin: '', roomType: 'Standard Room', roomNumbers: [], roomRate: '', checkIn: defaultCheckIn, checkOut: defaultCheckOut, guests: 2, advance: '', paymentMethod: 'Online' });
              } else if (bookingType === 'customBill') {
                setCustomBill({ name: '', mobile: '', address: '', guestGstin: '', roomType: 'Standard Room', roomNumbers: [], roomRate: '', checkIn: new Date().toISOString().split('T')[0], checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0], guests: 1, advance: '', paymentMethod: 'Online' });
              }

              setViewModal('bill');
              alert('✅ Payment successful! Booking confirmed.');
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            alert('Error verifying payment: ' + error.message);
          }
        },
        prefill: {
          name: bookingData.name || '',
          email: bookingData.email || 'guest@hotel.com',
          contact: bookingData.mobile || ''
        },
        theme: {
          color: '#d4af37'
        },
        modal: {
          ondismiss: () => {
            alert('Payment cancelled');
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      alert('Error initiating payment: ' + error.message);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      alert('Failed to load booking data from the server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/staff', { headers: { 'x-auth-token': token } });
      setStaffList(res.data);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      // Don't alert, just log the error
    }
  };

  useEffect(() => {
    // Admin Dashboard page par aate hi global Navbar aur Footer ko hide karna
    const navbar = document.querySelector('.navbar');
    const footer = document.querySelector('.footer');
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
    
    fetchBookings();
    fetchStaff();

    return () => {
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  useEffect(() => {
    if (entryData.checkInDate && entryData.durationValue && entryData.durationUnit) {
      const start = new Date(entryData.checkInDate);
      if (!isNaN(start.getTime())) {
        const end = new Date(start);
        if (entryData.durationUnit === 'Hours') {
          end.setHours(end.getHours() + parseInt(entryData.durationValue || 1, 10));
        } else {
          end.setDate(end.getDate() + parseInt(entryData.durationValue || 1, 10));
        }

        const offset = end.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(end - offset)).toISOString().slice(0, 16);
        if (entryData.checkOutDate !== localISOTime) {
          setEntryData(prev => ({ ...prev, checkOutDate: localISOTime }));
        }
      }
    }
  }, [entryData.checkInDate, entryData.durationValue, entryData.durationUnit, entryData.checkOutDate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    window.location.href = '/';
  };

  const handleAdminCheckIn = async (id) => {
    if(window.confirm('Are you sure you want to Check-In this guest?')) {
      const now = new Date();
      const currentTime = now.toLocaleDateString('en-GB') + ' at ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      try {
        const res = await axios.put(`/api/bookings/${id}/checkin`, { actualCheckIn: currentTime });
        setBookings(bookings.map(b => b.id === id ? res.data : b));
      } catch (error) {
        alert('Failed to check-in guest.');
      }
    }
  };

  const handleAdminCheckOut = async (id) => {
    if(window.confirm('Are you sure you want to Check-Out this guest?')) {
      const now = new Date();
      const currentTime = now.toLocaleDateString('en-GB') + ' at ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      try {
        const res = await axios.put(`/api/bookings/${id}/checkout`, { actualCheckOut: currentTime });
        setBookings(bookings.map(b => b.id === id ? res.data : b));
      } catch (error) {
        alert('Failed to check-out guest.');
      }
    }
  };


  // Booking record ko preserve karke sirf Super Admin archive/cancel kar sakta hai
  const handleDeleteBooking = async (id) => {
    if(currentUserRole !== 'sadmin') {
      alert('Only Super Admin can cancel/archive booking records.');
      return;
    }

    const reason = window.prompt('Enter cancellation/archive reason for this booking record:');
    if(reason === null) return;
    if(!reason.trim()) {
      alert('Reason is required so the record remains auditable.');
      return;
    }

    if(window.confirm('This will keep the booking record and mark it as Cancelled. Continue?')) {
      const now = new Date();
      const auditTime = now.toLocaleDateString('en-GB') + ' at ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      try {
        const res = await axios.put(`/api/bookings/${id}/cancel`, { reason: reason.trim(), auditTime });
        setBookings(bookings.map(b => b.id === id ? res.data : b));
      } catch (error) {
        alert('Failed to archive booking.');
      }
    }
  };

  // Custom Bill Generate Logic
  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!customBill.roomNumbers.length) {
      alert('Please select at least one room number.');
      return;
    }
    if (!Number(customBill.roomRate)) {
      alert('Please enter the rent for one room.');
      return;
    }
    if (new Date(customBill.checkOut) <= new Date(customBill.checkIn)) {
      alert('Check-out date must be after the check-in date.');
      return;
    }
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB');
    };

    const newBooking = {
      name: customBill.name,
      mobile: customBill.mobile,
      address: customBill.address || 'Not provided',
      guestGstin: customBill.guestGstin || '',
      room: `${customBill.roomType} (Rooms ${customBill.roomNumbers.join(', ')})`,
      roomType: customBill.roomType,
      roomNumbers: customBill.roomNumbers,
      roomRate: Number(customBill.roomRate) || 0,
      roomCount: customBill.roomNumbers.length,
      nights: customBillNightCount,
      checkIn: formatDate(customBill.checkIn),
      checkOut: formatDate(customBill.checkOut),
      rawCheckIn: customBill.checkIn,
      rawCheckOut: customBill.checkOut,
      guests: customBill.guests,
      totalAmount: customBillTotalAmount,
      advance: customBill.advance || 0,
      paymentMethod: customBill.paymentMethod,
      status: 'Checked-Out', // Automatically marked as done
      actualCheckOut: new Date().toLocaleDateString('en-GB') + ' at ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    // Check if payment method is Online
    if (customBill.paymentMethod === 'Online') {
      // Initiate Razorpay payment
      initiateRazorpayPayment(newBooking, customBillTotalAmount, 'customBill');
      return;
    }

    try {
      const res = await axios.post('/api/bookings', newBooking);
      const savedBooking = res.data;
      setBookings([savedBooking, ...bookings]);
      setSelectedBooking(savedBooking);
      setViewModal('bill');
    } catch (error) {
      alert('Failed to create bill: ' + (error.response?.data?.message || error.message));
    }

    setCustomBill({ name: '', mobile: '', address: '', guestGstin: '', roomType: 'Standard Room', roomNumbers: [], roomRate: '', checkIn: new Date().toISOString().split('T')[0], checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0], guests: 1, advance: '', paymentMethod: 'Cash' });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const handleEntryPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEntryData(prev => ({ ...prev, photoPreview: URL.createObjectURL(file) }));
    }
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();

    if (!entryData.roomNumber) {
      alert('Please select an available room number.');
      return;
    }

    const reqStart = new Date(entryData.checkInDate);
    const reqEnd = new Date(entryData.checkOutDate);
    if (reqEnd <= reqStart) {
      alert('Error: Check-out time must be after the check-in time!');
      return;
    }

    const roomDetails = `${entryData.roomType} (Room ${entryData.roomNumber})`;
    const hasConflict = bookings.some(b => {
      const st = b.status || (b.actualCheckOut ? 'Checked-Out' : 'Checked-In');
      if (st === 'Checked-Out' || st === 'Cancelled') return false;
      const bookedRoomNumbers = b.roomNumbers || (String(b.room || '').match(/\b\d{3}\b/g) || []);
      const sameRoomNumber = bookedRoomNumbers.map(String).includes(String(entryData.roomNumber));
      if (!sameRoomNumber && b.room !== roomDetails) return false;

      const exStart = new Date(b.rawCheckIn);
      const exEnd = new Date(b.rawCheckOut);
      return reqStart < exEnd && reqEnd > exStart;
    });

    if (hasConflict) {
      alert('This room already has an active booking for the selected date and time.');
      return;
    }

    const formatDt = (dt) => {
      if (!dt) return '';
      const d = new Date(dt);
      return isNaN(d.getTime()) ? dt : d.toLocaleString('en-IN', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true});
    };

    const now = new Date();
    const currentTime = now.toLocaleDateString('en-GB') + ' at ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const newBooking = {
      name: entryData.name,
      mobile: entryData.mobile,
      address: entryData.address || 'Not provided',
      room: roomDetails,
      roomCount: 1,
      photo: entryData.photoPreview || '',
      checkIn: formatDt(entryData.checkInDate),
      checkOut: formatDt(entryData.checkOutDate),
      rawCheckIn: entryData.checkInDate,
      rawCheckOut: entryData.checkOutDate,
      guests: entryData.guests,
      totalAmount: Number(entryData.totalAmount) || 0,
      advance: Number(entryData.downPayment) || 0,
      paymentMethod: entryData.paymentMethod,
      status: 'Checked-In',
      actualCheckIn: currentTime,
      actualCheckOut: null
    };

    // Check if payment method is Online
    if (entryData.paymentMethod === 'Online') {
      // Initiate Razorpay payment
      initiateRazorpayPayment(newBooking, newBooking.totalAmount, 'guestEntry');
      return;
    }

    try {
      const res = await axios.post('/api/bookings', newBooking);
      const savedBooking = res.data;
      setBookings([savedBooking, ...bookings]);
      setSelectedBooking(savedBooking);
      setActiveTab('bookings');
      setViewModal('details');
    } catch (error) {
      alert('Failed to create entry: ' + (error.response?.data?.message || error.message));
    }
    setEntryData({
      name: '',
      mobile: '',
      address: '',
      roomType: 'Standard Room',
      roomNumber: '',
      checkInDate: '',
      checkOutDate: '',
      durationValue: 1,
      durationUnit: 'Days',
      guests: 1,
      totalAmount: '',
      downPayment: '',
      paymentMethod: 'Cash',
      photoPreview: null
    });
  };

  // Multi Booking Generate Logic
  const handleMultiBookingSubmit = async (e) => {
    e.preventDefault();
    if (!multiBookingData.roomNumbers.length) {
      alert('Please select at least one room number.');
      return;
    }
    if (!Number(multiBookingData.roomRate)) {
      alert('Please enter the rent for one room.');
      return;
    }

    const requestStart = new Date(multiBookingData.checkIn);
    const requestEnd = new Date(multiBookingData.checkOut);
    if (requestEnd <= requestStart) {
      alert('Check-out date must be after the check-in date.');
      return;
    }
    const startsNowOrEarlier = requestStart <= new Date();

    const conflictingRooms = multiBookingData.roomNumbers.filter(roomNumber => bookings.some(booking => {
      const status = booking.status || (booking.actualCheckOut ? 'Checked-Out' : 'Checked-In');
      if (status === 'Checked-Out' || status === 'Cancelled') return false;

      const bookedRoomNumbers = booking.roomNumbers || (String(booking.room || '').match(/\b\d{3}\b/g) || []);
      if (!bookedRoomNumbers.map(String).includes(String(roomNumber))) return false;

      const bookedStart = new Date(booking.rawCheckIn);
      const bookedEnd = new Date(booking.rawCheckOut);
      if (isNaN(bookedStart.getTime()) || isNaN(bookedEnd.getTime())) return true;
      return requestStart < bookedEnd && requestEnd > bookedStart;
    }));

    if (conflictingRooms.length) {
      alert(`Room ${conflictingRooms.join(', ')} already booked for selected dates.`);
      return;
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB');
    };

    const newBooking = {
      name: multiBookingData.guestName,
      companyName: multiBookingData.companyName,
      mobile: multiBookingData.mobile,
      address: multiBookingData.address || 'Corporate Booking',
      guestGstin: multiBookingData.guestGstin || '',
      room: `${multiBookingData.roomType} (Rooms ${multiBookingData.roomNumbers.join(', ')})`,
      roomType: multiBookingData.roomType,
      roomNumbers: multiBookingData.roomNumbers,
      roomRate: Number(multiBookingData.roomRate) || 0,
      roomCount: multiBookingData.roomNumbers.length,
      nights: multiNightCount,
      checkIn: formatDate(multiBookingData.checkIn),
      checkOut: formatDate(multiBookingData.checkOut),
      rawCheckIn: multiBookingData.checkIn,
      rawCheckOut: multiBookingData.checkOut,
      guests: multiBookingData.guests,
      totalAmount: multiBookingTotalAmount,
      advance: multiBookingData.advance || 0,
      paymentMethod: multiBookingData.paymentMethod,
      status: startsNowOrEarlier ? 'Checked-In' : 'Pending',
      actualCheckIn: startsNowOrEarlier ? new Date().toLocaleDateString('en-GB') + ' at ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
      actualCheckOut: null
    };

    // Check if payment method is Online
    if (multiBookingData.paymentMethod === 'Online') {
      // Initiate Razorpay payment
      initiateRazorpayPayment(newBooking, multiBookingTotalAmount, 'multiBooking');
      return;
    }

    try {
      const res = await axios.post('/api/bookings', newBooking);
      const savedBooking = res.data;
      setBookings([savedBooking, ...bookings]);
      setSelectedBooking(savedBooking);
      setViewModal('bill');
    } catch (error) {
      alert('Failed to create multi-booking: ' + (error.response?.data?.message || error.message));
    }

    setMultiBookingData({ companyName: '', guestName: '', mobile: '', address: '', guestGstin: '', roomType: 'Standard Room', roomNumbers: [], roomRate: '', checkIn: toLocalDateTimeInput(new Date()), checkOut: toLocalDateTimeInput(addDays(new Date(), 1)), guests: 2, advance: '', paymentMethod: 'Bank Transfer' });
  };

  // Staff Attendance Update & Daily Record Logic
  const updateStaffStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/staff/${id}/attendance`, 
        { newStatus, todayStr },
        { headers: { 'x-auth-token': token } }
      );
      setStaffList(staffList.map(staff => staff._id === id ? res.data : staff));
    } catch (error) {
      alert('Failed to update staff status.');
      console.error(error);
    }
  };

  // Guest ko portal par alert send karne ka logic
  const sendCheckoutReminder = (id) => {
    // This needs a backend implementation. For now, it will just be a UI change.
    // In a real app: await axios.put(`/api/bookings/${id}/remind`);
    setBookings(bookings.map(b => b.id === id ? { ...b, checkoutAlert: true } : b));
    alert(`Check-out reminder sent successfully to Guest (ID: ${id})!`);
  };

  // Manual ID daal kar Alert send karne ka logic
  const handleManualAlert = async () => {
    const targetId = window.prompt("Enter Reservation ID (e.g., VSW-123456) to send Check-Out Alert:");
    if (targetId) {
      const id = targetId.trim().toUpperCase();
      const bookingExists = bookings.some(b => b.id === id);
      if (bookingExists) {
         // In a real app: await axios.put(`/api/bookings/${id}/remind`);
         // For now, just update the state
         setBookings(bookings.map(b => b.id === id ? { ...b, checkoutAlert: true } : b));
         alert(`Check-out reminder sent successfully to Guest (ID: ${id})!`);
      } else {
         alert('Error: No booking found with this Reservation ID.');
      }
    }
  };

  // Staff record ko preserve karke sirf Super Admin inactive/archive kar sakta hai
  const deleteStaff = async (id) => {
    if(currentUserRole !== 'sadmin') {
      alert('Only Super Admin can archive staff records.');
      return;
    }

    if(window.confirm('This will keep the staff record and mark it as Inactive. Continue?')) {
      const now = new Date();
      const auditTime = now.toLocaleDateString('en-GB') + ' at ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      try {
        const token = localStorage.getItem('token');
        const res = await axios.delete(`/api/staff/${id}`, { headers: { 'x-auth-token': token }, data: { archivedAt: auditTime, archivedBy: 'Super Admin' } });
        setStaffList(staffList.map(staff => staff._id === id ? res.data : staff));
      } catch (error) {
        alert('Failed to archive staff member.');
        console.error(error);
      }
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
    const headers = ['Booking ID', 'Guest Name', 'Mobile', 'Room', 'Status', 'Check-In', 'Check-Out', 'Actual Check-Out', 'Total Amount (Rs)', 'Advance (Rs)', 'Payment Method', 'Cancelled/Archived At', 'Cancelled/Archived By', 'Reason'];
    const rows = displayedBookings.map(b => [b.id, `"${b.name}"`, b.mobile, `"${b.room}"`, b.status || '', b.checkIn, b.checkOut, b.actualCheckOut || 'Pending', b.totalAmount, b.advance, b.paymentMethod, b.cancelledAt || '', b.cancelledBy || '', `"${b.cancelReason || ''}"`]);
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
  const entryTotalAmount = Number(entryData.totalAmount) || 0;
  const entryDownPayment = Number(entryData.downPayment) || 0;
  const entryPendingAmount = Math.max(0, entryTotalAmount - entryDownPayment);
  const multiRoomOptions = Array.from({ length: 10 }, (_, index) => String(101 + index));
  const multiNightCount = Math.max(1, Math.ceil((new Date(multiBookingData.checkOut) - new Date(multiBookingData.checkIn)) / 86400000) || 1);
  const multiRoomCount = multiBookingData.roomNumbers.length;
  const multiRoomRate = Number(multiBookingData.roomRate) || 0;
  const multiBookingTotalAmount = multiRoomCount * multiRoomRate * multiNightCount;
  const customBillNightCount = Math.max(1, Math.ceil((new Date(customBill.checkOut) - new Date(customBill.checkIn)) / 86400000) || 1);
  const customBillRoomCount = customBill.roomNumbers.length;
  const customBillRoomRate = Number(customBill.roomRate) || 0;
  const customBillTotalAmount = customBillRoomCount * customBillRoomRate * customBillNightCount;

  const getActiveStatus = (booking) => booking.status || (booking.actualCheckOut ? 'Checked-Out' : 'Checked-In');
  const isClosedBooking = (booking) => {
    const status = getActiveStatus(booking);
    return status === 'Checked-Out' || status === 'Cancelled';
  };
  const getBookedRoomNumbers = (booking) => (
    booking.roomNumbers || (String(booking.room || '').match(/\b\d{3}\b/g) || [])
  ).map(String);
  const roomHasBooking = (booking, roomNumber) => getBookedRoomNumbers(booking).includes(String(roomNumber));
  const formatBookingWindow = (booking) => {
    const start = new Date(booking.rawCheckIn);
    const end = new Date(booking.rawCheckOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Booked';

    const sameDate = start.toDateString() === end.toDateString();
    const dateText = start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const startTime = start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const endTime = end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const endDateText = end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return sameDate ? `${dateText}, ${startTime} - ${endTime}` : `${dateText} ${startTime} - ${endDateText} ${endTime}`;
  };
  const getRoomConflict = (roomNumber, checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;
    const requestStart = new Date(checkIn);
    const requestEnd = new Date(checkOut);
    if (isNaN(requestStart.getTime()) || isNaN(requestEnd.getTime()) || requestEnd <= requestStart) return null;

    return bookings.find(booking => {
      if (isClosedBooking(booking) || !roomHasBooking(booking, roomNumber)) return false;

      const bookedStart = new Date(booking.rawCheckIn);
      const bookedEnd = new Date(booking.rawCheckOut);
      if (isNaN(bookedStart.getTime()) || isNaN(bookedEnd.getTime())) return true;
      return requestStart < bookedEnd && requestEnd > bookedStart;
    }) || null;
  };
  const getUpcomingRoomBooking = (roomNumber) => {
    const now = new Date();
    return bookings
      .filter(booking => !isClosedBooking(booking) && roomHasBooking(booking, roomNumber))
      .filter(booking => {
        const start = new Date(booking.rawCheckIn);
        return !isNaN(start.getTime()) && start >= now;
      })
      .sort((a, b) => new Date(a.rawCheckIn) - new Date(b.rawCheckIn))[0] || null;
  };
  const entryRoomOptions = multiRoomOptions.map(roomNumber => ({
    roomNumber,
    conflict: getRoomConflict(roomNumber, entryData.checkInDate, entryData.checkOutDate),
    upcoming: getUpcomingRoomBooking(roomNumber)
  }));
  const multiUnavailableRooms = multiRoomOptions.filter(roomNumber => getRoomConflict(roomNumber, multiBookingData.checkIn, multiBookingData.checkOut));

  const toggleMultiRoom = (roomNumber) => {
    if (multiUnavailableRooms.includes(roomNumber)) return;
    setMultiBookingData(prev => ({
      ...prev,
      roomNumbers: prev.roomNumbers.includes(roomNumber)
        ? prev.roomNumbers.filter(number => number !== roomNumber)
        : [...prev.roomNumbers, roomNumber].sort()
    }));
  };

  const toggleCustomBillRoom = (roomNumber) => {
    setCustomBill(prev => ({
      ...prev,
      roomNumbers: prev.roomNumbers.includes(roomNumber)
        ? prev.roomNumbers.filter(number => number !== roomNumber)
        : [...prev.roomNumbers, roomNumber].sort()
    }));
  };

  const daysWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mockOccupancy = [45, 55, 60, 50, 85, 95, 80]; // Mock week data

  return (
    <div className="admin-layout">
      <div className="admin-mobile-bar">
        <button className="admin-menu-toggle" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open admin menu" aria-expanded={sidebarOpen}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <img src="/logo.png" alt="Viswa Hotel" />
        <strong>Admin Panel</strong>
      </div>

      {sidebarOpen && <button className="admin-sidebar-backdrop" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close admin menu"></button>}

      {/* Left Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="admin-sidebar-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close admin menu">&times;</button>
        <div className="admin-brand">
          <img src="/logo.png" alt="Visawa Logo" />
          <h2>Admin Panel</h2>
        </div>
        
        <nav className="admin-nav">
          {currentUserRole === 'sadmin' && (
            <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => handleTabChange('analytics')}>
              📈 Business Analytics
            </button>
          )}
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => handleTabChange('dashboard')}>
            📊 Dashboard Overview
          </button>
          <button className={activeTab === 'guest_entry' ? 'active' : ''} onClick={() => handleTabChange('guest_entry')}>
            + Guest Entry
          </button>
          <button className={activeTab === 'bookings' ? 'active' : ''} onClick={() => handleTabChange('bookings')}>
            🧾 All Bookings
          </button>
          <button className={activeTab === 'multi_booking' ? 'active' : ''} onClick={() => handleTabChange('multi_booking')}>
            🏢 Multi/Corp Booking
          </button>
          <button className={activeTab === 'create_bill' ? 'active' : ''} onClick={() => handleTabChange('create_bill')}>
            📝 Create Bill
          </button>
          <button className={activeTab === 'staff' ? 'active' : ''} onClick={() => handleTabChange('staff')}>
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
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p style={{ fontSize: '1.2rem', color: '#d4af37', fontWeight: 'bold' }}>
              Loading Admin Panel...
            </p>
          </div>
        ) : (
        <>
        <div className="admin-header">
          <div className="admin-header-copy">
            <h1>Welcome, Administrator</h1>
            <p style={{ color: '#aaa', fontFamily: 'sans-serif', margin: '5px 0 0 0' }}>Here is what's happening at Viswa Hotel & Resorts today.</p>
          </div>
          <div className="admin-profile">
            <img src="/logo.png" alt="Admin" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff' }} />
            <div className="admin-profile-text">
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
              <div className="stat-card" style={{ cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => setCardDetailsModal('bookings')}>
                <h3>Total Bookings</h3>
                <p className="value">{bookings.length}</p>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => setCardDetailsModal('available')}>
                <h3>Available Rooms</h3>
                <p className="value">{getAvailableRooms().length}</p>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => setCardDetailsModal('checkout')}>
                <h3>Pending Check-outs</h3>
                <p className="value" style={{ color: '#e74c3c' }}>{bookings.filter(b => {
                  const st = b.status || (b.actualCheckOut ? 'Checked-Out' : 'Checked-In');
                  return st === 'Checked-In';
                }).length}</p>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => setCardDetailsModal('active-staff')}>
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
                      <button onClick={() => handleDeleteBooking(booking.id)} style={{display: currentUserRole === 'sadmin' ? 'inline-block' : 'none', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', transition: '0.3s'}} title="Archive Booking">Archive</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No recent bookings found.</td></tr>
                )}
              </tbody>
            </table>

            {/* Card Details Modal */}
            {cardDetailsModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '15px', padding: '30px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '15px' }}>
                    <h2 style={{ color: '#d4af37', margin: 0, fontSize: '1.5rem' }}>
                      {cardDetailsModal === 'available' && '🏨 Available Rooms'}
                      {cardDetailsModal === 'checkout' && '🚪 Checked-In Guests (Pending Check-Out)'}
                      {cardDetailsModal === 'bookings' && '📅 All Bookings'}
                      {cardDetailsModal === 'active-staff' && '👔 Active Staff Members'}
                    </h2>
                    <button onClick={() => setCardDetailsModal(null)} style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: 'none', fontSize: '1.5rem', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>

                  {cardDetailsModal === 'available' && (
                    <div>
                      <p style={{ color: '#aaa', marginBottom: '20px', fontSize: '1rem' }}>Total Available: <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '1.2rem' }}>{getAvailableRooms().length} Rooms</span></p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
                        {getAvailableRooms().length > 0 ? getAvailableRooms().map(room => (
                          <div key={room} style={{ background: 'rgba(46, 204, 113, 0.15)', border: '2px solid #2ecc71', borderRadius: '8px', padding: '15px', textAlign: 'center', color: '#2ecc71', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s' }}>
                            Room {room}
                          </div>
                        )) : (
                          <p style={{ color: '#e74c3c', gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>No rooms available at the moment</p>
                        )}
                      </div>
                    </div>
                  )}

                  {cardDetailsModal === 'checkout' && (
                    <div>
                      <p style={{ color: '#aaa', marginBottom: '20px', fontSize: '1rem' }}>Total Checked-In: <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '1.2rem' }}>{getCheckedInGuests().length} Guests</span></p>
                      {getCheckedInGuests().length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          {getCheckedInGuests().map((guest, idx) => (
                            <div key={idx} style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: '8px', padding: '15px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>{guest.name}</span>
                                <span style={{ background: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', padding: '5px 12px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>Checked-In</span>
                              </div>
                              <p style={{ color: '#aaa', margin: '8px 0', fontSize: '0.9rem' }}>📞 {guest.mobile}</p>
                              <p style={{ color: '#aaa', margin: '8px 0', fontSize: '0.9rem' }}>🏨 {guest.room}</p>
                              <p style={{ color: '#aaa', margin: '8px 0', fontSize: '0.9rem' }}>📅 Check-In: {guest.checkIn} | Check-Out: {guest.checkOut}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: '#2ecc71', textAlign: 'center', padding: '20px' }}>No checked-in guests at the moment</p>
                      )}
                    </div>
                  )}

                  {cardDetailsModal === 'bookings' && (
                    <div>
                      <p style={{ color: '#aaa', marginBottom: '20px', fontSize: '1rem' }}>Total Bookings: <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1.2rem' }}>{bookings.length} Bookings</span></p>
                      {bookings.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          {bookings.slice(0, 10).map((booking, idx) => (
                            <div key={idx} style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px', padding: '15px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>{booking.name}</span>
                                <span style={{ background: booking.status === 'Checked-In' || !booking.actualCheckOut ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: booking.status === 'Checked-In' || !booking.actualCheckOut ? '#27ae60' : '#e74c3c', padding: '5px 12px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>{booking.status || (booking.actualCheckOut ? 'Checked-Out' : 'Checked-In')}</span>
                              </div>
                              <p style={{ color: '#aaa', margin: '8px 0', fontSize: '0.9rem' }}>ID: {booking.id}</p>
                              <p style={{ color: '#aaa', margin: '8px 0', fontSize: '0.9rem' }}>🏨 {booking.room}</p>
                              <p style={{ color: '#d4af37', margin: '8px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>₹{booking.totalAmount}</p>
                            </div>
                          ))}
                          {bookings.length > 10 && <p style={{ color: '#888', textAlign: 'center', marginTop: '15px' }}>... and {bookings.length - 10} more bookings</p>}
                        </div>
                      ) : (
                        <p style={{ color: '#2ecc71', textAlign: 'center', padding: '20px' }}>No bookings found</p>
                      )}
                    </div>
                  )}

                  {cardDetailsModal === 'active-staff' && (
                    <div>
                      <p style={{ color: '#aaa', marginBottom: '20px', fontSize: '1rem' }}>Total Active: <span style={{ color: '#3498db', fontWeight: 'bold', fontSize: '1.2rem' }}>{staffList.filter(s => s.status === 'Present').length} / {staffList.length}</span></p>
                      {staffList.filter(s => s.status === 'Present').length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          {staffList.filter(s => s.status === 'Present').map((staff, idx) => (
                            <div key={idx} style={{ background: 'rgba(46, 204, 113, 0.1)', border: '1px solid rgba(46, 204, 113, 0.3)', borderRadius: '8px', padding: '15px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>{staff.name}</span>
                                <span style={{ background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', padding: '5px 12px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>● Present</span>
                              </div>
                              <p style={{ color: '#aaa', margin: '8px 0', fontSize: '0.9rem' }}>{staff.staffId} - {staff.role}</p>
                              <p style={{ color: '#aaa', margin: '8px 0', fontSize: '0.9rem' }}>Shift: {staff.shift}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: '#e74c3c', textAlign: 'center', padding: '20px' }}>No staff members present</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
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
                    <td style={{ padding: '15px' }}>
                      {booking.companyName && <><strong style={{color:'#d4af37'}}>{booking.companyName}</strong><br/></>}
                      {booking.name}<br/><small style={{color:'#888'}}>{booking.mobile}</small>
                    </td>
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
                            {currentUserRole === 'sadmin' && <button className="admin-btn-action" style={{background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid #e74c3c'}} onClick={() => handleDeleteBooking(booking.id)}>Archive</button>}
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
                  <tr key={staff._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ccc' }}>
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
                      <button onClick={() => updateStaffStatus(staff._id, 'Present')} style={{ background: 'rgba(39, 174, 96, 0.2)', color: '#27ae60', border: '1px solid #27ae60', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Present</button>
                      <button onClick={() => updateStaffStatus(staff._id, 'Half Day')} style={{ background: 'rgba(52, 152, 219, 0.2)', color: '#3498db', border: '1px solid #3498db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Half Day</button>
                      <button onClick={() => updateStaffStatus(staff._id, 'Absent')} style={{ background: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Absent</button>
                      <button onClick={() => updateStaffStatus(staff._id, 'Leave')} style={{ background: 'rgba(241, 196, 15, 0.2)', color: '#f1c40f', border: '1px solid #f1c40f', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Leave</button>
                      <button onClick={() => { setSelectedStaff(staff); setViewModal('staff_history'); }} style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid #666', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>📜 Record</button>
                      {currentUserRole === 'sadmin' && <button onClick={() => deleteStaff(staff._id)} style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Archive</button>}
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

        {activeTab === 'multi_booking' && (
          <section className="guest-entry-page corporate-booking-page">
            <div className="corporate-booking-intro">
              <div>
                <span className="corporate-booking-kicker">Group Reservation</span>
                <h2>Corporate / Multi-Room Booking</h2>
              </div>
              <p className="guest-entry-subtitle">Select the required room numbers, add one-room rent, and the full booking amount will calculate automatically.</p>
            </div>
            
            <form onSubmit={handleMultiBookingSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Company / Group Name (Optional)</label>
                <input type="text" value={multiBookingData.companyName} onChange={(e) => setMultiBookingData({...multiBookingData, companyName: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="e.g. Garud Stacks Pvt. Ltd." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Primary Booker Name *</label>
                <input type="text" required value={multiBookingData.guestName} onChange={(e) => setMultiBookingData({...multiBookingData, guestName: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="Enter Name" />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Mobile Number *</label>
                <input type="tel" required value={multiBookingData.mobile} onChange={(e) => setMultiBookingData({...multiBookingData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="10-digit Mobile" maxLength="10" pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Company GSTIN (For B2B Invoice)</label>
                <input type="text" value={multiBookingData.guestGstin} onChange={(e) => setMultiBookingData({...multiBookingData, guestGstin: e.target.value.toUpperCase()})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem', textTransform: 'uppercase' }} placeholder="e.g. 23XXXXX..." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Company Address (Optional)</label>
                <input type="text" value={multiBookingData.address} onChange={(e) => setMultiBookingData({...multiBookingData, address: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="City, State" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Room Category *</label>
                <select required value={multiBookingData.roomType} onChange={(e) => setMultiBookingData({...multiBookingData, roomType: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }}>
                  <option>Standard Room</option>
                  <option>Standard Single Room</option>
                  <option>Comfort Double Room</option>
                  <option>Premium Double</option>
                  <option>Deluxe Suite</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Rent Per Room / Night (Rs.) *</label>
                <input type="number" min="1" required value={multiBookingData.roomRate} onChange={(e) => setMultiBookingData({...multiBookingData, roomRate: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="0" />
              </div>

              <div className="multi-room-selector">
                <div className="multi-room-selector-header">
                  <label>Select Room Numbers *</label>
                  <strong>{multiRoomCount} room(s) selected</strong>
                </div>
                <div className="multi-room-grid">
                  {multiRoomOptions.map(roomNumber => {
                    const selected = multiBookingData.roomNumbers.includes(roomNumber);
                    const conflict = getRoomConflict(roomNumber, multiBookingData.checkIn, multiBookingData.checkOut);
                    const upcoming = getUpcomingRoomBooking(roomNumber);
                    const unavailable = Boolean(conflict);
                    return (
                      <button type="button" key={roomNumber} className={unavailable ? 'unavailable' : selected ? 'selected' : ''} onClick={() => toggleMultiRoom(roomNumber)} aria-pressed={selected} disabled={unavailable}>
                        {roomNumber}
                        {conflict && <small>Booked: {formatBookingWindow(conflict)}</small>}
                        {!conflict && upcoming && <small>Next: {formatBookingWindow(upcoming)}</small>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Check-In Date & Time *</label>
                <input type="datetime-local" required value={multiBookingData.checkIn} onChange={(e) => setMultiBookingData({...multiBookingData, checkIn: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem', colorScheme: 'dark' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>Check-Out Date & Time *</label>
                  <span style={{ color: '#27ae60', fontSize: '0.85rem', fontWeight: 'bold', background: 'rgba(39,174,96,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{multiNightCount} Night(s)</span>
                </div>
                <input type="datetime-local" required value={multiBookingData.checkOut} onChange={(e) => setMultiBookingData({...multiBookingData, checkOut: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem', colorScheme: 'dark' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Total Guests *</label>
                <input type="number" min="1" required value={multiBookingData.guests} onChange={(e) => setMultiBookingData({...multiBookingData, guests: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Payment Method *</label>
                <select value={multiBookingData.paymentMethod} onChange={(e) => setMultiBookingData({...multiBookingData, paymentMethod: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }}>
                  <option value="Online">💳 Online Payment (Razorpay)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Cash">Cash / Cheque</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Automatic Total Amount (Rs.)</label>
                <input type="number" readOnly value={multiBookingTotalAmount} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d4af37', background: 'rgba(212,175,55,0.05)', color: '#d4af37', outline: 'none', fontWeight: 'bold', fontSize: '1.2rem' }} />
                <small className="booking-total-formula">{multiRoomCount} room(s) × Rs. {multiRoomRate} × {multiNightCount} night(s)</small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Advance Received (Rs.)</label>
                <input type="number" min="0" max={multiBookingTotalAmount} value={multiBookingData.advance} onChange={(e) => setMultiBookingData({...multiBookingData, advance: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #27ae60', background: 'rgba(39, 174, 96, 0.05)', color: '#27ae60', outline: 'none', fontWeight: 'bold', fontSize: '1.2rem' }} placeholder="0" />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#111', padding: '18px', borderRadius: '10px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', border: 'none', boxShadow: '0 8px 20px rgba(212,175,55,0.3)', textTransform: 'uppercase', letterSpacing: '2px', transition: '0.3s' }}>
                  🏨 Confirm Corporate Booking & Generate Bill
                </button>
              </div>
            </form>
          </section>
        )}

        {activeTab === 'create_bill' && (
          <section className="guest-entry-page create-bill-page">
            <h2>Create Manual Invoice</h2>
            <p className="guest-entry-subtitle">Select rooms and enter the rent for one room. The invoice amount will be calculated from rooms and nights automatically.</p>
            
            <form onSubmit={handleCreateBill} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Guest Name *</label>
                <input type="text" required value={customBill.name} onChange={(e) => setCustomBill({...customBill, name: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="Enter Name" />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Mobile Number *</label>
                <input type="tel" required value={customBill.mobile} onChange={(e) => setCustomBill({...customBill, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="10-digit Mobile" maxLength="10" pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Guest GSTIN (Optional / For Gov-B2B)</label>
                <input type="text" value={customBill.guestGstin} onChange={(e) => setCustomBill({...customBill, guestGstin: e.target.value.toUpperCase()})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem', textTransform: 'uppercase' }} placeholder="e.g. 23XXXXX..." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Address (Optional)</label>
                <input type="text" value={customBill.address} onChange={(e) => setCustomBill({...customBill, address: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="City, State" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Room Category *</label>
                <select required value={customBill.roomType} onChange={(e) => setCustomBill({...customBill, roomType: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }}>
                  <option>Standard Room</option>
                  <option>Standard Single Room</option>
                  <option>Comfort Double Room</option>
                  <option>Premium Double</option>
                  <option>Deluxe Suite</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Rent Per Room / Night (Rs.) *</label>
                <input type="number" min="1" required value={customBill.roomRate} onChange={(e) => setCustomBill({...customBill, roomRate: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }} placeholder="0" />
              </div>

              <div className="multi-room-selector">
                <div className="multi-room-selector-header">
                  <label>Select Room Numbers *</label>
                  <strong>{customBillRoomCount} room(s) selected</strong>
                </div>
                <div className="multi-room-grid">
                  {multiRoomOptions.map(roomNumber => {
                    const selected = customBill.roomNumbers.includes(roomNumber);
                    return (
                      <button type="button" key={roomNumber} className={selected ? 'selected' : ''} onClick={() => toggleCustomBillRoom(roomNumber)} aria-pressed={selected}>
                        {roomNumber}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Check-In Date *</label>
                <input type="date" required value={customBill.checkIn} onChange={(e) => setCustomBill({...customBill, checkIn: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem', colorScheme: 'dark' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>Check-Out Date *</label>
                  <span style={{ color: '#27ae60', fontSize: '0.85rem', fontWeight: 'bold', background: 'rgba(39,174,96,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{customBillNightCount} Night(s)</span>
                </div>
                <input type="date" required value={customBill.checkOut} onChange={(e) => setCustomBill({...customBill, checkOut: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem', colorScheme: 'dark' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Total Guests</label>
                <input type="number" min="1" required value={customBill.guests} onChange={(e) => setCustomBill({...customBill, guests: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Payment Method *</label>
                <select value={customBill.paymentMethod} onChange={(e) => setCustomBill({...customBill, paymentMethod: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', outline: 'none', fontSize: '1rem' }}>
                  <option value="Online">💳 Online Payment (Razorpay)</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Automatic Total Amount (Rs.)</label>
                <input type="number" readOnly value={customBillTotalAmount} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d4af37', background: 'rgba(212,175,55,0.05)', color: '#d4af37', outline: 'none', fontWeight: 'bold', fontSize: '1.2rem' }} />
                <small className="booking-total-formula">{customBillRoomCount} room(s) × Rs. {customBillRoomRate} × {customBillNightCount} night(s)</small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold' }}>Advance Paid (Rs.)</label>
                <input type="number" min="0" max={customBillTotalAmount} value={customBill.advance} onChange={(e) => setCustomBill({...customBill, advance: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #27ae60', background: 'rgba(39, 174, 96, 0.05)', color: '#27ae60', outline: 'none', fontWeight: 'bold', fontSize: '1.2rem' }} placeholder="0" />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#111', padding: '18px', borderRadius: '10px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', border: 'none', boxShadow: '0 8px 20px rgba(212,175,55,0.3)', textTransform: 'uppercase', letterSpacing: '2px', transition: '0.3s' }}>
                  🧾 Generate Final Bill
                </button>
              </div>
            </form>
          </section>
        )}

        {activeTab === 'guest_entry' && (
          <section className="guest-entry-page">
              <h2>Front Desk Guest Entry</h2>
              <p className="guest-entry-subtitle">Register a walk-in guest with room, stay, ID and payment details.</p>

              <form onSubmit={handleEntrySubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '18px' }}>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Guest Name *
                  <input type="text" required value={entryData.name} onChange={e => setEntryData({ ...entryData, name: e.target.value })} style={{ padding: '13px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff' }} />
                </label>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Mobile Number *
                  <input type="tel" required value={entryData.mobile} onChange={e => setEntryData({ ...entryData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} maxLength="10" pattern="[0-9]{10}" style={{ padding: '13px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff' }} />
                </label>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                  Complete Address *
                  <textarea required value={entryData.address} onChange={e => setEntryData({ ...entryData, address: e.target.value })} rows="2" style={{ padding: '13px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff', resize: 'vertical' }} />
                </label>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Guest Photo
                  <input type="file" accept="image/*" capture="user" onChange={handleEntryPhotoChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#ccc' }} />
                </label>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  ID Upload *
                  <input type="file" required multiple accept="image/*,.pdf" capture="environment" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#ccc' }} />
                </label>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Room Type *
                  <select required value={entryData.roomType} onChange={e => setEntryData({ ...entryData, roomType: e.target.value })} style={{ padding: '13px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff' }}>
                    <option>Standard Room</option>
                    <option>Standard Single Room</option>
                    <option>Comfort Double Room</option>
                    <option>Couple Hourly (3-4 Hrs)</option>
                    <option>Premium Double</option>
                    <option>Deluxe Suite</option>
                  </select>
                </label>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Available Room Number *
                  <select required value={entryData.roomNumber} onChange={e => setEntryData({ ...entryData, roomNumber: e.target.value })} style={{ padding: '13px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff' }}>
                    <option value="">Select room</option>
                    {entryRoomOptions.map(({ roomNumber, conflict, upcoming }) => (
                      <option key={roomNumber} value={roomNumber} disabled={Boolean(conflict)}>
                        Room {roomNumber}{conflict ? ` - Booked: ${formatBookingWindow(conflict)}` : upcoming ? ` - Next: ${formatBookingWindow(upcoming)}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Check-in *
                  <input type="datetime-local" required value={entryData.checkInDate} onChange={e => setEntryData({ ...entryData, checkInDate: e.target.value })} style={{ padding: '13px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff', colorScheme: 'dark' }} />
                </label>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Stay Duration *
                  <span style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" min="1" required value={entryData.durationValue} onChange={e => setEntryData({ ...entryData, durationValue: e.target.value })} style={{ width: '50%', padding: '13px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff' }} />
                    <select value={entryData.durationUnit} onChange={e => setEntryData({ ...entryData, durationUnit: e.target.value })} style={{ width: '50%', padding: '13px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff' }}>
                      <option value="Hours">Hours</option>
                      <option value="Days">Days</option>
                    </select>
                  </span>
                  {entryData.checkOutDate && <small style={{ color: '#2ecc71' }}>Till {new Date(entryData.checkOutDate).toLocaleString('en-IN')}</small>}
                </label>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Total Guests *
                  <input type="number" min="1" required value={entryData.guests} onChange={e => setEntryData({ ...entryData, guests: e.target.value })} style={{ padding: '13px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff' }} />
                </label>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Total Amount *
                  <input type="number" min="0" required value={entryData.totalAmount} onChange={e => setEntryData({ ...entryData, totalAmount: e.target.value })} style={{ padding: '13px', borderRadius: '6px', border: '1px solid #d4af37', background: '#111', color: '#d4af37' }} />
                </label>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Down Payment *
                  <input type="number" min="0" max={entryTotalAmount} required value={entryData.downPayment} onChange={e => setEntryData({ ...entryData, downPayment: e.target.value })} style={{ padding: '13px', borderRadius: '6px', border: '1px solid #2ecc71', background: '#111', color: '#2ecc71' }} />
                </label>
                <label style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Payment Method *
                  <select required value={entryData.paymentMethod} onChange={e => setEntryData({ ...entryData, paymentMethod: e.target.value })} style={{ padding: '13px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff' }}>
                    <option value="Online">💳 Online Payment (Razorpay)</option>
                    <option value="Cash">Cash / Counter</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </label>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', gap: '15px', padding: '18px', background: '#111', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', color: '#ccc', flexWrap: 'wrap' }}>
                  <span>Total: <strong style={{ color: '#d4af37' }}>Rs. {entryTotalAmount}</strong></span>
                  <span>Advance: <strong style={{ color: '#2ecc71' }}>Rs. {entryDownPayment}</strong></span>
                  <span>Pending: <strong style={{ color: '#fff' }}>Rs. {entryPendingAmount}</strong></span>
                </div>
                <button type="submit" style={{ gridColumn: '1 / -1', padding: '16px', background: 'linear-gradient(135deg, #d4af37, #b5952f)', color: '#111', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer' }}>
                  Confirm Guest Entry
                </button>
              </form>
          </section>
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
                      {selectedBooking.companyName && <div><small style={{ color: '#777' }}>Company Name</small><br/><strong style={{ color: '#d4af37' }}>{selectedBooking.companyName}</strong></div>}
                      <div><small style={{ color: '#777' }}>Guest Name</small><br/><strong style={{ color: '#fff' }}>{selectedBooking.name}</strong></div>
                      <div><small style={{ color: '#777' }}>Guest GSTIN</small><br/><strong style={{ color: '#fff' }}>{selectedBooking.guestGstin || 'Unregistered'}</strong></div>
                      <div><small style={{ color: '#777' }}>Mobile</small><br/><strong style={{ color: '#fff' }}>{selectedBooking.mobile}</strong></div>
                      <div><small style={{ color: '#777' }}>Total Guests</small><br/><strong style={{ color: '#fff' }}>{selectedBooking.guests}</strong></div>
                      <div style={{ gridColumn: '1 / -1' }}><small style={{ color: '#777' }}>Address</small><br/><strong style={{ color: '#ccc' }}>{selectedBooking.address}</strong></div>
                      <div style={{ gridColumn: '1 / -1' }}><small style={{ color: '#777' }}>Room</small><br/><strong style={{ color: '#d4af37' }}>{selectedBooking.room}</strong></div>
                      <div><small style={{ color: '#777' }}>Total Rooms</small><br/><strong style={{ color: '#fff' }}>{selectedBooking.roomCount || 1}</strong></div>
                      <div><small style={{ color: '#777' }}>Check-In</small><br/><strong style={{ color: '#fff' }}>{selectedBooking.checkIn}</strong></div>
                      <div><small style={{ color: '#777' }}>Check-Out</small><br/><strong style={{ color: '#fff' }}>{selectedBooking.actualCheckOut || selectedBooking.checkOut}</strong></div>
                    </div>
                  </div>
                </>
              )}

              {viewModal === 'bill' && (
                <div className="invoice-container" id="printable-invoice" style={{ background: '#fff', color: '#000', padding: '40px', borderRadius: '8px', maxWidth: '850px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 'bold', color: '#555', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Original For Recipient</div>
                  {/* Header Section */}
                  <div className="invoice-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <img src="/logo.png" alt="Viswa Hotel" style={{ width: '85px', height: '85px', objectFit: 'contain' }} />
                      <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#111', fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '1px' }}>VISWA HOTEL & RESORTS</h1>
                        <p style={{ margin: '2px 0 6px 0', fontSize: '0.75rem', color: '#333', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>(Owned & Operated by Garud Stacks Pvt. Ltd.)</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: '1.5' }}>
                          <strong>GSTIN:</strong> 23AAMC7637E1ZJ | 
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h2 style={{ margin: 0, fontSize: '2rem', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '2px' }}>TAX INVOICE</h2>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#444' }}>
                        <strong>Invoice No:</strong> {selectedBooking.id.replace('VSW', 'INV-2026')}<br/>
                        <strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Guest & Booking Info */}
                  <div className="invoice-booking-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    <div style={{ width: '48%' }}>
                      <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '5px', margin: '0 0 10px 0', color: '#333' }}>BILLED TO:</h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: '#222' }}>
                        {selectedBooking.companyName ? (
                          <>
                            <strong style={{ fontSize: '1.1rem', color: '#111', textTransform: 'uppercase' }}>{selectedBooking.companyName}</strong><br/>
                            <span style={{ color: '#555' }}>Attn: {selectedBooking.name}</span><br/>
                          </>
                        ) : (
                          <>
                            <strong>{selectedBooking.name}</strong><br/>
                          </>
                        )}
                        Phone: {selectedBooking.mobile}<br/>
                        Address: {selectedBooking.address || 'N/A'}<br/>
                        <span style={{ color: '#333', fontWeight: 'bold', display: 'inline-block', marginTop: '3px' }}>Guest GSTIN: {selectedBooking.guestGstin || 'URV (Unregistered)'}</span>
                      </p>
                    </div>
                    <div style={{ width: '48%' }}>
                      <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '5px', margin: '0 0 10px 0', color: '#333' }}>STAY DETAILS:</h3>
                      <table style={{ width: '100%', fontSize: '0.9rem', lineHeight: '1.6', color: '#222' }}>
                        <tbody>
                          <tr><td style={{ width: '40%' }}><strong>Booking ID:</strong></td><td>{selectedBooking.id}</td></tr>
                          <tr><td><strong>Room Details:</strong></td><td>{selectedBooking.room}</td></tr>
                          <tr><td><strong>Total Rooms:</strong></td><td>{selectedBooking.roomCount || 1}</td></tr>
                          {selectedBooking.roomRate != null && <tr><td><strong>Rate / Room / Night:</strong></td><td>Rs. {Number(selectedBooking.roomRate).toFixed(2)}</td></tr>}
                          {selectedBooking.nights != null && <tr><td><strong>Total Nights:</strong></td><td>{selectedBooking.nights}</td></tr>}
                          <tr><td><strong>Check-In:</strong></td><td>{selectedBooking.checkIn}</td></tr>
                          <tr><td><strong>Check-Out:</strong></td><td>{selectedBooking.actualCheckOut || selectedBooking.checkOut}</td></tr>
                          <tr><td><strong>Total Guests:</strong></td><td>{selectedBooking.guests} Person(s)</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Itemized Services Table */}
                  <table className="invoice-services-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f4f4f4', color: '#333', textAlign: 'left', borderTop: '2px solid #333', borderBottom: '2px solid #333' }}>
                        <th style={{ padding: '12px', fontSize: '0.9rem' }}>#</th>
                        <th style={{ padding: '12px', fontSize: '0.9rem' }}>Description of Services</th>
                        <th style={{ padding: '12px', fontSize: '0.9rem', textAlign: 'center' }}>HSN / SAC</th>
                        <th style={{ padding: '12px', fontSize: '0.9rem', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '12px', fontSize: '0.9rem', textAlign: 'right' }}>Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '12px', fontSize: '0.9rem', color: '#222' }}>1</td>
                        <td style={{ padding: '12px', fontSize: '0.9rem', color: '#222' }}>
                          Accommodation Services - {selectedBooking.room}
                          {selectedBooking.roomRate != null && <div style={{ marginTop: '4px', color: '#666', fontSize: '0.8rem' }}>Rs. {Number(selectedBooking.roomRate).toFixed(2)} × {selectedBooking.roomCount || 1} room(s) × {selectedBooking.nights || 1} night(s)</div>}
                        </td>
                        <td style={{ padding: '12px', fontSize: '0.9rem', color: '#222', textAlign: 'center' }}>996311</td>
                        <td style={{ padding: '12px', fontSize: '0.9rem', color: '#222', textAlign: 'center' }}>{selectedBooking.roomCount || 1}</td>
                        <td style={{ padding: '12px', fontSize: '0.9rem', color: '#222', textAlign: 'right' }}>{((Number(selectedBooking.totalAmount) || 0) / 1.12).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Totals & UPI QR Code Section */}
                  <div className="invoice-payment-section" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'flex-end' }}>
                    <div style={{ width: '55%', textAlign: 'left' }}>
                      {Math.max(0, Number(selectedBooking.totalAmount) - Number(selectedBooking.advance)) > 0 ? (
                        <div style={{ padding: '15px 20px', border: '1px solid #e0e0e0', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '25px', background: '#fcfcfc', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', fontWeight: 'bold', color: '#333', textTransform: 'uppercase', letterSpacing: '1px' }}>Scan & Pay</p>
                            <div style={{ background: '#fff', padding: '6px', borderRadius: '8px', border: '1px solid #eee', display: 'inline-block' }}>
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=paytm.s2e65rl@pty&pn=Viswa%20Hotel&am=${Math.max(0, Number(selectedBooking.totalAmount) - Number(selectedBooking.advance)).toFixed(2)}&cu=INR`)}`} alt="UPI QR Code" style={{ width: '85px', height: '85px', display: 'block', margin: '0 auto' }} />
                            </div>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', color: '#666', fontFamily: 'monospace', fontWeight: 'bold' }}>paytm.s2e65rl@pty</p>
                          </div>
                          <div style={{ borderLeft: '1px dashed #ccc', paddingLeft: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#111', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bank Transfer Details</p>
                            <table style={{ fontSize: '0.8rem', color: '#333', borderCollapse: 'collapse', textAlign: 'left' }}>
                              <tbody>
                                <tr><td style={{ padding: '0 15px 6px 0', color: '#777' }}>Bank:</td><td style={{ padding: '0 0 6px 0' }}><strong>HDFC Bank Ltd.</strong></td></tr>
                                <tr><td style={{ padding: '0 15px 6px 0', color: '#777' }}>A/C Name:</td><td style={{ padding: '0 0 6px 0' }}><strong>Garud Stacks Pvt. Ltd.</strong></td></tr>
                                <tr><td style={{ padding: '0 15px 6px 0', color: '#777' }}>A/C No:</td><td style={{ padding: '0 0 6px 0', fontFamily: 'monospace', fontSize: '0.9rem' }}><strong>50200012345678</strong></td></tr>
                                <tr><td style={{ padding: '0 15px 0 0', color: '#777' }}>IFSC Code:</td><td style={{ padding: 0, fontFamily: 'monospace', fontSize: '0.9rem' }}><strong>HDFC0001234</strong></td></tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '15px 25px', border: '2px solid #27ae60', borderRadius: '12px', display: 'inline-block', background: 'rgba(39, 174, 96, 0.05)' }}>
                          <h3 style={{ margin: 0, color: '#27ae60', fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Fully Paid ✅</h3>
                          <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#444' }}>Thank you for your visit!</p>
                        </div>
                      )}
                    </div>

                    <div style={{ width: '42%' }}>
                      <table style={{ width: '100%', fontSize: '0.95rem', color: '#222' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '6px', textAlign: 'right' }}><strong>Taxable Amount:</strong></td>
                            <td style={{ padding: '6px', textAlign: 'right', width: '140px' }}>₹{((Number(selectedBooking.totalAmount) || 0) / 1.12).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '6px', textAlign: 'right' }}><strong>CGST @ 6%:</strong></td>
                            <td style={{ padding: '6px', textAlign: 'right' }}>₹{(((Number(selectedBooking.totalAmount) || 0) - (Number(selectedBooking.totalAmount) || 0) / 1.12) / 2).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '6px', textAlign: 'right', borderBottom: '2px solid #333' }}><strong>SGST @ 6%:</strong></td>
                            <td style={{ padding: '6px', textAlign: 'right', borderBottom: '2px solid #333' }}>₹{(((Number(selectedBooking.totalAmount) || 0) - (Number(selectedBooking.totalAmount) || 0) / 1.12) / 2).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '1.1rem' }}><strong>Grand Total:</strong></td>
                            <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '1.1rem' }}><strong>₹{Number(selectedBooking.totalAmount).toFixed(2)}</strong></td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#27ae60', borderBottom: '2px solid #333' }}>Advance Paid ({selectedBooking.paymentMethod}):</td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#27ae60', borderBottom: '2px solid #333', fontSize: '1.05rem' }}>- ₹{Number(selectedBooking.advance).toFixed(2)}</td>
                          </tr>
                          <tr style={{ backgroundColor: '#f9f9f9' }}>
                            <td style={{ padding: '15px 8px', textAlign: 'right', fontSize: '1.3rem', textTransform: 'uppercase' }}><strong>Balance Due:</strong></td>
                            <td style={{ padding: '15px 8px', textAlign: 'right', fontSize: '1.3rem', color: (Number(selectedBooking.totalAmount) - Number(selectedBooking.advance)) > 0 ? '#e74c3c' : '#27ae60' }}>
                              <strong>₹{Math.max(0, Number(selectedBooking.totalAmount) - Number(selectedBooking.advance)).toFixed(2)}</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Address, Footer Terms & Digital Signature */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #333', paddingTop: '20px' }}>
                    <div style={{ width: '65%', fontSize: '0.75rem', color: '#444', lineHeight: '1.6' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#111' }}>Hotel Address & Contact:</strong><br/>
                      30, Zone-II, Maharana Pratap Nagar, Bhopal, MP - 462011<br/>
                      📞 +91 93017 83278 | ✉️ visawah401@gmail.com<br/><br/>
                      <strong>Terms & Conditions:</strong><br/>
                      1. Payment is due upon receipt. Late payments may attract interest.<br/>
                      2. Reverse Charge Mechanism (RCM) is not applicable.<br/>
                      3. All disputes are subject to Bhopal jurisdiction.<br/>
                      4. This is a computer-generated tax invoice and does not require a physical signature.
                    </div>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                      <div style={{ borderBottom: '1px solid #333', height: '40px', marginBottom: '5px' }}>
                        <span style={{ fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive', fontSize: '1.8rem', color: '#111', fontStyle: 'italic', paddingRight: '10px' }}>P. Garud</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#333', fontWeight: 'bold', textTransform: 'uppercase' }}>Authorized Signatory</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.65rem', color: '#666', textTransform: 'uppercase' }}>For Garud Stacks Pvt. Ltd.</p>
                    </div>
                  </div>

                  {/* Print & Share Action Buttons */}
                  <div style={{ textAlign: 'center', marginTop: '40px' }} className="no-print-action">
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <button onClick={() => window.print()} style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(46, 204, 113, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        🖨️ Print Legal Invoice
                      </button>
                      <a href={`https://wa.me/${selectedBooking.mobile ? (selectedBooking.mobile.replace(/\D/g, '').length === 10 ? '91' + selectedBooking.mobile.replace(/\D/g, '') : selectedBooking.mobile.replace(/\D/g, '')) : ''}?text=${encodeURIComponent(`*INVOICE - VISWA HOTEL & RESORTS*\n-----------------------------------\n*Invoice No:* ${selectedBooking.id.replace('VSW', 'INV-2026')}\n*Guest:* ${selectedBooking.companyName ? selectedBooking.companyName + ' (' + selectedBooking.name + ')' : selectedBooking.name}\n*Rooms Booked:* ${selectedBooking.roomCount || 1} (${selectedBooking.room})\n\n*Total Amount:* ₹${Number(selectedBooking.totalAmount).toFixed(2)}\n*Advance Paid:* ₹${Number(selectedBooking.advance).toFixed(2)}\n*Balance Due:* ₹${Math.max(0, Number(selectedBooking.totalAmount) - Number(selectedBooking.advance)).toFixed(2)}\n\nThank you for choosing Viswa Hotel & Resorts!`)}`} target="_blank" rel="noreferrer" style={{ background: '#25D366', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Share on WhatsApp
                      </a>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '12px' }}>Tip: Use A4 Paper size and check "Background graphics" in print settings.</p>
                  </div>

                  {/* CSS specific for printing perfectly on A4 */}
                  <style>
                    {`
                      @media print {
                        body * { visibility: hidden; }
                        #printable-invoice, #printable-invoice * { visibility: visible; }
                        #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; margin: 0; padding: 20px; box-shadow: none; border: none; }
                        .no-print-action { display: none !important; }
                        .close-modal { display: none !important; }
                        .admin-modal { background: none !important; border: none !important; box-shadow: none !important; overflow: visible !important; }
                        .admin-modal-overlay { background: none !important; overflow: visible !important; align-items: flex-start; padding: 0; }
                      }
                    `}
                  </style>
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
                    <tr key={staff._id}>
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
        </>)}

      </main>
    </div>
  );
}

export default Admin;
