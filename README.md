# Pierre Collet Motors

A beginner-friendly car stock website where you can add a car photo, price, and details so customers can see what vehicles are available.

## What It Does

- Shows a simple customer-facing list of cars in stock
- Lets you add a car ad with photo, brand, model, price, year, mileage, fuel type, condition, category, phone number, and notes
- Supports uploading a photo or using a photo URL
- Saves to MongoDB when the backend is running
- Falls back to browser storage when opened directly as `frontend/index.html`
- Includes search by brand, model, category, or condition

## Project Structure

```text
Car Dealership/
  frontend/
    index.html
    style.css
    script.js
    public/
  backend/
    server.js
    package.json
    .env.example
    data/
      sampleCars.js
    models/
      Booking.js
      Car.js
    public/
      uploads/
    routes/
      bookings.js
      cars.js
```

## Run With Database

Open a terminal in the backend folder:

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Then open:

```text
http://localhost:5000
```

Use a local MongoDB server or put a MongoDB Atlas connection string in `backend/.env`.

## Run Without Database

Open this file in your browser:

```text
frontend/index.html
```

Cars added this way are saved only in that browser using local storage.
