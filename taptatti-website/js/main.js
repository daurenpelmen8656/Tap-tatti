'use strict';

// jQuery 3.7.1 (подключён с CDN в HTML перед этим файлом). Эта строка нужна, потому что
// весь код ниже использует $: выбор элементов, события .on(), эффекты и создание элементов.
// app — общий объект: другие файлы берут из него функции корзины.
const app = {};

$(function () {
    const CART_KEY = 'taptatti-cart';
    const ui = {};
    let cart = loadCart();

    function createEl(tag, classNames, text) {
        const $element = $(`<${tag}>`);
        if (classNames) {
            $element.addClass(classNames);
        }
        if (text !== undefined) {
            $element.text(text);
        }
        return $element;
    }

    function createReference() {
        return `TT-${Math.floor(Math.random() * 900000) + 100000}`;
    }

    function flashButton($button, text) {
        const original = $button.data('label') || $button.text();
        $button.data('label', original).text(text);
        window.setTimeout(function () {
            $button.text(original);
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
        $.each(lines, function (index, line) {
            const product = findProduct(line.id);
            if (product === undefined) {
                return;
            }
            const subtotal = product.price * line.qty;
            items.push({ product, qty: line.qty, subtotal });
            totalQty += line.qty;
            total += subtotal;
        });
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
            ui.message.addClass('d-none');
            return;
        }
        ui.message.text(text).removeClass('d-none');
    }

    function createCartButton(label, action, id, className, ariaLabel) {
        return createEl('button', className, label).attr({
            type: 'button',
            'data-action': action,
            'data-id': id,
            'aria-label': ariaLabel
        });
    }

    function createCartRow(item) {
        const $info = createEl('div').append(
            createEl('strong', '', item.product.name),
            createEl('small', 'text-muted d-block', `${formatPrice(item.product.price)} за шт.`)
        );
        const $minus = createCartButton('−', 'dec', item.product.id, 'btn btn-outline-dark btn-sm', `Уменьшить количество: ${item.product.name}`)
            .prop('disabled', item.qty === 1);
        const $plus = createCartButton('+', 'inc', item.product.id, 'btn btn-outline-dark btn-sm', `Увеличить количество: ${item.product.name}`)
            .prop('disabled', item.qty === MAX_QTY);
        const $controls = createEl('div', 'd-flex align-items-center gap-2')
            .append($minus, createEl('span', 'fw-semibold px-1', `${item.qty} шт.`), $plus);
        const $subtotal = createEl('span', 'fw-bold', formatPrice(item.subtotal));
        const $remove = createCartButton('Удалить', 'remove', item.product.id, 'btn btn-outline-danger btn-sm', `Удалить из корзины: ${item.product.name}`);
        const $wrap = createEl('div', 'd-flex flex-wrap align-items-center justify-content-between gap-2')
            .append($info, $controls, $subtotal, $remove);
        return createEl('li', 'list-group-item px-0').append($wrap);
    }

    function renderCart() {
        renderCartPanel();
        $(document).trigger('cart:changed');
    }

    function renderCartPanel() {
        if (!ui.badge) {
            return;
        }
        const summary = calcCart(cart);
        ui.badge.text(summary.totalQty);
        ui.list.empty();
        $.each(summary.items, function (index, item) {
            createCartRow(item).appendTo(ui.list);
        });
        ui.empty.toggleClass('d-none', summary.items.length > 0);
        ui.total.text(`Позиций: ${summary.totalQty} шт. · Итого: ${formatPrice(summary.total)}`);
        ui.note.text(getDeliveryNote(summary.total));
        ui.checkout.prop('disabled', summary.totalQty === 0);
        ui.clear.prop('disabled', summary.totalQty === 0);
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
        if ($('#order-form-element').length > 0) {
            ui.modal.hide();
            $('html, body').animate({ scrollTop: $('#order-form').offset().top }, 300);
            return;
        }
        window.location.href = 'order.html#order-form';
    }

    // Делегирование: обработчик висит на списке #cart-list, который есть всегда,
    // а строки корзины создаются заново после каждого изменения. Если повесить .on('click')
    // прямо на кнопку, новые строки остались бы без обработчика.
    function handleCartClick() {
        const $button = $(this);
        const id = $button.data('id');
        const action = $button.data('action');
        if (action === 'remove') {
            $button.closest('li').fadeOut(200, function () {
                setCartMessage(removeFromCart(id).message);
            });
            return;
        }
        const result = changeQty(id, action === 'inc' ? 1 : -1);
        setCartMessage(result.ok && action === 'inc' ? '' : result.message);
    }

    function buildCartModal() {
        const $modal = createEl('div', 'modal fade').attr({
            id: 'cart-modal',
            tabindex: '-1',
            'aria-labelledby': 'cart-title',
            'aria-hidden': 'true'
        });
        const $header = createEl('div', 'modal-header').append(
            createEl('h2', 'modal-title h5', 'Корзина').attr('id', 'cart-title'),
            createEl('button', 'btn-close').attr({ type: 'button', 'data-bs-dismiss': 'modal', 'aria-label': 'Закрыть' })
        );

        ui.message = createEl('div', 'alert alert-warning py-2 small d-none').attr('role', 'status');
        ui.list = createEl('ul', 'list-group list-group-flush').attr('id', 'cart-list');
        ui.empty = createEl('div', 'text-center text-muted py-3').append(
            createEl('p', 'mb-1', 'Корзина пуста. Добавьте десерты из меню.'),
            createEl('a', 'btn btn-outline-dark btn-sm mt-2', 'Перейти в меню').attr('href', 'menu.html')
        );
        const $body = createEl('div', 'modal-body').append(ui.message, ui.list, ui.empty);

        ui.total = createEl('p', 'fw-semibold mb-0');
        ui.note = createEl('small', 'text-muted d-block');
        ui.clear = createEl('button', 'btn btn-outline-secondary', 'Очистить').attr('type', 'button');
        ui.checkout = createEl('button', 'btn btn-primary fw-semibold', 'Оформить заказ').attr('type', 'button');
        const $footer = createEl('div', 'modal-footer justify-content-between').append(
            createEl('div').append(ui.total, ui.note),
            createEl('div', 'd-flex gap-2').append(ui.clear, ui.checkout)
        );

        const $content = createEl('div', 'modal-content').append($header, $body, $footer);
        createEl('div', 'modal-dialog modal-dialog-scrollable modal-dialog-centered').append($content).appendTo($modal);
        return $modal.appendTo('body');
    }

    function buildCartUi() {
        const $lastNavItem = $('#navbarNav .nav-item:last');
        if ($lastNavItem.length === 0) {
            return;
        }
        const $openButton = createEl('button', 'nav-link text-dark px-2', 'Корзина').attr({ type: 'button', id: 'cart-open-btn' });
        ui.badge = createEl('span', 'badge bg-warning text-dark ms-1', '0').appendTo($openButton);
        createEl('li', 'nav-item').append($openButton).insertAfter($lastNavItem);

        ui.modal = new bootstrap.Modal(buildCartModal()[0]);

        $openButton.on('click', openCart);
        ui.list.on('click', 'button[data-action]', handleCartClick);
        ui.clear.on('click', function () {
            setCartMessage(clearCart().message);
        });
        ui.checkout.on('click', checkoutCart);
    }

    app.createEl = createEl;
    app.createReference = createReference;
    app.flashButton = flashButton;
    app.addToCart = addToCart;
    app.clearCart = clearCart;
    app.openCart = openCart;
    app.cartSummary = function () {
        return calcCart(cart);
    };
    app.inCart = function (id) {
        return cart.some(line => line.id === id);
    };

    buildCartUi();
    renderCart();
});