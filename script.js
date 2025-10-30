// ===============================
// ✅ REGISTER SERVICE WORKER + NOTIFICATIONS
// ===============================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => console.log("✅ Service Worker registered"))
    .catch((err) => console.error("❌ Service Worker registration failed:", err));
}

if ("Notification" in window && navigator.serviceWorker) {
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      console.log("🔔 Notifications allowed");
    } else {
      console.log("🚫 Notifications denied");
    }
  });
}

// ===============================
// 💳 PAYMENT + RECEIPT LOGIC
// ===============================
document.addEventListener("DOMContentLoaded", function () {
  const payBtn = document.getElementById("payBtn");
  if (!payBtn) return;

  payBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const clientName = document.getElementById("clientName")?.value?.trim();
    const projectName = document.getElementById("projectName")?.value?.trim();
    const clientEmail = document.getElementById("clientEmail")?.value?.trim();
    const clientAddress = document.getElementById("clientAddress")?.value?.trim();
    const deadline = document.getElementById("deadline")?.value;
    const amountInput = document.getElementById("amount")?.value?.trim();
    const amount = parseInt(amountInput);

    if (!clientName || !projectName || !clientEmail || !clientAddress || !deadline || !amountInput) {
      alert("Please fill all required fields before proceeding!");
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const options = {
      key: "rzp_test_RU4Dbct7tQgcnY", // test key
      amount: amount * 100,
      currency: "INR",
      name: "Solithix Technologies",
      description: projectName,
      image: "icons/icon-192x192.png",
      handler: function (response) {
        try {
          document.querySelector(".form-container")?.classList.add("hidden");
          const receipt = document.getElementById("receipt");
          if (receipt) receipt.classList.remove("hidden");

          const receiptFields = {
            rName: clientName,
            rProject: projectName,
            rEmail: clientEmail,
            rAddress: clientAddress,
            rDeadline: deadline,
            rAmount: amount.toLocaleString("en-IN"),
            rPaymentID: response.razorpay_payment_id || "N/A",
            rDate: new Date().toLocaleString(),
            rReceipt: "SOL" + Date.now().toString().slice(-6),
          };

          Object.entries(receiptFields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
          });

          savePaymentRecord({
            receiptId: receiptFields.rReceipt,
            clientName,
            projectName,
            clientEmail,
            clientAddress,
            deadline,
            amount,
            paymentId: response.razorpay_payment_id,
            date: receiptFields.rDate,
          });

          // ✅ Show notification after payment
          if (Notification.permission === "granted") {
            navigator.serviceWorker.getRegistration().then((reg) => {
              if (reg) {
                reg.showNotification("Payment Successful 💰", {
                  body: `Thank you ${clientName}, your payment for ${projectName} was successful.`,
                  icon: "icons/icon-192x192.png",
                });
              }
            });
          }
        } catch (error) {
          console.error("Error processing payment:", error);
          alert(
            "Payment was successful but there was an error generating the receipt. Please contact support with payment ID: " +
              (response.razorpay_payment_id || "unknown")
          );
        }
      },
      prefill: {
        name: clientName,
        email: clientEmail,
        contact: "",
      },
      theme: { color: "#00bcd4" },
      modal: {
        ondismiss: function () {
          console.log("Payment window closed");
        },
      },
    };

    try {
      const rzp = new Razorpay(options);
      rzp.open();
      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        alert(
          "Payment failed. Please try again or contact support. Error: " +
            (response.error.description || "Unknown error")
        );
      });
    } catch (error) {
      console.error("Error initializing Razorpay:", error);
      alert("Error initializing payment. Please try again later.");
    }
  });

  // Logout functionality
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("isLoggedIn");
      window.location.href = "index.html";
    });
  }
});

// ===============================
// 🗂️ LOCAL STORAGE FUNCTIONS
// ===============================
function savePaymentRecord(record) {
  try {
    const records = JSON.parse(localStorage.getItem("paymentRecords") || "[]");
    records.push(record);
    localStorage.setItem("paymentRecords", JSON.stringify(records));
  } catch (error) {
    console.error("Error saving payment record:", error);
  }
}

function loadPaymentRecords() {
  try {
    const records = JSON.parse(localStorage.getItem("paymentRecords") || "[]");
    const recordsContainer = document.getElementById("records");

    if (!recordsContainer || !records.length) return;

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Receipt No</th>
          <th>Client Name</th>
          <th>Project</th>
          <th>Amount (₹)</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${records
          .map(
            (record) => `
          <tr>
            <td>${record.receiptId}</td>
            <td>${record.clientName}</td>
            <td>${record.projectName}</td>
            <td>${record.amount}</td>
            <td>${new Date(record.date).toLocaleDateString()}</td>
            <td>
              <button class="btn view-receipt" data-receipt='${JSON.stringify(record)}'>View</button>
              <button class="delete-btn" data-id="${record.receiptId}">Delete</button>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    `;

    recordsContainer.innerHTML = "";
    recordsContainer.appendChild(table);

    document.querySelectorAll(".view-receipt").forEach((btn) => {
      btn.addEventListener("click", function () {
        const record = JSON.parse(this.getAttribute("data-receipt"));
        showReceipt(record);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        if (confirm("Are you sure you want to delete this record?")) {
          const receiptId = this.getAttribute("data-id");
          deleteRecord(receiptId);
        }
      });
    });
  } catch (error) {
    console.error("Error loading payment records:", error);
  }
}

function showReceipt(record) {
  const receipt = document.getElementById("receipt");
  if (!receipt) return;

  document.querySelector(".form-container")?.classList.add("hidden");
  receipt.classList.remove("hidden");

  const receiptFields = {
    rName: record.clientName,
    rProject: record.projectName,
    rEmail: record.clientEmail,
    rAddress: record.clientAddress,
    rDeadline: record.deadline,
    rAmount: record.amount,
    rPaymentID: record.paymentId,
    rDate: record.date,
    rReceipt: record.receiptId,
  };

  Object.entries(receiptFields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

function deleteRecord(receiptId) {
  try {
    const records = JSON.parse(localStorage.getItem("paymentRecords") || "[]");
    const updatedRecords = records.filter((r) => r.receiptId !== receiptId);

    if (updatedRecords.length < records.length) {
      localStorage.setItem("paymentRecords", JSON.stringify(updatedRecords));
      loadPaymentRecords();
      alert("Record deleted successfully");
    }
  } catch (error) {
    console.error("Error deleting record:", error);
    alert("Error deleting record. Please try again.");
  }
}

// Load records when the page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadPaymentRecords);
} else {
  loadPaymentRecords();
}