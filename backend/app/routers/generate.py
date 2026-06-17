from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from app.models import GenerateRequest, GeneratedImageResponse, PromptRequest
from app.services import generate_service
from io import BytesIO
from PIL import Image
from typing import List

router = APIRouter(
    prefix="/api/generate",
    tags=["generate"]
)

@router.post("/prompt")
def generate_prompt(request: PromptRequest):
    prompt = generate_service.build_prompt(
        request.subject,
        request.style,
        request.format,
        request.extra_elements
    )
    return {"prompt": prompt}

@router.post("/images", response_model=List[GeneratedImageResponse])
def generate_images(request: GenerateRequest):
    return generate_service.generate_images(request)

@router.put("/images/{image_id}/favorite")
def toggle_favorite(image_id: int):
    return generate_service.toggle_favorite(image_id)

@router.put("/images/{image_id}/archive")
def toggle_archive(image_id: int):
    return generate_service.toggle_archive(image_id)

@router.get("/images/{project_id}", response_model=List[GeneratedImageResponse])
def get_project_images(project_id: int):
    return generate_service.get_project_images(project_id)

@router.get("/images/{image_id}/download")
def download_image(image_id: int, format: str = Query("png", pattern="^(png|jpg)$")):
    image_path, file_name = generate_service.get_image_file(image_id)

    with Image.open(image_path) as image:
        output = BytesIO()
        if format == "jpg":
            image.convert("RGB").save(output, format="JPEG", quality=95, optimize=True)
            media_type = "image/jpeg"
        else:
            image.save(output, format="PNG", optimize=True)
            media_type = "image/png"

    output.seek(0)
    return StreamingResponse(
        output,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{file_name}.{format}"'
        },
    )

@router.delete("/images/{image_id}")
def delete_image(image_id: int):
    return generate_service.delete_image(image_id)
