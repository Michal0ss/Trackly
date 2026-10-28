from unicodedata import normalize

from sqlalchemy import select

from app.models.models import Subscription


def subscription_name_key(name):
    return normalize("NFC", name.strip()).casefold()


def has_subscription_duplicate(connection, user_id, name, exclude_id=None):
    statement = select(Subscription.id, Subscription.service_name).where(
        Subscription.user_id == user_id, Subscription.status != "cancelled",
    )
    if exclude_id is not None:
        statement = statement.where(Subscription.id != exclude_id)
    key = subscription_name_key(name)
    return any(subscription_name_key(existing_name) == key for _, existing_name in connection.execute(statement))
