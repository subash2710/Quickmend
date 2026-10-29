from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db, socketio
from app.models.booking import Booking
from app.models.payment import Payment, ProviderEarning
from app.models.provider import ProviderProfile
from app.services.payment_service import create_paypal_order, capture_paypal_order
from app.services.notification_service import send_notification
from app.auth.helpers import role_required

payments_bp = Blueprint("payments", __name__)

PLATFORM_FEE_PERCENT = 10.0 # 10% platform commission fee

@payments_bp.route("/create", methods=["POST"])
@role_required("CUSTOMER")
def create_payment(current_user):
    data = request.get_json() or {}
    booking_id = data.get("booking_id")

    if not booking_id:
        return jsonify({"error": "booking_id is required"}), 400

    booking = Booking.query.get_or_404(booking_id)

    if booking.customer_id != current_user.id:
        return jsonify({"error": "Unauthorized payment attempt"}), 403

    amount = booking.total_amount

    # Create PayPal Sandbox order
    order_data = create_paypal_order(
        amount=amount,
        currency="INR",
        description=f"QuickMend {booking.service_ref.name if booking.service_ref else 'Service'} Booking #{booking.id}"
    )

    # Save initial Payment record in DB
    existing_payment = Payment.query.filter_by(booking_id=booking.id).first()
    if not existing_payment:
        pay_rec = Payment(
            booking_id=booking.id,
            customer_id=current_user.id,
            provider_id=booking.provider_id,
            amount=amount,
            currency="INR",
            paypal_order_id=order_data.get("order_id"),
            payment_status="PENDING"
        )
        db.session.add(pay_rec)
    else:
        existing_payment.paypal_order_id = order_data.get("order_id")
        existing_payment.amount = amount
        pay_rec = existing_payment

    db.session.commit()

    return jsonify({
        "order": order_data,
        "payment": pay_rec.to_dict()
    }), 200


@payments_bp.route("/capture", methods=["POST"])
@role_required("CUSTOMER")
def capture_payment(current_user):
    data = request.get_json() or {}
    booking_id = data.get("booking_id")
    paypal_order_id = data.get("paypal_order_id")

    if not booking_id or not paypal_order_id:
        return jsonify({"error": "booking_id and paypal_order_id are required"}), 400

    booking = Booking.query.get_or_404(booking_id)
    payment = Payment.query.filter_by(booking_id=booking_id).first()

    if booking.customer_id != current_user.id:
        return jsonify({"error": "Unauthorized payment attempt"}), 403

    if payment and payment.payment_status == "COMPLETED":
        return jsonify({
            "message": "Payment was already captured.",
            "booking": booking.to_dict(),
            "payment": payment.to_dict()
        }), 200

    if not payment:
        payment = Payment(
            booking_id=booking.id,
            customer_id=current_user.id,
            provider_id=booking.provider_id,
            amount=booking.total_amount,
            currency="INR",
            paypal_order_id=paypal_order_id,
            payment_status="PENDING"
        )
        db.session.add(payment)

    # Capture order via PayPal API or Demo fallback
    capture_res = capture_paypal_order(paypal_order_id)

    if capture_res.get("success"):
        payment.paypal_transaction_id = capture_res.get("transaction_id")
        payment.payment_status = "COMPLETED"
        payment.completed_at = datetime.utcnow()

        booking.status = "PAYMENT_COMPLETED"

        # Calculate provider earnings & platform fee
        gross = booking.total_amount
        fee = round(gross * (PLATFORM_FEE_PERCENT / 100.0), 2)
        net = round(gross - fee, 2)

        earning = ProviderEarning.query.filter_by(booking_id=booking.id).first()
        if not earning:
            earning = ProviderEarning(
                provider_id=booking.provider_id,
                booking_id=booking.id,
                gross_amount=gross,
                platform_fee=fee,
                net_amount=net,
                payment_status="COMPLETED"
            )
            db.session.add(earning)

        # Set provider status back to AVAILABLE if ON_DUTY
        if booking.provider_user and booking.provider_user.provider_profile:
            prov = booking.provider_user.provider_profile
            if prov.duty_status == "ON_DUTY":
                prov.availability_status = "AVAILABLE"

        db.session.commit()

        # Send Notifications & Socket Events
        send_notification(
            user_id=current_user.id,
            notif_type="PAYMENT_SUCCESS",
            title="Payment Successful!",
            message=f"Payment of ₹{gross:.2f} received. Thank you!",
            booking_id=booking.id
        )

        if booking.provider_user:
            send_notification(
                user_id=booking.provider_user.user_id,
                notif_type="PAYMENT_RECEIVED",
                title="Payment Received!",
                message=f"You earned ₹{net:.2f} (Gross: ₹{gross:.2f}) for booking #{booking.id}.",
                booking_id=booking.id
            )

        try:
            socket_data = {"booking": booking.to_dict(), "payment": payment.to_dict()}
            socketio.emit("payment_completed", socket_data, to=f"user_{current_user.id}")
            socketio.emit("payment_completed", socket_data, to=f"booking_{booking.id}")
        except Exception as e:
            print(f"Socket error: {e}")

        return jsonify({
            "message": "Payment captured and verified successfully!",
            "booking": booking.to_dict(),
            "payment": payment.to_dict()
        }), 200

    return jsonify({"error": "Payment capture failed"}), 400
