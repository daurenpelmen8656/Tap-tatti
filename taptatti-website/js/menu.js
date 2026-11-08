'use strict';

(function () {
    const createEl = app.createEl;
    const menuGrid = document.getElementById('menu-grid');
    const menuNotice = document.getElementById('menu-notification');
    const ui = {};

    function getLeadLabel(days) {
        return days === 1 ? 'Готовим 1 день' : `Готовим ${days} дня`;
    }

    function getPriceSteps(list) {
        const prices = [];
        for (const item of list) {
            if (!prices.includes(item.price)) {
                prices.push(item.price);
            }
        }
        return prices.sort((a, b) => a - b);
    }

    function filterProducts(list, filters) {
        const text = filters.query.trim().toLowerCase();
        return list.filter(item => {
            const matchesText = text === '' || item.name.toLowerCase().includes(text);
            const matchesCategory = filters.category === 'all' || item.category === filters.category;
            const matchesPrice = item.price <= filters.maxPrice;
            const matchesLead = !filters.fastOnly || item.leadDays === 1;
            return matchesText && matchesCategory && matchesPrice && matchesLead;
        });
    }

    function sortProducts(list, mode) {
        const sorted = [...list];
        switch (mode) {
            case 'price-asc':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
                break;
            default:
                break;
        }
        return sorted;
    }

    function readFilters() {
        return {
            query: ui.search.value,
            category: ui.category.value,
            maxPrice: ui.price.value === 'all' ? Infinity : Number(ui.price.value),
            fastOnly: ui.fast.checked
        };
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
        const head = createEl('div', 'd-flex justify-content-between align-items-center mb-2');
        const price = createEl('span', 'fw-bold fs-5 text-brand', formatPrice(product.price));
        price.id = `price-${product.id}`;
        head.append(createEl('h2', 'h5 card-title m-0', product.name), price);

        const lead = createEl('p', 'small text-muted mb-3', getLeadLabel(product.leadDays));

        const orderLink = createEl('a', 'btn btn-outline-dark btn-sm w-100 order-btn', 'Перейти к заказу');
        orderLink.href = `order.html?item=${product.id}#order-form`;
        orderLink.id = `btn-order-${product.id}`;

        const addButton = createEl('button', 'btn btn-warning btn-sm w-100 mt-2 add-btn', 'В корзину');
        addButton.type = 'button';
        addButton.dataset.id = product.id;
        addButton.dataset.label = 'В корзину';

        body.append(head, lead, orderLink, addButton);
        card.append(body);
        column.append(card);
        return column;
    }

    function createControlGroup(columnClasses, labelText, control) {
        const column = createEl('div', columnClasses);
        const label = createEl('label', 'form-label fw-semibold', labelText);
        label.htmlFor = control.id;
        column.append(label, control);
        return column;
    }

    function createSelect(id, options) {
        const select = createEl('select', 'form-select');
        select.id = id;
        for (const [value, label] of options) {
            const option = createEl('option', '', label);
            option.value = value;
            select.append(option);
        }
        return select;
    }

    function buildMenuControls() {
        ui.search = createEl('input', 'form-control');
        ui.search.type = 'search';
        ui.search.id = 'menu-search';
        ui.search.placeholder = 'Например: медовый';
        ui.search.autocomplete = 'off';

        const categoryOptions = [['all', 'Все']];
        for (const key of Object.keys(categoryNames)) {
            categoryOptions.push([key, categoryNames[key]]);
        }
        ui.category = createSelect('menu-category', categoryOptions);
        ui.sort = createSelect('menu-sort', [
            ['default', 'По умолчанию'],
            ['price-asc', 'Сначала дешевле'],
            ['price-desc', 'Сначала дороже'],
            ['name', 'По названию']
        ]);

        const priceOptions = [['all', 'Любая']];
        for (const step of getPriceSteps(products)) {
            priceOptions.push([String(step), `до ${formatPrice(step)}`]);
        }
        ui.price = createSelect('menu-price', priceOptions);

        ui.fast = createEl('input', 'form-check-input');
        ui.fast.type = 'checkbox';
        ui.fast.id = 'menu-fast';

        ui.reset = createEl('button', 'btn btn-outline-secondary w-100', 'Сбросить');
        ui.reset.type = 'button';

        const topRow = createEl('div', 'row g-2 align-items-end mb-2');
        const resetColumn = createEl('div', 'col-12 col-md-2');
        resetColumn.append(ui.reset);
        topRow.append(
            createControlGroup('col-12 col-md-4', 'Поиск', ui.search),
            createControlGroup('col-6 col-md-3', 'Категория', ui.category),
            createControlGroup('col-6 col-md-3', 'Сортировка', ui.sort),
            resetColumn
        );

        const fastLabel = createEl('label', 'form-check-label', 'Можно получить уже завтра');
        fastLabel.htmlFor = ui.fast.id;
        const fastBox = createEl('div', 'form-check mb-2');
        fastBox.append(ui.fast, fastLabel);
        const fastColumn = createEl('div', 'col-12 col-md-6 d-flex align-items-end');
        fastColumn.append(fastBox);
        const bottomRow = createEl('div', 'row g-2 align-items-end mb-3');
        bottomRow.append(createControlGroup('col-12 col-md-4', 'Цена', ui.price), fastColumn);

        ui.count = createEl('p', 'text-muted mb-3');
        ui.count.setAttribute('aria-live', 'polite');

        ui.empty = createEl('div', 'alert alert-warning d-none');
        ui.emptyReset = createEl('button', 'btn btn-outline-dark btn-sm mt-2', 'Сбросить фильтры');
        ui.emptyReset.type = 'button';
        ui.empty.append(createEl('p', 'mb-0', 'По вашему запросу ничего не найдено. Измените слова поиска, цену или категорию.'), ui.emptyReset);

        menuGrid.before(topRow, bottomRow, ui.count, ui.empty);
    }

    function markCartCards() {
        for (const card of menuGrid.querySelectorAll('.card')) {
            const id = card.querySelector('.add-btn').dataset.id;
            card.classList.toggle('bg-warning-subtle', app.inCart(id));
        }
    }

    function renderMenu() {
        const visible = sortProducts(filterProducts(products, readFilters()), ui.sort.value);
        menuGrid.replaceChildren(...visible.map(createProductCard));
        ui.count.textContent = `Найдено: ${visible.length} из ${products.length}`;
        ui.empty.classList.toggle('d-none', visible.length > 0);
        markCartCards();
    }

    function showMenuNotice(text, ok) {
        menuNotice.textContent = text;
        menuNotice.classList.toggle('alert-info', ok);
        menuNotice.classList.toggle('alert-warning', !ok);
        menuNotice.classList.remove('d-none');
    }

    function resetMenu() {
        ui.search.value = '';
        ui.category.value = 'all';
        ui.sort.value = 'default';
        ui.price.value = 'all';
        ui.fast.checked = false;
        menuNotice.classList.add('d-none');
        renderMenu();
        ui.search.focus();
    }

    function handleMenuClick(event) {
        const button = event.target.closest('button[data-id]');
        if (button === null) {
            return;
        }
        const result = app.addToCart(button.dataset.id, 1);
        showMenuNotice(result.message, result.ok);
        if (result.ok) {
            app.flashButton(button, 'Добавлено ✓');
        }
    }

    buildMenuControls();
    renderMenu();

    ui.search.addEventListener('input', renderMenu);
    ui.search.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            ui.search.value = '';
            renderMenu();
        }
    });
    for (const control of [ui.category, ui.sort, ui.price, ui.fast]) {
        control.addEventListener('change', renderMenu);
    }
    ui.reset.addEventListener('click', resetMenu);
    ui.emptyReset.addEventListener('click', resetMenu);
    menuGrid.addEventListener('click', handleMenuClick);
    document.addEventListener('cart:changed', markCartCards);
})();