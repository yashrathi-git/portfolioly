"""
Post-processing service for AI extraction results.

This service transforms simplified extraction data into the full portfolio schema,
adding system fields, validating data, and ensuring frontend compatibility.
"""

import logging
from datetime import datetime
from typing import Optional, List

from ..schemas.extraction import (
    PortfolioExtractionData,
    ExtractedProfile,
)
from ..schemas.portfolio import (
    PortfolioData,
    PersonalInfo,
    Profile,
    WorkExperience,
    Project,
    Education,
    Certification,
    TextBlobs,
    LayoutSettings,
    PortfolioMetadata,
    ProfileType,
    DateInfo,
)
from ..schemas.upload import PDFData, GitHubRepoData
from ..utils.profile_detector import validate_and_fix_profile_type


logger = logging.getLogger(__name__)


class ExtractionProcessor:
    """
    Processes and transforms AI extraction results into storage-ready portfolio data.
    
    Responsibilities:
    - Convert extraction schema to storage schema
    - Auto-detect profile types from URLs
    - Add default values for system fields
    - Validate and sanitize all data
    - Ensure frontend compatibility (no null arrays, valid enums, etc.)
    """
    
    def process_extraction(
        self,
        extraction_data: PortfolioExtractionData,
        resume_pdf: Optional[PDFData] = None,
        linkedin_pdf: Optional[PDFData] = None,
        github_repos: Optional[List[GitHubRepoData]] = None,
    ) -> PortfolioData:
        """
        Transform extraction data into full portfolio data.
        
        Args:
            extraction_data: Simplified extraction data from AI
            resume_pdf: Original resume PDF data (for metadata)
            linkedin_pdf: Original LinkedIn PDF data (for metadata)
            github_repos: Original GitHub repos (for metadata)
            
        Returns:
            PortfolioData: Complete portfolio data ready for storage
        """
        try:
            # Process personal info with profile type detection
            personal_info = self._process_personal_info(
                extraction_data.personal_info
            )
            
            # Process work experiences
            work_experiences = self._process_work_experiences(
                extraction_data.work_experiences or []
            )
            
            # Process projects
            projects = self._process_projects(
                extraction_data.projects or []
            )
            
            # Process education
            education = self._process_education(
                extraction_data.education or []
            )
            
            # Process certifications
            certifications = self._process_certifications(
                extraction_data.certifications or []
            )
            
            # Process text blobs
            text_blobs = self._process_text_blobs(
                extraction_data.text_blobs
            )
            
            # Generate layout settings with defaults
            layout_settings = LayoutSettings(
                layout_mode="both",
                default_layout="chat"
            )
            
            # Generate metadata
            metadata = self._generate_metadata(
                resume_pdf=resume_pdf,
                linkedin_pdf=linkedin_pdf,
                github_repos=github_repos
            )
            
            # Create full portfolio data
            portfolio_data = PortfolioData(
                personal_info=personal_info,
                work_experiences=work_experiences,
                projects=projects,
                education=education,
                certifications=certifications,
                text_blobs=text_blobs,
                layout_settings=layout_settings,
                metadata=metadata,
            )
            
            logger.info("Successfully processed extraction data")
            return portfolio_data
            
        except Exception as e:
            logger.error(f"Error processing extraction data: {str(e)}", exc_info=True)
            # Return minimal valid portfolio data to prevent frontend errors
            return self._create_fallback_portfolio()
    
    def _process_personal_info(
        self,
        extracted_info: Optional[any]
    ) -> PersonalInfo:
        """Process and validate personal info, auto-detecting profile types."""
        if not extracted_info:
            return PersonalInfo()
        
        # Process profiles with type detection
        profiles = []
        if extracted_info.profiles:
            for extracted_profile in extracted_info.profiles:
                if not extracted_profile.url:
                    continue
                
                # Auto-detect profile type from URL
                profile_type = validate_and_fix_profile_type(
                    profile_type=None,
                    url=extracted_profile.url
                )
                
                # Create validated profile
                profile = Profile(
                    type=profile_type,
                    url=extracted_profile.url,
                    label=extracted_profile.label or profile_type.value
                )
                profiles.append(profile)
        
        return PersonalInfo(
            full_name=extracted_info.full_name,
            headline=extracted_info.headline,
            chatfolio_headline=extracted_info.chatfolio_headline,
            summary=extracted_info.summary,
            email=extracted_info.email,
            phone=extracted_info.phone,
            location=extracted_info.location,
            profile_photo_url=None,  # Set via upload endpoint
            profiles=profiles,
            tags=extracted_info.tags or [],
        )
    
    def _process_work_experiences(
        self,
        extracted_experiences: List[any]
    ) -> List[WorkExperience]:
        """Process work experiences, ensuring valid data."""
        experiences = []
        
        for exp in extracted_experiences:
            try:
                # Convert DateInfo objects to dicts if needed
                start_date = None
                if exp.start_date:
                    if isinstance(exp.start_date, dict):
                        start_date = DateInfo(**exp.start_date)
                    else:
                        start_date = DateInfo(
                            month=exp.start_date.month,
                            year=exp.start_date.year
                        )
                
                end_date = None
                if exp.end_date:
                    if isinstance(exp.end_date, dict):
                        end_date = DateInfo(**exp.end_date)
                    else:
                        end_date = DateInfo(
                            month=exp.end_date.month,
                            year=exp.end_date.year
                        )
                
                experience = WorkExperience(
                    organization=exp.organization,
                    title=exp.title,
                    location=exp.location,
                    logo_url=None,  # Set by brandfetch service
                    brandfetch_logo_url=None,  # Set by brandfetch service
                    brandfetch_domain=None,  # Set by brandfetch service
                    start_date=start_date,
                    end_date=end_date,
                    is_current=exp.is_current,
                    highlights=exp.highlights,
                    technologies=exp.technologies or [],
                    more_context=exp.more_context,
                )
                experiences.append(experience)
            except Exception as e:
                logger.warning(f"Skipping invalid work experience: {str(e)}")
                continue
        
        return experiences
    
    def _process_projects(
        self,
        extracted_projects: List[any]
    ) -> List[Project]:
        """Process projects, ensuring valid data."""
        projects = []
        
        for proj in extracted_projects:
            try:
                project = Project(
                    name=proj.name,
                    card_image_url=None,  # Set via upload endpoint
                    highlights=proj.highlights,
                    technologies=proj.technologies or [],
                    github=proj.github,
                    live_link=proj.live_link,
                    demo_video=proj.demo_video,
                    more_context=proj.more_context,
                    images=[],  # Set via upload endpoint
                )
                projects.append(project)
            except Exception as e:
                logger.warning(f"Skipping invalid project: {str(e)}")
                continue
        
        return projects
    
    def _process_education(
        self,
        extracted_education: List[any]
    ) -> List[Education]:
        """Process education entries, ensuring valid data."""
        education_list = []
        
        for edu in extracted_education:
            try:
                # Convert DateInfo objects to dicts if needed
                start_date = None
                if edu.start_date:
                    if isinstance(edu.start_date, dict):
                        start_date = DateInfo(**edu.start_date)
                    else:
                        start_date = DateInfo(
                            month=edu.start_date.month,
                            year=edu.start_date.year
                        )
                
                end_date = None
                if edu.end_date:
                    if isinstance(edu.end_date, dict):
                        end_date = DateInfo(**edu.end_date)
                    else:
                        end_date = DateInfo(
                            month=edu.end_date.month,
                            year=edu.end_date.year
                        )
                
                education = Education(
                    institution=edu.institution,
                    degree=edu.degree,
                    branch=edu.branch,
                    logo_url=None,  # Set by brandfetch service
                    brandfetch_logo_url=None,  # Set by brandfetch service
                    brandfetch_domain=None,  # Set by brandfetch service
                    start_date=start_date,
                    end_date=end_date,
                    is_current=edu.is_current,
                    location=edu.location,
                    grade=edu.grade,
                )
                education_list.append(education)
            except Exception as e:
                logger.warning(f"Skipping invalid education entry: {str(e)}")
                continue
        
        return education_list
    
    def _process_certifications(
        self,
        extracted_certs: List[any]
    ) -> List[Certification]:
        """Process certifications, ensuring valid data."""
        certifications = []
        
        for cert in extracted_certs:
            try:
                certification = Certification(
                    name=cert.name,
                    issuer=cert.issuer,
                    link=cert.link,
                )
                certifications.append(certification)
            except Exception as e:
                logger.warning(f"Skipping invalid certification: {str(e)}")
                continue
        
        return certifications
    
    def _process_text_blobs(
        self,
        extracted_blobs: Optional[any]
    ) -> TextBlobs:
        """Process text blobs."""
        if not extracted_blobs:
            return TextBlobs()
        
        return TextBlobs(
            achievements=extracted_blobs.achievements,
            additional_context=extracted_blobs.additional_context,
        )
    
    def _generate_metadata(
        self,
        resume_pdf: Optional[PDFData] = None,
        linkedin_pdf: Optional[PDFData] = None,
        github_repos: Optional[List[GitHubRepoData]] = None,
    ) -> PortfolioMetadata:
        """Generate metadata based on input sources."""
        # Determine source type
        sources = []
        if resume_pdf:
            sources.append("resume_pdf")
        if linkedin_pdf:
            sources.append("linkedin_pdf")
        if github_repos:
            sources.append("github")
        
        source_type = "_".join(sources) if sources else "unknown"
        
        return PortfolioMetadata(
            source_type=source_type,
            extracted_at=datetime.utcnow(),
            notes="Extracted and processed by AI"
        )
    
    def _create_fallback_portfolio(self) -> PortfolioData:
        """
        Create a minimal valid portfolio data structure.
        
        Used as a fallback when extraction fails to prevent frontend errors.
        """
        return PortfolioData(
            personal_info=PersonalInfo(),
            work_experiences=[],
            projects=[],
            education=[],
            certifications=[],
            text_blobs=TextBlobs(),
            layout_settings=LayoutSettings(
                layout_mode="both",
                default_layout="chat"
            ),
            metadata=PortfolioMetadata(
                source_type="error",
                extracted_at=datetime.utcnow(),
                notes="Extraction failed, using fallback data"
            ),
        )


# Global service instance
_extraction_processor: Optional[ExtractionProcessor] = None


def get_extraction_processor() -> ExtractionProcessor:
    """Get or create the global extraction processor instance."""
    global _extraction_processor
    if _extraction_processor is None:
        _extraction_processor = ExtractionProcessor()
    return _extraction_processor

