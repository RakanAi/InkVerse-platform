import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './TopNav.css';

function TopBar() {
  useEffect(() => {
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    if (!searchContainer || !searchInput || !searchBtn) return;

    const expandSearch = (event) => {
      event.preventDefault();
      searchContainer.classList.add('active');
      searchInput.focus();
    };

    const collapseSearch = (event) => {
      if (!searchContainer.contains(event.target)) {
        searchContainer.classList.remove('active');
        searchInput.value = '';
      }
    };

    searchBtn.addEventListener('click', expandSearch);
    document.addEventListener('click', collapseSearch);

    return () => {
      searchBtn.removeEventListener('click', expandSearch);
      document.removeEventListener('click', collapseSearch);
    };
  }, []);

  return (
    <div className="topbar d-flex  align-items-center">
      <form className="search-container">
        <input id="search-input" type="search" placeholder="Search..." />
        <button type="button" id="search-btn">
          🔍
        </button>
      </form>

      <div>
        <Link to="/login" className="text-light me-3">Login</Link>
        <Link to="/signup" className="text-light">Sign Up</Link>
      </div>
    </div>
  );
}

export default TopBar;
