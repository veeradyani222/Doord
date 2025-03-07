'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import SearchIcon from '../assets/search-new.png';
import './search.css';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Add your search logic here
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="search-section">
      <h2>Get Our Services</h2>
      <form onSubmit={handleSearch} className="search-bar">
        <div className="search-input-wrapper">
          <Image 
            src={SearchIcon} 
            alt="Search" 
            width={24} 
            height={24} 
            className="search-icon"
          />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Your Required Service" 
            aria-label="Search services"
          />
        </div>
      </form>
      <button type="submit">
          Search
        </button>
    </div>
  );
};

export default Search;
