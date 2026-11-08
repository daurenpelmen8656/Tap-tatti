'use strict';

// jQuery 3.7.1 (CDN, подключён в HTML перед этим файлом). Нужен для страниц «Заказ», «Главная»
// и «Торты на заказ»: выбор элементов, обработчики .on(), эффекты и создание элементов.
// jq — общий объект для этих трёх страниц. Меню и корзина написаны на чистом JavaScript.
const jq = {};

$(function () {
    jq.createEl = function (tag, classNames, text) {
        const $element = $(`<${tag}>`);
        if (classNames) {
            $element.addClass(classNames);
        }
        if (text !== undefined) {
            $element.text(text);
        }
        return $element;
    };

    jq.validate = {
        name(value) {
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
        },
        phone(value) {
            const text = value.trim();
            if (text === '') {
                return 'Введите номер телефона.';
            }
            const digits = text.replace(/\D/g, '');
            if (!/^[\d\s()+-]+$/.test(text) || !/^[78]\d{10}$/.test(digits)) {
                return 'Введите номер в формате +7 (705) 755-19-10.';
            }
            return '';
        },
        email(value) {
            const text = value.trim();
            if (text === '') {
                return 'Введите электронную почту.';
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)) {
                return 'Введите почту в формате example@mail.com.';
            }
            return '';
        },
        address(value) {
            if (value.trim().length < 5) {
                return 'Укажите адрес доставки: улица и дом (не короче 5 символов).';
            }
            return '';
        },
        cardNumber(value) {
            const digits = value.replace(/\D/g, '');
            if (digits === '') {
                return 'Введите номер карты.';
            }
            if (digits.length !== 16) {
                return 'Номер карты состоит из 16 цифр.';
            }
            return '';
        }
    };

    jq.formatCardNumber = function (value) {
        return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    jq.clearFieldState = function ($field) {
        $field.removeClass('is-invalid is-valid').removeAttr('aria-invalid aria-describedby').siblings('.invalid-feedback').remove();
    };

    jq.setFieldState = function ($field, message) {
        jq.clearFieldState($field);
        if (message === '') {
            if ($field.val().trim() !== '') {
                $field.addClass('is-valid');
            }
            return;
        }
        const errorId = `${$field.attr('id')}-error`;
        $field.addClass('is-invalid').attr({ 'aria-invalid': 'true', 'aria-describedby': errorId });
        jq.createEl('div', 'invalid-feedback', message).attr('id', errorId).insertAfter($field);
    };

    jq.setVisible = function ($group, visible, speed) {
        $group.stop(true, true);
        if (visible) {
            $group.slideDown(speed);
        } else {
            $group.slideUp(speed);
        }
    };

    jq.createRow = function (label, value, bold) {
        const $row = jq.createEl('li', 'd-flex flex-wrap justify-content-between gap-2');
        if (bold) {
            $row.addClass('fw-bold border-top pt-2 mt-1');
        }
        return $row.append(jq.createEl('span', '', label), jq.createEl('span', 'text-end', value));
    };

    jq.showBlock = function ($block, speed) {
        $block.stop(true, true).hide().removeClass('d-none').fadeIn(speed);
    };
});