# client/app.py
import requests

BASE_URL = "http://127.0.0.1:8000"

def show_menu():
    print("\n=== Mini-Uber Client ===")
    print("1. Book a Ride")
    print("2. View Queue")
    print("3. Get Next Ride")
    print("4. Update Ride Status")
    print("0. Exit")

while True:
    show_menu()
    choice = input("Choose option: ")

    if choice == "1":
        user_id = input("Enter user ID: ")
        start = input("Enter start location: ")
        dest = input("Enter destination: ")
        response = requests.post(f"{BASE_URL}/book-ride", params={"user_id": user_id, "start": start, "destination": dest})
        print(response.json())

    elif choice == "2":
        response = requests.get(f"{BASE_URL}/queue")
        print(response.json())

    elif choice == "3":
        response = requests.get(f"{BASE_URL}/next-ride")
        print(response.json())

    elif choice == "4":
        ride_id = input("Enter ride ID: ")
        status = input("Enter status (pending/completed/rejected): ")
        response = requests.put(f"{BASE_URL}/update-ride/{ride_id}", params={"status": status})
        print(response.json())

    elif choice == "0":
        break

    else:
        print("Invalid option, try again!")
