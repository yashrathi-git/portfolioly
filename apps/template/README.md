<div align="center">
  <a href="https://portfolioly.app">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://media.portfolioly.app/hero/logo-full-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://media.portfolioly.app/hero/logo-full-light.svg">
      <img alt="Portfolioly Logo" src="https://media.portfolioly.app/hero/logo-full-light.svg" width="200">
    </picture>
  </a>

  <h3 align="center">Portfolioly Template</h3>

  <p align="center">
    A portfolio template for Portfolioly
    <br />
    <br />
    <a href="https://github.com/yashrathi-git/portfolioly">Main Repo</a>
  </p>
</div>

<br />

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyashrathi-git%2Fportfolioly-template&env=NEXT_PUBLIC_USERNAME,NEXT_PUBLIC_API_BASE_URL&envDescription=Configure%20your%20portfolio&envLink=https%3A%2F%2Fgithub.com%2Fyashrathi-git%2Fportfolioly-template%23environment-variables">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" height="32" />
  </a>
  &nbsp;&nbsp;
  <a href="https://portfolioly.app/demo">
    <img src="https://img.shields.io/badge/Interactive_Demo-6366f1?style=for-the-badge" alt="Interactive Demo" height="32" />
  </a>
</p>

<br />

## This is how it looks

### Traditional Layout

https://github.com/user-attachments/assets/1fb8009f-89f7-44c7-adb0-d36adab90030

### Chat Layout

https://github.com/user-attachments/assets/a9d3ccd4-04ba-428c-a6cf-38d117cc0739

<br />

## What is this?

This is the portfolio template used by [Portfolioly](https://portfolioly.app). You can clone and deploy it manually, or use [portfolioly.app](https://portfolioly.app) to generate your portfolio data for free and deploy with one click.

<br />

## Quick Start

### Option 1: Deploy with Vercel

Click the **Deploy with Vercel** button above and configure your environment variables.

### Option 2: Manual Setup

```bash
git clone https://github.com/yashrathi-git/portfolioly-template.git
cd portfolioly-template
yarn install
cp .env.example .env
# Edit .env with your username
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view your portfolio.

<br />

## Environment Variables

| Variable                   | Required | Description                                              |
| -------------------------- | :------: | -------------------------------------------------------- |
| `NEXT_PUBLIC_USERNAME`     |    ✅    | Your Portfolioly username                                |
| `NEXT_PUBLIC_API_BASE_URL` |    ✅    | Backend API URL (default: `https://api.portfolioly.app`) |
| `NEXT_PUBLIC_PUBLIC_TOKEN` |    ❌    | Token for private portfolios & chat features             |

<br />

## Features

- Multiple layouts (Traditional & Chat)
- Dark/Light mode
- AI Chat (with public token)
- Responsive design
- Next.js 15 & React 19

<br />

## Tech Stack

- Next.js 15 with Turbopack
- React 19
- Tailwind CSS 4
- Framer Motion
- portfolioly-template-components

<br />

## Acknowledgments

Built by [@yashrathi-git](https://github.com/yashrathi-git)

- [Magic UI](https://magicui.design/) — Animated components
- [Portfolioly](https://github.com/yashrathi-git/portfolioly) — Main platform

<br />

## License

MIT License — See [LICENSE](./LICENSE) for details.
