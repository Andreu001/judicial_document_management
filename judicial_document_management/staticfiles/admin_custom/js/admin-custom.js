/* ========================================
   КАСТОМНЫЙ JS ДЛЯ АДМИН-ПАНЕЛИ
   ======================================== */

(function($) {
    'use strict';

    // ========================================
    // 1. АНИМАЦИЯ ПРИ ЗАГРУЗКЕ
    // ========================================
    $(document).ready(function() {
        // Добавляем классы анимации к элементам
        $('#content-main').addClass('fade-in');
        
        // Анимируем модули на главной
        $('.dashboard .module').each(function(index) {
            $(this).css('animation-delay', (index * 0.05) + 's');
            $(this).addClass('fade-in');
        });

        // Анимируем строки таблицы
        $('#result_list tbody tr').each(function(index) {
            $(this).css('animation-delay', (index * 0.02) + 's');
            $(this).addClass('fade-in');
        });

        console.log('✅ Админ-панель загружена с кастомным стилем!');
    });

    // ========================================
    // 2. УЛУЧШЕННЫЙ ПОИСК С ОЧИСТКОЙ
    // ========================================
    // Добавляем кнопку очистки к полю поиска
    $(document).ready(function() {
        var searchInput = $('#changelist-search input[name="q"]');
        
        if (searchInput.length) {
            // Создаем контейнер для кнопки очистки
            var wrapper = $('<div class="search-wrapper" style="position: relative; display: inline-block; width: 100%; max-width: 300px;"></div>');
            searchInput.wrap(wrapper);
            
            // Добавляем кнопку очистки
            var clearBtn = $('<button type="button" class="search-clear" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; display: none; padding: 4px;">✕</button>');
            searchInput.after(clearBtn);
            
            // Показываем/скрываем кнопку очистки
            searchInput.on('input', function() {
                if ($(this).val().length > 0) {
                    clearBtn.show();
                } else {
                    clearBtn.hide();
                }
            });
            
            // Очищаем поле
            clearBtn.on('click', function() {
                searchInput.val('').trigger('input');
                // Ищем кнопку поиска и кликаем по ней
                var submitBtn = $('#changelist-search input[type="submit"]');
                if (submitBtn.length) {
                    submitBtn.click();
                }
            });
        }
    });

    // ========================================
    // 3. УЛУЧШЕННЫЙ ВЫБОР ВСЕХ ЧЕКБОКСОВ
    // ========================================
    $(document).ready(function() {
        var actionCheckbox = $('#action-toggle');
        
        if (actionCheckbox.length) {
            actionCheckbox.on('change', function() {
                var isChecked = $(this).prop('checked');
                $('.action-checkbox input[type="checkbox"]').each(function() {
                    $(this).prop('checked', isChecked);
                });
            });
        }
    });

    // ========================================
    // 4. ПОДСКАЗКИ ПРИ НАВЕДЕНИИ НА КНОПКИ
    // ========================================
    $(document).ready(function() {
        // Добавляем всплывающие подсказки к кнопкам действий
        $('.submit-row input[type="submit"]').each(function() {
            var $this = $(this);
            var name = $this.attr('name') || '';
            var tooltip = '';
            
            switch(name) {
                case '_save':
                    tooltip = 'Сохранить и вернуться к списку';
                    break;
                case '_addanother':
                    tooltip = 'Сохранить и добавить еще один';
                    break;
                case '_continue':
                    tooltip = 'Сохранить и продолжить редактирование';
                    break;
                default:
                    tooltip = $this.val() || '';
            }
            
            if (tooltip) {
                $this.attr('title', tooltip);
            }
        });
    });

    // ========================================
    // 5. ПОДСВЕТКА СТРОК ТАБЛИЦЫ С ЦВЕТОМ
    // ========================================
    $(document).ready(function() {
        // Подсвечиваем строки в зависимости от статуса (если есть поле статуса)
        $('#result_list tbody tr').each(function() {
            var $row = $(this);
            var statusCell = $row.find('.field-status');
            
            if (statusCell.length) {
                var statusText = statusCell.text().trim().toLowerCase();
                
                // Добавляем классы в зависимости от статуса
                if (statusText.includes('архив') || statusText.includes('archived')) {
                    $row.addClass('row-archived');
                } else if (statusText.includes('заверш') || statusText.includes('completed')) {
                    $row.addClass('row-completed');
                } else if (statusText.includes('исполн') || statusText.includes('execution')) {
                    $row.addClass('row-execution');
                } else if (statusText.includes('актив') || statusText.includes('active')) {
                    $row.addClass('row-active');
                }
            }
        });
    });

    // ========================================
    // 6. АВТОФОКУС НА ПОЛЕ ПОИСКА (HOTKEY CTRL+/)
    // ========================================
    $(document).on('keydown', function(e) {
        // Ctrl+/ для фокуса на поиске
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();
            var searchInput = $('#changelist-search input[name="q"]');
            if (searchInput.length) {
                searchInput.focus();
            }
        }
        
        // Escape для очистки поиска
        if (e.key === 'Escape') {
            var searchInput = $('#changelist-search input[name="q"]');
            if (searchInput.is(':focus') && searchInput.val()) {
                searchInput.val('').trigger('input');
                var submitBtn = $('#changelist-search input[type="submit"]');
                if (submitBtn.length) {
                    submitBtn.click();
                }
            }
        }
    });

    // ========================================
    // 7. ПЛАВНАЯ ПРОКРУТКА К ФОРМЕ ПРИ ОШИБКЕ
    // ========================================
    $(document).ready(function() {
        if ($('.errorlist').length) {
            // Прокручиваем к первой ошибке
            var firstError = $('.errorlist:first');
            if (firstError.length) {
                $('html, body').animate({
                    scrollTop: firstError.closest('.form-row').offset().top - 100
                }, 500);
            }
        }
    });

    // ========================================
    // 8. ПОДТВЕРЖДЕНИЕ ПРИ УДАЛЕНИИ
    // ========================================
    $(document).ready(function() {
        // Кастомное подтверждение для кнопок удаления
        $('.deletelink, .delete-button').on('click', function(e) {
            var message = $(this).data('confirm') || 'Вы уверены, что хотите удалить этот объект?';
            if (!confirm(message)) {
                e.preventDefault();
                return false;
            }
        });
    });

    // ========================================
    // 9. ДОБАВЛЯЕМ ИНДИКАТОР ЗАГРУЗКИ ДЛЯ КНОПОК
    // ========================================
    $(document).ready(function() {
        $('.submit-row input[type="submit"]').on('click', function() {
            var $btn = $(this);
            var originalText = $btn.val();
            
            // Если кнопка не "Отмена" и не "Удалить"
            if (!originalText.includes('Отмена') && !originalText.includes('Удалить')) {
                $btn.val('⏳ ' + originalText + '...');
                $btn.prop('disabled', true);
                
                // Возвращаем состояние через 30 секунд (на случай ошибки)
                setTimeout(function() {
                    $btn.val(originalText);
                    $btn.prop('disabled', false);
                }, 30000);
            }
        });
    });

    // ========================================
    // 10. КАСТОМНЫЙ ТУЛТИП ДЛЯ СТАТУСОВ
    // ========================================
    $(document).ready(function() {
        $('.status-badge').each(function() {
            var $this = $(this);
            var tooltipText = $this.data('tooltip') || $this.text().trim();
            $this.attr('title', tooltipText);
        });
    });

    console.log('✅ Кастомный JS для админ-панели загружен!');
    
})(django.jQuery);