"""
AI extraction prompts for portfolio data processing.

This module contains prompts used for extracting structured portfolio data
from unstructured PDF text and GitHub repository information.
"""

# Token counting configuration constants
MAX_TOKENS_PER_REQUEST = 50000
MODEL_ENCODING = "cl100k_base"  # Default encoding for GPT models

# Main portfolio extraction prompt
PORTFOLIO_EXTRACTION_PROMPT = """
Extract structured portfolio information from the provided text (resume, LinkedIn profile, or GitHub data).

## KEY RULES:
1. Extract ONLY information present in the source - never invent data
2. All fields are optional - omit if not found
3. Resume data takes priority over LinkedIn when there are conflicts
4. Return valid JSON only - no explanatory text
5. **Generate headlines and summaries from content if not explicitly provided**
6. **Clean company names** - extract only the company name, remove annotations like "– YC backed", "– Series A", parenthetical info, etc.

## WHAT TO EXTRACT:

**Personal Info:**
- Name, headline, summary, email, phone, location
- **If headline is missing, generate one from job titles** (e.g., "Senior Software Engineer at Google")
- **If summary is missing, generate a brief one from work experience** (2-3 sentences highlighting key experience)
- Social/professional URLs (just the URL and optional label - don't worry about the type)
- Skills/technologies as tags

**Work Experience:**
- **Organization: Extract ONLY the company name** 
  - Examples: "Writesonic – YCombinator backed startup" → "Writesonic"
  - "Meta (formerly Facebook)" → "Meta"
  - "Google Inc." → "Google Inc."
- Title, location, dates
- Use is_current=true for current positions
- Format highlights as markdown bullet points: "- Point one\n- Point two"
- List technologies used

**Projects:**
- Name, highlights (as markdown bullets), technologies
- GitHub URL, live link, demo video (if YouTube link mentioned)
- Use more_context for detailed descriptions

**Education:**
- Institution, degree, field of study (branch)
- Dates, location, grades
- Use is_current=true if currently enrolled

**Certifications:**
- Name, issuing organization, verification link

**Text Blobs:**
- Achievements/awards as markdown bullets: "- Achievement one\n- Achievement two"
- Any additional context that doesn't fit elsewhere

## DATE FORMAT:
- Extract as {"month": 1-12, "year": 2020}
- Omit month if unclear, include only year
- Examples: "Jan 2020" → {"month": 1, "year": 2020}, "2020" → {"year": 2020}

## EXAMPLE OUTPUT:
{
  "personal_info": {
    "full_name": "Jane Doe",
    "headline": "Software Engineer",
    "email": "jane@example.com",
    "profiles": [{"url": "https://github.com/janedoe"}],
    "tags": ["Python", "React"]
  },
  "work_experiences": [{
    "organization": "Tech Corp",
    "title": "Senior Engineer",
    "start_date": {"month": 1, "year": 2020},
    "is_current": true,
    "highlights": "- Led team of 5\n- Improved performance by 40%",
    "technologies": ["Python", "AWS"]
  }],
  "projects": [{
    "name": "Portfolio Site",
    "highlights": "- Built with Next.js\n- Deployed to Vercel",
    "technologies": ["Next.js", "TypeScript"],
    "github": "https://github.com/janedoe/portfolio"
  }],
  "education": [{
    "institution": "State University",
    "degree": "Bachelor of Science",
    "branch": "Computer Science",
    "start_date": {"year": 2016},
    "end_date": {"year": 2020}
  }],
  "certifications": [{
    "name": "AWS Solutions Architect",
    "issuer": "Amazon Web Services"
  }],
  "text_blobs": {
    "achievements": "- Won hackathon 2023\n- Published research paper"
  }
}

Now extract data from the following:
"""
