document.getElementById("payBtn")?.addEventListener("click", function() {
  const amountInput = document.getElementById("amount").value;
  const amount = parseInt(amountInput) * 100; // convert to paise

  if (!amount || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  var options = {
    key: "rzp_test_RU4Dbct7tQgcnY",
    amount: amount,
    currency: "INR",
    name: "Solithix Studio",
    description: "Payment for branding services",
    image: "assets/logo.png",
    handler: function (response) {
      alert("Payment Successful!\nPayment ID: " + response.razorpay_payment_id);
    },
    prefill: {
      name: "Uddhav Taur",
      email: "uddhav@example.com",
      contact: "9022954025",
    },
    theme: {
      color: "#0078ff",
    },
  };

  var rzp1 = new Razorpay(options);
  rzp1.open();
});

document.getElementById("payBtn").onclick = function (e) {
  e.preventDefault();

  const clientName = document.getElementById("clientName").value;
  const projectName = document.getElementById("projectName").value;
  const clientEmail = document.getElementById("clientEmail").value;
  const clientAddress = document.getElementById("clientAddress").value;
  const deadline = document.getElementById("deadline").value;
  const amount = document.getElementById("amount").value;

  if (!clientName || !projectName || !clientEmail || !clientAddress || !deadline || !amount) {
    alert("Please fill all fields before proceeding!");
    return;
  }

  const options = {
    key: "rzp_test_RU4Dbct7tQgcnY",
    amount: amount * 100,
    currency: "INR",
    name: "Solithix Technologies",
    description: projectName,
    handler: function (response) {
      document.querySelector(".form-container").classList.add("hidden");
      const receipt = document.getElementById("receipt");
      receipt.classList.remove("hidden");

      document.getElementById("rName").textContent = clientName;
      document.getElementById("rProject").textContent = projectName;
      document.getElementById("rEmail").textContent = clientEmail;
      document.getElementById("rAddress").textContent = clientAddress;
      document.getElementById("rDeadline").textContent = deadline;
      document.getElementById("rAmount").textContent = amount;
      document.getElementById("rPaymentID").textContent = response.razorpay_payment_id;
      document.getElementById("rDate").textContent = new Date().toLocaleString();

      alert("Payment Successful! Receipt generated below.");
    },
    prefill: {
      name: clientName,
      email: clientEmail,
      contact: "",
    },
    theme: {
      color: "#00bcd4",
    },
  };

  const rzp = new Razorpay(options);
  rzp.open();
};


