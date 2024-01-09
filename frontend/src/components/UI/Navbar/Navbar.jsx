import React, {useContext} from 'react';
import {Link} from "react-router-dom";
//import MyButton from "../button/MyButton";
//import {AuthContext} from "../../../context";

const Navbar = () => {

    return (
        <div className="navbar">
            <div className="navbar__links">
                <Link to="/cards">Главная страница</Link>
                <Link to="/about">О сайте</Link>
                <Link to="/business_card/">Добавить карточку</Link>
                <Link to="/business_card/businesscard">Список всех карточек</Link>
            </div>
        </div>
    );
};

export default Navbar;
