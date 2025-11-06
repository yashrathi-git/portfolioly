# Integration Recommendations

## Your Questions Answered

### 1. How should I integrate this into a bigger application?

**Recommended Approach: Install as Package**

```bash
# From your parent application directory
pip install -e ../linkedin-extractor

# Or add to requirements.txt
-e ../linkedin-extractor
```

Then use in your code:

```python
from extraction.api import parse_profile

def process_linkedin_profile(markdown_text: str):
    profile = parse_profile(markdown_text)
    # Your business logic here
    return profile
```

**Why this approach?**

- Clean separation between the extractor and your app
- Easy to update the extractor independently
- Standard Python package workflow
- Can version and publish to PyPI later
- No code duplication

**Alternative: Copy Source Files**

Only if you need heavy customization:

```bash
cp -r linkedin-extractor/src/extraction your_app/src/your_app/
```

### 2. Should the tests also go into the parent application tests?

**Recommendation: Keep Tests Separate**

Keep the tests in the `linkedin-extractor` directory and run them independently:

```bash
# Validate the extractor module
cd linkedin-extractor
pytest tests/ -v
```

**Why keep them separate?**

- The extractor is a self-contained module with its own test suite
- You can validate it independently before integration
- Easier to update and maintain
- Your parent app tests should focus on YOUR business logic
- Avoids test suite bloat

**What to test in your parent application:**

Create integration tests that verify YOUR usage of the extractor:

```python
# your_app/tests/test_profile_integration.py
from your_app.services.profile_service import ProfileService
from extraction.api import parse_profile

def test_profile_service_integration():
    """Test that our service correctly uses the extractor."""
    service = ProfileService()

    # Test your business logic
    result = service.process_profile(sample_markdown)

    assert result.status == "success"
    assert result.profile_id is not None
    # Test YOUR logic, not the extractor's parsing
```

**When to merge tests:**

Only merge if:

- You're building a monorepo with unified test suite
- You need to customize the extractor heavily
- You want single test runner for everything

If merging:

```bash
mkdir -p your_app/tests/linkedin_extractor
cp -r linkedin-extractor/tests/* your_app/tests/linkedin_extractor/
```

### 3. Summary: Recommended Integration Strategy

```
your_parent_app/
├── src/
│   └── your_app/
│       ├── services/
│       │   └── profile_service.py    # Uses: from extraction.api import parse_profile
│       └── models/
│           └── profile.py            # Your domain models
│
├── tests/
│   └── test_profile_service.py       # Tests YOUR business logic
│
├── requirements.txt
│   └── -e ../linkedin-extractor      # Reference to extractor package
│
└── linkedin-extractor/               # Separate directory (sibling or submodule)
    ├── src/extraction/               # Extractor source
    ├── tests/                        # Extractor tests (run independently)
    └── README.md
```

## Step-by-Step Integration

### Step 1: Install the Extractor

```bash
cd your_parent_app
pip install -e ../linkedin-extractor
```

### Step 2: Import and Use

```python
# your_app/services/profile_service.py
from extraction.api import parse_profile
import logging

logger = logging.getLogger(__name__)

class ProfileService:
    def process_linkedin_profile(self, markdown_text: str) -> dict:
        """Process LinkedIn profile with business logic."""
        try:
            # Use the extractor
            profile = parse_profile(markdown_text)

            # Your business logic
            enriched_profile = self._enrich_profile(profile)
            self._save_to_database(enriched_profile)

            return {
                "status": "success",
                "profile_id": enriched_profile["id"]
            }

        except Exception as e:
            logger.exception("Failed to process profile")
            return {"status": "error", "message": str(e)}

    def _enrich_profile(self, profile: dict) -> dict:
        """Add your custom enrichment logic."""
        # Calculate years of experience
        total_months = sum(
            exp.get("duration_months", 0)
            for exp in profile["experience"]
        )
        profile["years_experience"] = total_months / 12

        # Add custom fields
        profile["processed_at"] = datetime.now().isoformat()

        return profile

    def _save_to_database(self, profile: dict):
        """Save to your database."""
        # Your database logic
        pass
```

### Step 3: Test Your Integration

```python
# your_app/tests/test_profile_service.py
import pytest
from your_app.services.profile_service import ProfileService

@pytest.fixture
def sample_markdown():
    return """
# John Doe
Software Engineer @ TechCorp

## Experience
### TechCorp
Software Engineer
Jan 2020 - Present · 4 yrs
"""

def test_profile_processing(sample_markdown):
    """Test our profile processing logic."""
    service = ProfileService()
    result = service.process_linkedin_profile(sample_markdown)

    assert result["status"] == "success"
    assert "profile_id" in result

def test_profile_enrichment(sample_markdown):
    """Test our enrichment logic."""
    service = ProfileService()
    profile = parse_profile(sample_markdown)
    enriched = service._enrich_profile(profile)

    assert "years_experience" in enriched
    assert "processed_at" in enriched
```

### Step 4: Validate the Extractor

```bash
# Run extractor tests independently
cd linkedin-extractor
pytest tests/ -v

# Run your app tests
cd your_parent_app
pytest tests/ -v
```

## Benefits of This Approach

✅ **Separation of Concerns**

- Extractor handles parsing
- Your app handles business logic
- Clear boundaries

✅ **Independent Testing**

- Extractor tests validate parsing
- Your tests validate business logic
- No test suite bloat

✅ **Easy Updates**

- Update extractor without touching your app
- Version control is cleaner
- Can publish extractor to PyPI

✅ **Maintainability**

- Each component has single responsibility
- Easier to debug issues
- Clearer code organization

## When to Deviate

**Copy source files if:**

- You need heavy customization of parsers
- You want to vendor the dependency
- You're building a standalone tool

**Merge tests if:**

- You're in a monorepo
- You want single test command
- You're heavily customizing the extractor

## Final Recommendation

**For most applications:**

1. ✅ Install extractor as package (`pip install -e ../linkedin-extractor`)
2. ✅ Keep tests separate (run independently)
3. ✅ Write integration tests in your app for YOUR logic
4. ✅ Use the extractor as a clean dependency

This gives you the best balance of:

- Clean architecture
- Easy maintenance
- Clear testing boundaries
- Future flexibility
