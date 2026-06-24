import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const heroSlides = [
  {
    image: '/hero6.png',
    label: 'Premium king room',
  },
  {
    image: '/hero2.png',
    label: 'Warm bedside comfort',
  },
  {
    image: '/hero3.png',
    label: 'Suite room lounge',
  },
  {
    image: '/hero4.png',
    label: 'Cozy hotel bedroom',
  },
  {
    image: '/hero5.png',
    label: 'Luxury twin beds',
  },
  {
    image: '/hero1.png',
    label: 'Spacious guest room',
  },
];

const roomRent = [
  {
    type: 'Single Room',
    price: '900',
    detail: 'Smart choice for solo and business guests.',
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Double Room',
    price: '1150',
    detail: 'Comfortable room for couples and small families.',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Couple Hourly (3-4 Hrs)',
    price: '600',
    detail: 'Short stay room with perfect comfort and complete privacy.',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
  },
];

const facilities = [
  'Restaurant',
  'Room Service',
  'Free WiFi',
  'Secure Parking',
  'Travel Desk',
  'Event Hall',
  'Pool Area',
  'Laundry',
];

const gallery = [
  {
    title: 'Spacious Guest Room',
    image: '/hero1.png',
  },
  {
    title: 'Warm Bedside Comfort',
    image: '/hero2.png',
  },
  {
    title: 'Suite Room Lounge',
    image: '/hero3.png',
  },
  {
    title: 'Standard Single Room',
    image: '/p1.png',
  },
  {
    title: 'Comfort Double Room',
    image: '/p2.png',
  },
  {
    title: 'Couple Hourly Room',
    image: '/p3.png',
  },
];

const nearbyPlaces = [
  { name: 'City Market', time: '8 min drive' },
  { name: 'Lake View Point', time: '15 min drive' },
  { name: 'Temple Route', time: '20 min drive' },
  { name: 'Business Hub', time: '10 min drive' },
];

const reviews = [
  {
    name: 'Rajesh patel',
    feedback: 'The rooms were spotless and the staff was incredibly polite. My family had a wonderful and comfortable stay. Great value for money!',
    image: '/rajesh.jpeg',
  },
  {
    name: 'Avad sharma',
    feedback: 'Excellent service! The restaurant and travel desk made my business trip very convenient. The booking process was simple and quick.',
    image: '/avad.png',
  },
  {
    name: 'Ravi rajak',
    feedback: 'We hosted a small family function here. The event space was arranged beautifully and the food service was exceptionally quick and delicious.',
    image: '/ravi.png',
  },
  {
    name: 'Fajal khan',
    feedback: 'A perfect place for a short stay. The check-in was smooth, and the room was very private and cozy. Highly recommended for couples.',
    image: '/fajal.png',
  },
];

const mapEmbedUrl = `https://maps.google.com/maps?q=Hotel+Visawa+Bhopal&t=&z=16&ie=UTF8&iwloc=&output=embed`;
const mapDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=Hotel+Visawa,30+Zone-II+Maharana+Pratap+Nagar+Bhopal`;

function Home() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="home">
      <style>{`
        /* --- COMPLETE HERO IMAGE RESPONSIVENESS FIX --- */

        /* 1. Set a responsive aspect ratio for the container */
        .hero-section {
          aspect-ratio: 16 / 9; /* Reverted to 16:9 to match image ratio */
          height: auto; /* Let the width determine the height */
          max-height: 90vh; /* Prevent it from being too tall on very tall screens */
          width: 100%;
          padding-top: 80px; /* Add space for the top navigation bar */
          background-color: #000; /* Fallback for image loading */
        }

        /* 2. Style the image itself for perfect fitting */
        .hero-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover; /* Fills the container, may crop slightly on extreme ratios */
          object-position: center; /* Ensures cropping is centered */
        }

        .reviews-section {
          padding: 80px 0;
          background-color: #111;
          overflow: hidden;
        }
        .reviews-slider {
          width: 100%;
          position: relative;
          margin-top: 40px;
          -webkit-mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
          mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
        }
        .reviews-track {
          display: flex;
          width: calc(380px * 8); /* 350px card + 30px gap */
          animation: scroll 30s linear infinite;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-380px * 4)); }
        }
        .reviews-slider:hover .reviews-track {
          animation-play-state: paused;
        }
        .review-card {
          width: 350px;
          flex-shrink: 0;
          background: #1a1a1a;
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 15px;
          padding: 30px;
          margin: 0 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .review-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(212, 175, 55, 0.15);
        }
        .review-content p {
          font-size: 1rem;
          line-height: 1.6;
          color: #ccc;
          margin: 0;
        }
        .review-author {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-top: 20px;
          border-top: 1px solid rgba(212, 175, 55, 0.15);
          padding-top: 20px;
        }
        .review-author img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(212, 175, 55, 0.5);
        }
        .review-author strong {
          color: #d4af37;
          font-weight: 600;
        }

        /* Manager Welcome Section */
        .manager-welcome-section {
          display: flex;
          align-items: center;
          gap: 80px;
          padding: 100px var(--page-padding);
          background: #0a0a0a;
          flex-wrap: wrap;
        }
        .manager-photo {
          flex: 1;
          min-width: 300px;
          text-align: center;
          position: relative;
          padding-bottom: 30px; /* Added padding below the photo */
        }
        .manager-photo img {
          width: 100%;
          max-width: 350px;
          border-radius: 15px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.7), 0 0 30px rgba(212,175,55,0.2);
          object-fit: cover;
          aspect-ratio: 4/5;
          border: 1px solid rgba(212, 175, 55, 0.2);
        }
        .manager-message {
          flex: 1.5;
          min-width: 320px;
        }
        .manager-message h2 {
          font-size: 2.8rem;
          font-family: Georgia, serif;
          margin-bottom: 15px;
          line-height: 1.2;
        }
        .manager-message p {
          font-size: 1.1rem;
          line-height: 1.7;
          color: #bbb;
          margin: 20px 0 30px 0;
          max-width: 650px;
        }
      `}</style>
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-slider" aria-hidden="true">
          {heroSlides.map((slide, index) => (
            <picture
              className={`hero-slide ${index === activeSlide ? 'active' : ''}`}
              key={slide.label}
            >
              <img src={slide.image} alt={slide.label} loading="eager" decoding="async" width="1600" height="900" />
            </picture>
          ))}
        </div>

        <div className="hero-overlay" />

        <div className="hero-inner">
          <div className="hero-content">
            <span className="hero-kicker">Premium stay, warm comfort</span>
            <h1 id="hero-title">Luxury hotel stays, dining, and events in Bhopal.</h1>
            <p>
              Elegant rooms, fresh dining, celebration spaces, and caring service for every visit.
            </p>
            <div className="hero-mobile-highlights" aria-label="Stay highlights">
              <span>Stay</span>
              <span>Dining</span>
              <span>Events</span>
            </div>
            <div className="hero-actions">
              <Link to="/rooms" className="cta-button">Book Now</Link>
              <a href="#video-tour" className="secondary-button">View Tour</a>
            </div>
            <div className="hero-tags" aria-label="Hotel room highlights">
              <span>Rooms</span>
              <span>Restaurant</span>
              <span>Events</span>
            </div>
          </div>

          <div className="hero-preview">
            <span>Now showing</span>
            <strong>{heroSlides[activeSlide].label}</strong>
            <div className="hero-dots" aria-label="Hero image slides">
              {heroSlides.map((slide, index) => (
                <button
                  className={index === activeSlide ? 'active' : ''}
                  key={slide.label}
                  onClick={() => setActiveSlide(index)}
                  type="button"
                  aria-label={`Show ${slide.label}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <form className="booking-strip" aria-label="Quick booking form">
        <label>
          Check in
          <input type="date" />
        </label>
        <label>
          Check out
          <input type="date" />
        </label>
        <label>
          Guests
          <select defaultValue="2">
            <option value="1">1 Guest</option>
            <option value="2">2 Guests</option>
            <option value="4">4 Guests</option>
          </select>
        </label>
        <Link to="/rooms" className="panel-button">Check Availability</Link>
      </form>

      <section className="quick-stats" aria-label="Hotel highlights" role="list">
        <div role="listitem"><strong>24/7</strong><span>Guest Support</span></div>
        <div role="listitem"><strong>35+</strong><span>Ready Rooms</span></div>
        <div role="listitem"><strong>4.8</strong><span>Guest Rating</span></div>
        <div role="listitem"><strong>10 min</strong><span>City Center</span></div>
      </section>

      <section className="intro-section" aria-labelledby="about-heading">
        <div className="intro-showcase">
          <span className="intro-ring" aria-hidden="true"></span>
          <img src="/logo.png" alt="Visawa Hotel & Resorts logo" loading="eager" decoding="async" width="96" height="96" />
          <strong>Visawa</strong>
          <small>Hotel & Resorts</small>
        </div>
        <div className="intro-content">
          <span className="eyebrow">Welcome To Visawa</span>
          <h2 id="about-heading">Stay, dine, celebrate, and travel with ease.</h2>
          <p>
            Visawa brings clean rooms, fresh dining, event spaces, and local travel help together
            in one welcoming place near 30, Zone-II, Maharana Pratap Nagar, Bhopal.
          </p>
          <div className="intro-points" aria-label="Visawa hotel highlights">
            <article>
              <span>01</span>
              <strong>Rest Easy</strong>
              <p>Clean rooms and calm comfort.</p>
            </article>
            <article>
              <span>02</span>
              <strong>Dine Well</strong>
              <p>Fresh meals for every mood.</p>
            </article>
            <article>
              <span>03</span>
              <strong>Celebrate</strong>
              <p>Spaces for special moments.</p>
            </article>
            <article className="mobile-only-card">
              <span>04</span>
              <strong>Travel Easy</strong>
              <p>Local support when you need it.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-block" id="facilities" aria-labelledby="rooms-heading">
        <div className="section-heading centered">
          <span className="eyebrow">Rooms & Rent</span>
          <h2 id="rooms-heading">Simple room choices with clear starting prices</h2>
          <p>Pick the room type, check availability, and complete booking from the rooms page.</p>
        </div>
        <div className="rent-grid">
          {roomRent.map((room) => (
            <article className="rent-card" key={room.type}>
              <img src={room.image} alt={room.type} loading="lazy" decoding="async" width="900" height="600" />
              <div>
                <h3>{room.type}</h3>
                <p>{room.detail}</p>
                <strong>Rs. {room.price}<small>/night</small></strong>
                <Link to="/rooms">View rooms</Link>
              </div>
            </article>
          ))}
        </div>
        <div className="section-more">
          <Link to="/rooms" className="rooms-more-button">
            Explore More Rooms
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="video-tour" id="video-tour" aria-labelledby="video-tour-heading">
        <div className="video-copy">
          <span className="eyebrow">Video Tour</span>
          <h2 id="video-tour-heading">Let guests see the property before they book.</h2>
          <p>
            Add your real hotel video here later. This area is placed right after rooms
            because visitors usually want to inspect rooms, lobby, dining, and outdoor space.
          </p>
          <Link to="/rooms" className="text-link">Explore rooms</Link>
        </div>
        <div className="video-frame">
          <div className="play-button">Play</div>
        </div>
      </section>

      <section className="section-block" id="gallery" aria-labelledby="facilities-heading">
        <div className="section-heading centered">
          <span className="eyebrow">Facilities</span>
          <h2 id="facilities-heading">Everything important, arranged clearly</h2>
        </div>
        <div className="facility-grid">
          {facilities.map((facility) => (
            <div className="facility-item" key={facility}>{facility}</div>
          ))}
        </div>
      </section>

      <section className="split-section food-section">
        <div>
          <span className="eyebrow">Food & Dining</span>
          <h2>Breakfast, family meals, and room dining.</h2>
          <p>
            Keep this section for restaurant timing, menu highlights, chef specials, buffet,
            birthday dinner setup, and room-service details.
          </p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=80"
          alt="Restaurant dining"
          loading="lazy"
          decoding="async"
          width="1000"
          height="700"
        />
      </section>

      <section className="section-block">
        <div className="section-heading centered">
          <span className="eyebrow">Photo Gallery</span>
          <h2>A visual look at Visawa</h2>
        </div>
        <div className="gallery-grid">
          {gallery.map((item) => (
            <figure className="gallery-card" key={item.title}>
              <img src={item.image} alt={item.title} loading="lazy" decoding="async" width="800" height="600" />
              <figcaption>{item.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="split-section event-section">
        <img
          src="/hero6.png"
          alt="Event suite setup"
          loading="lazy"
          decoding="async"
          width="1000"
          height="700"
        />
        <div>
          <span className="eyebrow">Events & Functions</span>
          <h2>Small events, meetings, and family celebrations.</h2>
          <p>
            This section can show hall rent, seating capacity, decoration support, catering,
            birthday packages, engagement setup, and meeting arrangements.
          </p>
        </div>
      </section>

      <section className="local-guide">
        <div className="section-heading">
          <span className="eyebrow">Nearby Places</span>
          <h2>Ghoomne ki jagah aur travel support</h2>
          <p>Airport pickup, railway station drop, local cab booking, market trip, and city tour details yahan rakhenge.</p>
        </div>
        <div className="guide-list" role="list" aria-label="Nearby attractions and travel support">
          {nearbyPlaces.map((place) => (
            <div key={place.name} role="listitem">
              <strong>{place.name}</strong>
              <span>{place.time}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="reviews-section">
        <div className="section-heading centered">
          <span className="eyebrow">Testimonials</span>
          <h2>What Our Guests Say</h2>
        </div>
        <div className="reviews-slider" tabIndex="0" aria-label="Guest reviews">
          <div className="reviews-track">
            {[...reviews, ...reviews].map((review, index) => (
              <div className="review-card" key={index}>
                <div className="review-content">
                  <p>"{review.feedback}"</p>
                </div>
                <div className="review-author">
                  <img src={review.image} alt={review.name} loading="lazy" decoding="async" width="60" height="60" />
                  <strong>- {review.name}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="offers-strip">
        <div>
          <span className="eyebrow">Offers</span>
          <h2>Weekend stay, family package, and event deals</h2>
          <p>Offer cards can be added here later for seasonal promotions.</p>
        </div>
        <Link to="/rooms" className="cta-button">See Rooms</Link>
      </section>

      <section className="manager-welcome-section" aria-labelledby="manager-heading">
        <div className="manager-photo">
          <img src="/sujeet.png" alt="Hotel Manager Sujeet Patel" loading="lazy" decoding="async" width="500" height="600" />
        </div>
        <div className="manager-message">
          <span className="eyebrow">A Word From Our Manager</span>
          <h2 id="manager-heading">Your Comfort is Our Commitment</h2>
          <p>
            "Welcome to Viswa Hotel & Resorts. Our team is dedicated to making your stay exceptional. From our pristine rooms to our dedicated service, we strive to create a memorable experience for every guest. We look forward to hosting you and ensuring your time with us is nothing short of perfect."
          </p>
          <strong style={{ color: '#d4af37', fontSize: '1.2rem', fontStyle: 'italic', letterSpacing: '0.5px' }}>- Sujeet Patel, General Manager</strong>
        </div>
      </section>

      <section className="location-section" id="location">
        <div className="location-copy">
          <span className="eyebrow">Location</span>
          <h2>Find Hotel Visawa on map.</h2>
          <p>
            30, Zone-II, Maharana Pratap Nagar, Bhopal - 462011 (M.P.).
            Open directions to start navigation from your current location.
          </p>
          <div className="location-actions">
            <a
              href={mapDirectionsUrl}
              className="cta-button"
              target="_blank"
              rel="noreferrer"
            >
              Get Directions
            </a>
            <a href="tel:+919301783278" className="secondary-button">Call Hotel</a>
          </div>
        </div>
        <a
          className="map-frame"
          href={mapDirectionsUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open directions to Hotel Visawa in Google Maps"
        >
          <iframe
            title="Hotel Visawa location map"
            src={mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </a>
      </section>

      <section className="contact-cta" id="contact">
        <span className="eyebrow">Contact</span>
        <h2>Contact Hotel Visawa today.</h2>
        <p>
          Address: 30, Zone-II, Maharana Pratap Nagar, Bhopal - 462011 (M.P.).
          Mobile: +91-9301783278, +91-8962069176.
        </p>
        <div className="contact-actions">
          <a href="tel:+919301783278" className="cta-button">Call +91 93017 83278</a>
          <a href="tel:+918962069176" className="secondary-button">Call +91 89620 69176</a>
        </div>
      </section>
    </main>
  );
}

export default Home;
