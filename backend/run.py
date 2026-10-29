import os
import sqlite3
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

from app import create_app, db, socketio
from seed import seed_database


def ensure_database_ready(app):
    database_url = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if not database_url.startswith("sqlite"):
        return

    db_path = database_url.replace("sqlite:///", "", 1)
    if db_path.startswith("/"):
        db_file = db_path
    else:
        db_file = os.path.join(os.getcwd(), db_path)

    if os.path.exists(db_file):
        try:
            conn = sqlite3.connect(db_file)
            conn.execute("SELECT 1 FROM sqlite_master LIMIT 1")
            conn.close()
            return
        except Exception as exc:
            print(f"SQLite database is corrupted or unreadable: {exc}")
            backup_path = f"{db_file}.corrupt-backup-{os.getpid()}"
            try:
                os.replace(db_file, backup_path)
                print(f"Moved corrupted database to {backup_path}")
            except Exception as replace_exc:
                print(f"Could not move corrupted database: {replace_exc}")
                try:
                    os.remove(db_file)
                    print(f"Deleted corrupted database: {db_file}")
                except Exception as remove_exc:
                    print(f"Could not delete corrupted database: {remove_exc}")


app = create_app()

if __name__ == "__main__":
    with app.app_context():
        ensure_database_ready(app)
        db.create_all()
        try:
            seed_database()
        except Exception as e:
            print(f"Seed info: {e}")

    port = int(os.getenv("PORT", 5000))
    print(f"Starting QuickMend Flask Backend with Socket.IO on http://127.0.0.1:{port}")
    socketio.run(app, host="0.0.0.0", port=port, debug=True, allow_unsafe_werkzeug=True)
