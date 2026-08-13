#pytest -v
from datetime import UTC, datetime
from jose import jwt
from app.utils.security import ALGORITHM, SECRET_KEY, create_access_token

def test_access_token_contains_user_id():
    token = create_access_token({"user_id": 42})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    assert payload["user_id"] == 42


def test_access_token_expires_in_the_future():
    token = create_access_token({"user_id": 1})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    assert payload["exp"] > datetime.now(UTC).timestamp()
