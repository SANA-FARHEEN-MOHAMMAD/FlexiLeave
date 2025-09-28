// Employee page behavior
// expects that successful login stored the user object in localStorage under key "user"
// user = { id, name, email, randomId, role }

const API_BASE = "/api"

function getCurrentUser() {
  const raw = localStorage.getItem("user")
  if (!raw) {
    window.location.href = "index.html"
    return null
  }
  return JSON.parse(raw)
}

const user = getCurrentUser()
if (user) {
  document.getElementById("welcomeTitle").innerText = `Welcome, Employee ${user.name}`
  document.getElementById("userId").innerText = user.randomId
  document.getElementById("userEmail").innerText = user.email
}

const btnNew = document.getElementById("btnNew")
const btnStatus = document.getElementById("btnStatus")
const btnHistory = document.getElementById("btnHistory")
const btnProfile = document.getElementById("btnProfile")
const content = document.getElementById("content")
const initialMsg = document.getElementById("initialMsg")
const logoutBtn = document.getElementById("logoutBtn")
const modalContainer = document.getElementById("modalContainer")

btnNew.addEventListener("click", () => showSection("new"))
btnStatus.addEventListener("click", () => showSection("status"))
btnHistory.addEventListener("click", () => showSection("history"))
btnProfile.addEventListener("click", () => showSection("profile"))
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("user")
  window.location.href = "index.html"
})

function setActive(button) {
  ;[btnNew, btnStatus, btnHistory, btnProfile].forEach((b) => {
    b.classList.remove("active")
    b.setAttribute("aria-pressed", "false")
  })
  if (button) {
    button.classList.add("active")
    button.setAttribute("aria-pressed", "true")
  }
}

function showSection(name) {
  initialMsg.style.display = "none"
  content.classList.remove("fade-in")
  void content.offsetWidth
  content.classList.add("fade-in")

  if (name === "new") {
    setActive(btnNew)
    renderNewForm()
  } else if (name === "status") {
    setActive(btnStatus)
    renderStatus()
  } else if (name === "history") {
    setActive(btnHistory)
    renderHistory()
  } else if (name === "profile") {
    setActive(btnProfile)
    renderProfile()
  }
}

// ---------------- NEW LEAVE ----------------
function renderNewForm() {
  content.innerHTML = `
    <h3>New Leave Request</h3>
    <div class="form-row"><label>Manager ID</label><input id="managerId" placeholder="Enter Manager 4-digit ID"></div>
    <div class="form-row"><label>Subject</label><input id="subject" placeholder="Subject"></div>
    <div class="form-row">
      <label>Leave Type</label>
      <div style="display:flex; gap:10px;">
        <label><input type="radio" name="leaveType" value="Sick" checked> Sick</label>
        <label><input type="radio" name="leaveType" value="Casual"> Casual</label>
        <label><input type="radio" name="leaveType" value="Work-from-home"> Work-from-home</label>
        <label><input type="radio" name="leaveType" value="Others"> Others</label>
      </div>
    </div>
    <div class="form-row"><label>Details</label><textarea id="body" rows="4" placeholder="Details"></textarea></div>
    <div class="form-row inline">
      <div style="flex:1"><label>Start Date</label><input type="date" id="startDate"></div>
      <div style="flex:1"><label>End Date</label><input type="date" id="endDate"></div>
    </div>
    <div style="margin-top:12px"><button id="sendRequestBtn" class="btn btn-primary okbtn">Send Request</button></div>
    <p id="newMsg" class="muted"></p>

    <div id="demoPopup" style="position:fixed; bottom:20px; right:20px; z-index:1000;">
      <button id="tryDemoBtn" class="btn btn-outline small-btn">Try Demo</button>
      <div id="demoContent" style="display:none; background:#fff; border:1px solid #ccc; padding:10px; border-radius:8px; margin-top:6px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
        Demo Manager ID: <strong>8246</strong>
        <p style="font-size:0.8rem; margin-top:4px;">You can signup as a manager and test by entering your manager ID here.</p>
      </div>
    </div>
  `
  document.getElementById("sendRequestBtn").addEventListener("click", submitLeave)
  document.getElementById("tryDemoBtn").addEventListener("click", () => {
    const demoContent = document.getElementById("demoContent")
    demoContent.style.display = demoContent.style.display === "block" ? "none" : "block"
  })
}

async function submitLeave() {
  const managerId = Number.parseInt(document.getElementById("managerId").value)
  const subject = document.getElementById("subject").value
  const body = document.getElementById("body").value
  const startDate = document.getElementById("startDate").value
  const endDate = document.getElementById("endDate").value
  const leaveType = document.querySelector('input[name="leaveType"]:checked').value

  if (!managerId || !subject) {
    document.getElementById("newMsg").innerText = "Manager ID and subject are required."
    return
  }

  // Validate manager ID
  try {
    const res = await fetch(`${API_BASE}/users/${managerId}`)
    if (!res.ok) {
      document.getElementById("newMsg").innerText = "Invalid manager ID."
      return
    }
    const managerData = await res.json()
    if (managerData.role !== "MANAGER") {
      document.getElementById("newMsg").innerText = "Invalid manager ID."
      return
    }
  } catch (err) {
    document.getElementById("newMsg").innerText = "Error validating manager ID."
    return
  }

  const payload = {
    employeeId: user.randomId,
    managerId,
    subject,
    body,
    startDate,
    endDate,
  }

  try {
    const res = await fetch(`${API_BASE}/leaves/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "error" }))
      document.getElementById("newMsg").innerText = err.error || "Failed to send"
      return
    }
    showModal("Request sent", "Your request has been sent to the manager.", "OK", () => {
      hideModal()
      document.getElementById("managerId").value = ""
      document.getElementById("subject").value = ""
      document.getElementById("body").value = ""
      document.getElementById("startDate").value = ""
      document.getElementById("endDate").value = ""
    })
  } catch (e) {
    console.error(e)
    document.getElementById("newMsg").innerText = "Error sending request."
  }
}

// ---------------- STATUS ----------------
async function renderStatus() {
  content.innerHTML = `<h3>Check Status</h3><div id="statusList">Loading...</div>`
  try {
    const res = await fetch(`${API_BASE}/leaves/employee/${user.randomId}/status`)
    const list = await res.json()
    if (!Array.isArray(list) || list.length === 0) {
      document.getElementById("statusList").innerHTML = "<p>No items to show.</p>"
      return
    }
    let html = ""
    list.forEach((l) => {
      html += `<div style="border:1px solid #eee;padding:10px;margin-bottom:8px;border-radius:6px;">
        <strong>${escapeHtml(l.subject || "No subject")}</strong>
        <div class="muted">From: ${escapeHtml(l.startDate || "-")} To: ${escapeHtml(l.endDate || "-")}</div>
        <div>${escapeHtml(l.body || "")}</div>
        <div style="margin-top:8px">Status: <strong>${l.status}</strong></div>`
      if (l.status === "ACCEPTED" || l.status === "REJECTED") {
        html += `<div style="margin-top:8px"><button class="btn btn-primary okbtn" onclick="ack('${l.id}')">OK</button></div>`
      }
      html += `</div>`
    })
    document.getElementById("statusList").innerHTML = html
  } catch (e) {
    console.error(e)
    document.getElementById("statusList").innerText = "Failed to load status"
  }
}

async function ack(id) {
  try {
    const res = await fetch(`${API_BASE}/leaves/acknowledge/${id}`, { method: "POST" })
    if (res.ok) {
      renderStatus()
    } else {
      alert("Failed to acknowledge")
    }
  } catch (e) {
    console.error(e)
    alert("Error")
  }
}

// ---------------- HISTORY ----------------
async function renderHistory() {
  content.innerHTML = `
    <h3>History</h3>
    <div style="display:flex;gap:10px;margin-bottom:10px;">
      <select id="histStatus"><option value="">All</option><option>ACCEPTED</option><option>REJECTED</option></select>
      <select id="histYear"><option value="">All years</option></select>
      <button id="histFilter" class="btn btn-outline">Filter</button>
    </div>
    <div id="histResults">Loading...</div>
  `

  const yearSelect = document.getElementById("histYear")
  const now = new Date()
  const current = now.getFullYear()
  for (let y = current; y >= current - 5; y--) {
    const opt = document.createElement("option")
    opt.value = y
    opt.textContent = y
    yearSelect.appendChild(opt)
  }

  document.getElementById("histFilter").addEventListener("click", async () => {
    const status = document.getElementById("histStatus").value
    const year = document.getElementById("histYear").value
    let url = `${API_BASE}/leaves/employee/${user.randomId}/history`
    const params = []
    if (status) params.push("status=" + encodeURIComponent(status))
    if (year) params.push("year=" + encodeURIComponent(year))
    if (params.length) url += "?" + params.join("&")
    try {
      const res = await fetch(url)
      const data = await res.json()
      renderHistoryResults(data)
    } catch (e) {
      document.getElementById("histResults").innerText = "Error loading history"
    }
  })

  document.getElementById("histFilter").click()
}

function renderHistoryResults(list) {
  const container = document.getElementById("histResults")
  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = "<p>No history found.</p>"
    return
  }
  let html = ""
  list.forEach((l) => {
    const badgeClass =
      l.status === "ACCEPTED" ? "badge badge-accepted" : l.status === "REJECTED" ? "badge badge-rejected" : "badge"
    html += `<div style="border:1px solid #eee;padding:8px;border-radius:6px;margin-bottom:8px;">
      <strong>${escapeHtml(l.subject)}</strong>
      <div class="muted">From ${escapeHtml(l.startDate || "-")} To ${escapeHtml(l.endDate || "-")}</div>
      <div>${escapeHtml(l.body || "")}</div>
      <div>Status: <span class="${badgeClass}">${l.status}</span></div>
    </div>`
  })
  container.innerHTML = html
}

// ---------------- PROFILE ----------------
function renderProfile() {
  content.innerHTML = `
    <h3>Profile</h3>
    <section class="profile-section">
      <div class="profile-card">
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Name</div><div class="info-value" id="profName">${escapeHtml(user.name)}</div></div>
          <div class="info-item"><div class="info-label">Email</div><div class="info-value">${escapeHtml(user.email)}</div></div>
          <div class="info-item"><div class="info-label">ID</div><div class="info-value">${user.randomId}</div></div>
          <div class="info-item"><div class="info-label">Gender</div><div class="info-value">${escapeHtml(user.gender) || "-"}</div></div>
          <div class="info-item"><div class="info-label">Age</div><div class="info-value">${user.age != null ? escapeHtml(user.age) : "-"}</div></div>
        </div>
      </div>

      <div class="profile-card">
        <div class="profile-actions">
          <button id="editProfile" class="btn btn-outline">Edit Profile</button>
          <button id="changePass" class="btn btn-outline">Change Password</button>
        </div>

        <div id="profileEdit" style="display:none;margin-top:12px">
          <div class="form-row"><label>Name</label><input id="editName" value="${escapeHtml(user.name)}" /></div>
          <div class="radio-input"> Gender
  <label class="label">
    <input type="radio" name="editGender" value="Male" ${user.gender === "Male" ? "checked" : ""} />
    <p class="text">Male</p>
  </label>
  <label class="label">
    <input type="radio" name="editGender" value="Female" ${user.gender === "Female" ? "checked" : ""} />
    <p class="text">Female</p>
  </label>
  <label class="label">
    <input type="radio" name="editGender" value="Other" ${user.gender === "Other" ? "checked" : ""} />
    <p class="text">Other</p>
  </label>
</div>

          <div class="form-row"><label>Age</label><input id="editAge" type="number" value="${user.age || ""}" /></div>
          <div class="inline" style="margin-top:10px">
            <button id="saveProfile" class="btn btn-primary okbtn">Save changes</button>
            <button id="cancelProfile" class="btn btn-outline">Cancel</button>
          </div>
          <p id="profileMsg" class="muted"></p>
        </div>
      </div>
    </section>
  `

  document.getElementById("editProfile").addEventListener("click", () => {
    document.getElementById("profileEdit").style.display = "block"
  })
  document.getElementById("saveProfile").addEventListener("click", saveProfile)
  document.getElementById("changePass").addEventListener("click", showChangePass)
  document.getElementById("cancelProfile").addEventListener("click", () => {
    document.getElementById("editName").value = user.name
    const genderInput = document.querySelector(`input[name="editGender"][value="${user.gender || ""}"]`)
    document.querySelectorAll('input[name="editGender"]').forEach((el) => (el.checked = false))
    if (genderInput) genderInput.checked = true
    document.getElementById("editAge").value = user.age || ""
    document.getElementById("profileMsg").innerText = ""
    document.getElementById("profileEdit").style.display = "none"
  })
}

async function saveProfile() {
  const name = document.getElementById("editName").value
  const gender = document.querySelector('input[name="editGender"]:checked')?.value || null
  const ageVal = document.getElementById("editAge").value
  const age = ageVal ? Number.parseInt(ageVal) : null

  if (!name || name.trim() === "") {
    document.getElementById("profileMsg").innerText = "Name cannot be empty"
    return
  }

  try {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, name, gender, age }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "error" }))
      document.getElementById("profileMsg").innerText = err.error || "Failed"
      return
    }
    const updated = await res.json()
    localStorage.setItem("user", JSON.stringify(updated))
    document.getElementById("profileMsg").innerText = "Saved!"
    setTimeout(() => {
      document.getElementById("profileEdit").style.display = "none"
      window.location.reload()
    }, 700)
  } catch (e) {
    console.error(e)
    document.getElementById("profileMsg").innerText = "Error saving"
  }
}

// change password flow
function showChangePass() {
  content.innerHTML = `
    <h3>Change Password</h3>
    <div class="form-row"><input id="newPassword" type="password" placeholder="New password"></div>
    <div style="margin-top:8px" class="inline">
      <button id="sendChangeOtp" class="btn btn-primary okbtn">Send OTP to Email</button>
      <button id="cancelChangePass" class="btn btn-outline">Cancel</button>
    </div>
    <div id="otpSection" style="display:none;margin-top:8px">
      <div class="form-row"><input id="changeOtp" placeholder="Enter OTP"></div>
      <div style="margin-top:8px" class="inline">
        <button id="confirmChange" class="btn btn-primary okbtn">Change Password</button>
        <button id="cancelChangePass2" class="btn btn-outline">Cancel</button>
      </div>
      <p id="changeMsg" class="muted"></p>
    </div>
  `

  document.getElementById("sendChangeOtp").addEventListener("click", async () => {
    const newPassword = document.getElementById("newPassword").value
    if (!newPassword) {
      alert("Enter new password first")
      return
    }
    try {
      const res = await fetch(`${API_BASE}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, newPassword }),
      })
      const data = await res.json()
      document.getElementById("changeMsg").innerText = data.message || data.error
      if (res.ok) document.getElementById("otpSection").style.display = "block"
    } catch (e) {
      console.error(e)
      document.getElementById("changeMsg").innerText = "Failed to send OTP"
    }
  })

  document.getElementById("confirmChange").addEventListener("click", confirmChangePassword)
  // cancel takes back to profile screen without committing
  const cancelBack = () => renderProfile()
  document.getElementById("cancelChangePass").addEventListener("click", cancelBack)
  document.getElementById("cancelChangePass2").addEventListener("click", cancelBack)
}

async function confirmChangePassword() {
  const otp = document.getElementById("changeOtp").value
  const newPassword = document.getElementById("newPassword").value
  if (!otp || !newPassword) {
    document.getElementById("changeMsg").innerText = "OTP and new password required"
    return
  }
  try {
    const res = await fetch(`${API_BASE}/users/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, otp, newPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      alert("Password changed. Please login again.")
      localStorage.removeItem("user")
      window.location.href = "index.html"
    } else {
      document.getElementById("changeMsg").innerText = data.error
    }
  } catch (e) {
    console.error(e)
    document.getElementById("changeMsg").innerText = "Failed to change password"
  }
}

// ---------------- Modal ----------------
function showModal(title, message, okText, okHandler) {
  modalContainer.style.display = "block"
  modalContainer.innerHTML = `<div class="modal"><div class="box"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p><div style="margin-top:12px"><button class="btn btn-primary okbtn" id="modalOk">${okText}</button></div></div></div>`
  document.getElementById("modalOk").addEventListener("click", okHandler)
}
function hideModal() {
  modalContainer.style.display = "none"
  modalContainer.innerHTML = ""
}

// simple escape
function escapeHtml(s) {
  if (!s && s !== 0) return ""
  return String(s).replace(
    /[&<>"']/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
  )
}






