document.addEventListener("DOMContentLoaded", () => {
  const productContainer = document.getElementById("product-list");
  const productTable = document.getElementById("product-table");
  const messageTable = document.getElementById("message-table");
  const addProductBtn = document.getElementById("add-product-btn");
  const addProductModal = document.getElementById("add-product-modal");
  const closeModal = document.querySelector(".modal .close");
  const productForm = document.getElementById("product-form");
  const cancelBtn = document.querySelector(".modal .cancel");

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  function updateCartIcon() {
    let cartLink = document.getElementById("cart-link");
    if (!cartLink) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="cart.html" id="cart-link">Cart (<span id="cart-count">0</span>)</a>`;
      document.querySelector("nav ul")?.appendChild(li);
    }
    document.getElementById("cart-count").textContent = cart.length;
  }

  function addToCart(product) {
    cart.push(product);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartIcon();
    alert(`Added "${product.name}" to cart.`);
  }

  // Load products for the main page
  function loadMainPageProducts() {
    if (productContainer) {
      fetch("http://localhost:3000/products")
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch products");
          return response.json();
        })
        .then((products) => {
          productContainer.innerHTML = "";
          products.forEach((product) => {
            const card = document.createElement("div");
            card.classList.add("product-card");

            const carouselWrapper = document.createElement("div");
            carouselWrapper.classList.add("carousel-wrapper");

            const imageStrip = document.createElement("div");
            imageStrip.classList.add("image-strip");

            product.images.forEach((imgSrc) => {
              const img = document.createElement("img");
              img.src = imgSrc;
              img.alt = product.name;
              img.classList.add("carousel-image");
              imageStrip.appendChild(img);
            });

            carouselWrapper.appendChild(imageStrip);

            const details = document.createElement("div");
            details.classList.add("product-details");
            details.innerHTML = `
              <h3>${product.name}</h3>
              <p class="scripture">${product.scripture}</p>
              <p class="price">$${product.price}</p>
              <button class="add-to-cart">Add to Cart</button>
            `;

            card.appendChild(carouselWrapper);
            card.appendChild(details);
            productContainer.appendChild(card);

            const addButton = details.querySelector(".add-to-cart");
            addButton.addEventListener("click", () => addToCart(product));

            let currentIndex = 0;
            const slideCount = product.images.length;
            setInterval(() => {
              currentIndex = (currentIndex + 1) % slideCount;
              imageStrip.style.transform = `translateX(-${
                currentIndex * 100
              }%)`;
            }, 3000);
          });
        })
        .catch((error) => {
          productContainer.innerHTML =
            "<p>Failed to load products. Please try again.</p>";
          console.error("Error loading products:", error);
        });
    }
  }

  // Load products for the admin dashboard
  function loadProducts() {
    if (productTable) {
      fetch("http://localhost:3000/products")
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch products");
          return response.json();
        })
        .then((products) => {
          const tbody = productTable.querySelector("tbody");
          tbody.innerHTML = "";
          products.forEach((product, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${product.name}</td>
              <td>$${product.price}</td>
              <td>${product.images
                .map(
                  (img) => `<img src="${img}" alt="${product.name}" width="50">`
                )
                .join("")}</td>
              <td>${product.scripture}</td>
              <td>
                <button onclick="editProduct(${index})">Edit</button>
                <button onclick="deleteProduct(${index})">Delete</button>
              </td>
            `;
            tbody.appendChild(row);
          });
          updateStats(products.length);
        })
        .catch((error) => {
          console.error("Failed to load products:", error);
          productTable.querySelector("tbody").innerHTML =
            "<tr><td colspan='5'>Failed to load products.</td></tr>";
        });
    }
  }

  // Load messages for the admin dashboard
  function loadMessages() {
    if (messageTable) {
      fetch("http://localhost:3000/api/messages")
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch messages");
          return response.json();
        })
        .then((messages) => {
          const tbody = messageTable.querySelector("tbody");
          tbody.innerHTML = "";
          messages.forEach((message, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${message.name}</td>
              <td>${message.email}</td>
              <td>${message.message}</td>
              <td>${new Date(message.timestamp).toLocaleString()}</td>
            `;
            tbody.appendChild(row);
          });
          updateStats(null, messages.filter((m) => !m.read).length);
        })
        .catch((error) => {
          console.error("Failed to load messages:", error);
          messageTable.querySelector("tbody").innerHTML =
            "<tr><td colspan='4'>Failed to load messages.</td></tr>";
        });
    }
  }

  // Update dashboard stats
  function updateStats(productCount, newMessageCount) {
    if (productCount !== null) {
      document.querySelector(".stats .stat:nth-child(1) p").textContent =
        productCount;
    }
    if (newMessageCount !== null) {
      document.querySelector(".stats .stat:nth-child(2) p").textContent =
        newMessageCount;
    }
  }

  // Handle product form submission
  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append("name", document.getElementById("product-name").value);
      formData.append("price", document.getElementById("product-price").value);
      formData.append(
        "scripture",
        document.getElementById("product-scripture").value
      );
      formData.append("category", "default"); // Adjust as needed
      const files = document.getElementById("product-images").files;
      for (let file of files) {
        formData.append("images", file);
      }

      try {
        const response = await fetch("http://localhost:3000/products", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          alert("Product added successfully!");
          productForm.reset();
          addProductModal.style.display = "none";
          loadProducts();
        } else {
          alert("Failed to add product.");
        }
      } catch (error) {
        console.error("Error adding product:", error);
        alert("Error adding product.");
      }
    });
  }

  // Image preview for product form
  if (document.getElementById("product-images")) {
    document
      .getElementById("product-images")
      .addEventListener("change", function (e) {
        const preview = document.getElementById("current-images");
        if (preview) {
          preview.innerHTML = "";
          Array.from(e.target.files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = function (e) {
              const img = document.createElement("img");
              img.src = e.target.result;
              img.style.width = "100px";
              preview.appendChild(img);
            };
            reader.readAsDataURL(file);
          });
        }
      });
  }

  // Modal controls
  if (addProductBtn && addProductModal) {
    addProductBtn.addEventListener("click", () => {
      addProductModal.style.display = "block";
    });
  }
  if (closeModal && addProductModal) {
    closeModal.addEventListener("click", () => {
      addProductModal.style.display = "none";
    });
  }
  if (cancelBtn && addProductModal) {
    cancelBtn.addEventListener("click", () => {
      addProductModal.style.display = "none";
    });
  }

  // Contact form submission
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = e.target.name.value;
      const email = e.target.email.value;
      const message = e.target.message.value;

      try {
        const response = await fetch("http://localhost:3000/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, message }),
        });
        if (response.ok) {
          alert("Message sent successfully!");
          e.target.reset();
        } else {
          alert("Failed to send message.");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message.");
      }
    });
  }

  // Initialize
  updateCartIcon();
  loadMainPageProducts();
  loadProducts();
  loadMessages();
});
