"""Operator-only, run from backend:
    python activate_account.py --list          # accounts that cannot log in yet
    python activate_account.py EMAIL_OR_ID     # set a password (typed hidden, never printed)
"""
import argparse
import getpass

from app.core.database import Base, SessionLocal, engine, check_and_migrate_db
from app.core.auth import AuthSession, hash_password
from app.models.user import User


def main():
    parser = argparse.ArgumentParser(description="Aktivasi/reset password akun lokal EduAdapt.")
    parser.add_argument("account", nargs="?", help="Email atau ID akun")
    parser.add_argument("--list", action="store_true", help="Tampilkan akun yang belum punya password")
    args = parser.parse_args()
    Base.metadata.create_all(engine)
    check_and_migrate_db()
    with SessionLocal() as db:
        if args.list:
            for user in db.query(User).filter(User.password_hash.is_(None)).order_by(User.created_at):
                print(f"{user.id:24} {user.role:5} {user.email:36} {user.name}")
            return
        if not args.account:
            parser.error("Isi email atau ID akun, atau gunakan --list.")
        key = args.account.strip()
        user = db.get(User, key) or db.query(User).filter(User.email == key.lower()).first()
        if not user:
            parser.error("Akun tidak ditemukan.")
        print(f"Akun: {user.name} ({user.role}, {user.email})")
        password = getpass.getpass("Password baru (10–128 karakter): ")
        if password != getpass.getpass("Ulangi password: "):
            parser.error("Password tidak sama.")
        try:
            user.password_hash = hash_password(password)
        except ValueError as exc:
            parser.error(str(exc))
        db.query(AuthSession).filter(AuthSession.user_id == user.id).delete()
        db.commit()
        print("Password disimpan; sesi lama dicabut. Masuk dengan email/nama akun dan password ini.")


if __name__ == "__main__":
    main()
