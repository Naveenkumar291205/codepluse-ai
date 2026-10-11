"""
Tests for the sample e-commerce pricing module.
"""
import pytest
from ecommerce.pricing import (
    calculate_price,
    apply_discount,
    calculate_tax,
    generate_invoice,
    format_currency,
    notify_customer,
    process_order,
)


class TestCalculatePrice:
    def test_basic_multiplication(self):
        assert calculate_price(10.0, 3) == 30.0

    def test_zero_quantity(self):
        assert calculate_price(100.0, 0) == 0.0

    def test_negative_price_raises(self):
        with pytest.raises(ValueError):
            calculate_price(-5.0, 1)

    def test_negative_quantity_raises(self):
        with pytest.raises(ValueError):
            calculate_price(10.0, -1)

    def test_decimal_price(self):
        result = calculate_price(9.99, 2)
        assert abs(result - 19.98) < 0.001


class TestApplyDiscount:
    def test_ten_percent_discount(self):
        result = apply_discount(100.0, 0.1)
        assert result == 90.0

    def test_no_discount(self):
        assert apply_discount(100.0, 0.0) == 100.0

    def test_full_discount(self):
        assert apply_discount(100.0, 1.0) == 0.0

    def test_invalid_discount_raises(self):
        with pytest.raises(ValueError):
            apply_discount(100.0, 1.5)

    def test_negative_discount_raises(self):
        with pytest.raises(ValueError):
            apply_discount(100.0, -0.1)


class TestCalculateTax:
    def test_default_tax_rate(self):
        tax = calculate_tax(100.0)
        assert tax == 18.0

    def test_custom_tax_rate(self):
        tax = calculate_tax(100.0, 0.05)
        assert tax == 5.0

    def test_zero_amount(self):
        assert calculate_tax(0.0) == 0.0


class TestGenerateInvoice:
    def test_basic_invoice(self):
        items = [{"name": "Widget", "price": 10.0, "quantity": 5}]
        invoice = generate_invoice("CUST001", items)
        assert invoice["subtotal"] == 50.0
        assert invoice["customer_id"] == "CUST001"

    def test_invoice_with_discount(self):
        items = [{"name": "Widget", "price": 100.0, "quantity": 1}]
        invoice = generate_invoice("CUST002", items, discount_rate=0.1)
        assert invoice["discount_amount"] == 10.0
        assert invoice["subtotal"] == 100.0

    def test_invoice_with_tax(self):
        items = [{"name": "Widget", "price": 100.0, "quantity": 1}]
        invoice = generate_invoice("CUST003", items, apply_tax=True)
        assert invoice["tax_amount"] == 18.0
        assert invoice["grand_total"] == 118.0

    def test_invoice_without_tax(self):
        items = [{"name": "Widget", "price": 100.0, "quantity": 1}]
        invoice = generate_invoice("CUST004", items, apply_tax=False)
        assert invoice["tax_amount"] == 0.0

    def test_empty_items(self):
        invoice = generate_invoice("CUST005", [])
        assert invoice["subtotal"] == 0.0
        assert invoice["grand_total"] == 0.0


class TestProcessOrder:
    def test_basic_order(self):
        items = [{"name": "Item", "price": 50.0, "quantity": 2}]
        result = process_order("CUST001", items)
        assert result["order_status"] == "confirmed"
        assert "invoice" in result

    def test_order_with_discount_code(self):
        items = [{"name": "Item", "price": 100.0, "quantity": 1}]
        result = process_order("CUST002", items, discount_code="SAVE10")
        assert result["invoice"]["discount_amount"] > 0

    def test_order_without_discount(self):
        items = [{"name": "Item", "price": 100.0, "quantity": 1}]
        result = process_order("CUST003", items)
        assert result["invoice"]["discount_amount"] == 0.0
