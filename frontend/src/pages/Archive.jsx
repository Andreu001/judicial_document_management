import React, { useState } from 'react';
import '../components/UI/PageLayout/PageLayout.css';

const Archive = () => {
    const [search, setSearch] = useState('');
    const archiveData = [
        { id: 1, title: 'Судебное дело №12345', date: '12.02.2023', category: 'Гражданское дело' },
        { id: 2, title: 'Иск №67890', date: '25.05.2022', category: 'Уголовное дело' },
        { id: 3, title: 'Решение суда №45678', date: '08.09.2021', category: 'Административное дело' },
        { id: 4, title: 'Апелляция №78901', date: '15.11.2023', category: 'Гражданское дело' },
        { id: 5, title: 'Исполнительное производство №23456', date: '03.01.2024', category: 'Исполнительное производство' }
    ];

    const filteredData = archiveData.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="archive-card">
                <div className="archive-header">
                    <h1>Архив документов</h1>
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Поиск по названию или категории..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                {filteredData.length > 0 ? (
                    <ul className="archive-list">
                        {filteredData.map(item => (
                            <li key={item.id} className="archive-item">
                                <div>
                                    <span className="document-title">{item.title}</span>
                                    <div className="document-details">
                                        <span className="document-date">{item.date}</span>
                                        <span className="document-category">{item.category}</span>
                                    </div>
                                </div>
                                <button className="view-button">Просмотреть</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="no-results">
                        <p>Ничего не найдено</p>
                        <p>Попробуйте изменить поисковый запрос</p>
                    </div>
                )}
                
                <div className="archive-stats">
                    <p>Всего документов: {archiveData.length}</p>
                    <p>Найдено: {filteredData.length}</p>
                </div>
            </div>
        </div>
    );
};

export default Archive;