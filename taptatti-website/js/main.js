'use strict';

const CART_KEY = 'taptatti-cart';
const cartUi = {};
let cart = loadCart();

function createEl(tag, classNames, text) {
    const element = document.createElement(tag);
    if (classNames) {
        element.classList.add(...classNames.split(' '));
    }
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}

function createReference() {
    return `TT-${Math.floor(Math.random() * 900000) + 100000}`;
}

function flashButton(button, text) {
    const original = button.dataset.label || button.textContent;
    button.dataset.label = original;
    button.textContent = text;
    window.setTimeout(() => {
        button.textContent = original;
    }, 1200);
}

function loadCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter(line => findProduct(line.id) !== undefined && Number.isInteger(line.qty) && line.qty > 0 && line.qty <= MAX_QTY);
    } catch (error) {
        return [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
        return;
    }
}

function calcCart(lines) {
    const items = [];
    let totalQty = 0;
    let total = 0;
    for (const line of lines) {
        const product = findProduct(line.id);
        if (product === undefined) {
            continue;
        }
        const subtotal = product.price * line.qty;
        items.push({ product, qty: line.qty, subtotal });
        totalQty += line.qty;
        total += subtotal;
    }
    return { items, totalQty, total };
}

function getDeliveryNote(total) {
    if (total === 0) {
        return '';
    }
    if (total >= FREE_DELIVERY_FROM) {
        return 'Доставка по городу бесплатна.';
    }
    return `До бесплатной доставки не хватает ${formatPrice(FREE_DELIVERY_FROM - total)}.`;
}

function addToCart(id, qty) {
    const product = findProduct(id);
    if (product === undefined) {
        return { ok: false, message: 'Десерт не найден.' };
    }
    const line = cart.find(item => item.id === id);
    const current = line ? line.qty : 0;
    if (current + qty > MAX_QTY) {
        return { ok: false, message: `В заказе не более ${MAX_QTY} шт. одного десерта.` };
    }
    if (line) {
        line.qty = current + qty;
    } else {
        cart.push({ id, qty });
    }
    saveCart();
    renderCart();
    return { ok: true, message: `${product.name} добавлен в корзину (${current + qty} шт.).` };
}

function removeFromCart(id) {
    const product = findProduct(id);
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
    return { ok: true, message: `${product.name} удалён из корзины.` };
}

function changeQty(id, delta) {
    const line = cart.find(item => item.id === id);
    if (line === undefined) {
        return { ok: false, message: 'Позиции нет в корзине.' };
    }
    const next = line.qty + delta;
    if (next > MAX_QTY) {
        return { ok: false, message: `В заказе не более ${MAX_QTY} шт. одного десерта.` };
    }
    if (next < 1) {
        return removeFromCart(id);
    }
    line.qty = next;
    saveCart();
    renderCart();
    return { ok: true, message: 'Количество изменено.' };
}

function clearCart() {
    cart = [];
    saveCart();
    renderCart();
    return { ok: true, message: 'Корзина очищена.' };
}

function setCartMessage(text) {
    if (text === '') {
        cartUi.message.classList.add('d-none');
        return;
    }
    cartUi.message.textContent = text;
    cartUi.message.classList.remove('d-none');
}

function createCartButton(label, action, id, className, ariaLabel) {
    const button = createEl('button', className, label);
    button.type = 'button';
    button.dataset.action = action;
    button.dataset.id = id;
    button.setAttribute('aria-label', ariaLabel);
    return button;
}

function createCartRow(item) {
    const row = createEl('li', 'list-group-item px-0');
    const wrap = createEl('div', 'd-flex flex-wrap align-items-center justify-content-between gap-2');

    const info = createEl('div');
    info.append(createEl('strong', '', item.product.name), createEl('small', 'text-muted d-block', `${formatPrice(item.product.price)} за шт.`));

    const controls = createEl('div', 'd-flex align-items-center gap-2');
    const minus = createCartButton('−', 'dec', item.product.id, 'btn btn-outline-dark btn-sm', `Уменьшить количество: ${item.product.name}`);
    const plus = createCartButton('+', 'inc', item.product.id, 'btn btn-outline-dark btn-sm', `Увеличить количество: ${item.product.name}`);
    minus.disabled = item.qty === 1;
    plus.disabled = item.qty === MAX_QTY;
    controls.append(minus, createEl('span', 'fw-semibold px-1', `${item.qty} шт.`), plus);

    const subtotal = createEl('span', 'fw-bold', formatPrice(item.subtotal));
    const remove = createCartButton('Удалить', 'remove', item.product.id, 'btn btn-outline-danger btn-sm', `Удалить из корзины: ${item.product.name}`);

    wrap.append(info, controls, subtotal, remove);
    row.append(wrap);
    return row;
}

function renderCart() {
    const summary = calcCart(cart);
    if (cartUi.badge === undefined) {
        return;
    }
    cartUi.badge.textContent = String(summary.totalQty);
    cartUi.list.replaceChildren(...summary.items.map(createCartRow));
    cartUi.empty.classList.toggle('d-none', summary.items.length > 0);
    cartUi.total.textContent = `Позиций: ${summary.totalQty} шт. · Итого: ${formatPrice(summary.total)}`;
    cartUi.note.textContent = getDeliveryNote(summary.total);
    cartUi.checkout.disabled = summary.totalQty === 0;
    cartUi.clear.disabled = summary.totalQty === 0;
}

function showCartConfirmation(summary) {
    const reference = createReference();
    const box = cartUi.confirmBox;
    box.replaceChildren();
    const list = createEl('ul', 'list-group list-group-flush mb-3');
    for (const item of summary.items) {
        list.append(createEl('li', 'list-group-item px-0', `${item.product.name} × ${item.qty} — ${formatPrice(item.subtotal)}`));
    }
    const actions = createEl('div', 'd-flex flex-wrap gap-2');
    const orderLink = createEl('a', 'btn btn-primary btn-sm', 'Перейти к форме заказа');
    orderLink.href = 'order.html#order-form';
    const closeButton = createEl('button', 'btn btn-outline-secondary btn-sm', 'Закрыть');
    closeButton.type = 'button';
    closeButton.setAttribute('data-bs-dismiss', 'modal');
    actions.append(orderLink, closeButton);

    box.append(
        createEl('h3', 'h5 fw-bold', 'Демонстрационная заявка сформирована'),
        createEl('p', 'mb-2', `Временный номер: ${reference}`),
        list,
        createEl('p', 'fw-bold', `Итого: ${formatPrice(summary.total)}`),
        createEl('p', 'small text-muted', 'Это демонстрация: данные не отправляются на сервер, реальный заказ и оплата не создаются. Для настоящего заказа позвоните по номеру +7 (705) 755-19-10.'),
        actions
    );
    cartUi.itemsBox.classList.add('d-none');
    cartUi.footer.classList.add('d-none');
    box.classList.remove('d-none');
}

function checkoutCart() {
    const summary = calcCart(cart);
    if (summary.totalQty === 0) {
        setCartMessage('Корзина пуста — добавьте десерты из меню.');
        return;
    }
    clearCart();
    showCartConfirmation(summary);
}

function resetCartView() {
    cartUi.confirmBox.classList.add('d-none');
    cartUi.itemsBox.classList.remove('d-none');
    cartUi.footer.classList.remove('d-none');
    setCartMessage('');
    renderCart();
}

function handleCartClick(event) {
    const button = event.target.closest('button[data-action]');
    if (button === null) {
        return;
    }
    const id = button.dataset.id;
    let result;
    switch (button.dataset.action) {
        case 'inc':
            result = changeQty(id, 1);
            break;
        case 'dec':
            result = changeQty(id, -1);
            break;
        case 'remove':
            result = removeFromCart(id);
            break;
        default:
            return;
    }
    setCartMessage(result.ok && button.dataset.action === 'inc' ? '' : result.message);
}

function buildCartModal() {
    const modal = createEl('div', 'modal fade');
    modal.id = 'cart-modal';
    modal.tabIndex = -1;
    modal.setAttribute('aria-labelledby', 'cart-title');
    modal.setAttribute('aria-hidden', 'true');

    const dialog = createEl('div', 'modal-dialog modal-dialog-scrollable modal-dialog-centered');
    const content = createEl('div', 'modal-content');

    const header = createEl('div', 'modal-header');
    const title = createEl('h2', 'modal-title h5', 'Корзина');
    title.id = 'cart-title';
    const closeIcon = createEl('button', 'btn-close');
    closeIcon.type = 'button';
    closeIcon.setAttribute('data-bs-dismiss', 'modal');
    closeIcon.setAttribute('aria-label', 'Закрыть');
    header.append(title, closeIcon);

    const body = createEl('div', 'modal-body');
    cartUi.itemsBox = createEl('div');
    cartUi.message = createEl('div', 'alert alert-warning py-2 small d-none');
    cartUi.message.setAttribute('role', 'status');
    cartUi.list = createEl('ul', 'list-group list-group-flush');
    cartUi.empty = createEl('div', 'text-center text-muted py-3');
    const emptyLink = createEl('a', 'btn btn-outline-dark btn-sm mt-2', 'Перейти в меню');
    emptyLink.href = 'menu.html';
    cartUi.empty.append(createEl('p', 'mb-1', 'Корзина пуста. Добавьте десерты из меню.'), emptyLink);
    cartUi.itemsBox.append(cartUi.message, cartUi.list, cartUi.empty);
    cartUi.confirmBox = createEl('div', 'd-none');
    body.append(cartUi.itemsBox, cartUi.confirmBox);

    cartUi.footer = createEl('div', 'modal-footer justify-content-between');
    const totals = createEl('div');
    cartUi.total = createEl('p', 'fw-semibold mb-0');
    cartUi.note = createEl('small', 'text-muted d-block');
    totals.append(cartUi.total, cartUi.note);
    const actions = createEl('div', 'd-flex gap-2');
    cartUi.clear = createEl('button', 'btn btn-outline-secondary', 'Очистить');
    cartUi.clear.type = 'button';
    cartUi.checkout = createEl('button', 'btn btn-primary fw-semibold', 'Оформить');
    cartUi.checkout.type = 'button';
    actions.append(cartUi.clear, cartUi.checkout);
    cartUi.footer.append(totals, actions);

    content.append(header, body, cartUi.footer);
    dialog.append(content);
    modal.append(dialog);
    document.body.append(modal);
    return modal;
}

function buildCartUi() {
    const navList = document.querySelector('#navbarNav .navbar-nav');
    if (navList === null) {
        return;
    }
    const navItem = createEl('li', 'nav-item');
    const openButton = createEl('button', 'nav-link text-dark px-2', 'Корзина');
    openButton.type = 'button';
    openButton.id = 'cart-open-btn';
    cartUi.badge = createEl('span', 'badge bg-warning text-dark ms-1', '0');
    openButton.append(cartUi.badge);
    navItem.append(openButton);
    navList.append(navItem);

    const modalElement = buildCartModal();
    cartUi.modal = new bootstrap.Modal(modalElement);

    openButton.addEventListener('click', () => {
        resetCartView();
        cartUi.modal.show();
    });
    cartUi.list.addEventListener('click', handleCartClick);
    cartUi.clear.addEventListener('click', () => {
        setCartMessage(clearCart().message);
    });
    cartUi.checkout.addEventListener('click', checkoutCart);
    modalElement.addEventListener('hidden.bs.modal', resetCartView);
}

buildCartUi();
renderCart();
