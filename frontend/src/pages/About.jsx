import React from 'react';
import '../components/UI/PageLayout/PageLayout.css';

const About = () => {
    return (
        <div className="page-container">
            <div className="about-card">
                <h1>О проекте</h1>
                <p className="description">
                    Проект создан для упрощения работы с судебными делами. Он предоставляем удобный инструмент для поиска, анализа и управления информацией о судебных процессах.
                </p>
                <div className="team-section">
                    <h2>Наша команда</h2>
                    <div className="team-members">
                        <div className="member">
                            <img src="https://via.placeholder.com/100" alt="Участник команды" />
                            <p>Андрей Киселёв</p>
                            <p>Frontend-разработчик</p>
                        </div>
                        <div className="member">
                            <img src="https://via.placeholder.com/100" alt="Участник команды" />
                            <p>Андрей Киселёв</p>
                            <p>Backend-разработчик</p>
                        </div>
                        <div className="member">
                            <img src="https://via.placeholder.com/100" alt="Участник команды" />
                            <p>Андрей Киселёв</p>
                            <p>Дизайнер</p>
                        </div>
                    </div>
                </div>
                <div className="contact-section">
                    <h2>Контакты</h2>
                    <p>Email: support@example.com</p>
                    <p>Телефон: +7 (999) 123-45-67</p>
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