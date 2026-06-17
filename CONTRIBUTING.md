# Contributing to Tasvir AI Studio

Thank you for considering a contribution to Tasvir. Contributions can include
bug fixes, interface improvements, documentation, translations, accessibility
work, and new features that fit the project's focused creative workflow.

## Before You Start

- Check existing issues and pull requests to avoid duplicate work.
- For a large feature or architectural change, open an issue before writing
  the implementation.
- Keep changes focused. Avoid unrelated refactors in the same pull request.
- Never include API keys, passwords, generated images, or local database data.

## Local Setup

Follow the [root README](README.md) and the guides under
[`docs/setup`](docs/setup).

Create local environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Install and run the backend:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Install and run the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

## Development Workflow

1. Fork or clone the repository.
2. Create a focused branch:

```bash
git checkout -b fix/short-description
```

3. Make the smallest complete change that solves the issue.
4. Run the available checks:

```bash
cd frontend
npm run lint
npm run build
```

5. Manually verify the affected flow in English and Turkish.
6. Update `README.md`, setup guides, or `CHANGELOG.md` when behavior changes.
7. Open a pull request with a clear description and screenshots for visual
   changes.

## Code Guidelines

- Follow the existing React, CSS, FastAPI, and service-layer structure.
- Keep UI text available in both English and Turkish.
- Use environment variables for keys and machine-specific settings.
- Keep API keys on the backend. Do not expose secrets through `VITE_*`
  variables.
- Validate user input on both the frontend and backend.
- Show understandable user-facing errors while keeping technical details in
  backend logs.
- Use safe, generated file names and cross-platform paths.
- Preserve the local-first approach: user files and records should remain on
  the user's computer.

## Pull Requests

A pull request should explain:

- What changed
- Why the change is needed
- How it was verified
- Any setup or environment changes
- Screenshots or a short recording for interface changes

Keep one pull request focused on one problem whenever possible.

## Reporting Bugs

Include:

- Operating system
- Node.js and Python versions
- Relevant page or API route
- Steps to reproduce
- Expected and actual behavior
- Non-sensitive logs or screenshots

Remove API keys, passwords, tokens, and personal file paths before sharing
logs.

## Current Project Scope

- Image Studio supports text-to-image generation.
- Image-to-image is not part of the project.
- Content Studio uses Ollama and Qwen for local text generation.
- Automated tests are planned but are not available yet.

## License Notice

By contributing, you agree that your contribution may be distributed under
the license selected for this repository. Review [LICENSE](LICENSE) before
submitting a contribution.
