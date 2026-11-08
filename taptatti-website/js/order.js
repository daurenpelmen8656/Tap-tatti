'use strict';

$(function () {
    const createEl = jq.createEl;
    const NOTES_LIMIT = 200;
    const MAX_DAYS_AHEAD = 60;

    const $form = $('#order-form-element');
    const $success = $('#order-success-message');
    const $error = $('#order-error-message');
    const $pickupGroup = $('#pickup-location-group');
    const $deliveryGroup = $('#delivery-address-group');
    const ui = {};
    const LAST_ORDER_KEY = 'taptatti-last-order';
    let keepSuccess = false;

    const submitKeys = ['name', 'phone', 'email', 'item', 'date', 'address', 'flat', 'cardNumber', 'cardExpiry', 'cardCvc', 'notes'];
    const fields = {
        name: $('#username'),
        phone: $('#userphone'),
        email: $('#useremail'),
        item: $('#cake-select'),
        qty: $('#cake-num'),
        date: $('#delivery-date'),
        address: $('#delivery-address'),
        notes: $('#notes')
    };

    function isCourier() {
        return $('input[name="deltype"]:checked').val() === 'courier';
    }

    function isCard() {
        return $('input[name="paymethod"]:checked').val() === 'card';
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

    function getCartItems() {
        return app.cartSummary().items;
    }

    function getLeadItem(items) {
        let result;
        $.each(items, function (index, item) {
            if (result === undefined || item.product.leadDays > result.product.leadDays) {
                result = item;
            }
        });
        return result;
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

    function validateAddress(value) {
        if (value.trim().length < 5) {
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

    function formatCardExpiry(value) {
        const digits = value.replace(/\D/g, '').slice(0, 4);
        return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    }

    function getFieldError(key) {
        const value = fields[key].val();
        switch (key) {
            case 'name':
                return jq.validate.name(value);
            case 'phone':
                return jq.validate.phone(value);
            case 'email':
                return jq.validate.email(value);
            case 'item':
                return getCartItems().length === 0 ? 'Заказ пуст: выберите десерт, количество и нажмите «Добавить в заказ».' : '';
            case 'qty':
                return validateQty(value);
            case 'date':
                return validateDate(value, getCartItems());
            case 'address':
                return validateAddress(value);
            case 'flat':
                return validateFlat(value);
            case 'cardNumber':
                return jq.validate.cardNumber(value);
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

    function validateField(key) {
        const message = getFieldError(key);
        jq.setFieldState(fields[key], message);
        return message === '';
    }

    function validateOrderForm() {
        let invalidCount = 0;
        $.each(submitKeys, function (index, key) {
            if (!isKeyActive(key)) {
                jq.clearFieldState(fields[key]);
                return;
            }
            if (!validateField(key)) {
                invalidCount += 1;
            }
        });
        return invalidCount;
    }

    function readOrder() {
        const summary = app.cartSummary();
        // .attr('checked') читает атрибут из HTML и не меняется, когда человек ставит галочку;
        // .prop('checked') читает текущее состояние флажка (true/false), поэтому здесь нужен именно prop.
        const packed = $('#pack').prop('checked');
        const courier = isCourier();
        return { items: summary.items, packed, courier, totals: calcOrderTotal(summary.total, packed, courier) };
    }

    function createRow(label, value, bold) {
        const $row = createEl('li', 'd-flex flex-wrap justify-content-between gap-2');
        if (bold) {
            $row.addClass('fw-bold border-top pt-2 mt-1');
        }
        return $row.append(createEl('span', '', label), createEl('span', 'text-end', value));
    }

    function createCalcRows(order) {
        const rows = [];
        $.each(order.items, function (index, item) {
            rows.push(createRow(`${item.product.name} × ${item.qty}`, formatPrice(item.subtotal), false));
        });
        if (order.items.length > 1) {
            rows.push(createRow('Стоимость десертов', formatPrice(order.totals.subtotal), false));
        }
        if (order.packed) {
            rows.push(createRow('Подарочная упаковка', formatPrice(order.totals.packing), false));
        }
        if (order.courier) {
            const note = order.totals.delivery === 0 ? 'бесплатно' : `${formatPrice(order.totals.delivery)} (бесплатно от ${formatPrice(FREE_DELIVERY_FROM)})`;
            rows.push(createRow('Доставка', note, false));
        }
        rows.push(createRow('Итого', formatPrice(order.totals.total), true));
        return rows;
    }

    function updateSummary() {
        ui.summaryList.empty();
        if (getCartItems().length === 0) {
            createEl('li', 'text-muted', 'В заказе пока нет десертов. Добавьте их кнопкой «Добавить в заказ» или выберите в меню.').appendTo(ui.summaryList);
            return;
        }
        $.each(createCalcRows(readOrder()), function (index, $row) {
            $row.appendTo(ui.summaryList);
        });
    }

    function updateNotesCounter() {
        ui.counter.text(`${fields.notes.val().length} / ${NOTES_LIMIT}`);
    }

    function updateDeliveryGroups(speed) {
        const courier = isCourier();
        jq.setVisible($pickupGroup, !courier, speed);
        jq.setVisible($deliveryGroup, courier, speed);
        jq.setVisible(ui.flatGroup, courier, speed);
        if (!courier) {
            jq.clearFieldState(fields.address);
            jq.clearFieldState(fields.flat);
        }
    }

    function clearCardFields() {
        $.each(['cardNumber', 'cardExpiry', 'cardCvc'], function (index, key) {
            fields[key].val('');
            jq.clearFieldState(fields[key]);
        });
    }

    function updatePaymentGroup(speed) {
        const card = isCard();
        jq.setVisible(ui.cardGroup, card, speed);
        if (!card) {
            clearCardFields();
        }
    }

    function updateDateLimits() {
        const leadItem = getLeadItem(getCartItems());
        const today = startOfToday();
        const earliest = addDays(today, leadItem ? leadItem.product.leadDays : 1);
        fields.date.attr('min', toInputDate(earliest)).attr('max', toInputDate(addDays(today, MAX_DAYS_AHEAD)));
        ui.dateHint.text(getCartItems().length === 0 ? '' : `Ближайшая дата получения: ${formatDate(earliest)}.`);
    }

    function refreshOrderUi(speed) {
        updateDeliveryGroups(speed);
        updatePaymentGroup(speed);
        updateDateLimits();
        updateNotesCounter();
        updateSummary();
    }

    function getPaymentLabel() {
        switch ($('input[name="paymethod"]:checked').val()) {
            case 'kaspi':
                return 'Kaspi QR / Kaspi Red';
            case 'card':
                return 'Оплата картой (данные карты не сохраняются)';
            default:
                return '—';
        }
    }

    function hideSuccess() {
        $('#order-success-message:not(.d-none)').fadeOut(200, function () {
            $(this).addClass('d-none');
        });
    }

    function showSuccess(order) {
        const address = order.courier
            ? `${fields.address.val().trim()}, кв./офис ${fields.flat.val().trim()}`
            : $('#pickup-address option:selected').text();
        const rows = [
            createRow('Имя', fields.name.val().trim(), false),
            createRow('Телефон', fields.phone.val().trim(), false),
            createRow('Почта', fields.email.val().trim(), false),
            createRow('Дата получения', formatDate(new Date(`${fields.date.val()}T00:00:00`)), false),
            createRow(order.courier ? 'Адрес доставки' : 'Самовывоз', address, false),
            createRow('Способ оплаты', getPaymentLabel(), false)
        ];
        const notes = fields.notes.val().trim();
        if (notes !== '') {
            rows.push(createRow('Пожелания', notes, false));
        }
        const $list = createEl('ul', 'list-unstyled mb-3');
        $.each(rows.concat(createCalcRows(order)), function (index, $row) {
            $row.appendTo($list);
        });

        const reference = app.createReference();
        $success.empty().append(
            createEl('h2', 'h5 alert-heading', 'Демонстрационная заявка принята'),
            createEl('p', 'mb-2', `Временный номер: ${reference}`),
            $list,
            createEl('p', 'small mb-0', 'Это учебная демонстрация: данные не отправляются на сервер, реальный заказ и оплата не создаются, менеджер не свяжется с вами.')
        );
        jq.showBlock($success, 300);
        $('html, body').animate({ scrollTop: $success.offset().top - 100 }, 300);
        return reference;
    }

    function loadLastOrder() {
        try {
            return JSON.parse(localStorage.getItem(LAST_ORDER_KEY));
        } catch (error) {
            return null;
        }
    }

    function saveLastOrder(order, reference) {
        const lines = order.items.map(item => ({ id: item.product.id, qty: item.qty }));
        const record = { reference, lines, total: order.totals.total, date: formatDate(new Date()) };
        try {
            localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(record));
        } catch (error) {
            return;
        }
    }

    function renderLastOrder() {
        const record = loadLastOrder();
        if (!record || !Array.isArray(record.lines) || record.lines.length === 0) {
            ui.lastOrder.addClass('d-none');
            return;
        }
        const names = record.lines.map(line => {
            const product = findProduct(line.id);
            return product ? `${product.name} × ${line.qty}` : '';
        }).filter(text => text !== '');
        ui.lastOrderText.text(`Прошлая заявка ${record.reference} от ${record.date}: ${names.join(', ')} — ${formatPrice(record.total)}.`);
        ui.lastOrderMessage.text('');
        jq.showBlock(ui.lastOrder, 300);
    }

    function findFieldKey(element) {
        return Object.keys(fields).find(key => fields[key][0] === element);
    }

    function createTextInput(id, placeholder, inputMode, maxLength) {
        return createEl('input', 'form-control').attr({
            type: 'text',
            id,
            name: id,
            placeholder,
            inputmode: inputMode,
            autocomplete: 'off',
            maxlength: maxLength
        });
    }

    function createInputGroup(columnClasses, labelText, $input) {
        return createEl('div', columnClasses).append(
            createEl('label', 'form-label fw-semibold', labelText).attr('for', $input.attr('id')),
            $input
        );
    }

    function buildDeliveryFlat() {
        $('label[for="delivery-address"]').text('Улица и дом:');
        fields.address.attr('placeholder', 'Например: ул. Достык 10');
        fields.flat = createTextInput('delivery-flat', 'Например: 15', 'text', 10);
        ui.flatGroup = createInputGroup('mb-3', 'Квартира / офис:', fields.flat).hide();
        $deliveryGroup.after(ui.flatGroup);
    }

    function buildCardGroup() {
        fields.cardNumber = createTextInput('card-number', '0000 0000 0000 0000', 'numeric', 19);
        fields.cardExpiry = createTextInput('card-expiry', 'ММ/ГГ', 'numeric', 5);
        fields.cardCvc = createTextInput('card-cvc', '000', 'numeric', 3);
        const $row = createEl('div', 'row g-3').append(
            createInputGroup('col-12', 'Номер карты:', fields.cardNumber),
            createInputGroup('col-6', 'Срок действия (ММ/ГГ):', fields.cardExpiry),
            createInputGroup('col-6', 'CVC:', fields.cardCvc)
        );
        ui.cardGroup = createEl('div', 'mt-3').append($row).hide();
        $('#pay-card').closest('.form-check').parent().after(ui.cardGroup);
    }

    function buildOrderUi() {
        buildDeliveryFlat();
        buildCardGroup();
        ui.counter = createEl('small', 'form-text d-block text-end').insertAfter(fields.notes);

        ui.addButton = createEl('button', 'btn btn-outline-dark btn-sm mt-2', 'Добавить в заказ').attr('type', 'button');
        ui.addMessage = createEl('p', 'small mt-1 mb-0').attr('role', 'status');
        fields.qty.parent().append(ui.addButton, ui.addMessage);
        ui.dateHint = createEl('small', 'form-text d-block').insertAfter(fields.date);

        ui.summaryList = createEl('ul', 'list-unstyled mb-2');
        ui.cartButton = createEl('button', 'btn btn-outline-dark btn-sm', 'Изменить в корзине').attr('type', 'button');
        const $summary = createEl('div', 'alert alert-secondary mb-4').attr('role', 'status').append(
            createEl('h3', 'h6 fw-bold mb-2', 'Состав заказа и расчёт'),
            ui.summaryList,
            ui.cartButton
        );
        $('#order-submit-btn').parent().before($summary);

        ui.lastOrderText = createEl('p', 'mb-2 small');
        ui.lastOrderMessage = createEl('p', 'small mb-0 mt-2').attr('role', 'status');
        ui.repeatButton = createEl('button', 'btn btn-outline-dark btn-sm', 'Повторить заказ').attr('type', 'button');
        ui.lastOrder = createEl('div', 'alert alert-light border d-none mb-4').append(
            createEl('h3', 'h6 fw-bold mb-2', 'Ваш последний заказ'),
            ui.lastOrderText,
            ui.repeatButton,
            ui.lastOrderMessage
        );
        $form.before(ui.lastOrder);
    }

    function preselectItem() {
        const requested = new URLSearchParams(window.location.search).get('item');
        if (requested === null || findProduct(requested) === undefined) {
            return;
        }
        fields.item.val(requested);
        if (!app.inCart(requested)) {
            ui.addMessage.text(app.addToCart(requested, 1).message);
        }
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
    }

    // Делегирование: input и change ловит сама форма #order-form-element, потому что поля
    // квартиры и карты создаёт код. Привязка прямо к таким полям потребовала бы вешать обработчик
    // отдельно на каждое созданное поле, а форма ловит всплывающее событие от любого из них.
    $form.on('input', 'input, textarea', function () {
        const $field = $(this);
        const key = findFieldKey(this);
        hideSuccess();
        if (key === 'cardNumber') {
            $field.val(jq.formatCardNumber($field.val()));
        }
        if (key === 'cardExpiry') {
            $field.val(formatCardExpiry($field.val()));
        }
        if (key === 'cardCvc') {
            $field.val($field.val().replace(/\D/g, '').slice(0, 3));
        }
        if (key !== undefined && $field.hasClass('is-invalid')) {
            validateField(key);
        }
        updateNotesCounter();
        updateSummary();
    });

    $form.on('change', 'input, select, textarea', function () {
        const $field = $(this);
        const key = findFieldKey(this);
        const name = $field.attr('name');
        hideSuccess();
        if (name === 'deltype') {
            updateDeliveryGroups(250);
        }
        if (name === 'paymethod') {
            updatePaymentGroup(250);
        }
        if (key !== undefined && key !== 'item' && isKeyActive(key)) {
            validateField(key);
        }
        updateSummary();
    });

    // preventDefault нужен, чтобы браузер не отправил форму (method="post" на order.html):
    // без него страница перезагрузилась бы, введённые данные и сообщения об ошибках пропали бы.
    // Проверка в браузере (required и этот код) не заменяет проверку на сервере: посетитель может
    // отключить JavaScript, изменить HTML в DevTools или отправить запрос в обход страницы,
    // поэтому сервер обязан перепроверять все данные сам. Атрибуты required оставлены в HTML
    // как запасной вариант без JS; novalidate выключает только стандартные всплывающие подсказки браузера,
    // чтобы показывать свои сообщения у каждого поля.
    $form.on('submit', function (event) {
        event.preventDefault();
        const invalidCount = validateOrderForm();
        if (invalidCount > 0) {
            hideSuccess();
            $error.text(`Заявка не отправлена: исправьте поля, отмеченные ошибкой (${invalidCount}).`).hide().removeClass('d-none').fadeIn(200);
            $form.find('.is-invalid:first').trigger('focus');
            return;
        }
        $error.addClass('d-none');
        const order = readOrder();
        saveLastOrder(order, showSuccess(order));
        renderLastOrder();
        app.clearCart();
        keepSuccess = true;
        $form[0].reset();
        keepSuccess = false;
    });

    $form.on('reset', function () {
        $.each(fields, function (key, $field) {
            jq.clearFieldState($field);
        });
        $error.addClass('d-none');
        app.clearCart();
        if (keepSuccess) {
            ui.addMessage.text('');
        } else {
            $success.addClass('d-none');
            ui.addMessage.removeClass('text-danger').text('Форма и состав заказа сброшены.');
        }
        window.setTimeout(function () {
            refreshOrderUi(0);
        }, 0);
    });

    $form.prop('noValidate', true);
    buildOrderUi();
    preselectItem();
    refreshOrderUi(0);

    ui.addButton.on('click', function () {
        hideSuccess();
        if (!validateField('qty')) {
            ui.addMessage.text('');
            fields.qty.trigger('focus');
            return;
        }
        const result = app.addToCart(fields.item.val(), Number(fields.qty.val()));
        ui.addMessage.text(result.message).toggleClass('text-danger', !result.ok);
    });

    ui.cartButton.on('click', app.openCart);

    ui.repeatButton.on('click', function () {
        const record = loadLastOrder();
        const result = app.addMany(record ? record.lines : []);
        const text = result.added === 0
            ? 'Не удалось добавить позиции: проверьте лимит количества в корзине.'
            : `Добавлено позиций в заказ: ${result.added}.${result.skipped > 0 ? ` Пропущено: ${result.skipped}.` : ''}`;
        ui.lastOrderMessage.text(text);
    });
    renderLastOrder();

    $(document).on('cart:changed', function () {
        updateDateLimits();
        updateSummary();
        if (fields.item.hasClass('is-invalid')) {
            validateField('item');
        }
        if (fields.date.val() !== '' && fields.date.hasClass('is-invalid')) {
            validateField('date');
        }
    });
});