'use strict';

$(function () {
    function updateDeliveryVisibility() {
        const courier = $('input[name="custom-deltype"]:checked').val() === 'courier';
        $('#custom-delivery-address-group').toggleClass('d-none', !courier);
        $('#custom-pickup-location-group').toggleClass('d-none', courier);
    }

    function updatePaymentVisibility() {
        const card = $('input[name="custom-paymethod"]:checked').val() === 'card';
        $('#custom-card-input-group').toggleClass('d-none', !card);
    }

    $('input[name="custom-deltype"]').on('change', updateDeliveryVisibility);
    $('input[name="custom-paymethod"]').on('change', updatePaymentVisibility);

    updateDeliveryVisibility();
    updatePaymentVisibility();
});