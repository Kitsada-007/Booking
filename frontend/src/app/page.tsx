'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'rooms' | 'boats'>('rooms');
  
  // Search state
  const [checkIn, setCheckIn] = useState('');
  const [guests, setGuests] = useState('2');
  const [boatDate, setBoatDate] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'rooms') {
      const params = new URLSearchParams();
      if (checkIn) params.set('checkIn', checkIn);
      if (guests) params.set('guests', guests);
      router.push(`/room-types?${params.toString()}`);
    } else {
      const params = new URLSearchParams();
      if (boatDate) params.set('date', boatDate);
      router.push(`/boats?${params.toString()}`);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-zinc-50/60 pb-16">
      {/* Hero Section with Agoda Style Search Widget */}
      <section className="relative flex min-h-[550px] md:h-[65vh] items-center justify-center overflow-hidden bg-zinc-900 py-16">
        <Image
          src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600&q=80"
          alt="Luxury Resort Beachfront"
          fill
          className="object-cover opacity-75 object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-zinc-900/30 to-black/40" />
        
        <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">
          <div className="text-center text-white mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-zinc-950 uppercase tracking-wider mb-3 shadow-md">
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              Winner of Luxury Beach Resort 2026
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-sm">
              Find Your Perfect Island Getaway
            </h1>
            <p className="mt-3 max-w-xl text-base text-zinc-200 drop-shadow-sm mx-auto sm:text-lg">
              Book beachfront suites, discover crystal clear lagoons, and enjoy top-tier amenities.
            </p>
          </div>

          {/* Agoda Style Booking Widget */}
          <div className="w-full bg-white rounded-2xl shadow-xl shadow-zinc-950/20 p-2 border border-zinc-200/50">
            {/* Tabs */}
            <div role="tablist" className="tabs tabs-boxed bg-zinc-50/80 p-1 flex gap-1">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'rooms'}
                onClick={() => setActiveTab('rooms')}
                className={`tab flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'rooms'
                    ? 'tab-active bg-white text-blue-600 shadow'
                    : 'text-zinc-600 hover:bg-zinc-100/50'
                }`}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10V19M21 10V19M3 14H21M3 10H21M5 6H7V10H5V6ZM17 6H19V10H17V6Z"/></svg>
                <span>Stay in Rooms</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'boats'}
                onClick={() => setActiveTab('boats')}
                className={`tab flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'boats'
                    ? 'tab-active bg-white text-blue-600 shadow'
                    : 'text-zinc-600 hover:bg-zinc-100/50'
                }`}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2 17h20M12 2v15m0-15L5 9h7m0-7l7 7h-7"/></svg>
                <span>Boat Excursions</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSearch} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {activeTab === 'rooms' ? (
                <>
                  {/* Destination (Disabled / Fixed for Resort) */}
                  <div className="md:col-span-5 text-left">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 tracking-wider">Destination</label>
                    <div className="w-full input input-bordered bg-zinc-50 font-medium text-zinc-800 flex items-center gap-2 cursor-not-allowed">
                      <svg className="h-4 w-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span className="truncate">Seaside Resort, Krabi</span>
                    </div>
                  </div>

                  {/* Check-In Date */}
                  <div className="md:col-span-4 text-left">
                    <label htmlFor="checkInHero" className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 tracking-wider">Check-in Date</label>
                    <input
                      id="checkInHero"
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="input input-bordered w-full font-medium"
                    />
                  </div>

                  {/* Guests */}
                  <div className="md:col-span-3 text-left">
                    <label htmlFor="guestsHero" className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 tracking-wider">Guests & Rooms</label>
                    <select
                      id="guestsHero"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="select select-bordered w-full font-medium text-zinc-700 bg-white"
                    >
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="3">3 Guests</option>
                      <option value="4">4 Guests</option>
                      <option value="6">6+ Guests</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* Destination */}
                  <div className="md:col-span-5 text-left">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 tracking-wider">Excursion Location</label>
                    <div className="w-full input input-bordered bg-zinc-50 font-medium text-zinc-800 flex items-center gap-2 cursor-not-allowed">
                      <svg className="h-4 w-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10c2.5-1 5 1 7.5 0s5-2 7.5-1M3 15c2.5-1 5 1 7.5 0s5-2 7.5-1" /></svg>
                      <span className="truncate">Phi Phi & Hong Islands</span>
                    </div>
                  </div>

                  {/* Boat Tour Date */}
                  <div className="md:col-span-7 text-left">
                    <label htmlFor="boatDateHero" className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 tracking-wider">Preferred Date</label>
                    <input
                      id="boatDateHero"
                      type="date"
                      value={boatDate}
                      onChange={(e) => setBoatDate(e.target.value)}
                      className="input input-bordered w-full font-medium"
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="md:col-span-12 mt-2">
                <button
                  type="submit"
                  className="btn btn-primary w-full py-3.5 text-base font-bold shadow-md hover:shadow-lg transition duration-150"
                >
                  Search Availability
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Featured Badges (Agoda Quality Standards) */}
      <section className="bg-white border-b border-zinc-200/60 py-6 text-zinc-600">
        <div className="mx-auto max-w-6xl px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <svg className="h-6 w-6 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <div className="text-left">
              <p className="text-xs font-bold text-zinc-800">Best Price Guarantee</p>
              <p className="text-[11px] text-zinc-400">Match rates or get refund</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <svg className="h-6 w-6 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <div className="text-left">
              <p className="text-xs font-bold text-zinc-800">Instant Booking</p>
              <p className="text-[11px] text-zinc-400">Confirmation in 2 seconds</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <svg className="h-6 w-6 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <div className="text-left">
              <p className="text-xs font-bold text-zinc-800">9.4/10 Guest Rating</p>
              <p className="text-[11px] text-zinc-400">Exceptional guest feedback</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <svg className="h-6 w-6 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            <div className="text-left">
              <p className="text-xs font-bold text-zinc-800">Eco-Friendly Stay</p>
              <p className="text-[11px] text-zinc-400">Certified green hotel</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services (Agoda Grid Style Cards) */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">Explore Our Featured Offerings</h2>
          <p className="mt-2 text-zinc-500">Pick from luxury accommodations or private boat rentals</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card
            image="https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=600&q=80"
            imageAlt="Beachfront room with ocean view"
            title="Premium Accommodations"
            description="Luxury beachfront bungalows and suites featuring private decks, ocean views, smart TVs, and premium comfort."
            href="/room-types"
            label="View Available Rooms"
            badge="Agoda Preferred"
            score="9.6 Excellent"
          />
          <Card
            image="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80"
            imageAlt="Boat tour on crystal clear water"
            title="Guided Boat Tours"
            description="Speedboat and longtail excursions across crystal clear waters to Phi Phi and adjacent islands. Snorkeling gear included."
            href="/boats"
            label="Book an Excursion"
            badge="Top Seller"
            score="9.2 Rated"
          />
        </div>
      </section>

      {/* Testimonials & Reviews Highlights */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="card bg-white border border-zinc-200/60 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-zinc-100 pb-6">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900">What Guests Say About Us</h3>
              <p className="text-zinc-500 text-sm mt-1">Verified reviews from Agoda members</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white font-extrabold text-lg px-3 py-2 rounded-xl">
                9.4
              </div>
              <div className="text-left text-sm">
                <p className="font-bold text-zinc-800">Exceptional</p>
                <p className="text-zinc-500">1,248 reviews</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-50 p-5 rounded-xl text-left border border-zinc-100">
              <div className="text-amber-500 mb-2">★★★★★</div>
              <p className="text-sm font-semibold text-zinc-800">&ldquo;Absolute Paradise!&rdquo;</p>
              <p className="text-xs text-zinc-500 leading-relaxed mt-2">
                &ldquo;The beachfront villa was steps from pristine sand. The staff replied instantly to all needs and boat tour was unforgettable.&rdquo;
              </p>
              <p className="text-xs font-medium text-zinc-400 mt-4">— Somchai S., Thailand</p>
            </div>
            <div className="bg-zinc-50 p-5 rounded-xl text-left border border-zinc-100">
              <div className="text-amber-500 mb-2">★★★★★</div>
              <p className="text-sm font-semibold text-zinc-800">&ldquo;Highly Recommend Packages&rdquo;</p>
              <p className="text-xs text-zinc-500 leading-relaxed mt-2">
                &ldquo;We booked the Room + Boat bundle. Super easy check-in, smooth operations. Breakfast was fantastic with gorgeous ocean views.&rdquo;
              </p>
              <p className="text-xs font-medium text-zinc-400 mt-4">— Jessica K., Singapore</p>
            </div>
            <div className="bg-zinc-50 p-5 rounded-xl text-left border border-zinc-100">
              <div className="text-amber-500 mb-2">★★★★★</div>
              <p className="text-sm font-semibold text-zinc-800">&ldquo;Best Service Ever&rdquo;</p>
              <p className="text-xs text-zinc-500 leading-relaxed mt-2">
                &ldquo;Easy communication. We arrived late and check-in was seamless. Everything on the site was matching reality.&rdquo;
              </p>
              <p className="text-xs font-medium text-zinc-400 mt-4">— David L., Germany</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promos Section */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="badge badge-secondary py-1 text-xs font-bold uppercase tracking-widest text-white">Limited-Time Offer</span>
          <h2 className="text-3xl font-extrabold mt-3">Unlock Instant Secret Deals</h2>
          <p className="text-blue-100 text-sm mt-3 leading-relaxed">
            Create a free Seaside Resort member account now and get immediate access to secret discounts, room upgrades, and priority boat check-in.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/register"
              className="btn btn-secondary border-none bg-white text-blue-700 hover:bg-zinc-100 shadow-lg shadow-black/10 px-6 py-3.5 text-sm font-bold transition"
            >
              Sign Up For Free
            </Link>
            <Link
              href="/login"
              className="btn btn-outline border-white text-white hover:bg-white/10 hover:border-white/50 px-6 py-3.5 text-sm font-bold transition"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({
  image,
  imageAlt,
  title,
  description,
  href,
  label,
  badge,
  score,
}: {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  href: string;
  label: string;
  badge: string;
  score: string;
}) {
  return (
    <Link
      href={href}
      className="card card-bordered bg-base-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
    >
      <div className="relative h-64 overflow-hidden">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="badge badge-primary text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider shadow border-none">
            {badge}
          </span>
        </div>
        <div className="absolute bottom-4 right-4 bg-zinc-900/90 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg backdrop-blur">
          {score}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-zinc-900 group-hover:text-blue-600 transition">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</p>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
          <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700 transition">
            {label}
          </span>
          <span className="text-lg text-blue-600 transition-transform group-hover:translate-x-1 duration-200">
            &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
