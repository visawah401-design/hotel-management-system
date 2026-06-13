import React from 'react';
import './RoomCard.css';

function RoomCard({ room, onBook, isLoggedIn }) {
  const isHourlyRoom = room.roomType?.toLowerCase().includes('hourly');

  // Default fallback image
  let imageUrl = 'https://images.unsplash.com/photo-1582719478250-c89af14cf758?auto=format&fit=crop&w=800&q=80';
  
  // Check agar proper valid image URL hai
  if (room.image && String(room.image).trim() !== '') {
    imageUrl = room.image;
  } else if (room.images && room.images.length > 0 && String(room.images[0]).trim() !== '') {
    imageUrl = room.images[0];
  }
  
  const formatDateTime = (dt) => {
    if (!dt) return '';
    const date = new Date(dt);
    if (isNaN(date.getTime())) return dt;
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="room-card" style={{ position: 'relative' }}>
      {room.status !== 'Available' && (
        <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(231, 76, 60, 0.95)', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Already Booked
        </div>
      )}
      {room.status === 'Available' && (
        <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(39, 174, 96, 0.95)', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Available
        </div>
      )}
      <img 
        src={imageUrl} 
        alt={room.roomType} 
        className="room-image" 
        style={{ width: '100%', height: '200px', objectFit: 'cover', backgroundColor: '#e0e0e0' }} 
        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1582719478250-c89af14cf758?auto=format&fit=crop&w=800&q=80'; }}
      />
      <div className="room-info">
        <h3>{room.roomType} - Room {room.roomNumber}</h3>
        
        {room.status !== 'Available' && room.bookedFrom && room.bookedTo && (
          <div style={{ background: 'rgba(231, 76, 60, 0.05)', borderLeft: '3px solid #e74c3c', padding: '10px 12px', margin: '10px 0', borderRadius: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#e74c3c', fontWeight: 'bold', textTransform: 'uppercase' }}>From:</span>
                <span style={{ fontSize: '0.8rem', color: '#444', fontWeight: 'bold' }}>{formatDateTime(room.bookedFrom)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#e74c3c', fontWeight: 'bold', textTransform: 'uppercase' }}>To:</span>
                <span style={{ fontSize: '0.8rem', color: '#444', fontWeight: 'bold' }}>{formatDateTime(room.bookedTo)}</span>
              </div>
            </div>
          </div>
        )}

        <p className="capacity">Capacity: {room.capacity} guests</p>
        <p className="price">Rs. {room.pricePerNight} {isHourlyRoom ? 'short stay' : 'per night'}</p>
        <div className="amenities">
          {room.amenities && room.amenities.slice(0, 5).map((amenity, index) => (
            <span key={index}>{amenity}</span>
          ))}
        </div>
        <p className="description">{room.description || 'Comfortable and well-equipped room'}</p>
        <button
          className="btn-book"
          onClick={onBook}
          disabled={room.status !== 'Available'}
        >
          {room.status === 'Available' ? 'Book Now' : room.status}
        </button>
      </div>
    </div>
  );
}

export default RoomCard;