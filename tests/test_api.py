import pytest
from httpx import AsyncClient, ASGITransport
from server.main import app

@pytest.mark.asyncio
async def test_home():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "🚖 Welcome to Mini-Uber Backend"}

@pytest.mark.asyncio
async def test_book_ride():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # send params since your endpoint expects function args, not JSON body
        response = await ac.post(
            "/book-ride?user_id=1&start=Bangalore&destination=Mysore"
        )
    assert response.status_code == 200
    assert "ride_id" in response.json()
    assert response.json()["status"] == "pending"

@pytest.mark.asyncio
async def test_get_queue():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/queue")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_next_ride():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/next-ride")
    assert response.status_code == 200
    assert "ride_id" in response.json() or response.json()["message"] == "No pending rides"
