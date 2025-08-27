import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../components/UI/PageLayout/PageLayout.css';

const Profile = () => {
    const { user } = useAuth();

    const getRoleName = (role) => {
        const roles = {
            admin: 'Администратор',
            judge: 'Судья',
            secretary: 'Секретарь',
            lawyer: 'Адвокат',
            citizen: 'Гражданин'
        };
        return roles[role] || role;
    };

    return (
        <div className="page-container">
            <div className="profile-card">
                <h1 className="profile-title">Профиль пользователя</h1>
                
                <div className="profile-content">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            <div className="avatar-circle">
                                {user?.first_name?.[0]?.toUpperCase()}
                                {user?.last_name?.[0]?.toUpperCase()}
                            </div>
                        </div>
                        
                        <div className="profile-name">
                            <h2>{user?.first_name} {user?.last_name}</h2>
                            <span className="profile-role">Должность - {getRoleName(user?.role)}</span>
                        </div>
                    </div>

                    <div className="profile-details">
                        <div className="detail-section">
                            <h3>Контактная информация</h3>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{user?.email || 'Не указан'}</span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="detail-label">Телефон:</span>
                                    <span className="detail-value">{user?.phone || 'Не указан'}</span>
                                </div>
                            </div>
                        </div>

                        {user?.additional_info && (
                            <div className="detail-section">
                                <h3>Дополнительная информация</h3>
                                <div className="detail-item">
                                    <span className="detail-value">{user.additional_info}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;