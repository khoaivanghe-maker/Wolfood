const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const authSection = document.getElementById("auth-section");
const gameSection = document.getElementById("game-section");
const usernameDisplay = document.getElementById("username");

// Kiểm tra xem người dùng đã đăng nhập chưa
const currentUser = localStorage.getItem("username");
if (currentUser) {
  showGameSection(currentUser);
}

// Đăng ký
registerBtn.addEventListener("click", async () => {
  const username = document.getElementById("reg-username").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await res.json();
  document.getElementById("register-msg").innerText = data.message;

  if (res.ok) {
    localStorage.setItem("username", username);
    showGameSection(username);
  }
});

// Đăng nhập
loginBtn.addEventListener("click", async () => {
  const identifier = document.getElementById("login-identifier").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await res.json();
  document.getElementById("login-msg").innerText = data.message;

  if (res.ok) {
    localStorage.setItem("username", data.username);
    showGameSection(data.username);
  }
});

// Đăng xuất
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("username");
  authSection.style.display = "block";
  gameSection.style.display = "none";
});

// Hàm hiển thị màn hình chính
function showGameSection(username) {
  authSection.style.display = "none";
  gameSection.style.display = "block";
  usernameDisplay.textContent = username;
}
