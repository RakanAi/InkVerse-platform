import React from "react";
import styled from "styled-components";

const Read = () => {
  return (
    <StyledWrapper>
      <button className="d-inline-flex">Read</button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  button {
    border: none;
    display: flex;
    padding: 0.75rem 1.5rem;
    background-color: #488aec;
    color: #ffffff;
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 700;
    text-align: center;
    cursor: pointer;
    text-transform: uppercase;
    vertical-align: middle;
    align-items: center;
    justify-self: end;
    border-radius: 0.5rem;
    user-select: none;
    box-shadow:
      0 4px 6px -1px #488aec31,
      0 2px 4px -1px #488aec17;
    transition: all 0.6s ease;
  }

  button:hover {
    box-shadow:
      0 10px 15px -3px #488aec4f,
      0 4px 6px -2px #488aec17;
  }

  button:focus,
  button:active {
    opacity: 0.85;
    box-shadow: none;
  }

  button svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export default Read;
