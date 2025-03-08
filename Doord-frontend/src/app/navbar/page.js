'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from './../assets/Doord.svg';
import Menu from './../assets/Menubtn.svg';
import Remove from './../assets/remove.svg';
import { usePathname } from 'next/navigation';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const pathname = usePathname();
  const buttonRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserName = async () => {
      const userEmail = localStorage.getItem('userEmail'); // Get email from storage
      if (!userEmail) return;
  
      try {
        const response = await fetch('https://doord.onrender.com/allusers');
        const users = await response.json();
  
        // Find user by email
        const user = users.find(u => u.email === userEmail);
        if (user) {
          setUserName(user.name); // Store name in state
          localStorage.setItem('userName', user.name); // Save name for persistence
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
  
    fetchUserName();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("user"); // Remove user from storage
    setUser(null);
    router.push("/"); // Redirect to home after logout
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Explore', path: '/explore' },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <div className='navbar'>
      <div className='navbar-left'>
        <Link href='/'>
          <Image src={Logo} alt='Logo' className='logo-nav' />
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
        {/* Desktop Auth Section */}
        <div className='auth-buttons desktop-only'>
          {userName ? (
            <>
              <span className="hello-user">Hello, {userName}</span>
              <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
            </>
          ) : (
            <>
              <Link href='/signin' className='sign-in-btn'>Sign In</Link>
              <Link href='/signup' className='sign-up-btn'>Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          ref={buttonRef}
          className='hamburger-btn mobile-only'
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Image 
            className='menu-icon'
            src={isMenuOpen ? Remove : Menu} 
            alt='menu' 
          />
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
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
          {userName ? (
            <>
              <span className="hello-user">Hello, {userName} !</span>
              <button onClick={handleSignOut} className="mobile-sign-out-btn">Sign Out</button>
            </>
          ) : (
            <>
              <Link href='/signin' className='mobile-sign-in-btn' onClick={() => setIsMenuOpen(false)}>Sign In</Link>
              <Link href='/signup' className='mobile-sign-up-btn' onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
