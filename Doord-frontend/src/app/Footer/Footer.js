'use client';

import React from 'react';
import './Footer.css';
import Image from 'next/image';
import FooterImage from './../assets/Footer.svg'; // update the path if different

const Footer = () => {
  return (
    <div className="footer">
      <div className="footer-top">
        <div className="footer-image">
          <Image src={FooterImage} alt="footer background" />
        </div>
        <div className="footer-links">
          <div className="footer-logo">
            <h2>Doord<span>.</span></h2>
          </div>
          <div className="footer-column-parent">
            <div className="footer-column">
              <h4>About Us</h4>
              <ul>
                <li>Mission</li>
                <li>Team</li>
                <li>Newsletter</li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>About Us</h4>
              <ul>
                <li>Contact</li>
                <li>Refund Policy</li>
                <li>FAQs</li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>About Us</h4>
              <ul>
                <li>Instagram</li>
                <li>LinkedIn</li>
                <li>Facebook</li>
              </ul>
            </div>  </div>
        </div>
      </div>
      <hr />
      <div className="footer-bottom">
        <p>Terms Of Service</p>
        <p className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Back To Top ↑
        </p>

      </div>
    </div>
  );
};

export default Footer;
