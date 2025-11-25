"use client";

import { Portfolio } from "portfolioly-template-components";
import type { PortfolioData } from "portfolioly-schema";
import { mapPortfolioDataToTemplate } from "@/utils/portfolioDataMapper";
import { env } from "@/lib/env";

// Import the compiled CSS styles to ensure they're loaded
import "portfolioly-template-components/style.css";

// Hardcoded demo portfolio data (backend format)
const DEMO_PORTFOLIO_DATA: PortfolioData = {
  personal_info: {
    full_name: "John Doe",
    headline:
      "Building scalable cloud infrastructure and next-gen AI experiences.",
    chatfolio_headline:
      "Building scalable cloud infrastructure and next-gen AI experiences.",
    summary:
      "Senior Software Engineer with 6.5 years of experience architecting high-scale distributed systems and integrating AI solutions. Currently optimizing search infrastructure. Previously built real-time communication features at SomePlace. Passionate about system design, large-scale data processing, and generative AI applications.",
    email: "alex.mercer.dev@gmail.com",
    phone: "+1-415-555-0123",
    location: "San Francisco, California, USA",
    profile_photo_url:
      "https://portfolioly.blob.core.windows.net/images/9bowdJ27KsWjxI8A4GKV4BE8MVs2/profile-photo.webp",
    profiles: [
      {
        type: "linkedin",
        url: "/",
        label: "LinkedIn",
      },
      {
        type: "github",
        url: "/",
        label: "GitHub",
      },
      {
        type: "medium",
        url: "/",
      },
      {
        type: "leetcode",
        url: "/",
      },
    ],
    tags: [
      "Go",
      "C++",
      "Python",
      "Java",
      "Kubernetes",
      "gRPC",
      "TensorFlow",
      "Google Cloud",
      "Azure",
      "System Design",
      "Microservices",
      "Redis",
      "Kafka",
      "React",
      "GraphQL",
      "CI/CD",
      "Terraform",
      "PostgreSQL",
    ],
  },
  work_experiences: [
    {
      organization: "SearchGiant",
      title: "Senior Software Engineer (L5)",
      location: "Mountain View, CA",
      logo_url: "https://cdn.brandfetch.io/google.com?c=1idhX7o8o4Zu9f-g8PS",
      start_date: { month: 5, year: 2023 },
      is_current: true,
      highlights:
        "- Leading a team of 5 engineers to migrate legacy monolithic search indexing pipelines to a microservices architecture using Go and gRPC.\n- Optimized query serving latency by 15% for high-traffic regions by implementing a new caching layer with Redis Cluster.\n- Integrated Gemini Pro models into internal developer tooling, reducing code review turnaround time by roughly 30%.",
      technologies: ["Go", "Kubernetes", "gRPC", "Gemini AI"],
    },
    {
      organization: "GameCompany",
      title: "Software Engineer II",
      location: "San Mateo, CA",
      logo_url: "https://cdn.brandfetch.io/roblox.com?c=1idhX7o8o4Zu9f-g8PS",
      start_date: { month: 5, year: 2021 },
      end_date: { month: 5, year: 2023 },
      is_current: false,
      highlights:
        "- Engineered real-time spatial voice chat features supporting millions of concurrent users, handling massive throughput via Apache Kafka.\n- Developed automated content moderation tools using computer vision to flag unsafe user-generated 3D assets with 99.5% accuracy.\n- Reduced server infrastructure costs by 20% through optimization of Lua-based game scripts and container resource allocation.",
      technologies: ["C++", "Lua", "Kafka", "Computer Vision"],
    },
    {
      organization: "Windows",
      title: "Software Engineer",
      location: "Redmond, WA",
      logo_url: "https://cdn.brandfetch.io/microsoft.com?c=1idhX7o8o4Zu9f-g8PS",
      start_date: { month: 6, year: 2019 },
      end_date: { month: 5, year: 2021 },
      is_current: false,
      highlights:
        "- Contributed to Azure Active Directory identity management, focusing on secure OAuth 2.0 implementation for enterprise clients.\n- Built and deployed scalable REST APIs for Microsoft Teams integrations, enhancing cross-organization collaboration capabilities.\n- Improved CI/CD pipeline reliability for the Azure DevOps suite, reducing build failures by 40% using C# and .NET Core.",
      technologies: ["C#", ".NET Core", "Azure", "OAuth"],
    },
    {
      organization: "ConsultancyCompany",
      title: "Software Engineer Intern",
      location: "New York, NY",
      logo_url: "https://cdn.brandfetch.io/mckinsey.com?c=1idhX7o8o4Zu9f-g8PS",
      start_date: { month: 6, year: 2018 },
      end_date: { month: 8, year: 2018 },
      is_current: false,
      highlights:
        "- Developed a client-facing data visualization dashboard using React and D3.js to track supply chain KPIs for a Fortune 500 client.\n- Automating daily data ingestion scripts using Python pandas, saving the analytics team 10+ hours of manual work per week.",
      technologies: ["React", "Python", "D3.js"],
    },
  ],
  projects: [
    {
      name: "Headspace CLI",
      card_image_url:
        "https://portfolioly.blob.core.windows.net/images/9bowdJ27KsWjxI8A4GKV4BE8MVs2/projects/1763982720306_147270294-de0ec3f9-7bfa-4c63-84de-b4239fd4995e.gif",
      highlights:
        "- Developed a command line interface for Headspace\n- Allows access to meditations directly from command line",
      technologies: ["Next.js", "Tailwind CSS", "Recharts", "WebSocket"],
      github: "/",
      live_link: "/",
      images: [],
    },
    {
      name: "Portfolioly",
      card_image_url:
        "https://portfolioly.blob.core.windows.net/images/9bowdJ27KsWjxI8A4GKV4BE8MVs2/projects/1763982769036_cursorful-video-1763919410202-ezgif.com-speed.gif",
      highlights:
        "- Allows users to create instant portfolio directly from their LinkedIn profile",
      technologies: ["Flutter", "Firebase", "Google Maps API", "MongoDB"],
      github: "/",
      images: [],
    },
    {
      name: "Music App",
      card_image_url:
        "https://portfolioly.blob.core.windows.net/images/9bowdJ27KsWjxI8A4GKV4BE8MVs2/projects/1763982856835_ezgif-54030ab3bcd4991d.gif",
      highlights: "- Free music streaming app, with a beautiful UI",
      technologies: ["Python", "FastAPI", "Stable Diffusion", "PostgreSQL"],
      github: "/",
      live_link: "/",
      images: [],
    },
  ],
  education: [
    {
      institution: "Yale University",
      degree: "Master of Science",
      branch: "Computer Science (Machine Learning Specialization)",
      logo_url: "https://cdn.brandfetch.io/yalebooks.com?c=1idhX7o8o4Zu9f-g8PS",
      start_date: { month: 8, year: 2017 },
      end_date: { month: 5, year: 2019 },
      is_current: false,
      location: "New Haven, CT",
      grade: "3.9/4.0",
    },
    {
      institution: "Columbia University",
      degree: "Bachelor of Science",
      branch: "Computer Science",
      logo_url: "https://cdn.brandfetch.io/columbia.edu?c=1idhX7o8o4Zu9f-g8PS",
      start_date: { month: 8, year: 2013 },
      end_date: { month: 5, year: 2017 },
      is_current: false,
      location: "New York, NY",
      grade: "3.8/4.0",
    },
  ],
  certifications: [
    {
      name: "Deep Learning Specialization",
      issuer: "Coursera",
      link: "/",
    },
    {
      name: "Google Cloud Professional Data Engineer",
      issuer: "Google",
      link: "/",
    },
    {
      name: "Become a Cloud DevOps Engineer",
      issuer: "Udacity",
      link: "/",
    },
    {
      name: "The Complete Web Development Bootcamp",
      issuer: "Udemy",
      link: "/",
    },
    {
      name: "Meta Back-End Developer Professional Certificate",
      issuer: "Meta",
      link: "/",
    },
    {
      name: "Learn Advanced Go",
      issuer: "Codecademy",
      link: "/",
    },
  ],
  text_blobs: {
    achievements:
      '- **TechCrunch Disrupt Hackathon Winner (2022):** Led a 4-person team to win 1st place in the FinTech category by building an AI-driven fraud detection prototype.\n**Open Source Contributor:** Core maintainer for a popular Go-based WebSocket library with over 2k GitHub stars and wide industry adoption.\n- **Conference Speaker:** Presented a talk on "Scaling Real-time Systems" at GopherCon 2023, attended by 500+ engineers.',
  },
  metadata: {
    source_type: "resume_pdf",
    extracted_at: "2025-11-24T09:53:26.307000Z",
    notes: "Extracted and processed by AI",
  },
  layout_settings: {
    layout_mode: "both",
    default_layout: "traditional",
    chat_mode_footer: false,
  },
};

// Demo credentials
const DEMO_USERNAME = "nikhilajmera2005";
const DEMO_PUBLIC_TOKEN = "psk_FHDZdx8PQ0mQed2irXuvNstqFxZ1KbQw";

export default function DemoPage() {
  // Transform backend data to display format
  const displayData = mapPortfolioDataToTemplate(DEMO_PORTFOLIO_DATA);

  return (
    <div className="min-h-screen">
      <Portfolio
        portfolioData={displayData}
        isLoading={false}
        isOwner={false}
        isPreview={false}
        username={DEMO_USERNAME}
        apiBaseUrl={env.API_BASE_URL}
        publicToken={DEMO_PUBLIC_TOKEN}
      />
    </div>
  );
}
