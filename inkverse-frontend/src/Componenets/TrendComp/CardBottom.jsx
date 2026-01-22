import React from 'react';
import "./Card.css";

const CardBottom = () => {
  return (
    <div>
      <div className="cardBottom-container">
        <div className="cardBottom">
          <div className="front-content">
            <p>Hover me</p>
          </div>
          <div className="content">
            <p className="heading">Card Hover</p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipii
              voluptas ten mollitia pariatur odit, ab
              minus ratione adipisci accusamus vel est excepturi laboriosam magnam
              necessitatibus dignissimos molestias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardBottom;
