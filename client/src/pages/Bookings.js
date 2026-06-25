import React, { useState, useEffect } from 'react';
import './Bookings.css';
import { apiClient } from '../api';

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await apiClient.get(`/bookings/user/${userId}`);
      setBookings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      try {
        await apiClient.put(`/bookings/${bookingId}/cancel`);
        alert('Booking cancelled successfully');
        fetchBookings();
      } catch (error) {
        alert('Failed to cancel booking');
      }
    }
  };

  const handleCheckIn = async (bookingId) => {
    if (window.confirm('Are you sure you want to check-in now?')) {
      try {
        await apiClient.put(`/bookings/${bookingId}/checkin`);
        alert('Checked in successfully');
        fetchBookings();
      } catch (error) {
        alert('Failed to check in');
      }
    }
  };

  const handleCheckOut = async (bookingId) => {
    if (window.confirm('Are you sure you want to check-out now?')) {
      try {
        await apiClient.put(`/bookings/${bookingId}/checkout`);
        alert('Checked out successfully');
        fetchBookings();
      } catch (error) {
        alert('Failed to check out');
      }
    }
  };

  return (
    <main className="bookings-page">
      <h1>My Bookings</h1>
      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="no-bookings">
          <p>You have no bookings yet</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <h3>Booking ID: {booking.id}</h3>
                <span className={`status ${booking.status.toLowerCase()}`}>
                  {booking.status}
                </span>
              </div>
              <div className="booking-details">
                <p>
                  <strong>Room:</strong> {booking.room}
                </p>
                <p>
                  <strong>Check-in:</strong> {booking.checkIn}
                </p>
                <p>
                  <strong>Check-out:</strong> {booking.checkOut}
                </p>
                <p>
                  <strong>Guests:</strong> {booking.guests}
                </p>
                <p>
                  <strong>Total Price:</strong> ₹{booking.totalAmount}
                </p>
              </div>
              <div className="booking-actions">
                {booking.status === 'Pending' && (
                  <>
                    <button className="btn-checkin" onClick={() => handleCheckIn(booking.id)}>
                      Check-in
                    </button>
                    <button className="btn-cancel" onClick={() => handleCancel(booking.id)}>
                      Cancel
                    </button>
                  </>
                )}
                {booking.status === 'Checked-In' && (
                  <button className="btn-checkout" onClick={() => handleCheckOut(booking.id)}>
                    Check-out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default Bookings;
