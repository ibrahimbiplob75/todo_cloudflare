# Software Requirements Specification (SRS)

## 1. Overview

### 1.1 Application Type

* Single Page Application (SPA)
* Built with **Vue 3**
* Uses **Vue Router**, **Pinia**, **Tailwind CSS**
* Icons via **Font Awesome CDN**
* Script style: **Options API only**

### 1.2 Purpose

The application provides:

* Authentication (Login)
* Protected dashboard area
* Profile management
* Scalable structure for future modules (Projects, Todo)

---

## 2. Tech Stack & Constraints

### 2.1 Frontend Framework

* Vue 3
* **Options API only** (no Composition API)

### 2.2 State Management

* **Pinia**
* Used for:

  * Authentication state
  * User profile data
  * Sidebar open/close state

### 2.3 Styling

* **Tailwind CSS only**
* No custom CSS files
* Responsive design using Tailwind breakpoints

### 2.4 Icons

* **Font Awesome CDN**
* No local icon packages

---

## 3. Routing Structure

### 3.1 Middleware Types

#### Public Middleware

* Accessible without authentication

Routes:

* `/login`

#### Private Middleware

* Requires authenticated user

Routes:

* `/dashboard`
* `/profile`
* `/profile/update`

Unauthenticated users attempting private routes must be redirected to `/login`.

---

## 4. Layouts

### 4.1 Public Layout

#### Description

* Used only for the login page

#### Behavior

* Plain layout
* No header
* No sidebar
* Login page is the **home page**

---

### 4.2 Private Layout

Used for all authenticated pages.

---

## 5. Private Layout Structure

### 5.1 Header

#### Structure

```
<header>
  <div class="flex justify-between items-center">
    <div>
      Left navigation toggle button
    </div>

    <div class="flex items-center gap-3">
      Profile name
      Logout icon
    </div>
  </div>
</header>
```

#### Behavior

* Left toggle button controls sidebar visibility on small screens
* Logout icon triggers logout action

---

### 5.2 Body Layout

```
<div class="flex">
  <aside>Sidebar</aside>
  <main>Router View</main>
</div>
```

---

## 6. Sidebar (Left Navigation)

### 6.1 General Rules

* Maximum width: **300px**
* Fixed on the left
* Height: full screen

### 6.2 Responsive Behavior

#### Medium Devices and Above (≥ 768px)

* Sidebar is **always visible**
* No backdrop

#### Small Devices (< 768px)

* Sidebar is **hidden by default**
* Opens by sliding in from the left
* When open:

  * A **full-screen backdrop** appears behind it
  * Clicking backdrop closes sidebar

---

### 6.3 Sidebar Navigation Items

Top section (navigation):

* Home (`/dashboard`)
* Profile (`/profile`)
* Project (future, placeholder)
* Todo (future, placeholder)

Bottom section:

* Logout button

  * Requires confirmation
  * Logs user out and redirects to `/login`

---

## 7. Router View Area

* Displays content of the active private route
* Occupies remaining horizontal space beside sidebar
* Responsive width based on sidebar visibility

---

## 8. Authentication Rules

* Login sets auth state in Pinia
* Logout clears auth state and user data
* Auth state persists while app is running (optional: localStorage)

---

## 9. Future Scalability

* Sidebar items for **Project** and **Todo** are placeholders
* Routing and layout should support adding these modules later without refactoring

---

## 10. Non-Functional Requirements

* Mobile-first design
* Smooth sidebar animations using Tailwind utilities
* Clean, readable component structure
* No external UI libraries (only Tailwind)

---

If you want, I can also:

* Convert this SRS into **Vue folder structure**
* Generate **Pinia stores**
* Write **Vue Router + middleware guards**
* Generate **ready-to-run Vue components**

Just tell me 👍
