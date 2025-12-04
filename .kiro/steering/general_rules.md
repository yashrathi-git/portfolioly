---
inclusion: always
---

# General Coding Rules

## Code Style

- Be concise with comments and docstrings - leave out the obvious
- Avoid excessive inline comments; code should be self-documenting
- Use meaningful variable and function names

## UI/UX Focus

- Prioritize clean, modern design with smooth animations
- Use Framer Motion for animations where appropriate
- Ensure responsive design across all breakpoints

## Spec mode rules:

- While working on spec create a file in documentation/resume-builder-feat/working-on-xx-feature
- In that docuementation have concise documentation of the functions and the API you exposed in that task so that it will be useful for the next task.
- It should be searchable easily and easily queriable for the next task to find the right file and know all about what was done concisely. The idea is we never re-invent the wheel and we never have backend-frontend mismatch.
- We should use consistent APIs across backend and frontend and if some functionality is already created by previous task the next task should know about it properly.
- In these tasks be concise and to-the-point, the point of these is just to get familar with what exists and what functions we already have along with what API endpoints we have built
- While doing a new task check these files, check the relevant file ONLY and verify what we already have in place
- The first three lines should be short description of what is to come so that while doing a new task those three line could be easily read to understand if the file is relevant for the current task or not.
- When doing a new task check if any file may be relevant in that directory to see if we can read it and understand what we already have in place.

## Package managers

- Always use `uv` package manager for backend and yarn for frontend

## Instructions for writing test cases

- Everything should be properly mocked and ensure that it is mocked properly
- We should have common mocking methods to mock network calls properly and ensure they are re-used across.
- Use `common-mocks.md` file for all information about the mocking functions.
- Use proper file and folder structure for tests also.
