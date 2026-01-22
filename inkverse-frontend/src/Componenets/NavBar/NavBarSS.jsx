import React from 'react';
import { Link } from 'react-router-dom';
import './NavBarS.css';

function SideNav() {
  return (
    <div className="sidenav ">
      <div className="logo text-white fw-bold mb-4">📚 BookVerse</div>

      <ul className="nav flex-column">
        <li className="nav-item">
          <Link to="/" className="nav-link">🏠 Home</Link>
        </li>
        <li className="nav-item">
          <Link to="/browser" className="nav-link">📚 Browse</Link>
        </li>
        <li className="nav-item">
          <Link to="/ranking" className="nav-link">🏆 Ranking</Link>
        </li>
        <li className="nav-item">
          <Link to="/author" className="nav-link">✍️ Authors</Link>
        </li>
        <li className="nav-item">
          <Link to="/events" className="nav-link">🎉 Events</Link>
        </li>
      </ul>
    </div>
  );
}

export default SideNav;
