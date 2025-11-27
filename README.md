<!-- PROJECT LOGO -->
<div align="center">
  <a href="https://portfolioly.app">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://media.portfolioly.app/hero/logo-full-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://media.portfolioly.app/hero/logo-full-light.svg">
      <img alt="Portfolioly Logo" src="https://media.portfolioly.app/hero/logo-full-light.svg" width="280">
    </picture>
  </a>

  <h3 align="center">Create a beautiful portfolio in two clicks</h3>

  <p align="center">
    Turn your Resume, GitHub, or LinkedIn into a stunning portfolio website with AI.
    <br />
    <br />
    <a href="https://portfolioly.app/"><strong>🚀 Create Your Portfolio</strong></a>
    &middot;
    <a href="https://github.com/yashrathi-git/portfolioly/issues/new?labels=bug">Report Bug</a>
    &middot;
    <a href="https://github.com/yashrathi-git/portfolioly/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>

<br />

<!-- HERO BANNER -->
<p align="center">
  <a href="https://portfolioly.app">
    <img src="https://media.portfolioly.app/hero/portfolioly-banner.jpg" alt="Portfolioly Banner" width="100%">
  </a>
</p>

<br />

<!-- WATCH DEMO CTA -->
<p align="center">
  <a href="https://www.youtube.com/watch?v=bL3o6-LaU7w">
    <img src="https://img.shields.io/badge/🎬_Watch_Demo-Build_&_Deploy_in_1_Minute-FF0000?style=for-the-badge&logoColor=white" alt="Watch Demo Video">
  </a>
</p>

<br />

<!-- TABLE OF CONTENTS -->
<details>
  <summary>📑 Table of Contents</summary>
  <ol>
    <li><a href="#-about-the-project">About The Project</a></li>
    <li><a href="#-see-what-generated-portfolios-look-like">Generated Portfolio Examples</a></li>
    <li><a href="#-how-it-works">How It Works</a></li>
    <li><a href="#-tech-stack">Tech Stack</a></li>
    <li><a href="#-getting-started">Getting Started</a></li>
    <li><a href="#-self-host-your-portfolio">Self-Host</a></li>
    <li><a href="#-contributing">Contributing</a></li>
    <li><a href="#-acknowledgments">Acknowledgments</a></li>
    <li><a href="#-license">License</a></li>
  </ol>
</details>

<br />

<!-- ABOUT -->

## 💡 About The Project

Portfolioly transforms your existing professional content into a polished, interactive portfolio. Upload a PDF resume, connect your GitHub, or import from LinkedIn — our AI extracts your experience, projects, and skills, then generates a ready-to-share portfolio.

**✨ Key Highlights:**

- **One-click deploy to Vercel** — completely free hosting
- **AI Chat Mode** — turns your portfolio into a ChatGPT-like assistant that answers questions about your experience, projects, and skills
- **No design skills needed. No hours of setup. Just two clicks.**

<br />

<!-- GENERATED PORTFOLIO DEMOS -->

## 🎨 See What Generated Portfolios Look Like

### Traditional Layout

<video src="https://media.portfolioly.app/hero/traditional-demo/traditional_demo_webm.webm" width="100%" autoplay loop muted playsinline>
  <source src="https://media.portfolioly.app/hero/traditional-demo/traditional_demo_webm.webm" type="video/webm">
  <source src="https://media.portfolioly.app/hero/traditional-demo/traditional_demo_mp4.mp4" type="video/mp4">
</video>

### Chat Layout

<video src="https://media.portfolioly.app/hero/chat_demo/chat_final.webm" width="100%" autoplay loop muted playsinline>
  <source src="https://media.portfolioly.app/hero/chat_demo/chat_final.webm" type="video/webm">
  <source src="https://media.portfolioly.app/hero/chat_demo/chat_final.mp4" type="video/mp4">
</video>

<br />

<p align="center">
  <a href="https://portfolioly.app/demo">
    <img src="https://img.shields.io/badge/✨_Try_Interactive_Demo-See_Generated_Portfolio-6366f1?style=for-the-badge" alt="Try Interactive Demo">
  </a>
</p>

<br />

<!-- HOW IT WORKS -->

## ⚡ How It Works

1. **Upload** — Drop your resume PDF, connect GitHub, or import from LinkedIn
2. **AI Magic** — Our AI extracts and structures your professional data
3. **Customize** — Edit content, choose your theme & layout
4. **Deploy** — One-click deploy to Vercel directly from the platform

<br />

<!-- TECH STACK -->

## 🛠 Tech Stack

| Layer    | Technologies                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Frontend | [![Next.js][Next.js]][Next-url] [![React][React.js]][React-url] [![TailwindCSS][TailwindCSS]][TailwindCSS-url] |
| Backend  | [![FastAPI][FastAPI]][FastAPI-url] [![Python][Python]][Python-url] [![Firebase][Firebase]][Firebase-url]       |
| AI       | Azure AI for data extraction                                                                                   |
| Infra    | Yarn workspaces monorepo                                                                                       |

<br />

<!-- GETTING STARTED -->

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/yashrathi-git/portfolioly.git

# Install dependencies
yarn install

# Start development
yarn dev:main
```

See individual README files in `/apps` and `/backend` for detailed setup.

<br />

<!-- SELF HOST -->

## 🏠 Self-Host Your Portfolio

**Easiest way:** Use [Portfolioly](https://portfolioly.app) to create your portfolio — once you're done, hit the built-in **Deploy to Vercel** button and you're live in seconds.

**Want full control?** Clone the standalone template repo and deploy anywhere:

<p align="center">
  <a href="https://github.com/yashrathi-git/portfolioly-template">
    <img src="https://img.shields.io/badge/portfolioly--template-Deploy%20in%20One%20Click-black?style=for-the-badge&logo=vercel" alt="Template Repo">
  </a>
</p>

<br />

<!-- CONTRIBUTING -->

## 🤝 Contributing

Contributions are what make the open source community amazing! Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<br />

<!-- ACKNOWLEDGMENTS -->

## 🙏 Acknowledgments

- [**Magic UI**](https://magicui.design/) — Beautiful animated components that make portfolios shine ✨
- [Next.js](https://nextjs.org/) — React framework
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [Radix UI](https://www.radix-ui.com/) — Accessible primitives

<br />

<!-- LICENSE -->

## 📄 License

Distributed under the Unlicense License. See `LICENSE` for more information.

<!-- MARKDOWN LINKS & IMAGES -->

[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[TailwindCSS]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[TailwindCSS-url]: https://tailwindcss.com/
[FastAPI]: https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white
[FastAPI-url]: https://fastapi.tiangolo.com/
[Python]: https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white
[Python-url]: https://python.org/
[Firebase]: https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black
[Firebase-url]: https://firebase.google.com/
