'use strict';

$(function () {
    const createEl = jq.createEl;
    const $wrapper = $('.aside-cards-wrapper');
    const state = { product: null, $message: null };

    function pickRandomProduct(list, excludeId) {
        const pool = list.filter(item => item.id !== excludeId);
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function renderFeatured($card, product) {
        const $title = createEl('p', 'mb-1').html('Попробуйте сегодня: <strong class="featured-name"></strong> — <span class="featured-price"></span>');
        $title.find('.featured-name').text(product.name);
        $title.find('.featured-price').text(formatPrice(product.price));

        const $orderLink = createEl('a', 'btn btn-outline-dark btn-sm', 'Заказать').attr('href', `order.html?item=${product.id}#order-form`);
        const $addButton = createEl('button', 'btn btn-warning btn-sm', 'В корзину').attr({ type: 'button', 'data-action': 'add' });
        const $nextButton = createEl('button', 'btn btn-outline-secondary btn-sm', 'Другой десерт').attr({ type: 'button', 'data-action': 'next' });
        state.$message = createEl('p', 'small mb-0 mt-2').attr('role', 'status');

        $card.empty().append(
            $title,
            createEl('p', 'small text-muted mb-2', 'Случайная подборка из нашего меню. Нажмите «Другой десерт», чтобы увидеть следующий вариант.'),
            createEl('div', 'd-flex flex-wrap gap-2').append($orderLink, $addButton, $nextButton),
            state.$message
        );
    }

    function initFeatured() {
        const $card = createEl('div', 'aside-card bg-white p-3 rounded shadow-sm h-100 border-start border-4 border-amber');
        createEl('div', 'col-12').append($card).appendTo($wrapper);

        state.product = products[Math.floor(Math.random() * products.length)];
        renderFeatured($card, state.product);

        // Делегирование: кнопки внутри карточки пересоздаются при каждой смене десерта,
        // поэтому обработчик стоит на самой карточке, которая остаётся на странице.
        // Привязанный прямо к кнопке обработчик пропал бы вместе со старой кнопкой.
        $card.on('click', 'button[data-action]', function () {
            const $button = $(this);
            if ($button.data('action') === 'next') {
                $card.fadeOut(150, function () {
                    state.product = pickRandomProduct(products, state.product.id);
                    renderFeatured($card, state.product);
                    $card.fadeIn(150);
                });
                return;
            }
            const result = app.addToCart(state.product.id, 1);
            state.$message.text(result.message);
            if (result.ok) {
                app.flashButton($button, 'Добавлено ✓');
            }
        });
    }

    function buildFaq() {
        const $list = createEl('div', 'accordion accordion-flush').attr('id', 'faq-list');
        $.each(faqItems, function (index, item) {
            const $button = createEl('button', 'accordion-button collapsed fw-semibold', item.question)
                .attr({ type: 'button', 'aria-expanded': 'false' });
            const $header = createEl('h4', 'accordion-header').append($button);
            const $answer = createEl('div', 'accordion-body text-secondary', item.answer).hide();
            createEl('div', 'accordion-item').append($header, $answer).appendTo($list);
        });
        createEl('section', 'bg-white p-4 rounded shadow-sm mb-5')
            .attr('id', 'faq-section')
            .append(createEl('h3', 'fw-bold mb-3', 'Частые вопросы'), $list)
            .insertAfter('#info-aside');

        // Делегирование: кнопки вопросов создаёт код после загрузки страницы, поэтому обработчик
        // стоит на #faq-list. Привязанный прямо к .accordion-button он бы на них не сработал.
        $list.on('click', '.accordion-button', function () {
            const $button = $(this);
            const $item = $button.closest('.accordion-item');
            const $others = $item.siblings();
            $others.find('.accordion-body').slideUp(200);
            $others.find('.accordion-button').addClass('collapsed').attr('aria-expanded', 'false');
            $button.toggleClass('collapsed').attr('aria-expanded', String(!$button.hasClass('collapsed')));
            $item.find('.accordion-body').slideToggle(200);
        });
    }

    if ($wrapper.length > 0) {
        initFeatured();
    }
    buildFaq();
});