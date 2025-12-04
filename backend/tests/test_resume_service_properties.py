"""
Property-based tests for ResumeService.

These tests verify correctness properties using Hypothesis for property-based testing.
Each test is tagged with the property number from the design document.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from hypothesis import given, settings, strategies as st

from app.services.resume_service import ResumeService, ResumeNotFoundError
from app.schemas.resume import (
    ResumeData,
    ResumePersonalInfo,
    ResumeWorkExperience,
    ResumeEducation,
    ResumeProject,
    ResumeSkills,
    ResumeCertification,
    ResumeDateInfo,
    SkillCategory,
    CreateResumeRequest,
    SectionType,
    DEFAULT_SECTION_ORDER,
)


# Hypothesis strategies for generating test data
@st.composite
def resume_personal_info_strategy(draw):
    """Generate valid ResumePersonalInfo."""
    return ResumePersonalInfo(
        full_name=draw(st.text(min_size=1, max_size=100).filter(lambda x: x.strip())),
        email=draw(st.none() | st.emails()),
        phone=draw(st.none() | st.text(min_size=1, max_size=20)),
        location=draw(st.none() | st.text(min_size=1, max_size=100)),
        linkedin_url=draw(st.none() | st.text(min_size=1, max_size=200)),
        github_url=draw(st.none() | st.text(min_size=1, max_size=200)),
        website_url=draw(st.none() | st.text(min_size=1, max_size=200)),
    )


@st.composite
def create_resume_request_strategy(draw):
    """Generate valid CreateResumeRequest."""
    personal_info = draw(resume_personal_info_strategy())
    return CreateResumeRequest(
        name=draw(st.text(min_size=1, max_size=100).filter(lambda x: x.strip())),
        template_id=draw(st.sampled_from(["classic", "modern", "minimal"])),
        personal_info=personal_info,
        summary=draw(st.none() | st.text(max_size=500)),
        work_experiences=[],
        education=[],
        projects=[],
        skills=ResumeSkills(categories=[]),
        certifications=[],
        section_order=list(DEFAULT_SECTION_ORDER),
    )


class MockFirestoreDoc:
    """Mock Firestore document."""

    def __init__(self, data=None, exists=True):
        self._data = data or {}
        self.exists = exists

    def to_dict(self):
        return self._data

    def get(self):
        return self


class MockFirestoreCollection:
    """Mock Firestore collection that tracks created documents."""

    def __init__(self):
        self._documents = {}

    def document(self, doc_id):
        if doc_id not in self._documents:
            self._documents[doc_id] = MockFirestoreDoc(exists=False)
        return self._documents[doc_id]

    def add_document(self, doc_id, data):
        doc = MockFirestoreDoc(data=data, exists=True)
        doc.set = Mock()
        doc.delete = Mock()
        self._documents[doc_id] = doc
        return doc


class MockFirestoreClient:
    """Mock Firestore client."""

    def __init__(self):
        self._users = {}

    def collection(self, name):
        if name == "users":
            return self
        return MockFirestoreCollection()

    def document(self, user_id):
        if user_id not in self._users:
            self._users[user_id] = {"resumes": MockFirestoreCollection()}
        return self._users[user_id]


class TestResumeServiceProperties:
    """Property-based tests for ResumeService."""

    @pytest.fixture
    def mock_firestore(self):
        """Create mock Firestore client."""
        return MockFirestoreClient()

    @pytest.fixture
    def resume_service(self, mock_firestore):
        """Create ResumeService with mocked Firestore."""
        with patch("app.services.resume_service.firebase_admin") as mock_admin:
            mock_admin.get_app.side_effect = ValueError("No app")
            with patch("app.services.resume_service.firestore") as mock_fs:
                mock_fs.client.return_value = mock_firestore
                service = ResumeService()
                service._db = mock_firestore
                return service

    @given(st.integers(min_value=2, max_value=50))
    @settings(max_examples=100)
    def test_property_10_unique_id_generation(self, num_resumes):
        """
        **Feature: linkedin-github-resume-builder, Property 10: Resume Creation Generates Unique ID**
        **Validates: Requirements 10.1**

        For any number of resumes created, each SHALL have a unique ID.
        """
        with patch("app.services.resume_service.firebase_admin") as mock_admin:
            mock_admin.get_app.side_effect = ValueError("No app")
            with patch("app.services.resume_service.firestore") as mock_fs:
                # Track all generated IDs
                generated_ids = set()

                # Create service
                service = ResumeService()

                # Generate IDs
                for _ in range(num_resumes):
                    resume_id = service._generate_resume_id()
                    # Each ID should be unique
                    assert (
                        resume_id not in generated_ids
                    ), f"Duplicate ID generated: {resume_id}"
                    generated_ids.add(resume_id)

                # All IDs should be unique
                assert len(generated_ids) == num_resumes

                # All IDs should have the correct format
                for resume_id in generated_ids:
                    assert resume_id.startswith("resume_")
                    assert len(resume_id) == len("resume_") + 12  # 12 hex chars

    @given(create_resume_request_strategy())
    @settings(max_examples=100)
    def test_property_11_duplication_preserves_content(self, request):
        """
        **Feature: linkedin-github-resume-builder, Property 11: Resume Duplication Preserves Content**
        **Validates: Requirements 10.3**

        For any duplicated resume, the copy SHALL have a different ID but identical content
        (personal_info, work_experiences, education, projects, skills, certifications).
        """
        with patch("app.services.resume_service.firebase_admin") as mock_admin:
            mock_admin.get_app.side_effect = ValueError("No app")
            with patch("app.services.resume_service.firestore") as mock_fs:
                # Setup mock
                mock_db = Mock()
                mock_fs.client.return_value = mock_db
                mock_fs.Query.DESCENDING = "DESCENDING"

                service = ResumeService()
                service._db = mock_db

                # Create original resume data
                original_id = "resume_original123"
                original_data = {
                    "id": original_id,
                    "name": request.name,
                    "template_id": request.template_id,
                    "section_order": [s.value for s in request.section_order],
                    "personal_info": request.personal_info.model_dump(),
                    "summary": request.summary,
                    "work_experiences": [],
                    "education": [],
                    "projects": [],
                    "skills": {"categories": []},
                    "certifications": [],
                    "created_at": datetime.utcnow().isoformat() + "Z",
                    "updated_at": datetime.utcnow().isoformat() + "Z",
                }

                # Mock get operation
                mock_doc = Mock()
                mock_doc.exists = True
                mock_doc.to_dict.return_value = original_data

                mock_doc_ref = Mock()
                mock_doc_ref.get.return_value = mock_doc

                # Track what gets set
                set_data = {}

                def capture_set(data):
                    set_data.update(data)

                new_doc_ref = Mock()
                new_doc_ref.set = capture_set

                # Setup collection mock
                mock_collection = Mock()
                call_count = [0]

                def document_side_effect(doc_id):
                    call_count[0] += 1
                    if doc_id == original_id:
                        return mock_doc_ref
                    return new_doc_ref

                mock_collection.document = document_side_effect

                mock_user_doc = Mock()
                mock_user_doc.collection.return_value = mock_collection

                mock_users = Mock()
                mock_users.document.return_value = mock_user_doc
                mock_db.collection.return_value = mock_users

                # Duplicate the resume
                new_id = service.duplicate_resume("user123", original_id)

                # Verify new ID is different
                assert new_id != original_id
                assert new_id.startswith("resume_")

                # Verify content is preserved
                assert set_data["personal_info"] == original_data["personal_info"]
                assert set_data["template_id"] == original_data["template_id"]
                assert set_data["summary"] == original_data["summary"]
                assert set_data["work_experiences"] == original_data["work_experiences"]
                assert set_data["education"] == original_data["education"]
                assert set_data["projects"] == original_data["projects"]
                assert set_data["skills"] == original_data["skills"]
                assert set_data["certifications"] == original_data["certifications"]

    @given(
        create_resume_request_strategy(),
        st.sampled_from(["classic", "modern", "minimal"]),
    )
    @settings(max_examples=100)
    def test_property_4_template_selection_persistence_round_trip(
        self, request, template_id
    ):
        """
        **Feature: linkedin-github-resume-builder, Property 4: Template Selection Persistence Round Trip**
        **Validates: Requirements 4.4**

        For any ResumeData with a template_id, saving and then loading the resume
        SHALL return the same template_id.
        """
        with patch("app.services.resume_service.firebase_admin") as mock_admin:
            mock_admin.get_app.side_effect = ValueError("No app")
            with patch("app.services.resume_service.firestore") as mock_fs:
                mock_db = Mock()
                mock_fs.client.return_value = mock_db

                service = ResumeService()
                service._db = mock_db

                # Override template_id in request
                request.template_id = template_id

                # Track what gets saved
                saved_data = {}
                generated_id = [None]

                def capture_set(data):
                    saved_data.update(data)

                mock_new_doc_ref = Mock()
                mock_new_doc_ref.set = capture_set

                # Mock for get operation - returns saved data
                def get_doc():
                    mock_doc = Mock()
                    mock_doc.exists = True
                    mock_doc.to_dict.return_value = saved_data
                    return mock_doc

                mock_get_doc_ref = Mock()
                mock_get_doc_ref.get = get_doc

                mock_collection = Mock()

                def document_side_effect(doc_id):
                    if generated_id[0] is None:
                        generated_id[0] = doc_id
                        return mock_new_doc_ref
                    return mock_get_doc_ref

                mock_collection.document = document_side_effect

                mock_user_doc = Mock()
                mock_user_doc.collection.return_value = mock_collection

                mock_users = Mock()
                mock_users.document.return_value = mock_user_doc
                mock_db.collection.return_value = mock_users

                # Create (save) the resume
                resume_id = service.create_resume("user123", request)

                # Verify template_id was saved
                assert saved_data.get("template_id") == template_id

                # Reset document mock for get operation
                generated_id[0] = resume_id
                mock_collection.document = lambda doc_id: mock_get_doc_ref

                # Load the resume
                loaded_resume = service.get_resume("user123", resume_id)

                # Verify template_id round trip
                assert (
                    loaded_resume.template_id == template_id
                ), f"Template ID mismatch: saved {template_id}, loaded {loaded_resume.template_id}"

    @given(st.text(min_size=1, max_size=20).filter(lambda x: x.strip()))
    @settings(max_examples=100)
    def test_property_12_deletion_removes_from_storage(self, resume_id_suffix):
        """
        **Feature: linkedin-github-resume-builder, Property 12: Resume Deletion Removes from Storage**
        **Validates: Requirements 10.4**

        For any deleted resume, subsequent retrieval attempts SHALL return not found.
        """
        with patch("app.services.resume_service.firebase_admin") as mock_admin:
            mock_admin.get_app.side_effect = ValueError("No app")
            with patch("app.services.resume_service.firestore") as mock_fs:
                mock_db = Mock()
                mock_fs.client.return_value = mock_db

                service = ResumeService()
                service._db = mock_db

                resume_id = f"resume_{resume_id_suffix}"

                # Track deletion state
                deleted = [False]

                def get_doc():
                    mock_doc = Mock()
                    mock_doc.exists = not deleted[0]
                    mock_doc.to_dict.return_value = {
                        "id": resume_id,
                        "name": "Test Resume",
                        "template_id": "classic",
                        "section_order": ["summary", "experience"],
                        "personal_info": {"full_name": "Test User"},
                        "summary": None,
                        "work_experiences": [],
                        "education": [],
                        "projects": [],
                        "skills": {"categories": []},
                        "certifications": [],
                        "created_at": datetime.utcnow().isoformat() + "Z",
                        "updated_at": datetime.utcnow().isoformat() + "Z",
                    }
                    return mock_doc

                def do_delete():
                    deleted[0] = True

                mock_doc_ref = Mock()
                mock_doc_ref.get = get_doc
                mock_doc_ref.delete = do_delete

                mock_collection = Mock()
                mock_collection.document.return_value = mock_doc_ref

                mock_user_doc = Mock()
                mock_user_doc.collection.return_value = mock_collection

                mock_users = Mock()
                mock_users.document.return_value = mock_user_doc
                mock_db.collection.return_value = mock_users

                # Delete the resume
                result = service.delete_resume("user123", resume_id)
                assert result is True

                # Verify deletion was called
                assert deleted[0] is True

                # Subsequent retrieval should fail
                with pytest.raises(ResumeNotFoundError):
                    service.get_resume("user123", resume_id)
