def test_register_user_success(client):
    user_data = {
        "email": "testowy@example.com",
        "password": "testowy123"
    }

    response = client.post("/users/register", json=user_data)
    assert response.status_code == 200

    data = response.json()
    assert data["email"] == "testowy@example.com"
    assert "id" in data


def test_register_duplicate_user_fails(client):
    #rejestracja uzytkownika ktory juz istnieje
    user_data = {
        "email": "testowy@example.com",
        "password": "testowy12"
    }

    response = client.post("/users/register", json=user_data)

    assert response.status_code == 400
    assert response.json()["detail"] == "User already exists"


def test_login_success(client):
    #logowanie uzytkownika
    login_data = {
        "username": "testowy@example.com",
        "password": "testowy123"
    }

    response = client.post("/users/login", data=login_data)
    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password_fails(client):
    #logowanie uzytkownika zlym haslem
    login_data = {
        "username": "testowy@example.com",
        "password": "testowy1234"
    }

    response = client.post("/users/login", data=login_data)

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"
