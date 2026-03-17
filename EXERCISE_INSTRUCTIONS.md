# Fullstack Developer Exercise - Newsletter CRM

## Objective
Build a simple Newsletter CRM that allows administrators to manage users, posts, newsletters, and subscribers.

The goal of this exercise is to evaluate your ability to design and implement a small full-stack application.

---

## Technical Stack

- Please implement the frontend using **React**
- The backend can be developed using any programming language or framework you prefer
- Database: Any relational or NoSQL database

### Optional but encouraged:
- TypeScript
- State management
- UI library (e.g., Tailwind)

---

## 1. User Management (Admin)

Implement authentication and basic user management.

### Requirements:
- Login system for CRM users
- Datatable displaying users
- Search and filtering of users
- Only active users can log into the system

---

## 2. Posts Management

Administrators can create and manage posts used inside newsletters.

### Requirements:
- Full CRUD operations
- Each post must have at least one category

---

## 3. Newsletter Creation

Administrators should be able to create newsletters composed of posts.

### Requirements:
- A newsletter should have **3 sections**
- Each section represents a post category
- For each section, you should be able to attach posts to it

---

## 4. Subscriber System

Create a public subscription page so that users can subscribe to the newsletter.

### Requirements:
- Users can submit their email address to subscribe

---

## Notes

- The exercise can be developed using any JavaScript framework
- For displaying lists, you can use a datatable component
- The UI does not need to be visually perfect, but should be functional and clean
- **Tests are mandatory**
- Create a GitHub repository and share it with:  
  **fedros.avraam@admin22.com**
- Include a `README.md` with setup instructions

---

## Bonus (Optional)

- Integrate an email service such as:
  - Mailchimp
  - SendGrid
  - Postmark
  - Resend  
  (to send newsletters to subscribers)

- Develop the backend using the **Laravel Framework**
- Achieve **100% test coverage** (frontend and backend)