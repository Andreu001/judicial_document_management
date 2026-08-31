import React, { useState, useEffect } from 'react';
import SideCaseService from '../../API/SideCaseService';
import styles from './SideProfile.module.css';

const PartyDocumentsHistoryList = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDocuments = async () => {
            const docs = await SideCaseService.getUserDocumentsHistory();
            setDocuments(docs);
            setLoading(false);
        };
        loadDocuments();
    }, []);

    if (loading) return <div className={styles.loading}>Загрузка...</div>;

    if (documents.length === 0) {
        return <div className={styles.emptyState}>Вы еще не отправляли документы</div>;
    }

    return (
        <div className={styles.documentsHistory}>
            <h3>Отправленные документы</h3>
            <table className={styles.historyTable}>
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Дело</th>
                        <th>Дата отправки</th>
                        <th>Статус</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map(doc => (
                        <tr key={doc.id}>
                            <td>{doc.title}</td>
                            <td>{doc.case_number}</td>
                            <td>{new Date(doc.submission_date).toLocaleDateString('ru-RU')}</td>
                            <td>
                                <span className={`${styles.statusBadge} ${styles[`status${doc.review_status}`]}`}>
                                    {doc.status_display}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PartyDocumentsHistoryList;