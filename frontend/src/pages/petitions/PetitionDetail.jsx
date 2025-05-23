import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFetching } from "../../hooks/useFetching";
import PetitionService from "../../API/PetitionService";
import Loader from "../../components/UI/loader/Loader";
import styles from '../../components/UI/Details.module.css';

const PetitionDetail = () => {
    const params = useParams();
    const [card, setCard] = useState({});
    const [comments, setComments] = useState([]);
    
    const [fetchPostById, isLoading, error] = useFetching(async (id) => {
        const response = await PetitionService.getById(id);
        setCard(response.data);
    });
    
    const [fetchComments, isComLoading, comError] = useFetching(async (id) => {
        const response = await PetitionService.getCommentsByCardId(id);
        setComments(response.data);
    });

    useEffect(() => {
        fetchPostById(params.id);
        fetchComments(params.id);
    }, []);

    return (
        <div className={styles.detailsContainer}>
            <h1 className={styles.detailsHeader}>Вы открыли страницу ходатайства c ID = {params.id}</h1>
            {isLoading ? (
                <Loader />
            ) : (
                <div className={styles.detailsContent}>
                    <h2>Детали ходатайства</h2>
                    <p><strong>ID:</strong> {card.id}</p>
                    <p><strong>Название:</strong> {card.title}</p>
                </div>
            )}
            <div className={styles.commentsSection}>
                <h3>Комментарии</h3>
                {isComLoading ? (
                    <Loader />
                ) : (
                    comments.map((comm) => (
                        <div key={comm.id} className={styles.comment}>
                            <h5>{comm.email}</h5>
                            <p>{comm.body}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PetitionDetail;
