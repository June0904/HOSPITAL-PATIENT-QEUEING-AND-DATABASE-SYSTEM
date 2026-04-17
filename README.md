# Clinic Queue & Patient Management System

## Overview

This project is a **web-based Clinic Queue and Patient Management System** designed to streamline patient flow and clinic operations. It manages multiple service types including **Consultation, Transaction (Finance), and Inquiry**, while maintaining organized patient records and queue tracking.

The system is built using a **simple and practical Java-based stack** to ensure ease of development, maintenance, and presentation.

---

## Objectives

* Organize patient queues efficiently
* Manage different service types (Consult, Transact, Inquiry)
* Record patient information and history
* Track payments and balances
* Provide a simple and clean user interface

---

## Tech Stack

### Backend

* Java
* Spring Boot

### Database

* MySQL

### Frontend

* HTML
* CSS
* Bootstrap
* JavaScript


---

## System Features

### Patient Registration

* Add new patients
* Store basic details:

  * Name
  * Age
  * Address

---

### Queue Management

* Assign queue numbers based on service type:

  * **Consult** → C001, C002
  * **Transaction** → T001, T002
  * **Inquiry** → I001, I002

* Track status:

  * Waiting
  * In Progress
  * Done

---

### Consultation Module

* Assign patient to doctor

* Record:

  * Problem
  * Diagnosis
  * Prescription

* Supports:

  * New patients
  * Returning patients (data update)

---

### Transaction Module (Finance)

* Record patient payments

* Track:

  * Payment amount
  * Remaining balance

* Display unpaid balances for returning patients

---

### Inquiry Module

* Handles general concerns or follow-ups
* Assigns inquiry queue number

---

### Admin Controls

* Call next patient
* Update queue status
* Monitor all service queues

---

## System Architecture

```
Frontend (HTML, CSS, JS, Bootstrap)
            ↓
        Fetch API
            ↓
     Spring Boot Backend
            ↓
         MySQL Database
```

---

## System Workflow

1. Patient selects service:

   * Consult / Transact / Inquiry

2. System:

   * Registers patient
   * Assigns queue number

3. Staff handles request:

   * Doctor (Consult)
   * Cashier (Transaction)
   * Front Desk (Inquiry)

4. Data is saved to database

5. Queue updates automatically (via polling)

---

## Database Tables (Simplified)

### patients

* id
* name
* age
* address

### queue

* id
* patient_id
* queue_number
* type (CONSULT / TRANSACT / INQUIRY)
* status

### consultations

* id
* patient_id
* problem
* diagnosis
* prescription

### transactions

* id
* patient_id
* payment
* balance

---

## Setup Instructions

### 1. Backend (Spring Boot)

* Install JDK 17+
* Create Spring Boot project
* Configure application.properties:

```
spring.datasource.url=jdbc:mysql://localhost:3306/clinic_db
spring.datasource.username=root
spring.datasource.password=
```

---

### 2. Database

* Create database:

```
CREATE DATABASE clinic_db;
```

* Create required tables

---

### 3. Frontend

* Open HTML files in browser
* Connect API endpoints using JavaScript Fetch

---

## Auto-Refresh (Queue Update)

```javascript
setInterval(() => {
  loadQueue();
}, 3000);
```

---

## Future Improvements

* Real-time updates using WebSocket
* User authentication (Admin/Staff login)
* Mobile-friendly UI
* Reporting and analytics dashboard

---

## Project Title

**Clinic Queue and Patient Management System with Multi-Service Support and Notification**

---

## Author

Luching, Seanlarenz
Madredano, Ilczar June
Malan, Carl Luis
Malinao, Fred Anthony

---

## License

This project is for educational purposes.
