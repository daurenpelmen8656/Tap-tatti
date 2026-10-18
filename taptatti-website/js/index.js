'use strict';

const featuredState = { product: null, message: null };

function pickRandomProduct(list, excludeId) {
    const pool = list.filter(item => item.id !== excludeId);
    return pool[Math.floor(Math.random() * pool.length)];
}

function renderFeatured(card, product) {
    const title = createEl('p', 'mb-1');
    title.append('Попробуйте сегодня: ', createEl('strong', '', product.name), ` — ${formatPrice(product.price)}`);

    const orderLink = createEl('a', 'btn btn-outline-dark btn-sm', 'Заказать');
    orderLink.href = `order.html?item=${product.id}#order-form`;

    const addButton = createEl('button', 'btn btn-warning btn-sm', 'В корзину');
    addButton.type = 'button';
    addButton.dataset.action = 'add';
    addButton.dataset.label = 'В корзину';

    const nextButton = createEl('button', 'btn btn-outline-secondary btn-sm', 'Другой десерт');
    nextButton.type = 'button';
    nextButton.dataset.action = 'next';

    const actions = createEl('div', 'd-flex flex-wrap gap-2');
    actions.append(orderLink, addButton, nextButton);

    featuredState.message = createEl('p', 'small mb-0 mt-2');
    featuredState.message.setAttribute('role', 'status');

    card.replaceChildren(
        title,
        createEl('p', 'small text-muted mb-2', 'Случайная подборка из нашего меню. Нажмите «Другой десерт», чтобы увидеть следующий вариант.'),
        actions,
        featuredState.message
    );
}

function handleFeaturedClick(event) {
    const button = event.target.closest('button[data-action]');
    if (button === null) {
        return;
    }
    const card = event.currentTarget;
    if (button.dataset.action === 'next') {
        featuredState.product = pickRandomProduct(products, featuredState.product.id);
        renderFeatured(card, featuredState.product);
        return;
    }
    const result = addToCart(featuredState.product.id, 1);
    featuredState.message.textContent = result.message;
    if (result.ok) {
        flashButton(button, 'Добавлено ✓');
    }
}

function initFeatured() {
    const wrapper = document.querySelector('.aside-cards-wrapper');
    if (wrapper === null) {
        return;
    }
    const column = createEl('div', 'col-12');
    const card = createEl('div', 'aside-card bg-white p-3 rounded shadow-sm h-100 border-start border-4 border-amber');
    column.append(card);
    wrapper.append(column);

    featuredState.product = products[Math.floor(Math.random() * products.length)];
    renderFeatured(card, featuredState.product);
    card.addEventListener('click', handleFeaturedClick);
}

initFeatured();
