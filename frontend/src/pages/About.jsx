import React from 'react';
import '../components/UI/PageLayout/PageLayout.css';

const About = () => {
    return (
        <div className="page-container">
            <div className="about-card">
                <h1>О проекте</h1>
                <p className="description">
                    Проект создан для упрощения работы с судебными делами. Он предоставляет удобный инструмент 
                    для поиска, анализа и управления информацией о судебных процессах.
                </p>
                
                <div className="features-section">
                    <h2>Основные возможности</h2>
                    <div className="features-grid">
                        <div className="feature">
                            <h3>📁 Удобный архив</h3>
                            <p>Быстрый поиск и доступ ко всем судебным документам</p>
                        </div>
                        <div className="feature">
                            <h3>⚖️ Категоризация</h3>
                            <p>Систематизация дел по типам и уровням судов</p>
                        </div>
                        <div className="feature">
                            <h3>🔍 Поиск</h3>
                            <p>Мощная система поиска по всем параметрам дел</p>
                        </div>
                    </div>
                </div>

                <div className="team-section">
                    <h2>Наша команда</h2>
                    <div className="team-members">
                        <div className="member">
                            <h3>Frontend-разработчик</h3>
                            <p>Андрей Киселёв</p>
                        </div>
                        <div className="member">
                            <h3>Backend-разработчик</h3>
                            <p>Андрей Киселёв</p>
                        </div>
                        <div className="member">
                            <h3>Дизайнер</h3>
                            <p>Андрей Киселёв</p>
                        </div>
                    </div>
                </div>
                
                <div className="contact-section">
                    <h2>Контакты</h2>
                    <div className="contact-info">
                        <p>📧 Email: andrey.kisik@yandex.ru</p>
                        <p>📞 Телефон: +7 (999) 123-45-67</p>
                        <p>🏢 Адрес: г. Москва, ул. Юридическая, д. 15</p>
                    </div>
                    <div className="social-links">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;