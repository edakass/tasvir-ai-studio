from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    icon: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")

    @field_validator("name", "description", "icon", mode="before")
    @classmethod
    def strip_category_text(cls, value):
        return value.strip() if isinstance(value, str) else value

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    created_at: datetime


class ProjectCreate(BaseModel):
    category_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=255)
    subject: str = Field(min_length=2, max_length=4000)
    style: str = Field(min_length=2, max_length=500)
    format: str = Field(min_length=2, max_length=50)
    extra_elements: Optional[str] = Field(default=None, max_length=2000)
    prompt: Optional[str] = Field(default=None, max_length=8000)

    @field_validator(
        "name",
        "subject",
        "style",
        "format",
        "extra_elements",
        "prompt",
        mode="before",
    )
    @classmethod
    def strip_project_text(cls, value):
        return value.strip() if isinstance(value, str) else value

class ProjectResponse(BaseModel):
    id: int
    category_id: int
    name: str
    subject: str
    style: str
    format: str
    extra_elements: Optional[str] = None
    prompt: Optional[str] = None
    created_at: datetime


class GenerateRequest(BaseModel):
    project_id: int = Field(gt=0)
    prompt: str = Field(min_length=3, max_length=8000)

    @field_validator("prompt", mode="before")
    @classmethod
    def strip_generate_prompt(cls, value):
        return value.strip()


class GeneratedImageResponse(BaseModel):
    id: int
    project_id: int
    image_path: str
    is_favorite: bool
    is_archived: bool
    created_at: datetime


class PromptRequest(BaseModel):
    subject: str = Field(min_length=2, max_length=4000)
    style: str = Field(min_length=2, max_length=500)
    format: str = Field(min_length=2, max_length=50)
    extra_elements: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("subject", "style", "format", "extra_elements", mode="before")
    @classmethod
    def strip_prompt_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class ContentPackageRequest(BaseModel):
    project_name: Optional[str] = Field(default=None, max_length=255)
    product_name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=4000)
    features: Optional[str] = Field(default=None, max_length=3000)
    sector: Optional[str] = Field(default=None, max_length=255)
    audience: Optional[str] = Field(default=None, max_length=1000)
    tone: Literal["friendly", "professional", "energetic", "luxury", "informative"]
    goal: Literal["promotion", "sales", "engagement", "information"]
    output_language: Literal["tr", "en"]
    brand_name: Optional[str] = Field(default=None, max_length=255)
    campaign: Optional[str] = Field(default=None, max_length=3000)
    include_carousel: bool = True
    content_length: Literal["short", "standard", "detailed"] = "standard"
    selected_outputs: list[
        Literal[
            "instagram",
            "story",
            "advertisement",
            "product",
            "hashtags",
            "cta",
            "carousel",
        ]
    ] = Field(
        default_factory=lambda: [
            "instagram",
            "story",
            "advertisement",
            "product",
            "hashtags",
            "cta",
            "carousel",
        ],
        min_length=1,
        max_length=7,
    )

    @field_validator(
        "project_name",
        "product_name",
        "description",
        "features",
        "sector",
        "audience",
        "brand_name",
        "campaign",
        mode="before",
    )
    @classmethod
    def strip_content_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class ContentResult(BaseModel):
    id: Literal[
        "instagram",
        "story",
        "advertisement",
        "product",
        "hashtags",
        "cta",
        "carousel",
    ]
    content: str = Field(min_length=1, max_length=8000)


class ContentResultUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=8000)


class ContentPackageResponse(BaseModel):
    model: str
    results: list[ContentResult]
