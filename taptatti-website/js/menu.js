'use strict';

const menuGrid = document.getElementById('menu-grid');
const menuNotice = document.getElementById('menu-notification');
const menuUi = {};

function filterProducts(list, query, category) {
    const text = query.trim().toLowerCase();
    return list.filter(item => (category === 'all' || item.category === category) && (text === '' || item.name.toLowerCase().includes(text)));
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
    menuUi.search = createEl('input', 'form-control');
    menuUi.search.type = 'search';
    menuUi.search.id = 'menu-search';
    menuUi.search.placeholder = 'Например: медовый';
    menuUi.search.autocomplete = 'off';

    const categoryOptions = [['all', 'Все']];
    for (const key of Object.keys(categoryNames)) {
        categoryOptions.push([key, categoryNames[key]]);
    }
    menuUi.category = createSelect('menu-category', categoryOptions);
    menuUi.sort = createSelect('menu-sort', [
        ['default', 'По умолчанию'],
        ['price-asc', 'Сначала дешевле'],
        ['price-desc', 'Сначала дороже'],
        ['name', 'По названию']
    ]);

    menuUi.reset = createEl('button', 'btn btn-outline-secondary w-100', 'Сбросить');
    menuUi.reset.type = 'button';

    const controls = createEl('div', 'row g-2 align-items-end mb-3');
    const resetColumn = createEl('div', 'col-12 col-md-2');
    resetColumn.append(menuUi.reset);
    controls.append(
        createControlGroup('col-12 col-md-4', 'Поиск', menuUi.search),
        createControlGroup('col-6 col-md-3', 'Категория', menuUi.category),
        createControlGroup('col-6 col-md-3', 'Сортировка', menuUi.sort),
        resetColumn
    );

    menuUi.count = createEl('p', 'text-muted mb-3');
    menuUi.count.setAttribute('aria-live', 'polite');

    menuUi.empty = createEl('div', 'alert alert-warning d-none');
    menuUi.emptyReset = createEl('button', 'btn btn-outline-dark btn-sm mt-2', 'Сбросить фильтры');
    menuUi.emptyReset.type = 'button';
    menuUi.empty.append(createEl('p', 'mb-0', 'По вашему запросу ничего не найдено. Измените слова поиска или выберите другую категорию.'), menuUi.emptyReset);

    menuGrid.before(controls, menuUi.count, menuUi.empty);
}

function renderMenu() {
    const visible = sortProducts(filterProducts(products, menuUi.search.value, menuUi.category.value), menuUi.sort.value);
    menuGrid.replaceChildren(...visible.map(createProductCard));
    menuUi.count.textContent = `Найдено: ${visible.length} из ${products.length}`;
    menuUi.empty.classList.toggle('d-none', visible.length > 0);
}

function showMenuNotice(text, ok) {
    menuNotice.textContent = text;
    menuNotice.classList.toggle('alert-info', ok);
    menuNotice.classList.toggle('alert-warning', !ok);
    menuNotice.classList.remove('d-none');
}

function resetMenu() {
    menuUi.search.value = '';
    menuUi.category.value = 'all';
    menuUi.sort.value = 'default';
    menuNotice.classList.add('d-none');
    renderMenu();
    menuUi.search.focus();
}

function handleMenuClick(event) {
    const button = event.target.closest('button[data-id]');
    if (button === null) {
        return;
    }
    const result = addToCart(button.dataset.id, 1);
    showMenuNotice(result.message, result.ok);
    if (result.ok) {
        flashButton(button, 'Добавлено ✓');
    }
}

function initMenuPage() {
    buildMenuControls();
    renderMenu();
    menuUi.search.addEventListener('input', renderMenu);
    menuUi.search.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            menuUi.search.value = '';
            renderMenu();
        }
    });
    menuUi.category.addEventListener('change', renderMenu);
    menuUi.sort.addEventListener('change', renderMenu);
    menuUi.reset.addEventListener('click', resetMenu);
    menuUi.emptyReset.addEventListener('click', resetMenu);
    menuGrid.addEventListener('click', handleMenuClick);
}

initMenuPage();
