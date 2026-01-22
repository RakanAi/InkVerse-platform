import React from 'react';

const Card = () => {
  return (
    <div className="card shadow rounded-4 overflow-hidden" style={{ width: '20rem' }}>
      {/* Top Gradient Background */}
      <div
        className=""
        style={{
          height: '160px',
          background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(src/assets/AlbedoBase_XL_A_surreal_scene_of_a_young_girl_with_long_flowin_3.jpg)',
        }}
      ></div>

      {/* Card Body */}
      <div className="card-body">
        <h5 className="card-title fw-semibold text-dark">Bootstrap Card</h5>
        <p className="card-text text-muted">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc felis ligula.
        </p>
      </div>

      {/* Card Footer */}
      <div className="card-body pt-0">
        <button className="btn btn-primary btn-sm fw-bold text-uppercase">
          Read More
        </button>
      </div>
    </div>
  );
};

export default Card;
