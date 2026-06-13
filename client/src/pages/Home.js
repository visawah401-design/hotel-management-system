import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1800&q=80',
    label: 'Premium king room',
  },
  {
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1800&q=80',
    label: 'Warm bedside comfort',
  },
  {
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1800&q=80',
    label: 'Suite room lounge',
  },
  {
    image: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1800&q=80',
    label: 'Cozy hotel bedroom',
  },
  {
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1800&q=80',
    label: 'Reception and check-in',
  },
  {
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=80',
    label: 'Resort exterior',
  },
];

const roomRent = [
  {
    type: 'Single Room',
    price: '1800',
    detail: 'Smart choice for solo and business guests.',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Double Room',
    price: '2800',
    detail: 'Comfortable room for couples and small families.',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Suite Room',
    price: '5200',
    detail: 'Premium stay with extra space and luxury comfort.',
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
    title: 'Reception Lobby',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Premium Bedroom',
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Dining Area',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Pool & Leisure',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Suite Lounge',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Event Setup',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
  },
];

const nearbyPlaces = [
  { name: 'City Market', time: '8 min drive' },
  { name: 'Lake View Point', time: '15 min drive' },
  { name: 'Temple Route', time: '20 min drive' },
  { name: 'Business Hub', time: '10 min drive' },
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
      <section className="hero-section">
        <div className="hero-slider" aria-hidden="true">
          {heroSlides.map((slide, index) => (
            <div
              className={`hero-slide ${index === activeSlide ? 'active' : ''}`}
              key={slide.label}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
        </div>

        <div className="hero-overlay" />

        <div className="hero-inner">
          <div className="hero-content">
            <span className="hero-kicker">Premium stay, warm comfort</span>
            <h1>Rooms, dining, events, and easy booking.</h1>
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

      <section className="booking-strip" aria-label="Quick booking">
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
      </section>

      <section className="quick-stats" aria-label="Hotel highlights">
        <div><strong>24/7</strong><span>Guest Support</span></div>
        <div><strong>35+</strong><span>Ready Rooms</span></div>
        <div><strong>4.8</strong><span>Guest Rating</span></div>
        <div><strong>10 min</strong><span>City Center</span></div>
      </section>

      <section className="intro-section">
        <div className="intro-showcase">
          <span className="intro-ring" aria-hidden="true"></span>
          <img src="/logo.png" alt="Visawa Hotel & Resorts logo" />
          <strong>Visawa</strong>
          <small>Hotel & Resorts</small>
        </div>
        <div className="intro-content">
          <span className="eyebrow">Welcome To Visawa</span>
          <h2>Stay, dine, celebrate, and travel with ease.</h2>
          <p>
            Visawa brings clean rooms, fresh dining, event spaces, and local travel help together
            in one welcoming place near 30, Zone-II, Maharana Pratap Nagar, Bhopal.
          </p>
          <div className="intro-points" aria-label="Visawa hotel highlights">
            <div>
              <span>01</span>
              <strong>Rest Easy</strong>
              <p>Clean rooms and calm comfort.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Dine Well</strong>
              <p>Fresh meals for every mood.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Celebrate</strong>
              <p>Spaces for special moments.</p>
            </div>
            <div className="mobile-only-card">
              <span>04</span>
              <strong>Travel Easy</strong>
              <p>Local support when you need it.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block" id="facilities">
        <div className="section-heading centered">
          <span className="eyebrow">Rooms & Rent</span>
          <h2>Simple room choices with clear starting prices</h2>
          <p>Pick the room type, check availability, and complete booking from the rooms page.</p>
        </div>
        <div className="rent-grid">
          {roomRent.map((room) => (
            <article className="rent-card" key={room.type}>
              <img src={room.image} alt={room.type} />
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

      <section className="video-tour" id="video-tour">
        <div className="video-copy">
          <span className="eyebrow">Video Tour</span>
          <h2>Let guests see the property before they book.</h2>
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

      <section className="section-block" id="gallery">
        <div className="section-heading centered">
          <span className="eyebrow">Facilities</span>
          <h2>Everything important, arranged clearly</h2>
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
              <img src={item.image} alt={item.title} />
              <figcaption>{item.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="split-section event-section">
        <img
          src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80"
          alt="Hotel event hall"
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
        <div className="guide-list">
          {nearbyPlaces.map((place) => (
            <div key={place.name}>
              <strong>{place.name}</strong>
              <span>{place.time}</span>
            </div>
          ))}
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

      <section className="reviews">
        <article>
          <p>"Clean rooms, polite staff, and smooth check-in. Good value for a family stay."</p>
          <strong>Family Guest</strong>
        </article>
        <article>
          <p>"Restaurant and travel desk made the trip easy. Booking experience was simple."</p>
          <strong>Business Guest</strong>
        </article>
        <article>
          <p>"Event space was arranged nicely and food service was quick."</p>
          <strong>Event Guest</strong>
        </article>
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
