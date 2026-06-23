from fastapi import APIRouter

from app.models import ContentPackageRequest, ContentResultUpdate
from app.services import content_service

router = APIRouter(
    prefix="/api/content",
    tags=["content"],
)

@router.post("/generate")
def generate_content_package(request: ContentPackageRequest):
    return content_service.generate_content_package(request)


@router.get("/packages")
def get_content_packages():
    return content_service.get_content_packages()


@router.delete("/packages/{package_id}")
def delete_content_package(package_id: int):
    return content_service.delete_content_package(package_id)


@router.put("/packages/{package_id}/results/{output_id}")
def update_content_package_result(
    package_id: int,
    output_id: str,
    payload: ContentResultUpdate,
):
    return content_service.update_content_package_result(
        package_id,
        output_id,
        payload.content,
    )
