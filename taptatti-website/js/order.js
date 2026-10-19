'use strict';

const NOTES_LIMIT = 200;
const MAX_DAYS_AHEAD = 60;

const orderForm = document.getElementById('order-form-element');
const orderSuccess = document.getElementById('order-success-message');
const orderError = document.getElementById('order-error-message');
const pickupGroup = document.getElementById('pickup-location-group');
const deliveryGroup = document.getElementById('delivery-address-group');
const orderUi = {};
const submitKeys = ['name', 'phone', 'email', 'item', 'date', 'address', 'flat', 'cardNumber', 'cardExpiry', 'cardCvc', 'notes'];

const orderFields = {
    name: document.getElementById('username'),
    phone: document.getElementById('userphone'),
    email: document.getElementById('useremail'),
    item: document.getElementById('cake-select'),
    qty: document.getElementById('cake-num'),
    date: document.getElementById('delivery-date'),
    address: document.getElementById('delivery-address'),
    notes: document.getElementById('notes')
};

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function toInputDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function formatDate(date) {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isCourier() {
    return orderForm.elements.deltype.value === 'courier';
}

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

function getCartItems() {
    return calcCart(cart).items;
}

function getLeadItem(items) {
    let result;
    for (const item of items) {
        if (result === undefined || item.product.leadDays > result.product.leadDays) {
            result = item;
        }
    }
    return result;
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

function isCard() {
    return orderForm.elements.paymethod.value === 'card';
}

function isKeyActive(key) {
    switch (key) {
        case 'address':
        case 'flat':
            return isCourier();
        case 'cardNumber':
        case 'cardExpiry':
        case 'cardCvc':
            return isCard();
        default:
            return true;
    }
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

function formatCardNumber(value) {
    return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatCardExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
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

function readOrder() {
    const summary = calcCart(cart);
    const packed = orderForm.elements.pack.checked;
    const courier = isCourier();
    return { items: summary.items, packed, courier, totals: calcOrderTotal(summary.total, packed, courier) };
}

function createRow(label, value, bold) {
    const row = createEl('li', bold ? 'd-flex flex-wrap justify-content-between gap-2 fw-bold border-top pt-2 mt-1' : 'd-flex flex-wrap justify-content-between gap-2');
    row.append(createEl('span', '', label), createEl('span', 'text-end', value));
    return row;
}

function createCalcRows(order) {
    const { items, totals } = order;
    const rows = items.map(item => createRow(`${item.product.name} × ${item.qty}`, formatPrice(item.subtotal), false));
    if (items.length > 1) {
        rows.push(createRow('Стоимость десертов', formatPrice(totals.subtotal), false));
    }
    if (order.packed) {
        rows.push(createRow('Подарочная упаковка', formatPrice(totals.packing), false));
    }
    if (order.courier) {
        const note = totals.delivery === 0 ? 'бесплатно' : `${formatPrice(totals.delivery)} (бесплатно от ${formatPrice(FREE_DELIVERY_FROM)})`;
        rows.push(createRow('Доставка', note, false));
    }
    rows.push(createRow('Итого', formatPrice(totals.total), true));
    return rows;
}

function updateSummary() {
    if (getCartItems().length === 0) {
        orderUi.summaryList.replaceChildren(createEl('li', 'text-muted', 'В заказе пока нет десертов. Добавьте их кнопкой «Добавить в заказ» или выберите в меню.'));
        return;
    }
    orderUi.summaryList.replaceChildren(...createCalcRows(readOrder()));
}

function updateNotesCounter() {
    const length = orderFields.notes.value.length;
    orderUi.counter.textContent = `${length} / ${NOTES_LIMIT}`;
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

function updateDateLimits() {
    const leadItem = getLeadItem(getCartItems());
    const today = startOfToday();
    const earliest = addDays(today, leadItem ? leadItem.product.leadDays : 1);
    orderFields.date.setAttribute('min', toInputDate(earliest));
    orderFields.date.setAttribute('max', toInputDate(addDays(today, MAX_DAYS_AHEAD)));
}

function refreshOrderUi() {
    updateDeliveryGroups();
    updatePaymentGroup();
    updateDateLimits();
    updateNotesCounter();
    updateSummary();
}

function getPaymentLabel() {
    switch (orderForm.elements.paymethod.value) {
        case 'kaspi':
            return 'Kaspi QR / Kaspi Red';
        case 'card':
            return 'Оплата картой (данные карты не сохраняются)';
        default:
            return '—';
    }
}

function showSuccess(order) {
    const list = createEl('ul', 'list-unstyled mb-3');
    const address = order.courier ? `${orderFields.address.value.trim()}, кв./офис ${orderFields.flat.value.trim()}` : orderForm.elements['pickup-address'].selectedOptions[0].textContent;
    const rows = [
        createRow('Имя', orderFields.name.value.trim(), false),
        createRow('Телефон', orderFields.phone.value.trim(), false),
        createRow('Почта', orderFields.email.value.trim(), false),
        createRow('Дата получения', formatDate(new Date(`${orderFields.date.value}T00:00:00`)), false),
        createRow(order.courier ? 'Адрес доставки' : 'Самовывоз', address, false),
        createRow('Способ оплаты', getPaymentLabel(), false)
    ];
    const notes = orderFields.notes.value.trim();
    if (notes !== '') {
        rows.push(createRow('Пожелания', notes, false));
    }
    list.append(...rows, ...createCalcRows(order));
    const reference = createReference();

    orderSuccess.replaceChildren(
        createEl('h2', 'h5 alert-heading', 'Демонстрационная заявка принята'),
        createEl('p', 'mb-2', `Временный номер: ${reference}`),
        list,
        createEl('p', 'small mb-0', 'Это учебная демонстрация: данные не отправляются на сервер, реальный заказ и оплата не создаются, менеджер не свяжется с вами.')
    );
    clearCardFields();
    orderSuccess.classList.remove('d-none');
    orderSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function findFieldKey(element) {
    return Object.keys(orderFields).find(key => orderFields[key] === element);
}

function handleOrderInput(event) {
    const key = findFieldKey(event.target);
    orderSuccess.classList.add('d-none');
    if (key === 'cardNumber') {
        event.target.value = formatCardNumber(event.target.value);
    }
    if (key === 'cardExpiry') {
        event.target.value = formatCardExpiry(event.target.value);
    }
    if (key === 'cardCvc') {
        event.target.value = event.target.value.replace(/\D/g, '').slice(0, 3);
    }
    if (key !== undefined && event.target.classList.contains('is-invalid')) {
        validateField(key);
    }
    updateNotesCounter();
    updateSummary();
}

function handleOrderChange(event) {
    const target = event.target;
    const key = findFieldKey(target);
    orderSuccess.classList.add('d-none');
    if (target.name === 'deltype') {
        updateDeliveryGroups();
    }
    if (target.name === 'paymethod') {
        updatePaymentGroup();
    }
    if (key !== undefined && key !== 'item' && isKeyActive(key)) {
        validateField(key);
    }
    updateSummary();
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

function handleOrderReset() {
    for (const field of Object.values(orderFields)) {
        clearFieldState(field);
    }
    orderSuccess.classList.add('d-none');
    orderError.classList.add('d-none');
    clearCart();
    orderUi.addMessage.classList.remove('text-danger');
    orderUi.addMessage.textContent = 'Форма и состав заказа сброшены.';
    window.setTimeout(refreshOrderUi, 0);
}

function handleAddToOrder() {
    orderSuccess.classList.add('d-none');
    if (!validateField('qty')) {
        orderUi.addMessage.textContent = '';
        orderFields.qty.focus();
        return;
    }
    const result = addToCart(orderFields.item.value, Number(orderFields.qty.value));
    orderUi.addMessage.textContent = result.message;
    orderUi.addMessage.classList.toggle('text-danger', !result.ok);
}

function handleCartChanged() {
    updateDateLimits();
    updateSummary();
    if (orderFields.item.classList.contains('is-invalid')) {
        validateField('item');
    }
    if (orderFields.date.value !== '' && orderFields.date.classList.contains('is-invalid')) {
        validateField('date');
    }
}

function createTextInput(id, placeholder, inputMode, autocomplete, maxLength) {
    const input = createEl('input', 'form-control');
    input.type = 'text';
    input.id = id;
    input.name = id;
    input.placeholder = placeholder;
    input.inputMode = inputMode;
    input.autocomplete = autocomplete;
    input.maxLength = maxLength;
    return input;
}

function createInputGroup(columnClasses, labelText, input) {
    const column = createEl('div', columnClasses);
    const label = createEl('label', 'form-label fw-semibold', labelText);
    label.htmlFor = input.id;
    column.append(label, input);
    return column;
}

function buildDeliveryFlat() {
    document.querySelector('label[for="delivery-address"]').textContent = 'Улица и дом:';
    orderFields.address.setAttribute('placeholder', 'Например: ул. Достык 10');
    orderFields.flat = createTextInput('delivery-flat', 'Например: 15', 'text', 'off', 10);
    orderUi.flatGroup = createInputGroup('mb-3 d-none', 'Квартира / офис:', orderFields.flat);
    deliveryGroup.after(orderUi.flatGroup);
}

function buildCardGroup() {
    orderFields.cardNumber = createTextInput('card-number', '0000 0000 0000 0000', 'numeric', 'off', 19);
    orderFields.cardExpiry = createTextInput('card-expiry', 'ММ/ГГ', 'numeric', 'off', 5);
    orderFields.cardCvc = createTextInput('card-cvc', '000', 'numeric', 'off', 3);

    const row = createEl('div', 'row g-3');
    row.append(
        createInputGroup('col-12', 'Номер карты:', orderFields.cardNumber),
        createInputGroup('col-6', 'Срок действия (ММ/ГГ):', orderFields.cardExpiry),
        createInputGroup('col-6', 'CVC:', orderFields.cardCvc)
    );
    orderUi.cardGroup = createEl('div', 'mt-3 d-none');
    orderUi.cardGroup.append(row);
    document.getElementById('pay-card').closest('.form-check').parentElement.after(orderUi.cardGroup);
}

function buildOrderUi() {
    buildDeliveryFlat();
    buildCardGroup();
    orderUi.counter = createEl('small', 'form-text d-block text-end');
    orderFields.notes.insertAdjacentElement('afterend', orderUi.counter);

    orderUi.addButton = createEl('button', 'btn btn-outline-dark btn-sm mt-2', 'Добавить в заказ');
    orderUi.addButton.type = 'button';
    orderUi.addMessage = createEl('p', 'small mt-1 mb-0');
    orderUi.addMessage.setAttribute('role', 'status');
    orderFields.qty.parentElement.append(orderUi.addButton, orderUi.addMessage);

    const summary = createEl('div', 'alert alert-secondary mb-4');
    summary.setAttribute('role', 'status');
    summary.append(createEl('h3', 'h6 fw-bold mb-2', 'Состав заказа и расчёт'));
    orderUi.summaryList = createEl('ul', 'list-unstyled mb-2');
    const cartButton = createEl('button', 'btn btn-outline-dark btn-sm', 'Изменить в корзине');
    cartButton.type = 'button';
    cartButton.addEventListener('click', openCart);
    summary.append(orderUi.summaryList, cartButton);
    document.getElementById('order-submit-btn').parentElement.before(summary);
}

function preselectItem() {
    const requested = new URLSearchParams(window.location.search).get('item');
    if (requested === null || findProduct(requested) === undefined) {
        return;
    }
    orderFields.item.value = requested;
    if (!cart.some(line => line.id === requested)) {
        orderUi.addMessage.textContent = addToCart(requested, 1).message;
    }
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
}

function initOrderPage() {
    orderForm.noValidate = true;
    buildOrderUi();
    preselectItem();
    refreshOrderUi();
    orderForm.addEventListener('input', handleOrderInput);
    orderForm.addEventListener('change', handleOrderChange);
    orderForm.addEventListener('submit', handleOrderSubmit);
    orderForm.addEventListener('reset', handleOrderReset);
    orderUi.addButton.addEventListener('click', handleAddToOrder);
    document.addEventListener('cart:changed', handleCartChanged);
}

initOrderPage();