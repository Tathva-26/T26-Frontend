# Tathva ’26 Website

Official website for Tathva ’26.

## Tech Stack

- **Framework**: Next.js
- **Runtime**: Node.js 22
- **Package Manager**: npm
- **Styling**: Tailwind CSS
- **Animations**: GSAP
- **Deployment**: Vercel

## Prerequisites

Before you begin, ensure you have:

- Node.js 22.x installed
- npm installed
- Git configured with your GitHub account

## Getting Started

### Initial Setup

Clone the repository:

```bash
git clone <repository-url>
cd <repository-directory>
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` to view the site.

---

# Git Workflow & Branch Conventions

## Branch Structure

The project uses a single permanent branch:

```text
main
 ├── dev/[your-github-username]
 ├── dev/[your-github-username]
 └── dev/[your-github-username]
```

`main` contains the latest stable version of the project.

**Never work directly on `main`.** Every developer must work on their own personal branch.

---

## Creating Your Personal Branch

Create your personal branch using:

```text
dev/[your-github-username]
```

Examples:

```text
dev/mathew
dev/prashant
dev/irene
```

Create your branch from the latest `main`:

```bash
git switch main
git pull origin main
git switch -C dev/[your-github-username]
```

Example:

```bash
git switch main
git pull origin main
git switch -C dev/mathew
```

### Branch Description

When creating the branch, add a short description explaining what the branch is being used for.

Examples:

```text
Homepage redesign and hero animations
```

```text
Events page implementation
```

```text
Registration flow
```

Keep the description concise and relevant to the work being done.

---

# Development Workflow

Whenever you start working, first make sure you have the latest version of `main`.

### 1. Switch to your personal branch

```bash
git switch dev/[your-github-username]
```

### 2. Update from `main`

```bash
git pull origin main
```

### 3. Work on your task

SEE you are not pulling main directly, but only from your branch, so don't jump in main

Make your changes and commit them regularly:

```bash
git add .
git commit -m "feat: add event registration form"
```

### 4. Push your branch (if you haven't done this before, only one time)

```bash
git push origin dev/[your-github-username]
```

```bash
#if branch is already pushed, then for pushing the commit
git push
```

---

# When Your Work Is Done

Once your work is complete:

1. Make sure your changes are tested locally.
2. Make sure your branch is up to date with `main`.
3. Push your branch.
4. Create a Pull Request to `main`.

Before creating the PR, update your branch if `main` has changed:

```bash
git switch main
git pull origin main

git switch dev/[your-github-username]
git merge main
```

Resolve any merge conflicts if necessary.

Then test your changes again and push:

```bash
git push origin dev/[your-github-username]
```

Create the Pull Request:

```text
dev/[your-github-username] → main
```

---

# Pull Request Process

All completed work must be submitted through a Pull Request.

## Before Creating a PR

Make sure:

- [ ] The project works locally
- [ ] There are no console errors
- [ ] Responsive design has been checked
- [ ] Images load correctly
- [ ] GSAP animations work correctly
- [ ] No `.env.local` or secrets are committed
- [ ] Page-specific components are inside `pageComponents`
- [ ] Common/reusable components are inside `components`
- [ ] Page-specific images are inside the appropriate `public/images` folder

## PR Template

```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Code refactoring
- [ ] UI/UX improvement

## Testing Done

- [ ] Tested locally
- [ ] Checked responsive design
- [ ] Checked animations
- [ ] Checked images
- [ ] No console errors

## Screenshots

Add screenshots if applicable.

## Additional Notes

Any additional context or concerns.
```

---

# Commit Message Convention

Follow the Conventional Commits format.

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code formatting/styling changes
- `refactor:` — Code refactoring
- `test:` — Adding or updating tests
- `chore:` — Maintenance tasks

Examples:

```text
feat: add event schedule page
fix: resolve mobile navigation bug
docs: update development guidelines
style: improve hero section spacing
refactor: simplify event card component
test: add registration form tests
chore: update dependencies
```

---

# Project Organization

The project follows a component-based organization.

## Page Components

Components that are specific to a particular page must be placed inside the `pageComponents` folder.

For example:

```text
pageComponents/
├── Home/
├── Events/
├── Schedule/
└── Register/
```

Page-specific components should **not** be placed directly inside the common `components` folder.

The `pageComponents` folder is intended for components that are only relevant to a particular page.

---

## Common Components

Components that are reusable across multiple pages must be placed inside the `components` folder.

Examples include:

- Navbar
- Footer
- Buttons
- Modals
- Loaders
- Common cards
- Shared UI elements

If a component is used or expected to be used across multiple pages, it belongs in `components`.

Avoid creating duplicate versions of common components for individual pages.

---

# Images

All images should be stored inside:

```text
public/images/
```

Images used exclusively by a particular page should be placed inside a folder corresponding to that page's `pageComponent`.

For example:

```text
public/
└── images/
    ├── Home/
    ├── Events/
    ├── Schedule/
    └── Register/
```

If the Events page uses:

- Event hero image
- Event cards
- Event backgrounds
- Event-specific graphics

they should all be kept under:

```text
public/images/Events/
```

### Important

**Keep images used by the same page together.**

Do not scatter page-specific images directly throughout `public/images`.

Shared images that are genuinely used across multiple pages may be placed in an appropriate shared location.

---

# Naming Conventions

## Components

Use PascalCase:

```text
EventCard.jsx
Navbar.jsx
RegistrationForm.jsx
HeroSection.jsx
```

## Utilities

Use camelCase:

```text
formatDate.js
apiHelper.js
fetchEvents.js
```

## Folders

Use clear and consistent names.

Page component folders should correspond to their page:

```text
pageComponents/
├── Home/
├── Events/
├── Schedule/
└── Register/
```

## Variables

Use camelCase:

```js
eventList
userName
registrationData
```

## Constants

Use UPPER_SNAKE_CASE:

```js
API_BASE_URL
MAX_FILE_SIZE
EVENT_CATEGORIES
```

## Functions

Use camelCase:

```js
fetchEvents()
handleSubmit()
formatDate()
```

## React Components

Use PascalCase:

```js
EventCard
RegistrationForm
HeroSection
```

---

# Styling

The primary styling system is **Tailwind CSS**.

Prefer Tailwind utility classes for normal styling.

Use custom CSS only when necessary, such as for:

- Complex visual effects
- Styles that are difficult to express with Tailwind
- Specialized animation-related styling

Keep styling consistent across the project.

---

# Animations

**GSAP** is the primary animation library.

When using GSAP:

- Keep animations performant.
- Prefer `transform` and `opacity` for animations where possible.
- Clean up GSAP animations and ScrollTriggers when components unmount.
- Avoid unnecessary animations.
- Test animations on both desktop and mobile.
- Ensure animations do not interfere with usability or navigation.
- Consider reduced-motion preferences where appropriate.

---

# Responsiveness

The website must be responsive across:

- Mobile
- Tablet
- Desktop

Follow a mobile-first approach where practical.

Avoid unnecessary fixed dimensions and ensure interactive elements are usable on touch devices.

Always test your changes at multiple viewport sizes before creating a PR.

---

# Environment Variables

Environment variables must be stored in `.env.local`.

Example:

```env
NEXT_PUBLIC_API_URL=your_api_url
DATABASE_URL=your_database_url
```

### IMPORTANT

**`.env.local` must NEVER be pushed to Git.**

Make sure it is included in `.gitignore`.

You may provide an `.env.example` containing the required variable names without any secrets:

```env
NEXT_PUBLIC_API_URL=
DATABASE_URL=
```

Never commit:

- API keys
- Access tokens
- Passwords
- Database credentials
- Private keys
- Other secrets

Also DO NOT UPDATE ANY VERSIONS of the dependencies used

---

# Development Best Practices

## Code Quality

- Write clean and readable code.
- Keep components small and focused.
- Use meaningful names.
- Avoid unnecessary duplication.
- Follow the DRY principle.
- Add comments only where they provide useful context.
- Prefer reusable components when appropriate.

## Before Creating a Component

Ask:

**Is this component specific to one page?**

→ Put it in `pageComponents`.

**Is this component reusable across multiple pages?**

→ Put it in `components`.

This keeps the codebase organized and prevents unnecessary duplication.

---

# Merge Conflicts

If `main` has changed while you are working, update your branch before creating your PR:

```bash
git switch main
git pull origin main

git switch dev/[your-github-username]
git merge main
```

Resolve conflicts, then:

```bash
git add .
git commit -m "chore: resolve merge conflicts"
```

Test the project again and push your branch:

```bash
git push origin dev/[your-github-username]
```

---

# Important Rules

### 1. Never work directly on `main`

Always use your personal development branch.

### 2. Pull `main` before starting work

Always begin your work by updating `main`:

```bash
git switch main
git pull origin main
```

### 3. Use a personal branch

Format:

```text
dev/[your-github-username]
```

### 4. Submit completed work through a PR

The workflow is:

```text
Personal Branch → Pull Request → main
```

### 5. Never push `.env.local`

Environment files containing secrets must never be committed.

### 6. Keep page-specific components in `pageComponents`

Do not put page-specific components into `components`.

### 7. Keep reusable components in `components`

Common components belong in the shared `components` folder.

### 8. Keep page-specific images together

Images for a particular page should be placed under:

```text
public/images/<pageComponentName>/
```

### 9. Test before creating a PR

Every developer is responsible for testing their changes locally before submitting them for review.

---

# Quick Reference

```text
                 main
                  │
                  │
          create personal branch
                  │
                  ▼
        dev/[your-github-username]
                  │
                  │
               Work
                  │
                  ▼
             Commit + Push
                  │
                  ▼
           Pull Request
                  │
                  ▼
                 main
```

**Keep the codebase clean, modular, responsive, and easy for the entire Tathva ’26 team to work on.**
