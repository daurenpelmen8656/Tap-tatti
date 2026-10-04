# Tap Tatti Bakery Website

This repository contains Assignment 1 for the Introduction to Web Technologies course.

## Author
Alizhan R.

## Organization
Tap Tatti Bakery (Astana, Kazakhstan)

## Files Included
- `index.html` - Main landing page with bakery background and quote
- `menu.html` - Product catalog and real prices table
- `custom-cakes.html` - Showcase of bespoke and custom cake options
- `order.html` - Cake order form with full input field set
- `checklist.txt` - Complete checklist of required HTML tags with line numbers
- `ai-log.txt` - Log of AI assistance
## Stylesheets
* `css/base.css` — Core base styles, typography resets, and global layout standards.
* `css/alizhan.css` — Custom styling, Flexbox/Grid layouts, positioning rules, and media adjustments.
## Design Sketches & Screenshots
* `Index Page Wireframe: design/sketch_index.jpg`
* `Menu Page Wireframe: design/sketch_menu.jpg`

## User Journeys (Сценарии использования)

### Scenario 1: Быстрый заказ из каталога
1. Пользователь заходит на главную страницу (`index.html`) и нажимает кнопку перехода в меню.
2. Переходит на страницу «Меню» (`menu.html`), просматривает каталог сладостей и таблицу с ценами.
3. Нажимает кнопку «Перейти к заказу» под понравившимся тортом.
4. Переходит на форму заказа в `order.html` по якорной ссылке (`#order-form`).
5. Заполняет имя, телефон, адрес доставки и отправляет форму.

### Scenario 2: Расчет и заказ индивидуального торта
1. Пользователь переходит на страницу «Торты на заказ» (`custom-cakes.html`).
2. Ознакамливается с примерами эксклюзивных работ и вариантами декорирования.
3. Заполняет форму спецзаказа (выбирает количество ярусов, начинку, нужную дату и пишет комментарий к оформлению).
4. Видит блок-подтверждение (`#custom-calc-result`) с уведомлением о том, что менеджер свяжется для уточнения деталей в течение 15 минут.

### Scenario 3: Навигация по сайту и поиск контактов
1. Пользователь заходит на `index.html` для ознакомления с кондитерской "Тап Тәтті".
2. Использует сквозное верхнее меню (Header) для свободного перемещения между всеми 4 страницами без «битых» ссылок.
3. Проверяет контакты пекарни в Астане, график работы и ссылки на социальные сети в едином футере (Footer) на любой из страниц.