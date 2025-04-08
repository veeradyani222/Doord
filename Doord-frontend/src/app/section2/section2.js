'use client';
import React from 'react';
import Image from "next/image";
import section2Image from '../assets/section2.svg';

const Section2 = () => {
  return (
    <section className="section2-container">
      <div className="section2-text-content">
        <h2 className="section2-heading">What We Do ?</h2>
        <p className="section2-description">
          Doord connects you with trusted professionals for home repairs, cleaning, plumbing, electrical work, and more. 
          With easy booking and reliable service, we make home maintenance hassle-free. Just knock on Doord, and we’ll handle the rest!
        </p>
        <button className="section2-button">See Details</button>
      </div>

      <div className="section2-image">
        <Image src={section2Image} alt="Home Services Illustration" />
      </div>
    </section>
  );
};

export default Section2;
