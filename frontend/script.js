document.getElementById("mpesaForm").addEventListener("submit", function (e) {
  e.preventDefault();

  let phone = document.getElementById("phone").value.trim();
  const amount = document.getElementById("amount").value.trim();
  const status = document.getElementById("status");
  const spinner = document.getElementById("spinner");
  const submitBtn = document.getElementById("submitBtn");

  // Accepts 9-digit phone numbers starting with 7 or 1
  const phonePattern = /^(7|1)\d{8}$/;
  const amountPattern = /^[1-9]\d{0,12}$/;

  status.textContent = "";
  status.className = "";

  if (!phonePattern.test(phone)) {
    showError("❌ Phone number must start with 7 or 1 and be 9 digits.");
    return;
  }

  if (!amountPattern.test(amount)) {
    showError("❌ Enter a valid amount (numeric only, no leading 0).");
    return;
  }

  // Add country code
  phone = "254" + phone;

  console.log("Formatted Phone:", phone);
  console.log("Amount:", amount);

  submitBtn.disabled = true;
  spinner.style.display = "block";

  fetch('http://localhost:3000/api/stkpush', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, amount })
  })
    .then(response => response.json())
    .then(data => {
      spinner.style.display = "none";
      submitBtn.disabled = false;

      if (data.response && data.response.ResponseCode === "0") {
        showSuccess("✅ Payment initiated. Check your phone.");
        document.getElementById("mpesaForm").reset();
      } else {
        showError("❌ Error: " + (data.response?.ResponseDescription || data.error || "Unknown error"));
      }
    })
    .catch((error) => {
      spinner.style.display = "none";
      submitBtn.disabled = false;
      console.error("Error during STK Push:", error);
      showError("❌ Request failed. Please check your network or backend.");
    });

  function showSuccess(message) {
    status.textContent = message;
    status.className = "success-message";
  }

  function showError(message) {
    status.textContent = message;
    status.className = "error-message";
  }
});
