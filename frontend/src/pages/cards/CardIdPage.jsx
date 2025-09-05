import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFetching } from "../../hooks/useFetching";
import CardService from "../../API/CardService";
import Loader from "../../components/UI/loader/Loader";
import styles from '../../components/UI/Details.module.css';

const CardIdPage = () => {
    const params = useParams();
    const [card, setCard] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPostById = async () => {
            try {
                setIsLoading(true);
                const response = await CardService.getById(params.id);
                setCard(response.data);
                setIsLoading(false);
            } catch (err) {
                console.error('Ошибка загрузки карточки:', err);
                setError('Не удалось загрузить данные карточки');
                setIsLoading(false);
            }
        };

        fetchPostById();
    }, [params.id]);

    if (isLoading) {
        return (
            <div className={styles.detailsContainer}>
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.detailsContainer}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    return (
        <div className={styles.detailsContainer}>
            <h1 className={styles.detailsHeader}>Детали карточки дела ID: {params.id}</h1>
            
            <div className={styles.detailsContent}>
                <h2>Основная информация</h2>
                <p><strong>ID:</strong> {card.id}</p>
                <p><strong>Название:</strong> {card.original_name || 'Не указано'}</p>
                <p><strong>Категория:</strong> {card.case_category_title || 'Не указана'}</p>
                <p><strong>Дата создания:</strong> {new Date(card.pub_date).toLocaleDateString('ru-RU')}</p>
                
                {card.description && (
                    <div>
                        <h3>Описание</h3>
                        <p>{card.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardIdPage;