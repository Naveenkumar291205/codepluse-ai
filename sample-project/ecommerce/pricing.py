"""
Sample e-commerce module for CodePulse AI demonstration.
This module demonstrates a realistic function dependency chain.
"""


def calculate_price(price: float, quantity: int) -> float:
    """
    Calculate the base total price for a quantity of items.
    
    Args:
        price: Unit price of the item
        quantity: Number of items
        
    Returns:
        Total price before discounts or taxes
    """
    if price < 0:
        raise ValueError("Price cannot be negative")
    if quantity < 0:
        raise ValueError("Quantity cannot be negative")
    return price * quantity


def apply_discount(total: float, discount_rate: float) -> float:
    """
    Apply a percentage discount to a total amount.
    
    Args:
        total: Total amount before discount
        discount_rate: Discount as a decimal (e.g., 0.1 for 10%)
        
    Returns:
        Discounted total
    """
    if not 0 <= discount_rate <= 1:
        raise ValueError("Discount rate must be between 0 and 1")
    return total * (1 - discount_rate)


def calculate_tax(amount: float, tax_rate: float = 0.18) -> float:
    """
    Calculate tax amount for a given total.
    
    Args:
        amount: Pre-tax amount
        tax_rate: Tax rate as a decimal (default 18%)
        
    Returns:
        Tax amount to be added
    """
    return amount * tax_rate


def generate_invoice(
    customer_id: str,
    items: list,
    discount_rate: float = 0.0,
    apply_tax: bool = True,
) -> dict:
    """
    Generate a complete invoice for a customer.
    
    This function calls:
    - calculate_price()
    - apply_discount()
    - calculate_tax()
    
    Args:
        customer_id: Unique identifier for the customer
        items: List of dicts with 'price' and 'quantity' keys
        discount_rate: Optional discount (0.0 to 1.0)
        apply_tax: Whether to add GST
        
    Returns:
        Invoice dictionary with all pricing details
    """
    subtotal = 0.0
    line_items = []

    for item in items:
        item_total = calculate_price(item["price"], item["quantity"])
        subtotal += item_total
        line_items.append({
            "name": item.get("name", "Item"),
            "price": item["price"],
            "quantity": item["quantity"],
            "total": item_total,
        })

    discounted = apply_discount(subtotal, discount_rate) if discount_rate > 0 else subtotal
    tax_amount = calculate_tax(discounted) if apply_tax else 0.0
    grand_total = discounted + tax_amount

    return {
        "customer_id": customer_id,
        "line_items": line_items,
        "subtotal": round(subtotal, 2),
        "discount_amount": round(subtotal - discounted, 2),
        "tax_amount": round(tax_amount, 2),
        "grand_total": round(grand_total, 2),
    }


def format_currency(amount: float, currency: str = "INR") -> str:
    """Format a numeric amount as currency string."""
    symbol = {"INR": "₹", "USD": "$", "EUR": "€"}.get(currency, currency)
    return f"{symbol}{amount:,.2f}"


def send_email(recipient: str, subject: str, body: str) -> bool:
    """
    Send an email notification.
    
    Args:
        recipient: Email address of the recipient
        subject: Email subject line
        body: Email body text
        
    Returns:
        True if sent successfully
    """
    # Placeholder: would integrate with email service
    print(f"Email to {recipient}: {subject}")
    return True


def notify_customer(customer_id: str, invoice: dict) -> bool:
    """
    Send an invoice notification to the customer.
    
    Calls: generate_invoice (indirectly via invoice dict), send_email, format_currency
    
    Args:
        customer_id: Customer identifier
        invoice: Invoice dictionary from generate_invoice()
        
    Returns:
        True if notification was sent successfully
    """
    amount_str = format_currency(invoice.get("grand_total", 0))
    subject = f"Your invoice is ready - Total: {amount_str}"
    body = (
        f"Dear Customer {customer_id},\n\n"
        f"Your invoice has been generated.\n"
        f"Total amount: {amount_str}\n\n"
        f"Thank you for your business."
    )
    return send_email(customer_id, subject, body)


def process_order(customer_id: str, cart_items: list, discount_code: str = None) -> dict:
    """
    Process a complete customer order end-to-end.
    
    This is the top-level orchestrator that calls:
    - generate_invoice()
    - notify_customer()
    
    Args:
        customer_id: Customer identifier
        cart_items: List of cart items
        discount_code: Optional discount code
        
    Returns:
        Order confirmation with invoice details
    """
    discount_rate = 0.1 if discount_code == "SAVE10" else 0.0

    invoice = generate_invoice(customer_id, cart_items, discount_rate=discount_rate)
    notification_sent = notify_customer(customer_id, invoice)

    return {
        "order_status": "confirmed",
        "invoice": invoice,
        "notification_sent": notification_sent,
    }
