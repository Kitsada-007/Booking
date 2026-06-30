'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Rooms & Suites', href: '/room-types' },
    { name: 'Boat Tours', href: '/boats' },
    { name: 'Package Deals', href: '/packages' },
  ];

  // Hide header and footer for admin and staff routes to allow full-screen dashboard control
  const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/staff');

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50/40 text-zinc-900 font-sans">
      {/* Top Banner (Agoda Style) */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-center py-2 px-4 text-xs font-semibold text-white tracking-wide">
        ✨ Exclusive Member Rates: Sign up or log in to unlock up to 20% off your booking!
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md transition-all">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
                  S
                </div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Seaside<span className="text-orange-500 font-medium">Resort</span>
                </span>
              </Link>

              {/* Navigation Links (Desktop) */}
              <nav className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                        isActive ? 'text-blue-600 border-b-2 border-blue-600 py-1' : 'text-zinc-600'
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right-side Auth Actions (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/my-bookings"
                    className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                      pathname === '/my-bookings' ? 'text-blue-600' : 'text-zinc-600'
                    }`}
                  >
                    My Bookings
                  </Link>
                  
                  <div className="h-4 w-px bg-zinc-200" />
                  
                  <div className="flex items-center gap-3">
                    <Link href="/profile" className="flex items-center gap-2 group">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm border border-blue-200 uppercase transition group-hover:border-blue-400">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <span className="text-sm font-medium text-zinc-700 group-hover:text-blue-600 transition">
                        {user.firstName}
                      </span>
                    </Link>
                    
                    {user.role !== 'member' && (
                      <Link
                        href={user.role === 'admin' ? '/admin/settings' : `/staff/${user.role === 'room_staff' ? 'room' : 'boat'}/bookings`}
                        className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 transition"
                      >
                        Dashboard
                      </Link>
                    )}

                    <button
                      onClick={logout}
                      className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-50 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-zinc-200 bg-white px-4 py-4 md:hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base font-medium py-1.5 px-2 rounded-md transition-colors ${
                    pathname === link.href ? 'bg-blue-50 text-blue-600' : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="h-px bg-zinc-100 my-2" />

              {user ? (
                <>
                  <Link
                    href="/my-bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium py-1.5 px-2 text-zinc-600 hover:bg-zinc-50 rounded-md"
                  >
                    My Bookings
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium py-1.5 px-2 text-zinc-600 hover:bg-zinc-50 rounded-md"
                  >
                    Profile Settings ({user.firstName})
                  </Link>
                  {user.role !== 'member' && (
                    <Link
                      href={user.role === 'admin' ? '/admin/settings' : `/staff/${user.role === 'room_staff' ? 'room' : 'boat'}/bookings`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium py-1.5 px-2 text-zinc-600 hover:bg-zinc-50 rounded-md"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-base font-medium py-1.5 px-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex justify-center rounded-md border border-zinc-200 px-4 py-2 text-base font-medium text-blue-600 hover:bg-zinc-50 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex justify-center rounded-md bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 transition"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Main Footer (Agoda Style) */}
      <footer className="bg-zinc-900 border-t border-zinc-800 text-zinc-400 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Branding Column */}
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-base shadow-md transition">
                  S
                </div>
                <span className="text-lg font-extrabold tracking-tight text-white">
                  Seaside<span className="text-orange-500 font-medium">Resort</span>
                </span>
              </Link>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Relax by the pristine white sands of Thailand. Book beachfront rooms, private boat tours, and package deals easily.
              </p>
              <div className="mt-6 flex gap-4">
                {/* Social icons stubs */}
                <span className="text-xs text-zinc-600">Facebook · Instagram · Twitter · Line</span>
              </div>
            </div>

            {/* Quick Links: Rooms */}
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Accommodations
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/room-types" className="hover:text-white transition">
                    Standard Rooms
                  </Link>
                </li>
                <li>
                  <Link href="/room-types" className="hover:text-white transition">
                    Deluxe Suites
                  </Link>
                </li>
                <li>
                  <Link href="/room-types" className="hover:text-white transition">
                    Beachfront Bungalows
                  </Link>
                </li>
                <li>
                  <Link href="/room-types" className="hover:text-white transition">
                    Family Pool Villas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick Links: Boat Excursions */}
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Boat Excursions
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/boats" className="hover:text-white transition">
                    Phi Phi Island Tour
                  </Link>
                </li>
                <li>
                  <Link href="/boats" className="hover:text-white transition">
                    Sunset & Snorkeling Cruise
                  </Link>
                </li>
                <li>
                  <Link href="/boats" className="hover:text-white transition">
                    Private Longtail Rental
                  </Link>
                </li>
                <li>
                  <Link href="/boats" className="hover:text-white transition">
                    Schedule & Time Slots
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick Links: Contact */}
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Contact Resort
              </h3>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>📍 123 Beachfront Rd, Krabi, Thailand</li>
                <li>✉️ contact@seasideresort.com</li>
                <li>📞 +66 (0) 75-123456</li>
                <li>⏰ Mon - Sun: 24/7 Front Desk</li>
              </ul>
            </div>
          </div>

          <div className="h-px bg-zinc-800 my-8" />

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
            <p>&copy; {new Date().getFullYear()} Seaside Resort. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Use</a>
              <a href="#" className="hover:underline">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
