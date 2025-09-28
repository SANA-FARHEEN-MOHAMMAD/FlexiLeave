// Manager page behavior
// user = { id, name, email, randomId, role }

const API_BASE = "/api"
const modalContainer = document.getElementById("modalContainer") // Declare modalContainer here

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
  document.getElementById("welcomeTitle").innerText = `Welcome, Manager ${user.name}`
  document.getElementById("userId").innerText = user.randomId
  document.getElementById("userEmail").innerText = user.email
}

// NAV buttons
const btnRequests = document.getElementById("btnRequests")
const btnLookup = document.getElementById("btnLookup")
const btnHistory = document.getElementById("btnHistory")
const btnProfile = document.getElementById("btnProfile")
const logoutBtn = document.getElementById("logoutBtn")
const content = document.getElementById("content")
const initialMsg = document.getElementById("initialMsg")

btnRequests.addEventListener("click", () => showSection("requests"))
btnLookup.addEventListener("click", () => showSection("lookup"))
btnHistory.addEventListener("click", () => showSection("history"))
btnProfile.addEventListener("click", () => showSection("profile"))

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("user")
  window.location.href = "index.html"
})

function setActive(button) {
  ;[btnRequests, btnLookup, btnHistory, btnProfile].forEach((b) => {
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

  if (name === "requests") {
    setActive(btnRequests)
    renderRequests()
  } else if (name === "lookup") {
    setActive(btnLookup)
    renderLookup()
  } else if (name === "history") {
    setActive(btnHistory)
    renderHistory()
  } else if (name === "profile") {
    setActive(btnProfile)
    renderProfile()
  }
}

// ---------------- PENDING REQUESTS ----------------
async function renderRequests() {
  content.innerHTML = `<h3>Pending Leave Requests</h3><div id="reqList">Loading...</div>`
  try {
    const res = await fetch(`${API_BASE}/leaves/manager/${user.randomId}/pending`)
    const list = await res.json()
    if (!Array.isArray(list) || list.length === 0) {
      document.getElementById("reqList").innerHTML = "<p>No pending requests.</p>"
      return
    }
    let html = ""
    list.forEach((l) => {
      html += `<div style="border:1px solid #eee;padding:10px;margin-bottom:8px;border-radius:6px;">
        <strong>Employee: ${l.employeeId}</strong>
        <div class="muted">Subject: ${escapeHtml(l.subject || "No subject")}</div>
        <div class="muted">From: ${escapeHtml(l.startDate || "-")} To: ${escapeHtml(l.endDate || "-")}</div>
        <div>${escapeHtml(l.body || "")}</div>
        <div style="margin-top:8px">
          <button class="btn btn-primary okbtn" onclick="decideLeave('${l.id}','ACCEPTED','${l.employeeEmail}')"><span class="icon">✓</span> Approve</button>
          <button class="btn cancelbtn" onclick="decideLeave('${l.id}','REJECTED','${l.employeeEmail}')"><span class="icon">✕</span> Reject</button>
        </div>
      </div>`
    })
    document.getElementById("reqList").innerHTML = html
  } catch (e) {
    console.error(e)
    document.getElementById("reqList").innerText = "Failed to load requests"
  }
}

async function decideLeave(id, decision, empEmail) {
  try {
    const res = await fetch(`${API_BASE}/leaves/manager/update/${id}?status=${decision}`, {
      method: "PATCH",
    })
    if (res.ok) {
      // send mail notification (ensure mail endpoint exists on backend)
      await fetch(`${API_BASE}/mail/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: empEmail,
          subject: `Your leave request has been : ${decision}`,
          body: `Hello, your leave request was ${decision} by manager ${user.name}.\n\nClick OK in your status section to confirm the acknowledgement.`,
        }),
      })
      renderRequests()
    } else {
      alert("Failed to update status")
    }
  } catch (e) {
    console.error(e)
    alert("Error")
  }
}

// ---------------- LOOKUP EMPLOYEES ----------------
function renderLookup() {
  content.innerHTML = `
    <h3>Lookup Employees</h3>
    <div class="form-row"><input id="searchTerm" placeholder="Enter Employee ID or Name"></div>
    <div style="margin-top:8px"><button id="lookupBtn" class="btn btn-primary okbtn"><span class="icon">🔍</span> Search</button></div>
    <div id="lookupResults" style="margin-top:12px;"></div>

    <div id="lookupDemo" style="position:fixed; bottom:20px; right:20px; z-index:1000;">
      <button id="tryDemoBtn" class="btn btn-outline small-btn">Try Demo</button>
      <div id="demoContent" style="display:none; position:absolute; bottom:40px; right:0; background:#fff; border:1px solid #ccc; padding:10px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.2); width:220px;">
        Demo Employee ID: <strong>6043</strong><br>
        Demo Employee Name: <strong>e_sana</strong><br>
        <p style="font-size:0.8rem; margin-top:4px;">You can signup as a Employee and test by entering your ID / name here.</p>
      </div>
    </div>
  `

  document.getElementById("lookupBtn").addEventListener("click", async () => {
    const term = document.getElementById("searchTerm").value.trim()
    if (!term) {
      alert("Enter something")
      return
    }
    try {
      const res = await fetch(`${API_BASE}/users/search?term=${encodeURIComponent(term)}`)
      const list = await res.json()
      if (!Array.isArray(list) || list.length === 0) {
        document.getElementById("lookupResults").innerHTML = "<p>No users found</p>"
        return
      }
      let html = ""
      list.forEach((u) => {
        html += `<div style="border:1px solid #eee;padding:8px;margin-bottom:6px;border-radius:6px;">
          <div><strong>ID: ${u.randomId}</strong></div>
          <div>Name: ${escapeHtml(u.name)}</div>
          <div>Email: ${escapeHtml(u.email)}</div>
          <div>Gender: ${u.gender || "-"}</div>
          <div>Age: ${u.age != null ? u.age : "-"}</div>
          <button class="btn btn-primary okbtn" onclick="sendMail('${u.email}')">Send Mail</button>
        </div>`
      })
      document.getElementById("lookupResults").innerHTML = html
    } catch (e) {
      console.error(e)
      document.getElementById("lookupResults").innerText = "Error searching users"
    }
  })

  document.getElementById("tryDemoBtn").addEventListener("click", () => {
    const demoContent = document.getElementById("demoContent")
    demoContent.style.display = demoContent.style.display === "block" ? "none" : "block"
  })
}

function sendMail(toEmail) {
  const modalHtml = `
    <div class="modal" id="mailModal">
      <div class="box">
        <h3>Send Mail</h3>
        <div class="form-row"><input id="mailSubject" placeholder="Subject"></div>
        <div class="form-row"><textarea id="mailBody" placeholder="Message" rows="5"></textarea></div>
        <div style="margin-top:12px">
          <button id="sendMailBtn" class="btn btn-primary okbtn">Send</button>
          <button id="cancelMailBtn" class="btn cancelbtn">Cancel</button>
        </div>
      </div>
    </div>
  `
  modalContainer.innerHTML = modalHtml
  modalContainer.style.display = "block"

  document.getElementById("sendMailBtn").addEventListener("click", async () => {
    const subject = document.getElementById("mailSubject").value.trim()
    const body = document.getElementById("mailBody").value.trim()
    if (!subject || !body) {
      alert("Fill both fields")
      return
    }
    try {
      const res = await fetch(`${API_BASE}/mail/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: toEmail, subject, body }),
      })
      const data = await res.json()
      alert(data.message || "Mail sent successfully")
      modalContainer.style.display = "none"
      modalContainer.innerHTML = ""
    } catch (e) {
      console.error(e)
      alert("Failed to send mail")
    }
  })

  document.getElementById("cancelMailBtn").addEventListener("click", () => {
    modalContainer.style.display = "none"
    modalContainer.innerHTML = ""
  })
}

// ---------------- HISTORY ----------------
async function renderHistory() {
  content.innerHTML = `
    <h3>Decision History</h3>
    <div class="form-row inline" style="margin-bottom:12px;">
      <select id="filterYear">
        <option value="">All Years</option>
      </select>
      <select id="filterStatus">
        <option value="">All Status</option>
        <option value="ACCEPTED">Accepted</option>
        <option value="REJECTED">Rejected</option>
      </select>
      <button id="applyFilters" class="btn btn-outline">Apply Filters</button>
    </div>
    <div id="histList">Loading...</div>
  `

  try {
    const res = await fetch(`${API_BASE}/leaves/manager/${user.randomId}/history`)
    const list = await res.json()

    if (!Array.isArray(list) || list.length === 0) {
      document.getElementById("histList").innerHTML = "<p>No history</p>"
      return
    }

    const years = [...new Set(list.map((l) => new Date(l.startDate).getFullYear()))]
    const yearSelect = document.getElementById("filterYear")
    years.forEach((y) => {
      const opt = document.createElement("option")
      opt.value = y
      opt.innerText = y
      yearSelect.appendChild(opt)
    })

    function renderFilteredHistory() {
      const selectedYear = document.getElementById("filterYear").value
      const selectedStatus = document.getElementById("filterStatus").value

      let filtered = list
      if (selectedYear) {
        filtered = filtered.filter((l) => new Date(l.startDate).getFullYear().toString() === selectedYear)
      }
      if (selectedStatus) {
        filtered = filtered.filter((l) => l.status === selectedStatus)
      }

      if (filtered.length === 0) {
        document.getElementById("histList").innerHTML = "<p>No history found</p>"
        return
      }

      let html = ""
      filtered.forEach((l) => {
        const badgeClass =
          l.status === "ACCEPTED" ? "badge badge-accepted" : l.status === "REJECTED" ? "badge badge-rejected" : "badge"
        html += `<div style="border:1px solid #eee;padding:8px;border-radius:6px;margin-bottom:8px;">
          <strong>${escapeHtml(l.employeeId)}</strong>
          <div>Reason: ${escapeHtml(l.subject || "")}</div>
          <div>From: ${escapeHtml(l.startDate || "-")} </div>
          <div>To: ${escapeHtml(l.endDate || "-")}</div>
          <div>Status: <span class="${badgeClass}">${l.status}</span></div>
        </div>`
      })
      document.getElementById("histList").innerHTML = html
    }

    renderFilteredHistory()
    document.getElementById("applyFilters").addEventListener("click", renderFilteredHistory)
  } catch (e) {
    console.error(e)
    document.getElementById("histList").innerText = "Error loading history"
  }
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


