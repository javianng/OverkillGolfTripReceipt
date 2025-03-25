let expenditures = [];
let payments = [];
let chart = null;
let title = "Split Bill Calculator";

// Initialize the application
window.onload = function() {
    // Check if there are URL parameters to load
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('data')) {
        const data = JSON.parse(decodeURIComponent(urlParams.get('data')));
        expenditures = data.expenditures || [];
        payments = data.payments || [];
        title = data.title || "Split Bill Calculator";
        document.getElementById('mainTitle').textContent = title;
        document.title = title;
        updateUI();
    }
};

function makeEditable(element) {
    element.contentEditable = true;
    element.classList.add('editing');
    element.focus();

    // Save on enter key
    element.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            element.blur();
        }
    });

    // Save on blur
    element.addEventListener('blur', function() {
        element.contentEditable = false;
        element.classList.remove('editing');
        title = element.textContent;
        document.title = title;
    });
}

function addExpenditure() {
    const expendituresList = document.getElementById('expendituresList');
    const id = Date.now();
    
    const expenditureHtml = `
        <div class="expenditure-item" id="exp-${id}">
            <span class="delete-btn" onclick="deleteExpenditure(${id})">×</span>
            <input type="text" class="form-control mb-2" placeholder="Description" onchange="updateExpenditure(${id})">
            <input type="number" class="form-control" placeholder="Amount" step="0.01" onchange="updateExpenditure(${id})">
        </div>
    `;
    
    expendituresList.insertAdjacentHTML('beforeend', expenditureHtml);
    expenditures.push({ id, description: '', amount: 0 });
}

function addPayment() {
    const paymentsList = document.getElementById('paymentsList');
    const id = Date.now();
    
    const paymentHtml = `
        <div class="payment-item" id="pay-${id}">
            <span class="delete-btn" onclick="deletePayment(${id})">×</span>
            <input type="text" class="form-control mb-2" placeholder="Person Name" onchange="updatePayment(${id})">
            <input type="number" class="form-control" placeholder="Amount Paid" step="0.01" onchange="updatePayment(${id})">
        </div>
    `;
    
    paymentsList.insertAdjacentHTML('beforeend', paymentHtml);
    payments.push({ id, name: '', amount: 0 });
}

function updateExpenditure(id) {
    const expDiv = document.getElementById(`exp-${id}`);
    const inputs = expDiv.getElementsByTagName('input');
    const index = expenditures.findIndex(e => e.id === id);
    
    if (index !== -1) {
        expenditures[index] = {
            id,
            description: inputs[0].value,
            amount: parseFloat(inputs[1].value) || 0
        };
        updateCalculations();
    }
}

function updatePayment(id) {
    const payDiv = document.getElementById(`pay-${id}`);
    const inputs = payDiv.getElementsByTagName('input');
    const index = payments.findIndex(p => p.id === id);
    
    if (index !== -1) {
        payments[index] = {
            id,
            name: inputs[0].value,
            amount: parseFloat(inputs[1].value) || 0
        };
        updateCalculations();
    }
}

function deleteExpenditure(id) {
    document.getElementById(`exp-${id}`).remove();
    expenditures = expenditures.filter(e => e.id !== id);
    updateCalculations();
}

function deletePayment(id) {
    document.getElementById(`pay-${id}`).remove();
    payments = payments.filter(p => p.id !== id);
    updateCalculations();
}

function updateUI() {
    // Clear existing items
    document.getElementById('expendituresList').innerHTML = '';
    document.getElementById('paymentsList').innerHTML = '';
    
    // Add expenditures
    expenditures.forEach(exp => {
        const expenditureHtml = `
            <div class="expenditure-item" id="exp-${exp.id}">
                <span class="delete-btn" onclick="deleteExpenditure(${exp.id})">×</span>
                <input type="text" class="form-control mb-2" placeholder="Description" value="${exp.description}" onchange="updateExpenditure(${exp.id})">
                <input type="number" class="form-control" placeholder="Amount" step="0.01" value="${exp.amount}" onchange="updateExpenditure(${exp.id})">
            </div>
        `;
        document.getElementById('expendituresList').insertAdjacentHTML('beforeend', expenditureHtml);
    });
    
    // Add payments
    payments.forEach(pay => {
        const paymentHtml = `
            <div class="payment-item" id="pay-${pay.id}">
                <span class="delete-btn" onclick="deletePayment(${pay.id})">×</span>
                <input type="text" class="form-control mb-2" placeholder="Person Name" value="${pay.name}" onchange="updatePayment(${pay.id})">
                <input type="number" class="form-control" placeholder="Amount Paid" step="0.01" value="${pay.amount}" onchange="updatePayment(${pay.id})">
            </div>
        `;
        document.getElementById('paymentsList').insertAdjacentHTML('beforeend', paymentHtml);
    });
    
    updateCalculations();
}

function updateCalculations() {
    const totalExpenses = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
    const totalPayments = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const perPerson = totalExpenses / (payments.length || 1);
    
    // Update pie chart
    updatePieChart();
    
    // Calculate settlements
    const settlements = calculateSettlements(perPerson);
    
    // Update settlement summary
    const summaryHtml = `
        <h6>Total Expenses: $${totalExpenses.toFixed(2)}</h6>
        <h6>Per Person: $${perPerson.toFixed(2)}</h6>
        <hr>
        <h6>Settlements:</h6>
        ${settlements.map(s => `<div class="settlement-item">${s}</div>`).join('')}
    `;
    
    document.getElementById('settlementSummary').innerHTML = summaryHtml;
}

function updatePieChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    const data = {
        labels: expenditures.map(exp => exp.description || 'Unnamed'),
        datasets: [{
            data: expenditures.map(exp => exp.amount),
            backgroundColor: expenditures.map((_, index) => 
                `hsl(${(index * 360) / expenditures.length}, 70%, 60%)`
            )
        }]
    };
    
    chart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function calculateSettlements(perPerson) {
    const settlements = [];
    const balances = payments.map(p => ({
        name: p.name,
        balance: p.amount - perPerson
    }));
    
    // Sort by balance (descending)
    balances.sort((a, b) => b.balance - a.balance);
    
    // Calculate settlements
    for (let i = 0; i < balances.length; i++) {
        for (let j = balances.length - 1; j > i; j--) {
            if (balances[i].balance <= 0 || balances[j].balance >= 0) continue;
            
            const amount = Math.min(balances[i].balance, -balances[j].balance);
            if (amount > 0.01) {
                settlements.push(`${balances[j].name} owes ${balances[i].name} $${amount.toFixed(2)}`);
                balances[i].balance -= amount;
                balances[j].balance += amount;
            }
        }
    }
    
    return settlements;
}

function generateShareableLink() {
    const data = {
        expenditures: expenditures,
        payments: payments,
        title: title
    };
    
    const encodedData = encodeURIComponent(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
    
    const linkDiv = document.getElementById('shareableLink');
    linkDiv.innerHTML = `
        <div class="alert alert-success">
            <strong>Shareable Link:</strong><br>
            <a href="${url}" target="_blank">${url}</a>
        </div>
    `;
} 