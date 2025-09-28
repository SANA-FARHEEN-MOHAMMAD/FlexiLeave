const BASE_URL = "/api/users"
let currentRole = "EMPLOYEE"

// Toggle password visibility
function togglePassword(id) {
  const input = document.getElementById(id)
  input.type = input.type === "password" ? "text" : "password"
}

// Smooth helper
function smoothShow(el) {
  el.style.display = "block"
  el.classList.remove("fade-in")
  // force reflow to restart animation
  void el.offsetWidth
  el.classList.add("fade-in")
}

// Role selection → login
function showLogin(role) {
  currentRole = role
  const login = document.getElementById("loginSection")
  const signup = document.getElementById("signupSection")
  const forgot = document.getElementById("forgotSection")
  const roleTitle = document.getElementById("loginRoleTitle")

  // Dim unselected box for clarity
  const emp = document.getElementById("employeeBox")
  const man = document.getElementById("managerBox")
  emp.classList.remove("dim")
  man.classList.remove("dim")
  if (role === "EMPLOYEE") man.classList.add("dim")
  if (role === "MANAGER") emp.classList.add("dim")

  roleTitle.innerText = `Login as ${role}`
  signup.style.display = "none"
  forgot.style.display = "none"

  // NEW: open overlay to produce same blur/modal feel as signup
  openOverlay()
  smoothShow(login)

  setTimeout(() => document.getElementById("loginEmail")?.focus(), 50)
  login.scrollIntoView({ behavior: "smooth", block: "center" })
}

// Back to role selection
const backBtn = document.getElementById("backToRoles")
if (backBtn) {
  backBtn.addEventListener("click", () => {
    document.getElementById("loginSection").style.display = "none"
    document.getElementById("forgotSection").style.display = "none"
    const emp = document.getElementById("employeeBox")
    const man = document.getElementById("managerBox")
    emp.classList.remove("dim")
    man.classList.remove("dim")
    closeOverlay()
  })
}

// Show forgot password form
function showForgot() {
  const forgot = document.getElementById("forgotSection")
  document.getElementById("loginSection").style.display = "none"
  document.getElementById("signupSection").style.display = "none"
  openOverlay()
  smoothShow(forgot)
}

// Escape key to close panels
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("loginSection").style.display = "none"
    document.getElementById("forgotSection").style.display = "none"
    const signupSection = document.getElementById("signupSection")
    if (signupSection) signupSection.style.display = "none"
    const emp = document.getElementById("employeeBox")
    const man = document.getElementById("managerBox")
    emp?.classList.remove("dim")
    man?.classList.remove("dim")
    closeOverlay()
  }
})
function showSignup() {
  const signup = document.getElementById('signupSection');
  if (!signup) return;
  signup.style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
  document.querySelectorAll('.role-box').forEach(b => b.classList.add('dim'));
}
// Show signup form
const showSignupBtn = document.getElementById("showSignup")
if (showSignupBtn) {
  showSignupBtn.addEventListener("click", (e) => {
    e.preventDefault()
    showSignupPanel()
  })
}

// Function to show the Signup panel properly (overlay + panel)
function showSignupPanel() {
  const login = document.getElementById("loginSection")
  const signup = document.getElementById("signupSection")
  const forgot = document.getElementById("forgotSection")
  if (login) login.style.display = "none"
  if (forgot) forgot.style.display = "none"
  openOverlay()
  if (signup) {
    smoothShow(signup)
    setTimeout(() => document.getElementById("name")?.focus(), 50)
    signup.scrollIntoView({ behavior: "smooth", block: "center" })
  }
}

const signupForm = document.getElementById("signupForm")
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  const user = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    role: document.getElementById("role").value,
  }
  try {
    const res = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })
    const data = await res.json()
    document.getElementById("message").innerText = data.message || data.error

    if (res.ok) {
      document.getElementById("otpSection").style.display = "block"
      currentRole = user.role

      localStorage.setItem(
        "signupUser",
        JSON.stringify({
          email: user.email,
          role: user.role,
          name: user.name,
        }),
      )
    }
  } catch (err) {
    console.error(err)
    document.getElementById("message").innerText = "Signup failed"
  }
})

// ===== VERIFY OTP =====
document.getElementById("verifyOtpBtn").addEventListener("click", async () => {
  const otp = document.getElementById("otpCode").value
  const signupUser = JSON.parse(localStorage.getItem("signupUser"))
  if (!signupUser) {
    document.getElementById("message").innerText = "Signup session expired"
    return
  }
  try {
    const res = await fetch(`${BASE_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: signupUser.email, otp }),
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: signupUser.email,
          role: signupUser.role,
          name: signupUser.name,
          randomId: data.randomId || Math.floor(Math.random() * 9000 + 1000),
        }),
      )
      localStorage.removeItem("signupUser")

      window.location.href = signupUser.role.toUpperCase() === "MANAGER" ? "manager.html" : "employee.html"
    } else {
      document.getElementById("message").innerText = data.error
    }
  } catch (err) {
    console.error(err)
    document.getElementById("message").innerText = "OTP verification failed"
  }
})

// ===== RESEND OTP =====
document.getElementById("resendOtp").addEventListener("click", async () => {
  const signupUser = JSON.parse(localStorage.getItem("signupUser"))
  if (!signupUser) {
    document.getElementById("message").innerText = "Signup session expired"
    return
  }
  try {
    const res = await fetch(`${BASE_URL}/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: signupUser.email }),
    })
    const data = await res.json()
    document.getElementById("message").innerText = data.message || data.error
  } catch (err) {
    console.error(err)
    document.getElementById("message").innerText = "Resend OTP failed"
  }
})

// ===== LOGIN =====
const loginForm = document.getElementById("loginForm")
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  const userLogin = {
    email: document.getElementById("loginEmail").value,
    password: document.getElementById("loginPassword").value,
  }
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userLogin),
    })
    const data = await res.json()
    if (res.ok) {
      if (data.role.toUpperCase() === currentRole.toUpperCase()) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            email: data.email,
            role: data.role,
            name: data.name,
            randomId: data.randomId,
          }),
        )
        window.location.href = data.role.toUpperCase() === "MANAGER" ? "manager.html" : "employee.html"
      } else {
        document.getElementById("loginMessage").innerText = "Selected role does not match your account role"
      }
    } else {
      document.getElementById("loginMessage").innerText = data.error
    }
  } catch (err) {
    console.error(err)
    document.getElementById("loginMessage").innerText = "Login failed"
  }
})

// ===== FORGOT PASSWORD =====
const forgotForm = document.getElementById("forgotForm")
forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  const email = document.getElementById("forgotEmail").value
  try {
    const res = await fetch(`${BASE_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    document.getElementById("forgotMessage").innerText = data.message || data.error
    if (res.ok) {
      document.getElementById("forgotOtpSection").style.display = "block"
    }
  } catch (err) {
    console.error(err)
    document.getElementById("forgotMessage").innerText = "Failed to send OTP"
  }
})

// ===== VERIFY FORGOT PASSWORD OTP =====
document.getElementById("verifyForgotOtp").addEventListener("click", async () => {
  const email = document.getElementById("forgotEmail").value
  const otp = document.getElementById("forgotOtp").value
  try {
    const res = await fetch(`${BASE_URL}/verify-forgot-password-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          email,
          role: currentRole,
          name: data.name || "User",
          randomId: data.randomId || Math.floor(Math.random() * 9000 + 1000),
        }),
      )
      window.location.href = currentRole.toUpperCase() === "MANAGER" ? "manager.html" : "employee.html"
    } else {
      document.getElementById("forgotMessage").innerText = data.error
    }
  } catch (err) {
    console.error(err)
    document.getElementById("forgotMessage").innerText = "OTP verification failed"
  }
})

// Demo popover
const tryDemoBtn = document.getElementById("tryDemoBtn")
const demoPopup = document.getElementById("demoPopup")
const closeDemoPopup = document.getElementById("closeDemoPopup")

tryDemoBtn.addEventListener("click", () => {
  demoPopup.style.display = demoPopup.style.display === "none" ? "block" : "none"
})
closeDemoPopup.addEventListener("click", () => {
  demoPopup.style.display = "none"
})

// Overlay & closers without touching API logic
const overlay = document.getElementById("overlay")
const loginPanel = document.getElementById("loginSection")
const signupPanel = document.getElementById("signupSection")
const forgotPanel = document.getElementById("forgotSection")

function openOverlay() {
  if (overlay) overlay.style.display = "block";
}
function closeOverlay() {
  if (overlay) overlay.style.display = "none";
}


function closeAllPanels() {
  if (loginPanel) loginPanel.style.display = "none"
  if (signupPanel) signupPanel.style.display = "none"
  if (forgotPanel) forgotPanel.style.display = "none"
  // undim role cards
  const emp = document.getElementById("employeeBox")
  const man = document.getElementById("managerBox")
  emp?.classList.remove("dim")
  man?.classList.remove("dim")
  closeOverlay()
}

// Clicking overlay closes panels
overlay?.addEventListener("click", closeAllPanels)

// Dedicated X buttons
document.getElementById("closeLogin")?.addEventListener("click", closeAllPanels)
document.getElementById("closeSignup")?.addEventListener("click", closeAllPanels)
document.getElementById("closeForgot")?.addEventListener("click", closeAllPanels)
for (let i = 0; i < 80; i++) {
  const dot = document.createElement("div");
  dot.className = "particle";
  dot.style.left = (i * 3) + "vw";
  dot.style.top = Math.random() * 100 + "vh";
  dot.style.animationDelay = (Math.random() * 5) + "s";
  document.body.appendChild(dot);
}
