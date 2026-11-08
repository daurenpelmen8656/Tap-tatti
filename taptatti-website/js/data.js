'use strict';

const MAX_QTY = 10;
const PACK_PRICE = 500;
const DELIVERY_PRICE = 1500;
const FREE_DELIVERY_FROM = 10000;
const CUSTOM_LEAD_DAYS = 3;
const CUSTOM_MAX_DAYS = 120;
const TOPPER_PRICE = 1500;

const categoryNames = {
    cake: 'Торты',
    dessert: 'Десерты'
};

const products = [
    { id: 'balhadisha', name: '«Balhadisha» торты', price: 8000, category: 'cake', image: 'images/balhadisha.jpeg', alt: 'Balhadisha торты', bestseller: true, leadDays: 1 },
    { id: 'strawberry', name: 'Клубничный торт', price: 7000, category: 'cake', image: 'images/strawberry.jpg', alt: 'Клубничный торт', bestseller: false, leadDays: 1 },
    { id: 'tanqurai', name: '«Таңқурай нәзіктігі»', price: 10000, category: 'cake', image: 'images/strawberry2.jpeg', alt: 'Таңқурай нәзіктігі торты', bestseller: false, leadDays: 2 },
    { id: 'molochnaya', name: 'Молочная девочка', price: 8500, category: 'cake', image: 'images/molochnayadevochka.png', alt: 'Молочная девочка', bestseller: false, leadDays: 1 },
    { id: 'whoopie', name: 'Whoopie Pie', price: 8500, category: 'dessert', image: 'images/whoopiepie.png', alt: 'Whoopie Pie', bestseller: false, leadDays: 1 },
    { id: 'morkovnyi', name: 'Морковный торт', price: 8500, category: 'cake', image: 'images/morkovnyi-1.png', alt: 'Морковный торт', bestseller: false, leadDays: 1 },
    { id: 'medovyi', name: 'Медовый торт', price: 6700, category: 'cake', image: 'images/medovyi.png', alt: 'Медовый торт', bestseller: false, leadDays: 1 },
    { id: 'shpinatnyi', name: 'Шпинатный торт', price: 8500, category: 'cake', image: 'images/shpinatnyi.png', alt: 'Шпинатный торт', bestseller: false, leadDays: 1 },
    { id: 'tiramisu', name: 'Тирамису', price: 6500, category: 'dessert', image: 'images/tiramisu.png', alt: 'Тирамису', bestseller: false, leadDays: 1 }
];

const pickupPoints = [
    { id: 'tole-bi', address: 'ул. Толе би 16' },
    { id: 'mangilik-el', address: 'пр. Мангилик Ел 51' },
    { id: 'turan', address: 'пр. Туран 55' }
];

const payMethods = [
    { id: 'kaspi', name: 'Kaspi QR / Kaspi Red' },
    { id: 'card', name: 'Банковская карта' }
];

const customFillings = [
    { id: 'honey', name: 'Медово-карамельная', pricePerKg: 6500 },
    { id: 'berry', name: 'Ягодный мусс', pricePerKg: 7500 },
    { id: 'chocolate', name: 'Тёмный шоколад', pricePerKg: 7000 },
    { id: 'pistachio-raspberry', name: 'Фисташка-малина', pricePerKg: 9500 },
    { id: 'vanilla-strawberry', name: 'Ваниль-клубника', pricePerKg: 7000 },
    { id: 'red-velvet', name: 'Красный бархат', pricePerKg: 8000 }
];

const customTiers = [
    { tiers: 1, minKg: 2, maxKg: 4, fee: 0 },
    { tiers: 2, minKg: 4, maxKg: 7, fee: 3000 },
    { tiers: 3, minKg: 7, maxKg: 12, fee: 6000 },
    { tiers: 4, minKg: 12, maxKg: 20, fee: 10000 }
];

function findProduct(id) {
    return products.find(item => item.id === id);
}

function formatPrice(value) {
    return `${value.toLocaleString('ru-RU')} ₸`;
}

function calcDelivery(subtotal) {
    if (subtotal >= FREE_DELIVERY_FROM) {
        return 0;
    }
    return DELIVERY_PRICE;
}

function calcOrderTotal(subtotal, packed, courier) {
    const packing = packed ? PACK_PRICE : 0;
    const delivery = courier ? calcDelivery(subtotal) : 0;
    return { subtotal, packing, delivery, total: subtotal + packing + delivery };
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

function formatDate(date) {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getMaxLeadDays(items) {
    let days = 1;
    for (const item of items) {
        if (item.product.leadDays > days) {
            days = item.product.leadDays;
        }
    }
    return days;
}

function getEarliestDate(leadDays) {
    return addDays(startOfToday(), leadDays);
}

function findTierForWeight(weight) {
    return customTiers.find(item => weight >= item.minKg && weight <= item.maxKg);
}

function calcCustomCake(filling, weight, tier, topper, packed, courier) {
    const cake = filling.pricePerKg * weight;
    const topperPrice = topper ? TOPPER_PRICE : 0;
    const base = cake + tier.fee + topperPrice;
    const packing = packed ? PACK_PRICE : 0;
    const delivery = courier ? calcDelivery(base) : 0;
    return { cake, tierFee: tier.fee, topper: topperPrice, packing, delivery, total: base + packing + delivery };
}

const slowProducts = products.filter(item => item.leadDays > 1).map(item => item.name).join(', ');

const faqItems = [
    {
        question: 'Как оформить заказ?',
        answer: 'Добавьте десерты в корзину на странице «Меню» или в форме заказа, затем заполните контактные данные, дату получения и способ оплаты на странице «Заказ».'
    },
    {
        question: 'Сколько стоит доставка?',
        answer: `Курьерская доставка по городу стоит ${formatPrice(DELIVERY_PRICE)}, а при заказе от ${formatPrice(FREE_DELIVERY_FROM)} — бесплатно. Самовывоз бесплатный.`
    },
    {
        question: 'За сколько дней нужно заказывать?',
        answer: `Большинство десертов готовим за 1 день, а ${slowProducts} — за 2 дня. Индивидуальные торты — минимум за ${CUSTOM_LEAD_DAYS} дня.`
    },
    {
        question: 'Где можно забрать заказ?',
        answer: `Заказ можно забрать по адресам: ${pickupPoints.map(point => point.address).join('; ')}.`
    },
    {
        question: 'Какие способы оплаты доступны?',
        answer: `Доступны: ${payMethods.map(method => method.name).join(', ')}.`
    },
    {
        question: 'Сколько десертов можно заказать?',
        answer: `До ${MAX_QTY} штук каждого десерта. Несколько разных десертов можно собрать в одном заказе через корзину.`
    }
];