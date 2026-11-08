'use strict';

const app = {};

(function () {
    const CART_KEY = 'taptatti-cart';
    const ui = {};
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

    function getDateNote(items) {
        if (items.length === 0) {
            return '';
        }
        return `Ближайшая дата получения: ${formatDate(getEarliestDate(getMaxLeadDays(items)))}.`;
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

    function addMany(lines) {
        let added = 0;
        let skipped = 0;
        for (const line of lines) {
            const product = findProduct(line.id);
            const existing = cart.find(item => item.id === line.id);
            const current = existing ? existing.qty : 0;
            if (product === undefined || current + line.qty > MAX_QTY) {
                skipped += 1;
                continue;
            }
            if (existing) {
                existing.qty = current + line.qty;
            } else {
                cart.push({ id: line.id, qty: line.qty });
            }
            added += 1;
        }
        saveCart();
        renderCart();
        return { added, skipped };
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
            ui.message.classList.add('d-none');
            return;
        }
        ui.message.textContent = text;
        ui.message.classList.remove('d-none');
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
        renderCartPanel();
        document.dispatchEvent(new CustomEvent('cart:changed'));
    }

    function renderCartPanel() {
        if (ui.badge === undefined) {
            return;
        }
        const summary = calcCart(cart);
        ui.badge.textContent = String(summary.totalQty);
        ui.list.replaceChildren(...summary.items.map(createCartRow));
        ui.empty.classList.toggle('d-none', summary.items.length > 0);
        ui.total.textContent = `Позиций: ${summary.totalQty} шт. · Итого: ${formatPrice(summary.total)}`;
        ui.note.textContent = getDeliveryNote(summary.total);
        ui.date.textContent = getDateNote(summary.items);
        ui.checkout.disabled = summary.totalQty === 0;
        ui.clear.disabled = summary.totalQty === 0;
    }

    function openCart() {
        setCartMessage('');
        renderCart();
        ui.modal.show();
    }

    function checkoutCart() {
        if (calcCart(cart).totalQty === 0) {
            setCartMessage('Корзина пуста — добавьте десерты из меню.');
            return;
        }
        const orderSection = document.getElementById('order-form');
        if (document.getElementById('order-form-element') !== null && orderSection !== null) {
            ui.modal.hide();
            orderSection.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        window.location.href = 'order.html#order-form';
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
        ui.message = createEl('div', 'alert alert-warning py-2 small d-none');
        ui.message.setAttribute('role', 'status');
        ui.list = createEl('ul', 'list-group list-group-flush');
        ui.empty = createEl('div', 'text-center text-muted py-3');
        const emptyLink = createEl('a', 'btn btn-outline-dark btn-sm mt-2', 'Перейти в меню');
        emptyLink.href = 'menu.html';
        ui.empty.append(createEl('p', 'mb-1', 'Корзина пуста. Добавьте десерты из меню.'), emptyLink);
        body.append(ui.message, ui.list, ui.empty);

        const footer = createEl('div', 'modal-footer justify-content-between');
        const totals = createEl('div');
        ui.total = createEl('p', 'fw-semibold mb-0');
        ui.note = createEl('small', 'text-muted d-block');
        ui.date = createEl('small', 'text-muted d-block');
        totals.append(ui.total, ui.note, ui.date);
        const actions = createEl('div', 'd-flex gap-2');
        ui.clear = createEl('button', 'btn btn-outline-secondary', 'Очистить');
        ui.clear.type = 'button';
        ui.checkout = createEl('button', 'btn btn-primary fw-semibold', 'Оформить заказ');
        ui.checkout.type = 'button';
        actions.append(ui.clear, ui.checkout);
        footer.append(totals, actions);

        content.append(header, body, footer);
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
        ui.badge = createEl('span', 'badge bg-warning text-dark ms-1', '0');
        openButton.append(ui.badge);
        navItem.append(openButton);
        navList.append(navItem);

        ui.modal = new bootstrap.Modal(buildCartModal());

        openButton.addEventListener('click', openCart);
        ui.list.addEventListener('click', handleCartClick);
        ui.clear.addEventListener('click', () => {
            setCartMessage(clearCart().message);
        });
        ui.checkout.addEventListener('click', checkoutCart);
    }

    app.createEl = createEl;
    app.createReference = createReference;
    app.flashButton = flashButton;
    app.addToCart = addToCart;
    app.addMany = addMany;
    app.clearCart = clearCart;
    app.openCart = openCart;
    app.cartSummary = () => calcCart(cart);
    app.inCart = id => cart.some(line => line.id === id);

    buildCartUi();
    renderCart();
})();