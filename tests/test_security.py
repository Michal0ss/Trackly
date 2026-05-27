#pytest -v
from app.utils.security import hash_password, verify_password


def test_password_hashing_and_verification():
    plain_password = "haslo123"

    hashed = hash_password(plain_password)

    assert hashed != plain_password
    assert verify_password(plain_password, hashed) is True
    assert verify_password("haslo12", hashed) is False
