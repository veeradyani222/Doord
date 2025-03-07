'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Logo from './../assets/Doord.svg'
import Menu from './../assets/Menubtn.svg'
import { usePathname } from 'next/navigation';
import './Navbar.css'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Explore', path: '/explore' },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <div className='navbar'>
      <div className='navbar-left'>
        <Link href="/">
          <Image 
            src={Logo}
            alt="Logo" 
            width={88} 
            height={32} 
            priority
          />
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className='navbar-center desktop-only'>
        {navLinks.map((link) => (
          <Link 
            key={link.path} 
            href={link.path}
            className={`nav-link ${pathname === link.path ? 'active' : ''}`}
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className='navbar-right'>
        {/* Desktop Auth Buttons */}
        <div className='auth-buttons desktop-only'>
          <Link href="/signin" className='sign-in-btn'>
            Sign In
          </Link>
          <Link href="/signup" className='sign-up-btn'>
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className='hamburger-btn mobile-only'
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Image 
            src={isMenuOpen ? "/assets/close.png" : Menu} 
            alt="menu" 
            width={24} 
            height={24}
          />
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className='mobile-menu'>
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              href={link.path}
              className={`mobile-nav-link ${pathname === link.path ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className='mobile-auth-buttons'>
            <Link 
              href="/signin" 
              className='mobile-sign-in-btn'
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className='mobile-sign-up-btn'
              onClick={() => setIsMenuOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;