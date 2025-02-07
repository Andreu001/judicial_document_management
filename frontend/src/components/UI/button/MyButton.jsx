import React from 'react';
import classes from './MyButtons.module.css';

const MyButton = ({ children, onClick, type = "primary", disabled = false }) => {
  return (
    <button 
      className={`${classes.myBtn} ${classes[type]}`} 
      onClick={onClick} 
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default MyButton;