'use strict';
// Старая версия на чистом JavaScript (без jQuery) для сравнения.
// Файл НЕ подключён ни к одной странице.

// ===== 1. Валидация формы заказа (order.js) =====
function validateName(value) {
    const text = value.trim();
    if (text === '') {
        return 'Введите имя.';
    }
    if (text.length < 2 || text.length > 50) {
        return 'Имя должно содержать от 2 до 50 символов.';
    }
    if (!/^[\p{L}\s'-]+$/u.test(text)) {
        return 'Имя может содержать только буквы, пробел и дефис.';
    }
    return '';
}

function validatePhone(value) {
    const text = value.trim();
    if (text === '') {
        return 'Введите номер телефона.';
    }
    const digits = text.replace(/\D/g, '');
    if (!/^[\d\s()+-]+$/.test(text) || !/^[78]\d{10}$/.test(digits)) {
        return 'Введите номер в формате +7 (705) 755-19-10.';
    }
    return '';
}

function validateEmail(value) {
    const text = value.trim();
    if (text === '') {
        return 'Введите электронную почту.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)) {
        return 'Введите почту в формате example@mail.com.';
    }
    return '';
}

function validateQty(value) {
    if (value.trim() === '') {
        return 'Укажите количество.';
    }
    const qty = Number(value);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
        return `Количество — целое число от 1 до ${MAX_QTY}.`;
    }
    return '';
}

function validateDate(value, items) {
    if (value === '') {
        return 'Укажите дату получения.';
    }
    const chosen = new Date(`${value}T00:00:00`);
    if (Number.isNaN(chosen.getTime())) {
        return 'Некорректная дата.';
    }
    const today = startOfToday();
    if (chosen < today) {
        return 'Нельзя выбрать прошедшую дату.';
    }
    const leadItem = getLeadItem(items);
    const leadDays = leadItem ? leadItem.product.leadDays : 1;
    const earliest = addDays(today, leadDays);
    if (chosen < earliest) {
        const reason = leadItem ? `${leadItem.product.name} готовится минимум ${leadDays} дн.` : 'Заказ нужно оформить минимум за 1 день';
        return `${reason} — выберите дату не раньше ${formatDate(earliest)}.`;
    }
    if (chosen > addDays(today, MAX_DAYS_AHEAD)) {
        return `Принимаем заявки не дальше чем на ${MAX_DAYS_AHEAD} дней вперёд.`;
    }
    return '';
}

function validateAddress(value, courier) {
    if (courier && value.trim().length < 5) {
        return 'Укажите улицу и дом (не короче 5 символов).';
    }
    return '';
}

function validateFlat(value) {
    const text = value.trim();
    if (text === '') {
        return 'Укажите квартиру или офис.';
    }
    if (text.length > 10 || !/^[\p{L}\d\s/-]+$/u.test(text)) {
        return 'Квартира или офис: до 10 символов, буквы, цифры, дефис.';
    }
    return '';
}

function validateCardNumber(value) {
    const digits = value.replace(/\D/g, '');
    if (digits === '') {
        return 'Введите номер карты.';
    }
    if (digits.length !== 16) {
        return 'Номер карты состоит из 16 цифр.';
    }
    return '';
}

function validateCardExpiry(value) {
    const text = value.trim();
    if (text === '') {
        return 'Введите срок действия в формате ММ/ГГ.';
    }
    const match = /^(\d{2})\/(\d{2})$/.exec(text);
    if (match === null) {
        return 'Срок действия указывается как ММ/ГГ, например 08/28.';
    }
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) {
        return 'Месяц должен быть от 01 до 12.';
    }
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
        return 'Срок действия карты истёк.';
    }
    return '';
}

function validateCardCvc(value) {
    if (!/^\d{3}$/.test(value)) {
        return 'CVC — три цифры с обратной стороны карты.';
    }
    return '';
}

function validateField(key) {
    const message = getFieldError(key);
    setFieldState(orderFields[key], message);
    return message === '';
}

function validateOrderForm() {
    const invalid = [];
    for (const key of submitKeys) {
        if (!isKeyActive(key)) {
            clearFieldState(orderFields[key]);
            continue;
        }
        if (!validateField(key)) {
            invalid.push(orderFields[key]);
        }
    }
    return invalid;
}

function getFieldError(key) {
    const value = orderFields[key].value;
    switch (key) {
        case 'name':
            return validateName(value);
        case 'phone':
            return validatePhone(value);
        case 'email':
            return validateEmail(value);
        case 'item':
            return getCartItems().length === 0 ? 'Заказ пуст: выберите десерт, количество и нажмите «Добавить в заказ».' : '';
        case 'qty':
            return validateQty(value);
        case 'date':
            return validateDate(value, getCartItems());
        case 'address':
            return validateAddress(value, isCourier());
        case 'flat':
            return validateFlat(value);
        case 'cardNumber':
            return validateCardNumber(value);
        case 'cardExpiry':
            return validateCardExpiry(value);
        case 'cardCvc':
            return validateCardCvc(value);
        case 'notes':
            return value.length > NOTES_LIMIT ? `Пожелания не длиннее ${NOTES_LIMIT} символов.` : '';
        default:
            return '';
    }
}

function clearFieldState(field) {
    const old = document.getElementById(`${field.id}-error`);
    if (old !== null) {
        old.remove();
    }
    field.classList.remove('is-invalid', 'is-valid');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
}

function setFieldState(field, message) {
    clearFieldState(field);
    if (message === '') {
        if (field.value.trim() !== '') {
            field.classList.add('is-valid');
        }
        return;
    }
    const feedback = createEl('div', 'invalid-feedback', message);
    feedback.id = `${field.id}-error`;
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', feedback.id);
    field.insertAdjacentElement('afterend', feedback);
}

function handleOrderSubmit(event) {
    event.preventDefault();
    const invalid = validateOrderForm();
    if (invalid.length > 0) {
        orderSuccess.classList.add('d-none');
        orderError.textContent = `Заявка не отправлена: исправьте поля, отмеченные ошибкой (${invalid.length}).`;
        orderError.classList.remove('d-none');
        invalid[0].focus();
        return;
    }
    orderError.classList.add('d-none');
    showSuccess(readOrder());
    clearCart();
}

// ===== 2. Показ и скрытие блоков доставки и оплаты (order.js) =====
function isCourier() {
    return orderForm.elements.deltype.value === 'courier';
}

function isCard() {
    return orderForm.elements.paymethod.value === 'card';
}

function updateDeliveryGroups() {
    const courier = isCourier();
    pickupGroup.classList.toggle('d-none', courier);
    deliveryGroup.classList.toggle('d-none', !courier);
    orderUi.flatGroup.classList.toggle('d-none', !courier);
    if (!courier) {
        clearFieldState(orderFields.address);
        clearFieldState(orderFields.flat);
    }
}

function clearCardFields() {
    for (const key of ['cardNumber', 'cardExpiry', 'cardCvc']) {
        orderFields[key].value = '';
        clearFieldState(orderFields[key]);
    }
}

function updatePaymentGroup() {
    const card = isCard();
    orderUi.cardGroup.classList.toggle('d-none', !card);
    if (!card) {
        clearCardFields();
    }
}

// ===== 3. Список карточек из массива (menu.js) =====
function filterProducts(list, query, category) {
    const text = query.trim().toLowerCase();
    return list.filter(item => (category === 'all' || item.category === category) && (text === '' || item.name.toLowerCase().includes(text)));
}

function createProductCard(product) {
    const column = createEl('div', 'col-12 col-md-6 col-lg-4');
    column.id = `cake-card-${product.id}`;
    const card = createEl('div', 'card h-100 shadow-sm border-0');

    const image = createEl('img', 'card-img-top');
    image.src = product.image;
    image.alt = product.alt;
    if (product.bestseller) {
        const wrap = createEl('div', 'position-relative');
        wrap.append(image, createEl('span', 'badge bg-danger position-absolute top-0 end-0 m-2', 'Хит продаж'));
        card.append(wrap);
    } else {
        card.append(image);
    }

    const body = createEl('div', 'card-body d-flex flex-column justify-content-between');
    const head = createEl('div', 'd-flex justify-content-between align-items-center mb-3');
    const price = createEl('span', 'fw-bold fs-5 text-brand', formatPrice(product.price));
    price.id = `price-${product.id}`;
    head.append(createEl('h2', 'h5 card-title m-0', product.name), price);

    const orderLink = createEl('a', 'btn btn-outline-dark btn-sm w-100 order-btn', 'Перейти к заказу');
    orderLink.href = `order.html?item=${product.id}#order-form`;
    orderLink.id = `btn-order-${product.id}`;

    const addButton = createEl('button', 'btn btn-warning btn-sm w-100 mt-2', 'В корзину');
    addButton.type = 'button';
    addButton.dataset.id = product.id;
    addButton.dataset.label = 'В корзину';

    body.append(head, orderLink, addButton);
    card.append(body);
    column.append(card);
    return column;
}

function renderMenu() {
    const visible = sortProducts(filterProducts(products, menuUi.search.value, menuUi.category.value), menuUi.sort.value);
    menuGrid.replaceChildren(...visible.map(createProductCard));
    menuUi.count.textContent = `Найдено: ${visible.length} из ${products.length}`;
    menuUi.empty.classList.toggle('d-none', visible.length > 0);
}