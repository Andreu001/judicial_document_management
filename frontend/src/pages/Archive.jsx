import React, { useState } from 'react';
import '../components/UI/PageLayout/PageLayout.css';

const Archive = () => {
    const [search, setSearch] = useState('');
    const archiveData = [
        { id: 1, title: 'Судебное дело №12345', date: '12.02.2023' },
        { id: 2, title: 'Иск №67890', date: '25.05.2022' },
        { id: 3, title: 'Решение суда №45678', date: '08.09.2021' }
    ];

    const filteredData = archiveData.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="archive-card">
                <div className="archive-header">
                    <h1>Архив документов</h1>
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Поиск по архиву..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <ul className="archive-list">
                    {filteredData.length > 0 ? (
                        filteredData.map(item => (
                            <li key={item.id} className="archive-item">
                                <span>{item.title} - {item.date}</span>
                                <button className="view-button">Открыть</button>
                            </li>
                        ))
                    ) : (
                        <p>Ничего не найдено</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Archive;
