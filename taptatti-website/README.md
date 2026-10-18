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

# Кондитерская Тап Тәтті — Assignment 4–5

## Коррекции midterm
Нет. В HTML добавлены только `<script src="js/... " defer>`. CSS не менялся. В `custom-cakes.html` подключены только `data.js` и `main.js` (общая корзина); его встроенный скрипт переключения полей оставлен как был.

## Functionality Plan

| Страница | Цель посетителя | Функция | Результат | Ответственный |
|---|---|---|---|---|
| menu.html | Найти десерт | Поиск + категория + сортировка + сброс | Карточки из массива, счётчик, пустое состояние | Alizhan R. |
| menu.html | Выбрать десерт | Кнопка «В корзину» + ссылка «Перейти к заказу» | Сообщение о добавлении, счётчик корзины | Alizhan R. |
| order.html | Оформить заявку | Форма с валидацией 8 полей | Ошибки у полей, фокус на первом, сводка + временный номер | Alizhan R. |
| order.html | Узнать стоимость | Живой расчёт: десерты, упаковка, доставка | Итог пересчитывается при каждом изменении | Alizhan R. |
| index.html | Выбрать, что попробовать | «Попробуйте сегодня» (Math.random) | Случайный десерт, заказ или добавление в корзину | Alizhan R. |
| Все страницы | Собрать заказ | Корзина в модальном окне (общая) | +/−, удалить, очистить, итог, демо-номер | Команда |

Логин, регистрация и бронирование не нужны для этого сайта. Отзывов на сайте нет, модуль не добавлялся.

## Данные и правила
- 9 десертов в `js/data.js` (id, name, price, category, image, alt, bestseller, leadDays). Цены совпадают с midterm.
- Доставка по городу бесплатна от 10 000 ₸ (как на главной), иначе 1 500 ₸. Упаковка 500 ₸. До 10 шт. одного десерта.
- Торты готовятся минимум 1 день (2 дня для «Таңқурай нәзіктігі»); заявки не дальше чем на 60 дней вперёд. Суммы доставки, упаковки и сроки — демонстрационные значения для проекта.
- Все подтверждения: данные не отправляются на сервер, заказ и оплата не создаются. Номер TT-xxxxxx временный.
- В localStorage хранится только корзина (id и количество).

## JavaScript checklist

| Требование | Файл:строка |
|---|---|
| `defer`, `'use strict'` | подключение в HTML; первая строка каждого файла |
| Массив из 9 объектов, 8 свойств | data.js:13 |
| Цикл `for...of` | main.js:56 (`calcCart`), order.js:188 (`validateOrderForm`) |
| filter / find / map / reduce-подобное суммирование | menu.js:7 (filter), menu.js:12 (sort), main.js:52 (итог), data.js:25 (`findProduct`, find) |
| Функции с параметрами и return | data.js:33, 40; menu.js:7, 12; main.js:52 |
| Одна функция вызывает другую | data.js:40 (`calcOrderTotal` → `calcDelivery`) |
| Арифметика | data.js:41–44; main.js:61–63 |
| if/else, switch | order.js:50–62; menu.js:14; order.js:132; main.js:240 |
| `&&`, `\|\|`, `!` | menu.js:9; order.js:70; order.js:234 |
| `===` и `!==` | menu.js:9; main.js:58; order.js:114 |
| Math.random() | main.js:19 (временный номер); index.js:7, 68 («Попробуйте сегодня») |
| Рендер карточек одной функцией | menu.js:30 (`createProductCard`), menu.js:129 (`renderMenu`) |
| Поиск / фильтр / сортировка, счётчик, пусто, сброс | menu.js:7, 12, 129, 143 |
| Корзина: add / ± / remove / clear, итоги, пусто, disabled | main.js:79–140, 150, 172 |
| Валидация (имя, телефон, почта, количество, дата + срок десерта, адрес курьера) | order.js:50–128, 130 |
| Ошибки у полей, фокус на первом, очистка старых | order.js:154–200, 341–352 |
| Сводка + «данные не отправляются» | order.js:281 |
| События submit / click / input / change / keydown / reset | order.js:388–391; menu.js:167–178; main.js:325–333 |
| `textContent`, без `innerHTML` | весь код (`createEl` в main.js:7) |

## AI log
| Инструмент | Запрос | Что получено | Что проверено вручную |
|---|---|---|---|
| Claude | Обьяснить JS для меню, заказа и корзины без изменения HTML/CSS |

