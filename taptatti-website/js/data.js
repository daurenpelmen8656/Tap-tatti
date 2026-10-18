'use strict';

const MAX_QTY = 10;
const PACK_PRICE = 500;
const DELIVERY_PRICE = 1500;
const FREE_DELIVERY_FROM = 10000;

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

function calcOrderTotal(product, qty, packed, courier) {
    const subtotal = product.price * qty;
    const packing = packed ? PACK_PRICE : 0;
    const delivery = courier ? calcDelivery(subtotal) : 0;
    return { subtotal, packing, delivery, total: subtotal + packing + delivery };
}
