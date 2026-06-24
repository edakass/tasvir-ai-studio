from google import genai
from app.database import get_connection
from fastapi import HTTPException
from app.models import GenerateRequest
from dotenv import load_dotenv
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageOps
from threading import Lock
import logging
import random
import os
import re
import uuid
import requests

load_dotenv()

logger = logging.getLogger(__name__)

HF_API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"
BASE_DIR = Path(__file__).resolve().parents[2]
UPLOADS_DIR = BASE_DIR / "uploads"
TEXT_TO_IMAGE_DIR = UPLOADS_DIR / "text_to_image"
_active_projects = set()
_active_projects_lock = Lock()

FORMAT_DIMENSIONS = {
    "Instagram Feed 1:1": (1080, 1080),
    "Instagram Reels 9:16": (1080, 1920),
    "Instagram Story 9:16": (1080, 1920),
    "Facebook Post 1.91:1": (1200, 630),
    "WhatsApp 9:16": (1080, 1920),
}


def get_format_dimensions(format_name: str) -> tuple[int, int]:
    if format_name in FORMAT_DIMENSIONS:
        return FORMAT_DIMENSIONS[format_name]

    custom_match = re.fullmatch(r"Custom\s+(\d{3,4})[×x](\d{3,4})", format_name or "")
    if custom_match:
        width, height = map(int, custom_match.groups())
        if 256 <= width <= 2048 and 256 <= height <= 2048:
            return width, height

    return 1024, 1024


def get_generation_dimensions(width: int, height: int) -> tuple[int, int]:
    max_pixels = 1024 * 1024
    scale = min(1, (max_pixels / (width * height)) ** 0.5)
    generated_width = max(256, round((width * scale) / 8) * 8)
    generated_height = max(256, round((height * scale) / 8) * 8)
    return generated_width, generated_height


def build_prompt(subject: str, style: str, format: str, extra_elements: str = None) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_TEXT_MODEL")
    if not api_key or not model:
        logger.error("Gemini configuration is missing")
        raise HTTPException(
            status_code=503,
            detail="Prompt service is not configured."
        )

    user_input = f"""
    Create a detailed image generation prompt.
    The input may be in any language. Always respond in English.

    Subject: {subject}
    Style: {style}
    Format: {format}
    Extra elements: {extra_elements or 'none'}

    Rules:
    - Translate any non-English input to English
    - Photorealistic, high quality
    - Include lighting, materials, atmosphere details
    - No logos, text or watermarks
    - Max 200 words
    - Return only the prompt, nothing else
    """

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model,
            contents=user_input
        )
        prompt = (response.text or "").strip()
    except Exception as error:
        logger.exception("Gemini prompt generation failed")
        raise HTTPException(
            status_code=502,
            detail="Prompt could not be generated. Please try again."
        ) from error

    if not prompt:
        logger.error("Gemini returned an empty prompt")
        raise HTTPException(
            status_code=502,
            detail="Prompt service returned an empty response."
        )

    return prompt


def generate_image_with_hf(prompt: str, output_size: tuple[int, int]) -> str:
    token = os.getenv("HF_API_TOKEN")

    if not token:
        logger.error("HF_API_TOKEN is missing")
        raise HTTPException(
            status_code=503,
            detail="Image service is not configured."
        )

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    target_width, target_height = output_size
    generation_width, generation_height = get_generation_dimensions(
        target_width,
        target_height,
    )

    payload = {
        "inputs": prompt,
        "parameters": {
            "seed": random.randint(0, 2147483647),
            "width": generation_width,
            "height": generation_height,
        }
    }

    try:
        response = requests.post(
            HF_API_URL,
            headers=headers,
            json=payload,
            timeout=(10, 120)
        )

        if response.status_code in (400, 422):
            fallback_payload = {
                "inputs": prompt,
                "parameters": {"seed": payload["parameters"]["seed"]},
            }
            response = requests.post(
                HF_API_URL,
                headers=headers,
                json=fallback_payload,
                timeout=(10, 120),
            )
    except requests.Timeout as error:
        logger.warning("Hugging Face image generation timed out")
        raise HTTPException(
            status_code=504,
            detail="Image generation timed out. Please try again."
        ) from error
    except requests.RequestException as error:
        logger.exception("Hugging Face image generation request failed")
        raise HTTPException(
            status_code=502,
            detail="Image service is temporarily unavailable."
        ) from error

    if response.status_code == 402:
        logger.error("Hugging Face credits are depleted: %s", response.text[:500])
        raise HTTPException(
            status_code=402,
            detail=(
                "Hugging Face image credits are depleted. Add credits, upgrade the "
                "account, or configure another image provider."
            ),
        )

    if response.status_code != 200:
        logger.error(
            "Hugging Face generation failed with status %s: %s",
            response.status_code,
            response.text[:500],
        )
        raise HTTPException(
            status_code=502,
            detail="Image could not be generated. Please try a different prompt."
        )

    if not response.content:
        logger.error("Hugging Face returned an empty image response")
        raise HTTPException(
            status_code=502,
            detail="Image service returned an empty response."
        )

    TEXT_TO_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    file_name = f"generated_{uuid.uuid4().hex}.png"
    absolute_path = TEXT_TO_IMAGE_DIR / file_name
    stored_path = Path("uploads") / "text_to_image" / file_name

    try:
        with Image.open(BytesIO(response.content)) as generated_image:
            generated_image.load()
            normalized_image = ImageOps.fit(
                generated_image.convert("RGB"),
                (target_width, target_height),
                method=Image.Resampling.LANCZOS,
            )
            normalized_image.save(absolute_path, format="PNG", optimize=True)
    except Exception as error:
        absolute_path.unlink(missing_ok=True)
        logger.exception("Image service returned invalid image data")
        raise HTTPException(
            status_code=502,
            detail="Image service returned an invalid image."
        ) from error

    return stored_path.as_posix()


def generate_images(request: GenerateRequest):
    with _active_projects_lock:
        if request.project_id in _active_projects:
            raise HTTPException(
                status_code=409,
                detail="An image is already being generated for this project."
            )
        _active_projects.add(request.project_id)

    conn = get_connection()
    if not conn:
        with _active_projects_lock:
            _active_projects.discard(request.project_id)
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    file_path = None
    try:
        cursor.execute("SELECT * FROM projects WHERE id = %s", (request.project_id,))
        project = cursor.fetchone()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        output_size = get_format_dimensions(project["format"])
        file_path = generate_image_with_hf(request.prompt, output_size)
        cursor.execute(
            "INSERT INTO generated_images (project_id, image_path) VALUES (%s, %s)",
            (request.project_id, file_path)
        )
        conn.commit()

        cursor.execute("SELECT * FROM generated_images WHERE id = %s", (cursor.lastrowid,))
        image = cursor.fetchone()
        return [image]
    except Exception:
        conn.rollback()
        if file_path:
            delete_upload_file(file_path)
        raise
    finally:
        cursor.close()
        conn.close()
        with _active_projects_lock:
            _active_projects.discard(request.project_id)


def resolve_upload_path(stored_path: str) -> Path:
    candidate = (BASE_DIR / stored_path).resolve()
    uploads_root = UPLOADS_DIR.resolve()
    if candidate != uploads_root and uploads_root not in candidate.parents:
        logger.error("Rejected unsafe upload path: %s", stored_path)
        raise HTTPException(status_code=400, detail="Invalid image path")
    return candidate


def delete_upload_file(stored_path: str):
    try:
        resolve_upload_path(stored_path).unlink(missing_ok=True)
    except (HTTPException, OSError):
        logger.warning("Could not delete upload file: %s", stored_path, exc_info=True)


def get_image_file(image_id: int) -> tuple[str, str]:
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT image_path FROM generated_images WHERE id = %s",
            (image_id,)
        )
        image = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

    if not image or not image["image_path"]:
        raise HTTPException(status_code=404, detail="Image not found")

    image_path = resolve_upload_path(image["image_path"])
    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="Image file not found")

    return str(image_path), f"tasvir_{image_id}"


def toggle_favorite(image_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM generated_images WHERE id = %s", (image_id,))
        image = cursor.fetchone()

        if not image:
            raise HTTPException(status_code=404, detail="Image not found")

        new_status = not image["is_favorite"]
        cursor.execute(
            "UPDATE generated_images SET is_favorite = %s WHERE id = %s",
            (new_status, image_id)
        )
        conn.commit()
        return {"is_favorite": new_status}
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


def toggle_archive(image_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM generated_images WHERE id = %s", (image_id,))
        image = cursor.fetchone()

        if not image:
            raise HTTPException(status_code=404, detail="Image not found")

        new_status = not image["is_archived"]
        cursor.execute(
            "UPDATE generated_images SET is_archived = %s WHERE id = %s",
            (new_status, image_id)
        )
        conn.commit()
        return {"is_archived": new_status}
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


def get_project_images(project_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM generated_images WHERE project_id = %s ORDER BY created_at DESC",
            (project_id,)
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()


def delete_image(image_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM generated_images WHERE id = %s", (image_id,))
        image = cursor.fetchone()

        if not image:
            raise HTTPException(status_code=404, detail="Image not found")

        cursor.execute("DELETE FROM generated_images WHERE id = %s", (image_id,))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    if image["image_path"]:
        delete_upload_file(image["image_path"])

    return {"message": "Image deleted"}
