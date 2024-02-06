import React from 'react';
import classes from './Input.module.css';

const MyInput = React.forwardRef( (props, ref) => {
    return (
        <input ref={ref} {...props} className={classes.myInput}/>

    );
});

export default MyInput;