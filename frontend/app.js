// Login and role management
let currentUser = null;
let currentRole = null;

const demoUsers = {
    patient1: { password: 'pass', role: 'patient' },
    queue1: { password: 'pass', role: 'queue_manager' },
    doctor1: { password: 'pass', role: 'doctor' },
    cashier1: { password: 'pass', role: 'transaction' }
};

const TRANSACTION_CLEAR_FLAG = "clinic_transaction_records_cleared_2026_04_20";

function login(username, password) {
    if (demoUsers[username] && demoUsers[username].password === password) {
        currentUser = username;
        currentRole = demoUsers[username].role;
        return true;
    }
    return false;
}

function logout() {
    currentUser = null;
    currentRole = null;
    showLogin();
}

function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('patientSection').style.display = 'none';
    document.getElementById('queueSection').style.display = 'none';
    document.getElementById('currentCallSection').style.display = 'none';
    document.getElementById('doctorSection').style.display = 'none';
    document.getElementById('transactionSection').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'none';
}

function showRoleSections() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'block';
    if (currentRole === 'patient') {
        document.getElementById('patientSection').style.display = 'block';
    } else if (currentRole === 'queue_manager') {
        document.getElementById('queueSection').style.display = 'block';
        document.getElementById('currentCallSection').style.display = 'block';
    } else if (currentRole === 'doctor') {
        document.getElementById('doctorSection').style.display = 'block';
    } else if (currentRole === 'transaction') {
        document.getElementById('transactionSection').style.display = 'block';
    }
    
    // Re-bind elements and re-attach events after DOM changes
    if (window.clinicUI) {
        window.clinicUI.elements = window.clinicUI.bindElements();
        window.clinicUI.renderAll();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    showLogin();
    document.getElementById('logoutButton').addEventListener('click', logout);
    // Existing initialization code...
});

class Patient {
    constructor(id, name, age, address, balance = 0) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.address = address;
        this.balance = balance;
        this.diagnosis = "";
        this.prescription = "";
        this.history = [];
    }
}

class QueueItem {
    constructor(ticket, patientId, serviceType, timestamp) {
        this.ticket = ticket;
        this.patientId = patientId;
        this.serviceType = serviceType;
        this.timestamp = timestamp;
        this.status = "waiting";
    }
}

class ClinicDatabase {
    constructor() {
        this.patients = {};
        this.history = [];
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem("clinic_db");
            if (saved) {
                const data = JSON.parse(saved);
                this.patients = data.patients || {};
                this.history = data.history || [];
            }
        } catch (error) {
            console.error("Failed to load database", error);
        }
    }

    save() {
        try {
            localStorage.setItem("clinic_db", JSON.stringify({
                patients: this.patients,
                history: this.history,
            }));
        } catch (error) {
            console.error("Failed to save database", error);
        }
    }

    addPatient(patient) {
        this.patients[patient.id] = patient;
        this.save();
    }

    updatePatient(patientId, updates) {
        if (!this.patients[patientId]) {
            throw new Error("Patient not found");
        }
        Object.assign(this.patients[patientId], updates);
        this.save();
    }

    getPatient(patientId) {
        return this.patients[patientId] || null;
    }

    addHistory(entry) {
        this.history.unshift(entry);
        this.save();
    }

    search(query) {
        const normalized = query.trim().toLowerCase();
        return Object.values(this.patients).filter((patient) => {
            return (
                patient.id.toLowerCase().includes(normalized) ||
                patient.name.toLowerCase().includes(normalized)
            );
        });
    }
}

class QueueManager {
    constructor(db) {
        this.db = db;
        this.queues = {
            consult: [],
            transact: [],
            inquiry: [],
        };
        this.ticketCount = {
            consult: 0,
            transact: 0,
            inquiry: 0,
        };
        this.active = {
            consult: null,
            transact: null,
            inquiry: null,
        };
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem("clinic_queues");
            if (saved) {
                const data = JSON.parse(saved);
                this.queues = data.queues || this.queues;
                this.ticketCount = data.ticketCount || this.ticketCount;
                this.active = data.active || this.active;
            }
        } catch (error) {
            console.error("Failed to load queues", error);
        }
    }

    save() {
        try {
            localStorage.setItem("clinic_queues", JSON.stringify({
                queues: this.queues,
                ticketCount: this.ticketCount,
                active: this.active,
            }));
        } catch (error) {
            console.error("Failed to save queues", error);
        }
    }

    createTicket(serviceType) {
        this.ticketCount[serviceType] += 1;
        const prefix = {
            consult: "C",
            transact: "T",
            inquiry: "I",
        }[serviceType];
        return `${prefix}-${String(this.ticketCount[serviceType]).padStart(3, "0")}`;
    }

    addToQueue(patient, serviceType) {
        const ticket = this.createTicket(serviceType);
        const item = new QueueItem(ticket, patient.id, serviceType, new Date().toISOString());
        this.queues[serviceType].push(item);
        this.db.addHistory({
            timestamp: new Date().toLocaleString(),
            type: "join",
            ticket,
            patientId: patient.id,
            serviceType,
            patientName: patient.name,
        });
        this.save();
        return item;
    }

    callNext(serviceType) {
        const queue = this.queues[serviceType];
        if (!queue || queue.length === 0) {
            throw new Error("Queue is empty");
        }
        const nextItem = queue.shift();
        nextItem.status = "called";
        this.active[serviceType] = nextItem;
        this.db.addHistory({
            timestamp: new Date().toLocaleString(),
            type: "call",
            ticket: nextItem.ticket,
            patientId: nextItem.patientId,
            serviceType,
        });
        this.save();
        return nextItem;
    }

    completeActive(serviceType, details) {
        const current = this.active[serviceType];
        if (!current) {
            throw new Error("No active patient for this service");
        }

        const patient = this.db.getPatient(current.patientId);
        if (!patient) {
            throw new Error("Patient data missing in database");
        }

        if (serviceType === "consult") {
            if (!details.diagnosis && !details.prescription) {
                throw new Error("Enter diagnosis or prescription to save consult data.");
            }
            patient.diagnosis = details.diagnosis;
            patient.prescription = details.prescription;
            patient.history.push({
                when: new Date().toLocaleString(),
                event: "Consult completed",
                diagnosis: details.diagnosis,
                prescription: details.prescription,
            });
        } else if (serviceType === "transact") {
            this.applyPayment(patient.id, details.payment, {
                ticket: current.ticket,
                serviceType,
                source: "queue",
            });
        } else if (serviceType === "inquiry") {
            patient.history.push({
                when: new Date().toLocaleString(),
                event: "Inquiry completed",
            });
        }

        this.db.updatePatient(patient.id, {
            diagnosis: patient.diagnosis,
            prescription: patient.prescription,
            balance: patient.balance,
            history: patient.history,
        });

        this.db.addHistory({
            timestamp: new Date().toLocaleString(),
            type: "complete",
            ticket: current.ticket,
            patientId: patient.id,
            serviceType,
            details,
        });

        this.active[serviceType] = null;
        this.save();
        return this.db.getPatient(current.patientId);
    }

    applyPayment(patientId, paymentAmount, metadata = {}) {
        const patient = this.db.getPatient(patientId);
        if (!patient) {
            throw new Error("Patient not found");
        }

        const payment = Number(paymentAmount) || 0;
        if (payment <= 0) {
            throw new Error("Enter payment amount greater than zero.");
        }

        patient.balance = Math.max(0, Number(patient.balance) - payment);
        patient.history.push({
            when: new Date().toLocaleString(),
            event: `Payment ${payment.toFixed(2)}`,
            balance: patient.balance,
        });

        this.db.updatePatient(patient.id, {
            balance: patient.balance,
            history: patient.history,
        });

        this.db.addHistory({
            timestamp: new Date().toLocaleString(),
            type: "payment",
            patientId: patient.id,
            patientName: patient.name,
            payment,
            balance: patient.balance,
            ...metadata,
        });

        return patient;
    }

    resetQueue(serviceType) {
        this.queues[serviceType] = [];
        this.active[serviceType] = null;
        this.save();
    }

    resetAllQueues() {
        this.resetQueue("consult");
        this.resetQueue("transact");
        this.resetQueue("inquiry");
        this.ticketCount = { consult: 0, transact: 0, inquiry: 0 };
        this.save();
    }
}

class ClinicUI {
    constructor() {
        this.db = new ClinicDatabase();
        this.manager = new QueueManager(this.db);
        this.elements = this.bindElements();
        this.currentPatientForUpdate = null; // Track selected patient
        this.currentPatientForPayment = null;
        this.isCompletingConsult = false; // Track if completing a consult
        this.eventsAttached = false;
        this.runOneTimeTransactionClear();
        this.attachEvents();
        this.renderAll();
    }

    bindElements() {
        const elements = {
            patientForm: document.getElementById("patientForm"),
            patientName: document.getElementById("patientName"),
            patientAge: document.getElementById("patientAge"),
            patientAddress: document.getElementById("patientAddress"),
            serviceType: document.getElementById("serviceType"),
            patientBalance: document.getElementById("patientBalance"),
            balanceLabel: document.getElementById("balanceLabel"),
            patientMessage: document.getElementById("patientMessage"),
        };

        // Add role-specific elements only if they exist
        if (document.getElementById("consultQueue")) {
            elements.consultQueue = document.getElementById("consultQueue");
            elements.transactQueue = document.getElementById("transactQueue");
            elements.inquiryQueue = document.getElementById("inquiryQueue");
            elements.resetConsult = document.getElementById("resetConsult");
            elements.resetTransact = document.getElementById("resetTransact");
            elements.resetInquiry = document.getElementById("resetInquiry");
            elements.resetAllQueues = document.getElementById("resetAllQueues");
            elements.currentCallArea = document.getElementById("currentCallArea");
        }

        if (document.getElementById("databaseTable")) {
            elements.databaseTable = document.getElementById("databaseTable");
        }

        if (document.getElementById("searchInput")) {
            elements.searchInput = document.getElementById("searchInput");
            elements.searchButton = document.getElementById("searchButton");
            elements.searchResult = document.getElementById("searchResult");
            elements.clearDatabase = document.getElementById("clearDatabase");
        }

        if (document.getElementById("transactionSearchInput")) {
            elements.transactionSearchInput = document.getElementById("transactionSearchInput");
            elements.transactionSearchButton = document.getElementById("transactionSearchButton");
            elements.transactionSearchResult = document.getElementById("transactionSearchResult");
            elements.transactionCurrentPatientCard = document.getElementById("transactionCurrentPatientCard");
            elements.transactionPaymentForm = document.getElementById("transactionPaymentForm");
            elements.transactionPatientId = document.getElementById("transactionPatientId");
            elements.transactionPaymentAmount = document.getElementById("transactionPaymentAmount");
            elements.transactionUpdateForm = document.getElementById("transactionUpdateForm");
            elements.transactionMessage = document.getElementById("transactionMessage");
        }

        return elements;
    }

    attachEvents() {
        if (this.eventsAttached) {
            return;
        }
        this.eventsAttached = true;

        // Login
        document.getElementById('loginForm').addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (login(username, password)) {
                document.getElementById('loginMessage').textContent = '';
                showRoleSections();
            } else {
                document.getElementById('loginMessage').textContent = 'Invalid credentials';
            }
        });

        // Patient form events (always available)
        if (this.elements.patientForm) {
            this.elements.patientForm.addEventListener("submit", (event) => {
                event.preventDefault();
                this.handleAddPatient();
            });
        }

        if (this.elements.serviceType) {
            this.elements.serviceType.addEventListener("change", () => {
                if (this.elements.balanceLabel) {
                    this.elements.balanceLabel.style.display =
                        this.elements.serviceType.value === "transact" ? "grid" : "none";
                }
            });
        }

        // Queue manager events
        if (this.elements.resetConsult) {
            this.elements.resetConsult.addEventListener("click", () => this.handleResetQueue("consult"));
            this.elements.resetTransact.addEventListener("click", () => this.handleResetQueue("transact"));
            this.elements.resetInquiry.addEventListener("click", () => this.handleResetQueue("inquiry"));
            this.elements.resetAllQueues.addEventListener("click", () => this.handleResetAllQueues());
        }

        // Doctor events
        if (this.elements.searchButton) {
            this.elements.searchButton.addEventListener("click", () => this.handleSearch());
            this.elements.searchInput.addEventListener("keypress", (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });
            this.elements.clearDatabase.addEventListener("click", () => this.handleClearDatabase());
        }
        
        // Doctor update form
        const doctorUpdateForm = document.getElementById('doctorUpdateForm');
        if (doctorUpdateForm) {
            doctorUpdateForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleDoctorUpdate();
            });
        }

        if (this.elements.transactionSearchButton) {
            this.elements.transactionSearchButton.addEventListener("click", () => this.handleTransactionSearch());
            this.elements.transactionSearchInput.addEventListener("keypress", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    this.handleTransactionSearch();
                }
            });
        }

        if (this.elements.transactionUpdateForm) {
            this.elements.transactionUpdateForm.addEventListener("submit", (event) => {
                event.preventDefault();
                this.handleTransactionPayment();
            });
        }
    }

    handleAddPatient() {
        try {
            const name = this.elements.patientName.value.trim();
            const age = Number(this.elements.patientAge.value);
            const address = this.elements.patientAddress.value.trim();
            const serviceType = this.elements.serviceType.value;
            const balance = Number(this.elements.patientBalance.value) || 0;

            if (!name || !address || !serviceType || age <= 0) {
                throw new Error("Please provide valid patient name, age, address, and service.");
            }

            const patientId = `${serviceType.toUpperCase()}-${Date.now()}`;
            const newPatient = new Patient(patientId, name, age, address, balance);
            this.db.addPatient(newPatient);

            const queueItem = this.manager.addToQueue(newPatient, serviceType);
            this.showMessage(`Added ${name} to ${serviceType} queue as ticket ${queueItem.ticket}.`);
            this.elements.patientForm.reset();
            this.elements.balanceLabel.style.display = "none";
            this.renderAll();
        } catch (error) {
            this.showMessage(error.message, true);
        }
    }

    handleResetQueue(serviceType) {
        if (!confirm(`Reset ${serviceType} queue? This will remove waiting tickets.`)) {
            return;
        }
        this.manager.resetQueue(serviceType);
        this.showMessage(`${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} queue reset.`);
        this.renderAll();
    }

    handleResetAllQueues() {
        if (!confirm("Reset all queues and clear current calls?")) {
            return;
        }
        this.manager.resetAllQueues();
        this.showMessage("All queues were reset.");
        this.renderAll();
    }

    handleSearch() {
        const query = this.elements.searchInput.value.trim();
        if (!query) {
            this.showMessage("Enter a patient ID or name to search.", true);
            return;
        }

        const results = this.db.search(query);
        if (results.length === 0) {
            this.elements.searchResult.innerHTML = `<p>No patient records found for "${query}".</p>`;
            document.getElementById('updateForm').style.display = 'none';
            return;
        }

        this.elements.searchResult.innerHTML = results
            .map((patient) => `
                <div class="search-result-item clickable" data-patient-id="${patient.id}">
                    <strong>${patient.name}</strong> (${patient.id})<br/>
                    Age: ${patient.age}, Address: ${patient.address}<br/>
                    Diagnosis: ${patient.diagnosis || '—'} | Prescription: ${patient.prescription || '—'}
                </div>`)
            .join("");

        // Make search results clickable
        this.elements.searchResult.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const patientId = item.dataset.patientId;
                this.selectPatientForUpdate(patientId);
            });
        });

        if (currentRole === 'doctor') {
            document.getElementById('updateForm').style.display = 'block';
        }
    }

    selectPatientForUpdate(patientId) {
        const patient = this.db.getPatient(patientId);
        if (!patient) return;
        
        this.currentPatientForUpdate = patientId;
        this.isCompletingConsult = false; // Reset consult completion mode
        document.getElementById('updateDiagnosis').value = patient.diagnosis || '';
        document.getElementById('updatePrescription').value = patient.prescription || '';
        document.getElementById('updateBalance').value = patient.balance || '';
        document.getElementById('updateButton').textContent = 'Save Update'; // Reset button text
        
        // Show current patient card
        const currentPatientCard = document.getElementById('currentPatientCard');
        if (currentPatientCard) {
            currentPatientCard.innerHTML = `
                <div class="patient-summary-card">
                    <strong>${patient.name}</strong> (${patient.id})<br/>
                    Age: ${patient.age}, Address: ${patient.address}<br/>
                    Current Diagnosis: ${patient.diagnosis || '—'}<br/>
                    Current Prescription: ${patient.prescription || '—'}<br/>
                    Current Balance: ₱${Number(patient.balance).toFixed(2)}
                </div>`;
        }
        
        // Highlight selected result
        this.elements.searchResult.querySelectorAll('.search-result-item').forEach(item => {
            item.classList.toggle('active', item.dataset.patientId === patientId);
        });
    }

    updateDoctorCurrentPatient() {
        const currentPatientCard = document.getElementById('currentPatientCard');
        if (!currentPatientCard) return; // Element doesn't exist for this role
        
        const consultActive = this.manager.active.consult;
        
        if (consultActive) {
            const patient = this.db.getPatient(consultActive.patientId);
            if (patient) {
                currentPatientCard.innerHTML = `
                    <div class="patient-summary-card patient-summary-card--active">
                        <strong>CONSULT - ${consultActive.ticket}</strong><br/>
                        <strong>${patient.name}</strong> (${patient.id})<br/>
                        Age: ${patient.age}, Address: ${patient.address}<br/>
                        Current Diagnosis: ${patient.diagnosis || '—'}<br/>
                        Current Prescription: ${patient.prescription || '—'}<br/>
                        Current Balance: ₱${Number(patient.balance).toFixed(2)}
                    </div>
                    <button id="completeConsultBtn" class="full-width-button">Complete Consultation</button>`;
                
                // Attach event to complete consult button
                document.getElementById('completeConsultBtn').addEventListener('click', () => {
                    this.showConsultForm(consultActive.patientId);
                });
            }
        } else {
            currentPatientCard.innerHTML = '<p>No active consult patient. Search for a patient below.</p>';
        }
    }

    showConsultForm(patientId) {
        const patient = this.db.getPatient(patientId);
        if (!patient) return;
        
        document.getElementById('updateDiagnosis').value = patient.diagnosis || '';
        document.getElementById('updatePrescription').value = patient.prescription || '';
        document.getElementById('updateBalance').value = patient.balance || '';
        document.getElementById('updateForm').style.display = 'block';
        
        // Change the form to complete consult mode
        document.getElementById('updateButton').textContent = 'Complete Consultation';
        this.currentPatientForUpdate = patientId;
        this.isCompletingConsult = true;
    }

    handleDoctorUpdate() {
        if (!this.currentPatientForUpdate) {
            this.showMessage("Please select a patient first.", true);
            return;
        }
        
        const diagnosis = document.getElementById('updateDiagnosis').value.trim();
        const prescription = document.getElementById('updatePrescription').value.trim();
        const balance = Number(document.getElementById('updateBalance').value) || 0;
        
        if (this.isCompletingConsult) {
            // Complete the consult service
            try {
                const patient = this.manager.completeActive('consult', { diagnosis, prescription });
                this.showMessage(`Consultation completed for ${patient.name}. Records updated.`);
                this.isCompletingConsult = false;
                document.getElementById('updateButton').textContent = 'Save Update';
                document.getElementById('updateForm').style.display = 'none';
                this.renderAll();
            } catch (error) {
                this.showMessage(error.message, true);
            }
        } else {
            // Regular patient update
            this.db.updatePatient(this.currentPatientForUpdate, { diagnosis, prescription, balance });
            this.showMessage(`Patient ${this.currentPatientForUpdate} updated successfully.`);
            this.handleSearch(); // Refresh search to show updated info
        }
    }

    handleTransactionSearch() {
        const query = this.elements.transactionSearchInput.value.trim();
        if (!query) {
            this.showTransactionMessage("Enter a patient ID or name to search.", true);
            return;
        }

        const results = this.db.search(query);
        if (results.length === 0) {
            this.elements.transactionSearchResult.innerHTML = `<p>No patient records found for "${query}".</p>`;
            this.elements.transactionPaymentForm.style.display = "none";
            return;
        }

        this.elements.transactionSearchResult.innerHTML = results
            .map((patient) => `
                <div class="search-result-item clickable" data-patient-id="${patient.id}">
                    <strong>${patient.name}</strong> (${patient.id})<br/>
                    Age: ${patient.age}, Address: ${patient.address}<br/>
                    Remaining Balance: ₱${Number(patient.balance).toFixed(2)}
                </div>`)
            .join("");

        this.elements.transactionSearchResult.querySelectorAll(".search-result-item").forEach((item) => {
            item.addEventListener("click", () => {
                this.selectPatientForPayment(item.dataset.patientId);
            });
        });
    }

    selectPatientForPayment(patientId) {
        const patient = this.db.getPatient(patientId);
        if (!patient) {
            return;
        }

        this.currentPatientForPayment = patientId;
        this.elements.transactionPatientId.value = patient.id;
        this.elements.transactionPaymentAmount.value = "";
        this.elements.transactionPaymentForm.style.display = "block";

        this.elements.transactionSearchResult.querySelectorAll(".search-result-item").forEach((item) => {
            item.classList.toggle("active", item.dataset.patientId === patientId);
        });

        this.renderTransactionPatientCard(patient);
    }

    handleTransactionPayment() {
        if (!this.currentPatientForPayment) {
            this.showTransactionMessage("Select a patient before applying payment.", true);
            return;
        }

        try {
            const payment = Number(this.elements.transactionPaymentAmount.value);
            const activeTransaction = this.manager.active.transact;
            const isCurrentQueuePatient =
                activeTransaction && activeTransaction.patientId === this.currentPatientForPayment;

            const patient = isCurrentQueuePatient
                ? this.manager.completeActive("transact", { payment })
                : this.manager.applyPayment(this.currentPatientForPayment, payment, {
                    source: "cashier",
                    serviceType: "transact",
                });

            this.showTransactionMessage(`Payment recorded for ${patient.name}. Remaining balance: ₱${Number(patient.balance).toFixed(2)}.`);
            this.elements.transactionPaymentAmount.value = "";
            this.renderAll();
            this.selectPatientForPayment(patient.id);
        } catch (error) {
            this.showTransactionMessage(error.message, true);
        }
    }

    handleClearDatabase() {
        if (!confirm("Clear all saved patient records? This cannot be undone.")) {
            return;
        }
        localStorage.removeItem("clinic_db");
        this.db = new ClinicDatabase();
        this.showMessage("Database cleared. No patient records remain.");
        this.renderAll();
    }

    runOneTimeTransactionClear() {
        try {
            if (localStorage.getItem(TRANSACTION_CLEAR_FLAG)) {
                return;
            }

            this.clearTransactionData();
            localStorage.setItem(TRANSACTION_CLEAR_FLAG, "true");
        } catch (error) {
            console.error("Failed to clear transaction data", error);
        }
    }

    clearTransactionData() {
        Object.values(this.db.patients).forEach((patient) => {
            patient.balance = 0;
            patient.history = (patient.history || []).filter((entry) => {
                return !String(entry.event || "").startsWith("Payment ");
            });
        });

        this.db.history = (this.db.history || []).filter((entry) => {
            return entry.type !== "payment" && entry.serviceType !== "transact";
        });
        this.db.save();

        this.manager.queues.transact = [];
        this.manager.active.transact = null;
        this.manager.ticketCount.transact = 0;
        this.manager.save();
    }

    showMessage(text, isError = false) {
        if (this.elements.patientMessage) {
            this.elements.patientMessage.textContent = text;
            this.elements.patientMessage.style.background = isError ? "#f8d7da" : "#d1f2eb";
            this.elements.patientMessage.style.color = isError ? "#7a1f1f" : "#0b5345";
        }
    }

    showTransactionMessage(text, isError = false) {
        if (this.elements.transactionMessage) {
            this.elements.transactionMessage.textContent = text;
            this.elements.transactionMessage.style.background = isError ? "#f8d7da" : "#d1f2eb";
            this.elements.transactionMessage.style.color = isError ? "#7a1f1f" : "#0b5345";
        }
    }

    renderQueue(serviceType, container) {
        if (!container) return; // Element doesn't exist for this role
        
        const list = this.manager.queues[serviceType];
        if (list.length === 0) {
            container.innerHTML = "<p class='empty'>No waiting patients.</p>";
            return;
        }
        container.innerHTML = list
            .map(
                (item) => `
            <div class="queue-item">
                <span>${item.ticket} — ${this.db.getPatient(item.patientId)?.name || "Unknown"}</span>
                <button data-service="${serviceType}" data-ticket="${item.ticket}">Call</button>
            </div>`
            )
            .join("");
        container.querySelectorAll("button").forEach((button) => {
            button.addEventListener("click", () => {
                this.handleCall(button.dataset.service);
            });
        });
    }

    handleCall(serviceType) {
        try {
            const next = this.manager.callNext(serviceType);
            this.showMessage(`Calling ${next.ticket} for ${serviceType}.`);
            this.renderAll();
        } catch (error) {
            this.showMessage(error.message, true);
        }
    }

    renderCurrentCall() {
        if (!this.elements.currentCallArea) return; // Element doesn't exist for this role
        
        const activeItems = Object.entries(this.manager.active)
            .filter(([, value]) => value !== null)
            .map(([serviceType, item]) => ({ serviceType, item }));

        if (activeItems.length === 0) {
            this.elements.currentCallArea.innerHTML = `<p>No active call yet. Click a ticket to call the next patient.</p>`;
            return;
        }

        this.elements.currentCallArea.innerHTML = activeItems
            .map(({ serviceType, item }) => {
                const patient = this.db.getPatient(item.patientId);
                const name = patient?.name || "Unknown";
                return `
                <div class="current-card">
                    <strong>${serviceType.toUpperCase()} - ${item.ticket}</strong>
                    <p><strong>Patient:</strong> ${name}</p>
                    <p><strong>Service:</strong> ${serviceType}</p>
                    ${serviceType === 'consult' ? 
                        '<p class="consult-status-note">Patient sent to doctor for consultation.</p>' :
                        this.renderServiceForm(serviceType, item.patientId)}
                </div>`;
            })
            .join("");

        this.attachCurrentFormEvents();
        
        // Update doctor's panel with currently called consult patient
        this.updateDoctorCurrentPatient();
    }

    renderTransactionPatientCard(patient) {
        if (!this.elements.transactionCurrentPatientCard) {
            return;
        }

        this.elements.transactionCurrentPatientCard.innerHTML = `
            <div class="patient-summary-card">
                <strong>${patient.name}</strong> (${patient.id})<br/>
                Age: ${patient.age}, Address: ${patient.address}<br/>
                Current Balance: ₱${Number(patient.balance).toFixed(2)}<br/>
                Diagnosis: ${patient.diagnosis || "—"}<br/>
                Prescription: ${patient.prescription || "—"}
            </div>`;
    }

    updateTransactionCurrentPatient() {
        if (!this.elements.transactionCurrentPatientCard) {
            return;
        }

        const activeTransaction = this.manager.active.transact;
        if (!activeTransaction) {
            this.elements.transactionCurrentPatientCard.innerHTML =
                "<p>No active transaction patient. Search for a patient or wait for the next called transaction.</p>";
            return;
        }

        const patient = this.db.getPatient(activeTransaction.patientId);
        if (!patient) {
            this.elements.transactionCurrentPatientCard.innerHTML = "<p>Active transaction patient record not found.</p>";
            return;
        }

        this.currentPatientForPayment = patient.id;
        if (this.elements.transactionPatientId) {
            this.elements.transactionPatientId.value = patient.id;
        }
        if (this.elements.transactionPaymentForm) {
            this.elements.transactionPaymentForm.style.display = "block";
        }

        this.elements.transactionCurrentPatientCard.innerHTML = `
            <div class="patient-summary-card patient-summary-card--active">
                <strong>TRANSACTION - ${activeTransaction.ticket}</strong><br/>
                <strong>${patient.name}</strong> (${patient.id})<br/>
                Age: ${patient.age}, Address: ${patient.address}<br/>
                Current Balance: ₱${Number(patient.balance).toFixed(2)}<br/>
                Ready for cashier payment processing.
            </div>`;
    }

    renderServiceForm(serviceType, patientId) {
        const patient = this.db.getPatient(patientId);
        const details = patient ? `
            <p><strong>Age:</strong> ${patient.age}</p>
            <p><strong>Address:</strong> ${patient.address}</p>
            <p><strong>Balance:</strong> ₱${Number(patient.balance).toFixed(2)}</p>
            <p><strong>Diagnosis:</strong> ${patient.diagnosis || "—"}</p>
            <p><strong>Prescription:</strong> ${patient.prescription || "—"}</p>` : "";

        if (serviceType === "transact") {
            return `
                ${details}
                <label>Payment Amount<input id="paymentInput" type="number" min="0" placeholder="Enter payment amount" /></label>
                <button id="completeTransact" data-service="transact">Complete Transaction</button>`;
        }

        if (serviceType === "inquiry") {
            return `
                ${details}
                <button id="completeInquiry" data-service="inquiry">Complete Inquiry</button>`;
        }

        return details; // For consult, just show details
    }

    attachCurrentFormEvents() {
        const transactButton = document.getElementById("completeTransact");
        const inquiryButton = document.getElementById("completeInquiry");

        if (transactButton) {
            transactButton.addEventListener("click", () => {
                const payment = document.getElementById("paymentInput").value;
                this.completeCurrentService("transact", { payment: Number(payment) });
            });
        }

        if (inquiryButton) {
            inquiryButton.addEventListener("click", () => {
                this.completeCurrentService("inquiry", {});
            });
        }
    }

    completeCurrentService(serviceType, details) {
        try {
            const patient = this.manager.completeActive(serviceType, details);
            this.showMessage(`Completed ${serviceType} for ${patient.name}. Updated records saved.`);
            this.renderAll();
        } catch (error) {
            this.showMessage(error.message, true);
        }
    }

    renderPatientCard(patient) {
        const historyHtml = patient.history
            .map(
                (entry) => `<li>${entry.when}: ${entry.event}${entry.diagnosis ? ` - ${entry.diagnosis}` : ""}${entry.prescription ? ` - ${entry.prescription}` : ""}${entry.balance !== undefined ? ` - Balance ₱${Number(entry.balance).toFixed(2)}` : ""}</li>`
            )
            .join("");

        return `
            <div class="search-result-card">
                <h4>${patient.name} (${patient.id})</h4>
                <p><strong>Age:</strong> ${patient.age}</p>
                <p><strong>Address:</strong> ${patient.address}</p>
                <p><strong>Balance:</strong> ₱${Number(patient.balance).toFixed(2)}</p>
                <p><strong>Diagnosis:</strong> ${patient.diagnosis || "—"}</p>
                <p><strong>Prescription:</strong> ${patient.prescription || "—"}</p>
                <p><strong>History:</strong></p>
                <ul>${historyHtml || "<li>No history yet.</li>"}</ul>
            </div>`;
    }

    renderDatabaseTable() {
        if (!this.elements.databaseTable) return; // Element doesn't exist for this role
        
        const patients = Object.values(this.db.patients);
        if (patients.length === 0) {
            this.elements.databaseTable.innerHTML = "<p>No saved patient records.</p>";
            return;
        }

        const rows = patients
            .map(
                (patient) => `
            <tr>
                <td>${patient.id}</td>
                <td>${patient.name}</td>
                <td>${patient.age}</td>
                <td>${patient.address}</td>
                <td>₱${Number(patient.balance).toFixed(2)}</td>
                <td>${patient.diagnosis || "—"}</td>
                <td>${patient.prescription || "—"}</td>
            </tr>`
            )
            .join("");

        this.elements.databaseTable.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Address</th>
                        <th>Balance</th>
                        <th>Diagnosis</th>
                        <th>Prescription</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>`;
    }

    renderAll() {
        // Only render elements that exist for the current role
        if (currentRole === 'queue_manager') {
            this.renderQueue("consult", this.elements.consultQueue);
            this.renderQueue("transact", this.elements.transactQueue);
            this.renderQueue("inquiry", this.elements.inquiryQueue);
            this.renderCurrentCall();
        } else if (currentRole === 'doctor') {
            this.renderDatabaseTable();
            this.elements.searchResult.innerHTML = "";
            this.updateDoctorCurrentPatient();
        } else if (currentRole === 'transaction') {
            this.updateTransactionCurrentPatient();
        }
        // Patients don't need to render anything special after joining
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.clinicUI = new ClinicUI();
});
