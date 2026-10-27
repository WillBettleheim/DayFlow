# ⚡ DAYFLOW

### Your Personal Life Operating System

**Plan smarter. Stay focused. Make every day count.**

DAYFLOW is a modern, open-source productivity web application that brings tasks, projects, daily planning, focus sessions, and productivity insights into one clean and organized workspace.

Built to make productivity feel simple, intentional, and distraction-free.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

---

## ✨ Overview

DAYFLOW combines essential productivity tools into a single dashboard.

Instead of switching between multiple applications, you can organize what needs to be done, track project progress, schedule tasks, manage your focus time, and review your productivity in one place.

**Designed for:**
- Students managing assignments and study plans
- Developers tracking personal projects
- Creators organizing daily workflows
- Anyone looking for a simpler productivity system

---

## 🚀 Features

### 📊 1. Smart Dashboard

Get a clear overview of your day.

- Total, completed, and pending tasks
- Task completion percentage
- Priority-based task summaries
- Weekly productivity activity
- Project progress overview

### ✅ 2. Advanced Task Management

Turn large goals into manageable actions.

- Create, edit, complete, and delete tasks
- Add detailed task descriptions
- Organize tasks by category and priority
- Set due dates
- Search, filter, and sort tasks
- Break tasks into subtasks
- Track subtask completion progress
- Connect tasks to projects

### 📁 3. Project Management

Keep your work organized.

- Create and manage projects
- Assign tasks to projects
- Set project deadlines
- Monitor progress based on completed tasks
- Review project-related tasks

### 📅 4. Daily Planner

Organize your schedule and upcoming work.

- View tasks by date
- Navigate through the weekly schedule
- Keep track of deadlines
- Mark scheduled tasks as complete

### ⏱️ 5. Focus Mode

Build better concentration habits.

- Built-in focus timer
- Distraction-free productivity interface
- Manage tasks during focus sessions
- Track basic focus activity locally

### 📈 6. Productivity Insights

Understand how your work is progressing.

- Task completion trends
- Productivity summaries
- Priority distribution
- Time-based productivity insights

### 📱 7. Responsive Design

DAYFLOW is designed for different screen sizes.

- Desktop dashboard
- Tablet-friendly layout
- Mobile navigation drawer
- Collapsible desktop sidebar
- Responsive task and project interfaces

---

## 🎨 Design Philosophy

DAYFLOW uses a minimal dark interface with carefully chosen accent colors.

| Element | Color |
|---|---|
| Primary background | `#191B19` |
| Main accent | `#D8FF56` |
| Secondary accent | `#456CF0` |
| Panel background | `#282B27` |

The interface prioritizes readability, clarity, and a consistent user experience.

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| Next.js 16 | Full-stack application framework |
| React | Interactive UI |
| TypeScript | Type-safe development |
| Tailwind CSS 4 | Responsive styling |
| Prisma ORM 6 | Database access and migrations |
| MySQL | Persistent task and project data |
| Git & GitHub | Version control |

---

## 📂 Project Structure

```text
dayflow/
├── app/
│   ├── api/
│   │   ├── tasks/
│   │   │   └── route.ts
│   │   └── projects/
│   │       ├── route.ts
│   │       └── [id]/
│   │           └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   └── views/
│       ├── OverviewView.tsx
│       ├── TasksView.tsx
│       ├── ProjectsView.tsx
│       ├── PlannerView.tsx
│       ├── FocusView.tsx
│       └── InsightsView.tsx
│
├── lib/
