document.addEventListener('DOMContentLoaded', function() {
  const payBtn = document.getElementById('payBtn');
  if (!payBtn) return;

  payBtn.addEventListener('click', function(e) {
    e.preventDefault();

    const clientName = document.getElementById('clientName')?.value?.trim();
    const projectName = document.getElementById('projectName')?.value?.trim();
    const clientEmail = document.getElementById('clientEmail')?.value?.trim();
    const clientAddress = document.getElementById('clientAddress')?.value?.trim();
    const deadline = document.getElementById('deadline')?.value;
    const amountInput = document.getElementById('amount')?.value?.trim();
    const amount = parseInt(amountInput);

    // Validate inputs
    if (!clientName || !projectName || !clientEmail || !clientAddress || !deadline || !amountInput) {
      alert('Please fill all required fields before proceeding!');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    // In a production environment, this key should come from your backend
    const options = {
      key: 'rzp_test_RU4Dbct7tQgcnY', // Move this to environment variables in production
      amount: amount * 100, // convert to paise
      currency: 'INR',
      name: 'Solithix Technologies',
      description: projectName,
      image: 'icons/icon-192x192.png', // Using the PWA icon instead of non-existent assets/logo.png
      handler: function(response) {
        try {
          document.querySelector('.form-container')?.classList.add('hidden');
          const receipt = document.getElementById('receipt');
          if (receipt) receipt.classList.remove('hidden');

          // Update receipt details
          const receiptFields = {
            'rName': clientName,
            'rProject': projectName,
            'rEmail': clientEmail,
            'rAddress': clientAddress,
            'rDeadline': deadline,
            'rAmount': amount.toLocaleString('en-IN'),
            'rPaymentID': response.razorpay_payment_id || 'N/A',
            'rDate': new Date().toLocaleString(),
            'rReceipt': 'SOL' + Date.now().toString().slice(-6)
          };

          Object.entries(receiptFields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
          });

          // Save the record
          savePaymentRecord({
            receiptId: receiptFields.rReceipt,
            clientName,
            projectName,
            clientEmail,
            clientAddress,
            deadline,
            amount,
            paymentId: response.razorpay_payment_id,
            date: receiptFields.rDate
          });

        } catch (error) {
          console.error('Error processing payment:', error);
          alert('Payment was successful but there was an error generating the receipt. Please contact support with payment ID: ' + (response.razorpay_payment_id || 'unknown'));
        }
      },
      prefill: {
        name: clientName,
        email: clientEmail,
        contact: ''
      },
      theme: {
        color: '#00bcd4'
      },
      modal: {
        ondismiss: function() {
          console.log('Payment window closed');
        }
      }
    };

    try {
      const rzp = new Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', function(response) {
        console.error('Payment failed:', response.error);
        alert('Payment failed. Please try again or contact support. Error: ' + (response.error.description || 'Unknown error'));
      });
    } catch (error) {
      console.error('Error initializing Razorpay:', error);
      alert('Error initializing payment. Please try again later.');
    }
  });

  // Logout functionality
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('isLoggedIn');
      window.location.href = 'index.html';
    });
  }
});

// Save payment record to localStorage
function savePaymentRecord(record) {
  try {
    const records = JSON.parse(localStorage.getItem('paymentRecords') || '[]');
    records.push(record);
    localStorage.setItem('paymentRecords', JSON.stringify(records));
  } catch (error) {
    console.error('Error saving payment record:', error);
  }
}

// Load and display payment records
function loadPaymentRecords() {
  try {
    const records = JSON.parse(localStorage.getItem('paymentRecords') || '[]');
    const recordsContainer = document.getElementById('records');
    
    if (!recordsContainer || !records.length) return;

    const table = document.createElement('table');
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
        ${records.map(record => `
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
          </tr>
        `).join('')}
      </tbody>
    `;

    recordsContainer.innerHTML = '';
    recordsContainer.appendChild(table);

    // Add event listeners for view receipt buttons
    document.querySelectorAll('.view-receipt').forEach(btn => {
      btn.addEventListener('click', function() {
        const record = JSON.parse(this.getAttribute('data-receipt'));
        showReceipt(record);
      });
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this record?')) {
          const receiptId = this.getAttribute('data-id');
          deleteRecord(receiptId);
        }
      });
    });
  } catch (error) {
    console.error('Error loading payment records:', error);
  }
}

function showReceipt(record) {
  const receipt = document.getElementById('receipt');
  if (!receipt) return;

  document.querySelector('.form-container')?.classList.add('hidden');
  receipt.classList.remove('hidden');

  const receiptFields = {
    'rName': record.clientName,
    'rProject': record.projectName,
    'rEmail': record.clientEmail,
    'rAddress': record.clientAddress,
    'rDeadline': record.deadline,
    'rAmount': record.amount,
    'rPaymentID': record.paymentId,
    'rDate': record.date,
    'rReceipt': record.receiptId
  };

  Object.entries(receiptFields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

function deleteRecord(receiptId) {
  try {
    const records = JSON.parse(localStorage.getItem('paymentRecords') || '[]');
    const updatedRecords = records.filter(record => record.receiptId !== receiptId);
    
    if (updatedRecords.length < records.length) {
      localStorage.setItem('paymentRecords', JSON.stringify(updatedRecords));
      loadPaymentRecords();
      alert('Record deleted successfully');
    }
  } catch (error) {
    console.error('Error deleting record:', error);
    alert('Error deleting record. Please try again.');
  }
}

// Load records when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPaymentRecords);
} else {
  loadPaymentRecords();
}

