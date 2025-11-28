import React, { useState, useEffect } from 'react';
import { EditorState, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import styles from './RulingEditor.module.css';

const RulingEditor = ({ 
    rulingData, 
    onSave, 
    onCancel, 
    isEditing = true,
    templateVariables = {},
    rulingType = ''  // Добавьте этот пропс
    }) => {
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    const [title, setTitle] = useState('');
    const [currentRulingType, setCurrentRulingType] = useState(rulingType); // Используйте локальное состояние
    const [isDraft, setIsDraft] = useState(true);
    const [saving, setSaving] = useState(false);

    // Инициализация редактора
    useEffect(() => {
        if (rulingData) {
        // Загрузка существующего постановления
        setTitle(rulingData.title);
        setCurrentRulingType(rulingData.ruling_type);
        setIsDraft(rulingData.is_draft);
        
        if (rulingData.content_raw) {
            try {
            const contentState = convertFromRaw(JSON.parse(rulingData.content_raw));
            setEditorState(EditorState.createWithContent(contentState));
            } catch (error) {
            console.error('Error parsing content raw:', error);
            const contentBlock = htmlToDraft(rulingData.content || '');
            const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
            setEditorState(EditorState.createWithContent(contentState));
            }
        } else if (rulingData.content) {
            const contentBlock = htmlToDraft(rulingData.content);
            const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
            setEditorState(EditorState.createWithContent(contentState));
        }
        } else {
        // Создание нового постановления с шаблоном
        const template = generateTemplate(currentRulingType, templateVariables);
        const contentBlock = htmlToDraft(template);
        if (contentBlock.contentBlocks) {
            const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
            setEditorState(EditorState.createWithContent(contentState));
        }
        setTitle(getDefaultTitle(currentRulingType));
        }
    }, [rulingData, currentRulingType, templateVariables]);

    // Генерация шаблона постановления
    const generateTemplate = (type, variables) => {
        const { caseNumber, judgeName, incomingDate, defendants } = variables;
        
        const defendantNames = defendants?.map(d => d.full_name).join(', ') || '[ФИО обвиняемого]';
        
        const templates = {
        preliminary_hearing: `
            <h2 style="text-align: center;">ПОСТАНОВЛЕНИЕ</h2>
            <h3 style="text-align: center;">о назначении предварительного слушания</h3>
            <p style="text-align: right;">г. [Город] ${new Date().toLocaleDateString('ru-RU')}</p>
            
            <p>Судья [Наименование суда] ${judgeName || '[ФИО судьи]'},</p>
            <p>рассмотрев материалы уголовного дела № ${caseNumber || '[номер дела]'}</p>
            <p>в отношении ${defendantNames},</p>
            
            <h4>УСТАНОВИЛ:</h4>
            
            <p>[Текст установочной части]</p>
            
            <h4>НА ОСНОВАНИИ ИЗЛОЖЕННОГО, РУКОВОДСТВУЯСЬ</h4>
            <p>статьями 227, 234 Уголовно-процессуального кодекса Российской Федерации,</p>
            
            <h4>ПОСТАНОВИЛ:</h4>
            
            <p>1. Назначить по уголовному делу № ${caseNumber || '[номер дела]'} предварительное слушание.</p>
            <p>2. [Дополнительные пункты]</p>
            
            <p style="margin-top: 50px;">Судья: ___________________ ${judgeName || '[ФИО судьи]'}</p>
        `,
        
        court_session: `
            <h2 style="text-align: center;">ПОСТАНОВЛЕНИЕ</h2>
            <h3 style="text-align: center;">о назначении судебного заседания</h3>
            <p style="text-align: right;">г. [Город] ${new Date().toLocaleDateString('ru-RU')}</p>
            
            <p>Судья [Наименование суда] ${judgeName || '[ФИО судьи]'},</p>
            <p>рассмотрев материалы уголовного дела № ${caseNumber || '[номер дела]'}</p>
            <p>в отношении ${defendantNames},</p>
            
            <h4>УСТАНОВИЛ:</h4>
            
            <p>[Текст установочной части]</p>
            
            <h4>НА ОСНОВАНИИ ИЗЛОЖЕННОГО, РУКОВОДСТВУЯСЬ</h4>
            <p>статьями 231, 236 Уголовно-процессуального кодекса Российской Федерации,</p>
            
            <h4>ПОСТАНОВИЛ:</h4>
            
            <p>1. Назначить по уголовному делу № ${caseNumber || '[номер дела]'} судебное заседание.</p>
            <p>2. [Дополнительные пункты]</p>
            
            <p style="margin-top: 50px;">Судья: ___________________ ${judgeName || '[ФИО судьи]'}</p>
        `,
        
        case_appointment: `
            <h2 style="text-align: center;">ПОСТАНОВЛЕНИЕ</h2>
            <h3 style="text-align: center;">о назначении уголовного дела к судебному разбирательству</h3>
            <p style="text-align: right;">г. [Город] ${new Date().toLocaleDateString('ru-RU')}</p>
            
            <p>Судья [Наименование суда] ${judgeName || '[ФИО судьи]'},</p>
            <p>рассмотрев поступившее ${incomingDate ? new Date(incomingDate).toLocaleDateString('ru-RU') : '[дата поступления]'} в суд</p>
            <p>уголовное дело № ${caseNumber || '[номер дела]'} в отношении ${defendantNames},</p>
            
            <h4>УСТАНОВИЛ:</h4>
            
            <p>[Текст установочной части]</p>
            
            <h4>ПОСТАНОВИЛ:</h4>
            
            <p>1. Назначить уголовное дело № ${caseNumber || '[номер дела]'} к судебному разбирательству.</p>
            <p>2. [Дополнительные пункты]</p>
            
            <p style="margin-top: 50px;">Судья: ___________________ ${judgeName || '[ФИО судьи]'}</p>
        `
        };
        
        return templates[type] || '<p>Выберите тип постановления</p>';
    };

    const getDefaultTitle = (type) => {
        const titles = {
        preliminary_hearing: 'Постановление о назначении предварительного слушания',
        court_session: 'Постановление о назначении судебного заседания',
        case_appointment: 'Постановление о назначении уголовного дела'
        };
        return titles[type] || 'Постановление';
    };

    const handleSave = async () => {
        try {
        setSaving(true);
        
        const contentRaw = convertToRaw(editorState.getCurrentContent());
        const contentHtml = draftToHtml(contentRaw);
        
        const rulingDataToSave = {
            title,
            ruling_type: currentRulingType, // Используйте currentRulingType
            content: contentHtml,
            content_raw: JSON.stringify(contentRaw),
            is_draft: isDraft
        };
        
        await onSave(rulingDataToSave);
        setSaving(false);
        } catch (error) {
        console.error('Error saving ruling:', error);
        setSaving(false);
        }
    };

    const handlePrint = () => {
        const contentHtml = draftToHtml(convertToRaw(editorState.getCurrentContent()));
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
        <html>
            <head>
            <title>${title}</title>
            <style>
                body { font-family: Times New Roman, serif; font-size: 14pt; line-height: 1.5; }
                .print-content { max-width: 210mm; margin: 0 auto; padding: 20mm; }
            </style>
            </head>
            <body>
            <div class="print-content">${contentHtml}</div>
            </body>
        </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    if (!isEditing) {
        // Режим просмотра
        return (
        <div className={styles.container}>
            <div className={styles.header}>
            <h2>{title}</h2>
            <div className={styles.actions}>
                <button onClick={handlePrint} className={styles.printButton}>
                🖨️ Печать
                </button>
            </div>
            </div>
            <div 
            className={styles.preview}
            dangerouslySetInnerHTML={{ 
                __html: draftToHtml(convertToRaw(editorState.getCurrentContent()))
            }}
            />
        </div>
        );
    }

    return (
        <div className={styles.container}>
        <div className={styles.header}>
            <h2>Редактор постановления</h2>
            <div className={styles.controls}>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название постановления"
                className={styles.titleInput}
            />
            <select
                value={currentRulingType}
                onChange={(e) => setCurrentRulingType(e.target.value)}
                className={styles.typeSelect}
            >
                <option value="">Выберите тип</option>
                <option value="preliminary_hearing">О назначении предварительного слушания</option>
                <option value="court_session">О назначении судебного заседания</option>
                <option value="case_appointment">О назначении дела</option>
                <option value="other">Иное постановление</option>
            </select>
            <label className={styles.draftLabel}>
                <input
                type="checkbox"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                />
                Черновик
            </label>
            </div>
        </div>

        <div className={styles.editorContainer}>
            <Editor
            editorState={editorState}
            onEditorStateChange={setEditorState}
            toolbar={{
                options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'link', 'embedded', 'image', 'remove', 'history'],
                inline: { inDropdown: true },
                list: { inDropdown: true },
                textAlign: { inDropdown: true },
                link: { inDropdown: true },
                history: { inDropdown: true },
            }}
            localization={{
                locale: 'ru',
            }}
            />
        </div>

        <div className={styles.footer}>
            <button 
            onClick={handleSave} 
            className={styles.saveButton}
            disabled={saving}
            >
            {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button 
            onClick={onCancel} 
            className={styles.cancelButton}
            >
            Отмена
            </button>
            <button 
            onClick={handlePrint} 
            className={styles.printButton}
            >
            🖨️ Печать
            </button>
        </div>
        </div>
    );
    };

export default RulingEditor;