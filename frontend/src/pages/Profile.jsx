import React from 'react';
import '../components/UI/PageLayout/PageLayout.css';

const Profile = () => {
    return (
        <div className="page-container">
            <div className="profile-card">
                <h1>Профиль пользователя</h1>
                <div className="profile-info">
                    <div className="avatar">
                        <img src="https://via.placeholder.com/150" alt="Аватар" />
                        <button className="edit-button">Изменить фото</button>
                    </div>
                    <div className="details">
                        <div className="detail-item">
                            <label>Имя:</label>
                            <p>Иван Иванов</p>
                        </div>
                        <div className="detail-item">
                            <label>Email:</label>
                            <p>ivan@example.com</p>
                        </div>
                        <div className="detail-item">
                            <label>Телефон:</label>
                            <p>+7 (999) 123-45-67</p>
                        </div>
                        <div className="detail-item">
                            <label>Роль:</label>
                            <p>Администратор</p>
                        </div>
                    </div>
                </div>
                <div className="actions">
                    <button className="primary-button">Редактировать профиль</button>
                    <button className="secondary-button">Сменить пароль</button>
                </div>
            </div>
        </div>
    );
};

export default Profile;