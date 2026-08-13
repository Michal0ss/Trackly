#pytest -v
TEST_SUB_DATA = {
    "service_name": "Netflix",
    "plan_name": "Premium",
    "price": 60.0,
    "currency": "PLN",
    "billing_cycle": "monthly",
    "start_date": "2026-05-01",
    "renewal_date": "2026-06-01",
    "end_date": None,
    "status": "confirmed",
    "source": "manual",
    "source_url": "http://netflix.com",
    "auto_renew": True
}


def test_create_subscription_success(client, auth_headers):
    #post z naglowkiem autoryzacyjnym
    response = client.post(
        "/subscriptions",
        json=TEST_SUB_DATA,
        headers=auth_headers
    )

    assert response.status_code == 200

    data = response.json()
    assert data["service_name"] == "Netflix"
    assert data["price"] == 60.0
    assert "id" in data


def test_create_duplicate_subscription_fails(client, auth_headers):
    #dodanie drugi raz tej samej subskrypcji
    response = client.post(
        "/subscriptions",
        json=TEST_SUB_DATA,
        headers=auth_headers
    )

    assert response.status_code == 409
    assert "aktywną subskrypcję" in response.json()["detail"]


def test_get_subscriptions_list(client, auth_headers):
    #pobranie listy subskrypcji uzytkownika
    response = client.get("/subscriptions", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["service_name"] == "Netflix"


def test_get_single_subscription_success(client, auth_headers):
    #sprawdzenie jednej subskrypcji
    list_response = client.get("/subscriptions", headers=auth_headers)
    sub_id = list_response.json()[0]["id"]

    response = client.get(f"/subscriptions/{sub_id}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["service_name"] == "Netflix"


def test_get_subscription_not_found(client, auth_headers):
    #pobranie nieistniejacej subskrypcji
    response = client.get("/subscriptions/99999", headers=auth_headers)

    assert response.status_code == 404
    assert "Nie znaleziono subskrypcji" in response.json()["detail"]


def test_unauthorized_access_fails(client):
    #wejscie na zabezpieczony endpoint bez naglowkow autoryzacyjnych
    response = client.get("/subscriptions")

    assert response.status_code == 401
