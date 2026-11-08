'use strict';

(function () {
    
    const FILLINGS = [
        { id: 'honey', name: 'Медово-карамельная', pricePerKg: 5500 },
        { id: 'berry', name: 'Ягодный мусс', pricePerKg: 6500 },
        { id: 'chocolate', name: 'Тёмный шоколад', pricePerKg: 6000 },
        { id: 'pistachio-raspberry', name: 'Фисташка-малина', pricePerKg: 8000 },
        { id: 'vanilla-strawberry', name: 'Ваниль-клубника', pricePerKg: 7000 },
        { id: 'red-velvet', name: 'Красный бархат', pricePerKg: 6500 }
    ];

    const TIERS = [
        { id: '1', title: '1 ярус', label: '1 ярус (до 4 кг)', minKg: 2, maxKg: 4, surcharge: 0 },
        { id: '2', title: '2 яруса', label: '2 яруса (от 4 до 7 кг)', minKg: 4, maxKg: 7, surcharge: 3000 },
        { id: '3', title: '3 яруса', label: '3 яруса (от 7 до 12 кг)', minKg: 7, maxKg: 12, surcharge: 7000 },
        { id: '4', title: '4 яруса и более', label: '4 яруса и более (от 12 кг, для свадеб)', minKg: 12, maxKg: 20, surcharge: 12000 }
    ];

    const RULES = {
        minDaysAhead: 2,      
        rushDays: 3,          
        rushRate: 0.2,
        maxDaysAhead: 90,
        discountFrom: 40000,  
        discountRate: 0.05,
        topperPrice: 1500,
        notesLimit: 300,
        weightStep: 0.5
    };

    // ключ поля -> id в HTML
    const FIELD_IDS = {
        name: 'client-name',
        phone: 'client-phone',
        email: 'client-email',
        date: 'event-date',
        weight: 'cake-weight',
        filling: 'filling-select',
        tier: 'tier-select',
        design: 'design-descr',
        address: 'custom-delivery-address',
        cardNumber: 'custom-card-number'
    };

    const SUBMIT_KEYS = ['name', 'phone', 'email', 'date', 'weight', 'tier', 'design', 'address', 'cardNumber'];
    const TEXT_KEYS = ['name', 'phone', 'email', 'design', 'address'];

    const form = document.getElementById('custom-cake-form');
    if (form === null) {
        return;
    }

    const fields = {};
    for (const key of Object.keys(FIELD_IDS)) {
        fields[key] = document.getElementById(FIELD_IDS[key]);
    }
    const topperBox = document.getElementById('custom-topper');
    const packBox = document.getElementById('custom-pack');
    const pickupGroup = document.getElementById('custom-pickup-location-group');
    const deliveryGroup = document.getElementById('custom-delivery-address-group');
    const cardGroup = document.getElementById('custom-card-input-group');
    const pickupSelect = document.getElementById('custom-pickup-address');
    const resultBox = document.getElementById('custom-calc-result');
    const errorBox = document.getElementById('custom-error-message');
    const ui = {};
    let keepResult = false;

    // ===== Вспомогательные функции: дата, элементы, списки =====
    function createEl(tag, classNames, text) {
        const element = document.createElement(tag);
        if (classNames) {
            element.className = classNames;
        }
        if (text !== undefined) {
            element.textContent = text;
        }
        return element;
    }

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

    function formatDateRu(date) {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Сколько полных дней от сегодня до выбранной даты; null, если даты нет или она некорректна.
    function getDaysAhead(value) {
        if (value === '') {
            return null;
        }
        const chosen = new Date(`${value}T00:00:00`);
        if (Number.isNaN(chosen.getTime())) {
            return null;
        }
        return Math.round((chosen - startOfToday()) / 86400000);
    }

    function findById(list, id) {
        return list.find(item => item.id === id);
    }

    function roundToHundreds(value) {
        return Math.round(value / 100) * 100;
    }

    function isCourier() {
        return form.elements['custom-deltype'].value === 'courier';
    }

    function isCard() {
        return form.elements['custom-paymethod'].value === 'card';
    }

    function isKeyActive(key) {
        if (key === 'address') {
            return isCourier();
        }
        if (key === 'cardNumber') {
            return isCard();
        }
        return true;
    }

    function findFieldKey(element) {
        return Object.keys(fields).find(key => fields[key] === element);
    }

    // Строит <option> из массива данных. Вызывается дважды: для начинок и для ярусов.
    function fillSelect(select, items, getLabel) {
        const options = items.map(function (item, index) {
            const option = createEl('option', '', getLabel(item));
            option.value = item.id;
            option.defaultSelected = index === 0;
            return option;
        });
        select.replaceChildren(...options);
        select.value = items[0].id;
    }

    // ===== Проверки полей: каждая возвращает текст ошибки или '' =====
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

    function validateDate(value) {
        if (value === '') {
            return 'Укажите дату мероприятия.';
        }
        const daysAhead = getDaysAhead(value);
        if (daysAhead === null) {
            return 'Некорректная дата.';
        }
        if (daysAhead < 0) {
            return 'Нельзя выбрать прошедшую дату.';
        }
        if (daysAhead < RULES.minDaysAhead) {
            const earliest = addDays(startOfToday(), RULES.minDaysAhead);
            return `Индивидуальный торт готовится минимум ${RULES.minDaysAhead} дня — выберите дату не раньше ${formatDateRu(earliest)}.`;
        }
        if (daysAhead > RULES.maxDaysAhead) {
            return `Принимаем заявки не дальше чем на ${RULES.maxDaysAhead} дней вперёд.`;
        }
        return '';
    }

    function validateWeight(value) {
        if (value.trim() === '') {
            return 'Укажите примерный вес.';
        }
        const weight = Number(value);
        const minKg = TIERS[0].minKg;
        const maxKg = TIERS[TIERS.length - 1].maxKg;
        if (!Number.isFinite(weight) || weight < minKg || weight > maxKg) {
            return `Вес — число от ${minKg} до ${maxKg} кг.`;
        }
        if (!Number.isInteger(weight / RULES.weightStep)) {
            return 'Вес указывается с шагом 0,5 кг.';
        }
        return '';
    }

    function validateTier(weightValue, tierId) {
        if (validateWeight(weightValue) !== '') {
            return '';
        }
        const tier = findById(TIERS, tierId);
        const weight = Number(weightValue);
        if (tier !== undefined && (weight < tier.minKg || weight > tier.maxKg)) {
            return `Для варианта «${tier.title}» вес должен быть от ${tier.minKg} до ${tier.maxKg} кг. Измените вес или число ярусов.`;
        }
        return '';
    }

    function validateDesign(value, topperChecked) {
        const text = value.trim();
        if (topperChecked && text === '') {
            return 'Для топпера напишите надпись в пожеланиях.';
        }
        if (value.length > RULES.notesLimit) {
            return `Пожелания не длиннее ${RULES.notesLimit} символов.`;
        }
        return '';
    }

    function validateAddress(value) {
        if (value.trim().length < 5) {
            return 'Укажите улицу, дом и квартиру (не короче 5 символов).';
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

    function formatCardNumber(value) {
        return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    function getFieldError(key) {
        const value = fields[key].value;
        switch (key) {
            case 'name':
                return validateName(value);
            case 'phone':
                return validatePhone(value);
            case 'email':
                return validateEmail(value);
            case 'date':
                return validateDate(value);
            case 'weight':
                return validateWeight(value);
            case 'tier':
                return validateTier(fields.weight.value, value);
            case 'design':
                return validateDesign(value, topperBox.checked);
            case 'address':
                return validateAddress(value);
            case 'cardNumber':
                return validateCardNumber(value);
            default:
                return '';
        }
    }

    function clearFieldState(field) {
        field.classList.remove('is-invalid', 'is-valid');
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
        const old = document.getElementById(`${field.id}-error`);
        if (old !== null) {
            old.remove();
        }
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
        setFieldState(fields[key], message);
        return message === '';
    }

    function trimTextFields() {
        for (const key of TEXT_KEYS) {
            fields[key].value = fields[key].value.trim();
        }
    }

    // Возвращает список полей с ошибками (пустой — всё верно).
    function validateForm() {
        const invalid = [];
        for (const key of SUBMIT_KEYS) {
            if (!isKeyActive(key)) {
                clearFieldState(fields[key]);
                continue;
            }
            if (!validateField(key)) {
                invalid.push(fields[key]);
            }
        }
        return invalid;
    }

    function calcCakeQuote(values) {
        const filling = findById(FILLINGS, values.fillingId);
        const tier = findById(TIERS, values.tierId);
        if (filling === undefined || tier === undefined || !Number.isFinite(values.weight)) {
            return null;
        }
        const base = values.weight * filling.pricePerKg;
        const topper = values.topper ? RULES.topperPrice : 0;
        const cakeSum = base + tier.surcharge + topper;
        const isRush = values.daysAhead !== null && values.daysAhead < RULES.rushDays;
        const rush = isRush ? roundToHundreds(cakeSum * RULES.rushRate) : 0;
        const discount = cakeSum >= RULES.discountFrom ? roundToHundreds(cakeSum * RULES.discountRate) : 0;
        const cakeTotal = cakeSum + rush - discount;
        const packing = values.pack ? PACK_PRICE : 0;
        const delivery = values.courier ? calcDelivery(cakeTotal) : 0;
        return {
            filling, tier, weight: values.weight, base, topper, rush, discount, packing, delivery,
            courier: values.courier, total: cakeTotal + packing + delivery
        };
    }

    function readValues() {
        const weightOk = validateWeight(fields.weight.value) === '';
        return {
            fillingId: fields.filling.value,
            tierId: fields.tier.value,
            weight: weightOk ? Number(fields.weight.value) : NaN,
            daysAhead: getDaysAhead(fields.date.value),
            topper: topperBox.checked,
            pack: packBox.checked,
            courier: isCourier()
        };
    }

    function createRow(label, value, bold) {
        const row = createEl('li', 'd-flex flex-wrap justify-content-between gap-2');
        if (bold) {
            row.classList.add('fw-bold', 'border-top', 'pt-2', 'mt-1');
        }
        row.append(createEl('span', '', label), createEl('span', 'text-end', value));
        return row;
    }

    function createQuoteRows(quote) {
        const rows = [
            createRow(`${quote.filling.name}, ${quote.weight} кг × ${formatPrice(quote.filling.pricePerKg)}`, formatPrice(quote.base), false)
        ];
        if (quote.tier.surcharge > 0) {
            rows.push(createRow(`Доплата за ярусность (${quote.tier.title})`, formatPrice(quote.tier.surcharge), false));
        }
        if (quote.topper > 0) {
            rows.push(createRow('Топпер с надписью', formatPrice(quote.topper), false));
        }
        if (quote.rush > 0) {
            rows.push(createRow(`Срочный заказ (менее ${RULES.rushDays} дней), +${RULES.rushRate * 100}%`, formatPrice(quote.rush), false));
        }
        if (quote.discount > 0) {
            rows.push(createRow(`Скидка ${RULES.discountRate * 100}% (заказ от ${formatPrice(RULES.discountFrom)})`, `−${formatPrice(quote.discount)}`, false));
        }
        if (quote.packing > 0) {
            rows.push(createRow('Подарочная упаковка', formatPrice(quote.packing), false));
        }
        if (quote.courier) {
            rows.push(createRow('Доставка', quote.delivery === 0 ? 'бесплатно' : formatPrice(quote.delivery), false));
        }
        rows.push(createRow('Итого', formatPrice(quote.total), true));
        return rows;
    }

    function updateEstimate() {
        const quote = calcCakeQuote(readValues());
        ui.estimateList.replaceChildren();
        if (quote === null) {
            ui.estimateList.append(createEl('li', 'text-muted', 'Укажите вес торта — стоимость рассчитается автоматически.'));
            return;
        }
        ui.estimateList.append(...createQuoteRows(quote));
    }

    function updateDeliveryGroups() {
        const courier = isCourier();
        pickupGroup.classList.toggle('d-none', courier);
        deliveryGroup.classList.toggle('d-none', !courier);
        if (!courier) {
            clearFieldState(fields.address);
        }
    }

    function updatePaymentGroup() {
        const card = isCard();
        cardGroup.classList.toggle('d-none', !card);
        if (!card) {
            fields.cardNumber.value = '';
            clearFieldState(fields.cardNumber);
        }
    }

    function updateDateLimits() {
        const today = startOfToday();
        fields.date.min = toInputDate(addDays(today, RULES.minDaysAhead));
        fields.date.max = toInputDate(addDays(today, RULES.maxDaysAhead));
    }

    function refreshUi() {
        updateDeliveryGroups();
        updatePaymentGroup();
        updateDateLimits();
        updateEstimate();
    }

    function createReference() {
        return `CK-${Math.floor(Math.random() * 900000) + 100000}`;
    }

    function hideResult() {
        resultBox.classList.add('d-none');
    }

    function getPaymentLabel() {
        return isCard() ? 'Банковская карта (данные карты не сохраняются)' : 'Kaspi QR / Kaspi Red';
    }

    function showResult(quote) {
        const place = quote.courier ? fields.address.value : pickupSelect.selectedOptions[0].textContent;
        const rows = [
            createRow('Имя', fields.name.value, false),
            createRow('Телефон', fields.phone.value, false),
            createRow('Почта', fields.email.value, false),
            createRow('Дата мероприятия', formatDateRu(new Date(`${fields.date.value}T00:00:00`)), false),
            createRow(quote.courier ? 'Адрес доставки' : 'Самовывоз', place, false),
            createRow('Способ оплаты', getPaymentLabel(), false)
        ];
        if (fields.design.value !== '') {
            rows.push(createRow('Пожелания к дизайну', fields.design.value, false));
        }
        const list = createEl('ul', 'list-unstyled mb-3');
        list.append(...rows, ...createQuoteRows(quote));

        resultBox.replaceChildren(
            createEl('h2', 'h5 alert-heading', 'Заявка на торт принята (демо)'),
            createEl('p', 'mb-2', `Временный номер: ${createReference()}`),
            list,
            createEl('p', 'small mb-0', 'Стоимость предварительная: шеф-кондитер уточнит дизайн и итоговую цену. Это учебная демонстрация: данные не отправляются на сервер, реальный заказ и оплата не создаются.')
        );
        resultBox.classList.remove('d-none');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function handleInput(event) {
        const field = event.target;
        const key = findFieldKey(field);
        hideResult();
        if (key === 'cardNumber') {
            field.value = formatCardNumber(field.value);
        }
        if (key !== undefined && field.classList.contains('is-invalid')) {
            validateField(key);
        }
        if (key === 'weight' && fields.tier.classList.contains('is-invalid')) {
            validateField('tier');
        }
        updateEstimate();
    }

    function handleChange(event) {
        const field = event.target;
        const key = findFieldKey(field);
        hideResult();
        if (field.name === 'custom-deltype') {
            updateDeliveryGroups();
        }
        if (field.name === 'custom-paymethod') {
            updatePaymentGroup();
        }
        if (field === topperBox && fields.design.classList.contains('is-invalid')) {
            validateField('design');
        }
        if (key === 'weight' || key === 'tier') {
            validateField('weight');
            validateField('tier');
        } else if (key !== undefined && key !== 'filling' && isKeyActive(key)) {
            validateField(key);
        }
        updateEstimate();
    }

    function handleSubmit(event) {
        event.preventDefault();
        trimTextFields();
        const invalid = validateForm();
        if (invalid.length > 0) {
            hideResult();
            errorBox.textContent = `Заявка не отправлена: исправьте поля, отмеченные ошибкой (${invalid.length}).`;
            errorBox.classList.remove('d-none');
            invalid[0].focus();
            return;
        }
        errorBox.classList.add('d-none');
        showResult(calcCakeQuote(readValues()));
        keepResult = true;
        form.reset();
        keepResult = false;
    }

    function handleReset() {
        for (const key of Object.keys(fields)) {
            clearFieldState(fields[key]);
        }
        errorBox.classList.add('d-none');
        if (!keepResult) {
            hideResult();
        }
        window.setTimeout(refreshUi, 0);
    }

    function buildEstimateUi() {
        ui.estimateList = createEl('ul', 'list-unstyled mb-0');
        const box = createEl('div', 'alert alert-secondary mb-4');
        box.setAttribute('role', 'status');
        box.append(
            createEl('h3', 'h6 fw-bold mb-2', 'Предварительный расчёт'),
            ui.estimateList,
            createEl('small', 'd-block text-muted mt-2', 'Итоговую стоимость подтвердит кондитер после уточнения дизайна.')
        );
        document.getElementById('custom-submit-btn').parentElement.before(box);
    }

    form.noValidate = true;
    fillSelect(fields.filling, FILLINGS, item => `${item.name} — ${formatPrice(item.pricePerKg)}/кг`);
    fillSelect(fields.tier, TIERS, item => item.label);
    fields.weight.step = String(RULES.weightStep);
    fields.cardNumber.maxLength = 19;
    buildEstimateUi();
    refreshUi();

    form.addEventListener('input', handleInput);
    form.addEventListener('change', handleChange);
    form.addEventListener('submit', handleSubmit);
    form.addEventListener('reset', handleReset);
})();