from app.models.notification import Notification
from app import db, socketio

def send_notification(user_id, notif_type, title, message, booking_id=None):
    """
    Creates a notification in DB and emits real-time WebSocket event to user room.
    """
    notif = Notification(
        user_id=user_id,
        booking_id=booking_id,
        type=notif_type,
        title=title,
        message=message,
        is_read=False
    )
    db.session.add(notif)
    db.session.commit()

    # Emit socket event to room `user_{user_id}`
    try:
        socketio.emit(
            "new_notification",
            notif.to_dict(),
            to=f"user_{user_id}"
        )
    except Exception as e:
        print(f"Socket emit error: {e}")

    return notif
