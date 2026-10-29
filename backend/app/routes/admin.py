from flask import Blueprint, jsonify
from app.models.user import User
from app.models.provider import ProviderProfile
from app.models.booking import Booking
from app.models.payment import Payment, ProviderEarning
from app.models.service import Service
from app.auth.helpers import role_required

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/dashboard", methods=["GET"])
@role_required("ADMIN")
def get_admin_dashboard(current_user):
    total_customers = User.query.filter_by(role="CUSTOMER").count()
    total_providers = User.query.filter_by(role="PROVIDER").count()
    total_bookings = Booking.query.count()
    total_services = Service.query.count()

    completed_bookings = Booking.query.filter_by(status="PAYMENT_COMPLETED").all()
    completed_payments = Payment.query.filter_by(payment_status="COMPLETED").all()
    total_revenue = sum(payment.amount for payment in completed_payments)
    total_platform_commission = sum(
        earning.platform_fee
        for earning in ProviderEarning.query.filter_by(payment_status="COMPLETED").all()
    )
    total_provider_payout = sum(
        earning.net_amount
        for earning in ProviderEarning.query.filter_by(payment_status="COMPLETED").all()
    )

    recent_bookings = [b.to_dict() for b in Booking.query.order_by(Booking.created_at.desc()).limit(10).all()]
    providers_list = [p.to_dict() for p in ProviderProfile.query.limit(20).all()]
    customers_list = [u.to_dict() for u in User.query.filter_by(role="CUSTOMER").limit(20).all()]

    return jsonify({
        "stats": {
            "total_customers": total_customers,
            "total_providers": total_providers,
            "total_bookings": total_bookings,
            "total_services": total_services,
            "total_revenue": total_revenue
            ,"total_platform_commission": total_platform_commission
            ,"total_provider_payout": total_provider_payout
            ,"commission_rate": 10
        },
        "recent_bookings": recent_bookings,
        "providers": providers_list,
        "customers": customers_list
    }), 200
