<a id="readme-top"></a>

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
    Self-host your Portfolioly portfolio with one click
    <br />
    <br />
    <a href="https://portfolioly.app"><strong>Create Your Portfolio →</strong></a>
    &middot;
    <a href="https://github.com/yashrathi-git/portfolioly">Main Repo</a>
  </p>
</div>

<br />

<!-- DEPLOY BUTTON -->
<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyashrathi-git%2Fportfolioly-template&env=NEXT_PUBLIC_USERNAME,NEXT_PUBLIC_API_BASE_URL&envDescription=Configure%20your%20portfolio&envLink=https%3A%2F%2Fgithub.com%2Fyashrathi-git%2Fportfolioly-template%23environment-variables">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" height="40" />
  </a>
</p>

<br />

## ✨ What is this?

This is the standalone template for [**Portfolioly**](https://portfolioly.app) — a platform that transforms your Resume, GitHub, or LinkedIn into a stunning portfolio website.

**Want the full experience?** Head to [portfolioly.app](https://portfolioly.app) to:

- 📄 Upload your resume PDF
- 🐙 Connect your GitHub
- 💼 Import from LinkedIn
- 🎨 Customize themes & layouts
- 🚀 One-click deploy

**Want to self-host?** Clone this repo and deploy your portfolio anywhere.

<br />

## 🚀 Quick Start

### Option 1: Deploy with Vercel (Recommended)

Click the **Deploy with Vercel** button above and configure your environment variables.

### Option 2: Manual Setup

```bash
# Clone the repo
git clone https://github.com/yashrathi-git/portfolioly-template.git
cd portfolioly-template

# Install dependencies
yarn install

# Copy environment file
cp .env.example .env

# Edit .env with your username
# NEXT_PUBLIC_USERNAME=your_username

# Start development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view your portfolio.

<br />

## ⚙️ Environment Variables

| Variable                   | Required | Description                                              |
| -------------------------- | :------: | -------------------------------------------------------- |
| `NEXT_PUBLIC_USERNAME`     |    ✅    | Your Portfolioly username                                |
| `NEXT_PUBLIC_API_BASE_URL` |    ✅    | Backend API URL (default: `https://api.portfolioly.app`) |
| `NEXT_PUBLIC_PUBLIC_TOKEN` |    ❌    | Token for private portfolios & chat features             |

<br />

## 🎨 Features

- 🖼️ **Multiple Layouts** — Traditional & Chat-based designs
- 🌙 **Dark/Light Mode** — Automatic theme switching
- 💬 **AI Chat** — Interactive portfolio experience (with public token)
- 📱 **Responsive** — Looks great on all devices
- ⚡ **Fast** — Built with Next.js 15 & React 19

<br />

## 🛠 Tech Stack

- **Next.js 15** with Turbopack
- **React 19**
- **Tailwind CSS 4**
- **Framer Motion**
- **portfolioly-template-components**

<br />

## 🙏 Acknowledgments

Built with ❤️ by [@yashrathi-git](https://github.com/yashrathi-git)

Special thanks to:

- [**Magic UI**](https://magicui.design/) — Beautiful animated components ✨
- [**Portfolioly**](https://github.com/yashrathi-git/portfolioly) — The main platform

<br />

## 📄 License

Unlicense — See [LICENSE](./LICENSE) for details.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
