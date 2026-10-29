from flask import request
from flask_socketio import emit, join_room, leave_room
from app import socketio, db
from app.models.provider import ProviderProfile
from app.models.booking import Booking
from datetime import datetime

@socketio.on("connect")
def handle_connect():
    print(f"Socket Client connected: {request.sid}")
    emit("connected", {"status": "connected", "sid": request.sid})

@socketio.on("disconnect")
def handle_disconnect():
    print(f"Socket Client disconnected: {request.sid}")

@socketio.on("join_user_room")
def handle_join_user_room(data):
    user_id = data.get("user_id")
    if user_id:
        room = f"user_{user_id}"
        join_room(room)
        emit("room_joined", {"room": room}, to=request.sid)

@socketio.on("join_booking_room")
def handle_join_booking_room(data):
    booking_id = data.get("booking_id")
    if booking_id:
        room = f"booking_{booking_id}"
        join_room(room)
        emit("room_joined", {"room": room}, to=request.sid)

@socketio.on("update_provider_location")
def handle_update_location(data):
    """
    Provider updates live location via Socket.IO.
    Broadcasts location to customer in booking room and updates DB.
    """
    provider_id = data.get("provider_id")
    booking_id = data.get("booking_id")
    lat = data.get("latitude")
    lng = data.get("longitude")

    if not provider_id or lat is None or lng is None:
        return

    # Update ProviderProfile DB location
    provider = ProviderProfile.query.get(provider_id)
    if provider:
        provider.latitude = lat
        provider.longitude = lng
        provider.last_location_update = datetime.utcnow()
        db.session.commit()

    # Update active Booking location if booking_id provided
    if booking_id:
        booking = Booking.query.get(booking_id)
        if booking:
            booking.provider_latitude = lat
            booking.provider_longitude = lng
            db.session.commit()
            
            # Emit live location to booking room
            emit("location_update", {
                "booking_id": booking_id,
                "provider_id": provider_id,
                "latitude": lat,
                "longitude": lng,
                "timestamp": datetime.utcnow().isoformat()
            }, to=f"booking_{booking_id}")
