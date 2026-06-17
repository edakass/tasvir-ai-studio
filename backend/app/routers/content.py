from fastapi import APIRouter

from app.models import ContentPackageRequest, ContentPackageResponse
from app.services import content_service

router = APIRouter(
    prefix="/api/content",
    tags=["content"],
)

@router.post("/generate", response_model=ContentPackageResponse)
def generate_content_package(request: ContentPackageRequest):
    return content_service.generate_content_package(request)
