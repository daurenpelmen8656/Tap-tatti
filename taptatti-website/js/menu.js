'use strict';

$(function () {
    const createEl = app.createEl;
    const $grid = $('#menu-grid');
    const $notice = $('#menu-notification');
    const ui = {};

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

    // Было (old-js-version.js): document.createElement + classList.add + append в каждой строке, ~35 строк.
    // Стало: $('<div>') + .addClass() + .append()/.appendTo() цепочками, ~20 строк. Короче и читается
    // как дерево карточки сверху вниз; вспомогательная createEl скрывает повторяющиеся строки.
    function createProductCard(product) {
        const $image = createEl('img', 'card-img-top').attr({ src: product.image, alt: product.alt });
        const $card = createEl('div', 'card h-100 shadow-sm border-0');
        if (product.bestseller) {
            createEl('div', 'position-relative')
                .append($image, createEl('span', 'badge bg-danger position-absolute top-0 end-0 m-2', 'Хит продаж'))
                .appendTo($card);
        } else {
            $image.appendTo($card);
        }
        const $price = createEl('span', 'fw-bold fs-5 text-brand', formatPrice(product.price)).attr('id', `price-${product.id}`);
        const $head = createEl('div', 'd-flex justify-content-between align-items-center mb-3')
            .append(createEl('h2', 'h5 card-title m-0', product.name), $price);
        const $orderLink = createEl('a', 'btn btn-outline-dark btn-sm w-100 order-btn', 'Перейти к заказу')
            .attr({ href: `order.html?item=${product.id}#order-form`, id: `btn-order-${product.id}` });
        const $addButton = createEl('button', 'btn btn-warning btn-sm w-100 mt-2 add-btn', 'В корзину')
            .attr({ type: 'button', 'data-id': product.id });
        createEl('div', 'card-body d-flex flex-column justify-content-between')
            .append($head, $orderLink, $addButton)
            .appendTo($card);
        return createEl('div', 'col-12 col-md-6 col-lg-4').attr('id', `cake-card-${product.id}`).append($card);
    }

    function createControlGroup(columnClasses, labelText, $control) {
        return createEl('div', columnClasses).append(
            createEl('label', 'form-label fw-semibold', labelText).attr('for', $control.attr('id')),
            $control
        );
    }

    function createSelect(id, options) {
        const $select = createEl('select', 'form-select').attr('id', id);
        $.each(options, function (index, pair) {
            $('<option>').val(pair[0]).text(pair[1]).appendTo($select);
        });
        return $select;
    }

    function buildMenuControls() {
        ui.search = createEl('input', 'form-control').attr({ type: 'search', id: 'menu-search', placeholder: 'Например: медовый', autocomplete: 'off' });

        const categoryOptions = [['all', 'Все']];
        $.each(categoryNames, function (key, label) {
            categoryOptions.push([key, label]);
        });
        ui.category = createSelect('menu-category', categoryOptions);
        ui.sort = createSelect('menu-sort', [
            ['default', 'По умолчанию'],
            ['price-asc', 'Сначала дешевле'],
            ['price-desc', 'Сначала дороже'],
            ['name', 'По названию']
        ]);
        ui.reset = createEl('button', 'btn btn-outline-secondary w-100', 'Сбросить').attr('type', 'button');

        const $controls = createEl('div', 'row g-2 align-items-end mb-3').append(
            createControlGroup('col-12 col-md-4', 'Поиск', ui.search),
            createControlGroup('col-6 col-md-3', 'Категория', ui.category),
            createControlGroup('col-6 col-md-3', 'Сортировка', ui.sort),
            createEl('div', 'col-12 col-md-2').append(ui.reset)
        );

        ui.count = createEl('p', 'text-muted mb-3').attr('aria-live', 'polite');
        ui.emptyReset = createEl('button', 'btn btn-outline-dark btn-sm mt-2', 'Сбросить фильтры').attr('type', 'button');
        ui.empty = createEl('div', 'alert alert-warning d-none').append(
            createEl('p', 'mb-0', 'По вашему запросу ничего не найдено. Измените слова поиска или выберите другую категорию.'),
            ui.emptyReset
        );

        $grid.before($controls, ui.count, ui.empty);
    }

    function markCartCards() {
        $grid.find('.card').each(function () {
            const id = $(this).find('.add-btn').data('id');
            $(this).toggleClass('bg-warning-subtle', app.inCart(id));
        });
    }

    function renderMenu() {
        const visible = sortProducts(filterProducts(products, ui.search.val(), ui.category.val()), ui.sort.val());
        $grid.empty();
        $.each(visible, function (index, product) {
            createProductCard(product).hide().appendTo($grid).fadeIn(150);
        });
        ui.count.text(`Найдено: ${visible.length} из ${products.length}`);
        ui.empty.toggleClass('d-none', visible.length > 0);
        markCartCards();
    }

    // Цепочка из шести звеньев:
    // .text(text) — вставляет сообщение (как текст, без HTML);
    // .toggleClass('alert-info', ok) — синий стиль, если действие удалось;
    // .toggleClass('alert-warning', !ok) — жёлтый стиль, если не удалось;
    // .hide() — ставит inline display:none, чтобы fadeIn было с чего начинать;
    // .removeClass('d-none') — снимает класс «скрыто», который стоит в HTML;
    // .fadeIn(250) — плавно показывает сообщение за 250 мс.
    function showNotice(text, ok) {
        $notice.text(text).toggleClass('alert-info', ok).toggleClass('alert-warning', !ok).hide().removeClass('d-none').fadeIn(250);
    }

    function resetMenu() {
        ui.search.val('');
        ui.category.val('all');
        ui.sort.val('default');
        $notice.addClass('d-none');
        renderMenu();
        ui.search.trigger('focus');
    }

    buildMenuControls();
    renderMenu();

    ui.search.on('input', renderMenu);
    ui.search.on('keyup', function (event) {
        if (event.key === 'Escape') {
            $(this).val('');
            renderMenu();
        }
    });
    ui.category.add(ui.sort).on('change', renderMenu);
    ui.reset.add(ui.emptyReset).on('click', resetMenu);
    $(document).on('cart:changed', markCartCards);

    // Делегирование: обработчик стоит на #menu-grid, который есть при загрузке страницы,
    // а кнопки «В корзину» создаёт renderMenu при каждом поиске или сортировке.
    // Если привязать click прямо к .add-btn, то новые кнопки, созданные кодом после привязки,
    // обработчика не получили бы — событие ловит только родитель.
    $grid.on('click', '.add-btn', function () {
        const $button = $(this);
        const result = app.addToCart($button.data('id'), 1);
        showNotice(result.message, result.ok);
        if (result.ok) {
            app.flashButton($button, 'Добавлено ✓');
        }
    });
});