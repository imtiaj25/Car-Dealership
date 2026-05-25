const BACKEND_ORIGIN = "http://localhost:5000";
const API_BASE = window.location.protocol === "file:" ? `${BACKEND_ORIGIN}/api` : "/api";
const STORAGE_KEY = "simpleCarStock";

const form = document.querySelector("#carForm");
const formMessage = document.querySelector("#formMessage");
const carList = document.querySelector("#carList");
const stockCount = document.querySelector("#stockCount");
const searchInput = document.querySelector("#searchInput");
const emptyTemplate = document.querySelector("#emptyTemplate");
const navToggle = document.querySelector("#navToggle");
const navLinks = document.querySelector("#navLinks");

let cars = [];
let backendAvailable = false;

function formatPrice(price) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0
  }).format(Number(price || 0));
}

function getImageSource(image) {
  if (!image) {
    return "";
  }

  if (image.startsWith("/uploads/") && window.location.protocol === "file:") {
    return `${BACKEND_ORIGIN}${image}`;
  }

  return image;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function saveLocalCars() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
}

function loadLocalCars() {
  const savedCars = localStorage.getItem(STORAGE_KEY);

  if (savedCars) {
    cars = JSON.parse(savedCars);
    return;
  }

  cars = [
    {
      _id: crypto.randomUUID(),
      image:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80",
      brand: "Toyota",
      model: "Camry",
      price: 24990,
      year: 2020,
      mileage: 52000,
      fuelType: "Petrol",
      condition: "Used",
      category: "Family",
      sellerPhone: "03 9888 9222",
      description: "Clean family car with service history and smooth automatic transmission."
    },
    {
      _id: crypto.randomUUID(),
      image:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80",
      brand: "Ford",
      model: "Mustang",
      price: 58990,
      year: 2022,
      mileage: 18000,
      fuelType: "Petrol",
      condition: "Used",
      category: "Sports",
      sellerPhone: "03 9888 9222",
      description: "Sporty coupe in excellent condition with low kilometres."
    }
  ];
  saveLocalCars();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Photo could not be loaded."));
    reader.readAsDataURL(file);
  });
}

function showMessage(text, isError = false) {
  formMessage.textContent = text;
  formMessage.classList.toggle("error", isError);
}

function createLocalCar(formData, image) {
  return {
    _id: crypto.randomUUID(),
    image,
    brand: formData.get("brand").trim(),
    model: formData.get("model").trim(),
    price: Number(formData.get("price")),
    year: Number(formData.get("year")),
    mileage: Number(formData.get("mileage")),
    fuelType: formData.get("fuelType").trim(),
    condition: formData.get("condition"),
    category: formData.get("category"),
    sellerPhone: formData.get("sellerPhone").trim() || "03 9888 9222",
    description: formData.get("description").trim()
  };
}

async function loadCars() {
  try {
    const response = await fetch(`${API_BASE}/cars`);

    if (!response.ok) {
      throw new Error("Backend is not available.");
    }

    cars = await response.json();
    backendAvailable = true;
  } catch (error) {
    backendAvailable = false;
    loadLocalCars();
  }

  renderCars();
}

function renderCars() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const visibleCars = cars.filter((car) => {
    const text = `${car.brand} ${car.model} ${car.category} ${car.condition}`.toLowerCase();
    return text.includes(searchTerm);
  });

  stockCount.textContent = `${visibleCars.length} car${visibleCars.length === 1 ? "" : "s"} in stock`;
  carList.innerHTML = "";

  if (visibleCars.length === 0) {
    carList.appendChild(emptyTemplate.content.cloneNode(true));
    return;
  }

  visibleCars.forEach((car) => {
    const card = document.createElement("article");
    card.className = "car-card";
    const title = `${escapeHtml(car.brand)} ${escapeHtml(car.model)}`;
    const description = escapeHtml(car.description);

    card.innerHTML = `
      <div class="car-photo">
        <img src="${escapeHtml(getImageSource(car.image))}" alt="${title}" loading="lazy" />
      </div>
      <div class="car-info">
        <div class="car-title">
          <h3>${title}</h3>
          <span class="price">${formatPrice(car.price)}</span>
        </div>
        <div class="tags">
          <span class="tag">${escapeHtml(car.condition)}</span>
          <span class="tag">${escapeHtml(car.category)}</span>
          <span class="tag">${escapeHtml(car.fuelType)}</span>
        </div>
        <p class="details">
          <span>Year: ${escapeHtml(car.year)}</span>
          <span>Mileage: ${Number(car.mileage || 0).toLocaleString()} km</span>
          <span>Phone: ${escapeHtml(car.sellerPhone || "03 9888 9222")}</span>
        </p>
        ${description ? `<p class="description">${description}</p>` : ""}
        <button class="delete-button" data-id="${car._id}">Remove Ad</button>
      </div>
    `;
    carList.appendChild(card);
  });
}

async function addCar(event) {
  event.preventDefault();
  showMessage("Saving car ad...");

  const formData = new FormData(form);
  const imageFile = formData.get("image");
  const imageUrl = formData.get("imageUrl").trim();

  if ((!imageFile || imageFile.size === 0) && !imageUrl) {
    showMessage("Please add a photo or photo URL.", true);
    return;
  }

  try {
    if (backendAvailable) {
      const response = await fetch(`${API_BASE}/cars`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Could not save to backend.");
      }

      cars.unshift(await response.json());
    } else {
      const image = imageFile && imageFile.size > 0 ? await fileToDataUrl(imageFile) : imageUrl;
      cars.unshift(createLocalCar(formData, image));
      saveLocalCars();
    }

    form.reset();
    showMessage("Car ad saved. Customers can now see it below.");
    renderCars();
    document.querySelector(".used-cars").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function removeCar(carId) {
  if (backendAvailable) {
    await fetch(`${API_BASE}/cars/${carId}`, {
      method: "DELETE"
    });
  }

  cars = cars.filter((car) => car._id !== carId);
  saveLocalCars();
  renderCars();
}

form.addEventListener("submit", addCar);
searchInput.addEventListener("input", renderCars);

navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

navLinks.addEventListener("click", () => {
  navLinks.classList.remove("open");
});

carList.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-button");
  if (!button) return;

  removeCar(button.dataset.id);
});

loadCars();
