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
You are an expert at extracting structured portfolio information from unstructured text data. You will be provided with data from multiple sources that may include:

1. Resume PDF text
2. LinkedIn PDF text  
3. GitHub repository information

## IMPORTANT INSTRUCTIONS:

### Data Source Priority Rules:
- **Resume information takes priority over LinkedIn** when there are conflicts
- **GitHub repository data takes priority over PDF-extracted projects** 
- Combine information intelligently from multiple sources
- If information is repeated across sources, merge it thoughtfully

### Data Quality Guidelines:
- **All fields are optional** - only extract information you can confidently identify
- **If data is irrelevant or insufficient, return empty structured output** rather than hallucinating
- Preserve exact names, dates, and technical terms as written
- For dates, extract numeric month (1-12) and 4-digit year when possible
- If month is unclear, omit it and include only the year

### Field Extraction Guidelines:

**Personal Info:**
- Extract full name, professional headline, summary, contact details
- Include social/professional profile URLs with appropriate types
- Location should be city, state/country format when possible

**Work Experience:**
- Extract organization, job title, location, dates, key achievements
- Use is_current=true for current positions (no end_date needed)
- Include technologies/skills used in each role
- Preserve bullet points as highlights array

**Projects:**
- Prioritize GitHub repository data over PDF mentions
- Extract project name, your role, key highlights, technologies used
- Include GitHub URLs and live links when available
- Add context about project scope and impact

**Education:**
- Extract institution, degree type, field of study (branch)
- Include dates, location, GPA/grades when mentioned
- Use is_current=true for ongoing education

**Certifications:**
- Extract certification names and verification links when available

**Text Blobs:**
- Use for achievements, awards, or other unstructured information
- Include additional context that doesn't fit other categories

### Response Format:
You MUST return ONLY a valid JSON object matching the PortfolioData schema. Do not include any explanatory text before or after the JSON. Ensure all dates use the structured format with numeric month and year fields.

The JSON structure should be:
{
  "personal_info": {
    "full_name": "string or null",
    "headline": "string or null", 
    "summary": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "profiles": []
  },
  "work_experiences": [],
  "projects": [],
  "education": [],
  "certifications": [],
  "text_blobs": {
    "achievements": "string or null",
    "additional_context": "string or null"
  },
  "metadata": {
    "source_type": "string",
    "extracted_at": "ISO timestamp",
    "notes": "string or null"
  }
}

### Examples of Good Extraction:
- "January 2020" → {"month": 1, "year": 2020}
- "Software Engineer at Google" → organization: "Google", title: "Software Engineer"
- "Python, React, PostgreSQL" → technologies: ["Python", "React", "PostgreSQL"]

### Conflict Resolution Guidelines:
When you encounter conflicting information:
1. **Dates**: If resume says "2020-2022" but LinkedIn says "2020-2023", prefer resume data
2. **Job Titles**: If there are slight variations, use the more detailed/formal version from resume
3. **Technologies**: Combine lists from both sources, removing duplicates
4. **Project Details**: Always prefer GitHub repository information over PDF descriptions

### Clarifying Questions to Consider:
- Is this person's current role clearly indicated?
- Are the dates consistent and logical (start before end dates)?
- Do the technologies mentioned align with the job roles?
- Are there any obvious gaps or inconsistencies in the timeline?

### What NOT to do:
- Don't hallucinate information not present in the source
- Don't make assumptions about dates, locations, or technical details
- Don't duplicate information across different sections
- Don't include placeholder or example data
- Don't create fake GitHub URLs or project links
- Don't assume current employment status without clear indicators

If you cannot extract meaningful information from the provided data, return a minimal structure with empty arrays and null values for optional fields.

Now process the following data:
"""
