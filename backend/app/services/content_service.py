import json
import logging
import os
import re

import requests
from fastapi import HTTPException
from pydantic import ValidationError

from app.database import get_connection
from app.models import ContentPackageRequest, ContentResult

logger = logging.getLogger(__name__)

CJK_TEXT_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+")

CONTENT_FIELDS = (
    "instagram",
    "story",
    "advertisement",
    "product",
    "carousel",
    "hashtags",
    "cta",
)

TONE_LABELS = {
    "friendly": "friendly and approachable",
    "professional": "professional and confident",
    "energetic": "energetic and action-oriented",
    "luxury": "refined, premium, and understated",
    "informative": "clear, useful, and informative",
}

GOAL_LABELS = {
    "promotion": "introduce and promote the product",
    "sales": "encourage a purchase or qualified inquiry",
    "engagement": "encourage comments, saves, and interaction",
    "information": "educate the audience clearly",
}

LENGTH_LABELS = {
    "short": "Keep every output concise and immediately usable.",
    "standard": "Use a balanced amount of detail suitable for normal social publishing.",
    "detailed": "Use richer detail while keeping the copy clear and platform-appropriate.",
}

OUTPUT_REQUIREMENTS = {
    "instagram": "For instagram, write the final caption with natural paragraph breaks.",
    "product": "For product, write the final product description based only on supplied facts.",
    "hashtags": "For hashtags, write actual relevant hashtags on one line, each starting with #.",
    "cta": "For cta, write one concise call to action aligned with the primary goal.",
}


def _env_count(name: str, default: int, maximum: int = 20) -> int:
    try:
        value = int(os.getenv(name, str(default)))
    except ValueError:
        logger.warning("Invalid %s value; using default %s", name, default)
        return default

    if not 1 <= value <= maximum:
        logger.warning("%s must be between 1 and %s; using default %s", name, maximum, default)
        return default
    return value


def _output_requirement(field: str) -> str:
    if field == "story":
        count = _env_count("CONTENT_STORY_SCREEN_COUNT", 3)
        return f"For story, write final copy for a concise {count}-screen story sequence."
    if field == "advertisement":
        count = _env_count("CONTENT_AD_HEADLINE_COUNT", 3)
        return f"For advertisement, write {count} distinct ad headlines, one per line."
    if field == "carousel":
        count = _env_count("CONTENT_CAROUSEL_CONTENT_SLIDE_COUNT", 5)
        return f"For carousel, write a cover, {count} content slides, and a final CTA slide."
    return OUTPUT_REQUIREMENTS[field]


def _required_text(value: str | None, field_name: str) -> str:
    if not value:
        raise HTTPException(
            status_code=422,
            detail=f"{field_name} is required for text content generation.",
        )
    return value


def build_content_prompt(request: ContentPackageRequest) -> str:
    product_name = _required_text(request.product_name, "Product name")
    description = _required_text(request.description, "Description")
    output_language = "Turkish" if request.output_language == "tr" else "English"

    selected_outputs = [
        field
        for field in request.selected_outputs
        if request.include_carousel or field != "carousel"
    ]
    output_requirements = "\n".join(
        f"- {_output_requirement(field)}"
        for field in selected_outputs
    )
    json_keys = ", ".join(selected_outputs)

    return f"""
Return JSON only. Create final publish-ready copy for these JSON keys:
{json_keys}

Write every output in {output_language}.
Use only {output_language}. Do not mix in Chinese, Japanese, Korean,
or any other language. Translate product attributes such as texture,
color, material, and style into {output_language}.
Brand tone: {TONE_LABELS[request.tone]}.
Primary goal: {GOAL_LABELS[request.goal]}.
Length guidance: {LENGTH_LABELS[request.content_length]}

Project: {request.project_name or "Not provided"}
Product or service: {product_name}
Description: {description}
Key features: {request.features or "Not provided"}
Industry: {request.sector or "Not provided"}
Target audience: {request.audience or "General audience"}
Brand name: {request.brand_name or "Not provided"}
Campaign notes: {request.campaign or "None"}

Field rules:
{output_requirements}

Every JSON value must contain the final user-facing copy for that field.
Do not describe the task. Do not copy these field rules into the JSON values.
For hashtags, output examples look like "#InteriorDesign #ModernDoor";
the final value must include real # hashtags.

Do not invent prices, discounts, materials, certifications, delivery details,
or product features that were not supplied. Write with natural, native-level
grammar in the requested language. Avoid generic AI language, vague claims,
awkward phrases, and repeated adjectives or sentences. Keep each output
distinct and ready to publish without explanatory labels. Return only the
structured JSON response requested by the schema.
""".strip()


def _clean_result(field: str, value: str, output_language: str) -> str:
    cleaned = _clean_language_artifacts(value, output_language)
    if field != "hashtags":
        return cleaned

    tags = []
    for item in cleaned.replace(",", " ").split():
        tag = item.strip()
        if not tag:
            continue
        if not tag.startswith("#"):
            tag = f"#{tag}"
        tags.append(tag)
    return " ".join(tags) or cleaned


def _clean_language_artifacts(value: str, output_language: str) -> str:
    is_turkish = output_language == "tr"
    replacements = {
        "walnut纹理": "ceviz dokusu" if is_turkish else "walnut texture",
        "纹理": " doku" if is_turkish else " texture",
        "质感": " doku" if is_turkish else " texture",
        "颜色": " renk" if is_turkish else " color",
        "材料": " malzeme" if is_turkish else " material",
        "风格": " stil" if is_turkish else " style",
    }
    cleaned = value.strip()
    for source, replacement in replacements.items():
        cleaned = cleaned.replace(source, replacement)
    cleaned = CJK_TEXT_RE.sub("", cleaned)
    return re.sub(r"[ \t]{2,}", " ", cleaned).strip()


def generate_content_package(request: ContentPackageRequest) -> dict:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "qwen3:4b").strip()

    if not model:
        raise HTTPException(status_code=503, detail="Ollama model is not configured.")

    selected_outputs = [
        field
        for field in CONTENT_FIELDS
        if field in request.selected_outputs
        and (request.include_carousel or field != "carousel")
    ]
    if not selected_outputs:
        raise HTTPException(
            status_code=422,
            detail="Select at least one content output.",
        )

    content_schema = {
        "type": "object",
        "properties": {
            field: {"type": "string", "minLength": 1}
            for field in selected_outputs
        },
        "required": selected_outputs,
        "additionalProperties": False,
    }

    payload = {
        "model": model,
        "prompt": build_content_prompt(request),
        "system": (
            "You are an experienced brand copywriter. Follow the requested "
            "language, facts, tone, goal, and JSON schema exactly."
        ),
        "stream": False,
        "think": False,
        "format": content_schema,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
        },
    }

    try:
        response = requests.post(
            f"{base_url}/api/generate",
            json=payload,
            timeout=(5, 180),
        )
    except requests.ConnectionError as error:
        logger.warning("Could not connect to Ollama at %s", base_url)
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Start Ollama and try again.",
        ) from error
    except requests.Timeout as error:
        logger.warning("Ollama content generation timed out")
        raise HTTPException(
            status_code=504,
            detail="Local content generation timed out. Try again.",
        ) from error
    except requests.RequestException as error:
        logger.exception("Ollama content generation request failed")
        raise HTTPException(
            status_code=502,
            detail="The local content model is temporarily unavailable.",
        ) from error

    if response.status_code == 404:
        raise HTTPException(
            status_code=503,
            detail=f'Ollama model "{model}" is not installed.',
        )

    if response.status_code != 200:
        logger.error(
            "Ollama generation failed with status %s: %s",
            response.status_code,
            response.text[:500],
        )
        raise HTTPException(
            status_code=502,
            detail="The local content model could not generate the package.",
        )

    try:
        ollama_payload = response.json()
        content = json.loads(ollama_payload.get("response", ""))
        results = [
            ContentResult(
                id=field,
                content=_clean_result(field, str(content[field]), request.output_language),
            )
            for field in selected_outputs
        ]
    except (KeyError, TypeError, ValueError, ValidationError) as error:
        logger.exception("Ollama returned an invalid structured response")
        raise HTTPException(
            status_code=502,
            detail="The local model returned an invalid content package.",
        ) from error

    package_id = _save_content_package(request, model, results)
    return _get_content_package_by_id(package_id)


def _package_title(request: ContentPackageRequest) -> str:
    return request.project_name or request.product_name or "New content package"


def _language_label(output_language: str) -> str:
    return "Türkçe" if output_language == "tr" else "English"


def _form_from_package(row: dict) -> dict:
    try:
        selected_outputs = json.loads(row["selected_outputs"] or "[]")
    except (TypeError, ValueError):
        selected_outputs = []

    return {
        "projectName": row["project_name"] or "",
        "productName": row["product_name"] or "",
        "description": row["description"] or "",
        "audience": row["audience"] or "",
        "tone": row["tone"],
        "goal": row["goal"],
        "contentLength": row["content_length"],
        "language": _language_label(row["output_language"]),
        "selectedOutputs": selected_outputs,
    }


def _format_content_package(row: dict, results: list[dict]) -> dict:
    return {
        "id": str(row["id"]),
        "createdAt": row["created_at"].isoformat() if row.get("created_at") else None,
        "title": row["title"],
        "productName": row["product_name"],
        "form": _form_from_package(row),
        "model": row["model"],
        "results": [
            {
                "id": result["output_id"],
                "content": result["content"],
            }
            for result in results
        ],
    }


def _save_content_package(
    request: ContentPackageRequest,
    model: str,
    results: list[ContentResult],
) -> int:
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            INSERT INTO content_packages
            (title, project_name, product_name, description, audience, tone, goal,
             output_language, content_length, selected_outputs, model)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                _package_title(request),
                request.project_name,
                request.product_name,
                request.description,
                request.audience,
                request.tone,
                request.goal,
                request.output_language,
                request.content_length,
                json.dumps(request.selected_outputs, ensure_ascii=False),
                model,
            ),
        )
        package_id = cursor.lastrowid

        cursor.executemany(
            """
            INSERT INTO content_package_results
            (package_id, output_id, content, sort_order)
            VALUES (%s, %s, %s, %s)
            """,
            [
                (package_id, result.id, result.content, index)
                for index, result in enumerate(results)
            ],
        )
        conn.commit()
        return package_id
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


def _get_content_package_by_id(package_id: int) -> dict:
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM content_packages WHERE id = %s", (package_id,))
        package = cursor.fetchone()
        if not package:
            raise HTTPException(status_code=404, detail="Content package not found")

        cursor.execute(
            """
            SELECT output_id, content
            FROM content_package_results
            WHERE package_id = %s
            ORDER BY sort_order ASC, id ASC
            """,
            (package_id,),
        )
        results = cursor.fetchall()
        return _format_content_package(package, results)
    finally:
        cursor.close()
        conn.close()


def get_content_packages() -> list[dict]:
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM content_packages ORDER BY created_at DESC, id DESC")
        packages = cursor.fetchall()
        if not packages:
            return []

        package_ids = [package["id"] for package in packages]
        placeholders = ", ".join(["%s"] * len(package_ids))
        cursor.execute(
            f"""
            SELECT package_id, output_id, content
            FROM content_package_results
            WHERE package_id IN ({placeholders})
            ORDER BY sort_order ASC, id ASC
            """,
            tuple(package_ids),
        )

        results_by_package = {package_id: [] for package_id in package_ids}
        for result in cursor.fetchall():
            results_by_package[result["package_id"]].append(result)

        return [
            _format_content_package(package, results_by_package[package["id"]])
            for package in packages
        ]
    finally:
        cursor.close()
        conn.close()


def delete_content_package(package_id: int) -> dict:
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM content_packages WHERE id = %s", (package_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Content package not found")

        cursor.execute("DELETE FROM content_packages WHERE id = %s", (package_id,))
        conn.commit()
        return {"message": "Content package deleted successfully"}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Content package deletion failed: {error}",
        ) from error
    finally:
        cursor.close()
        conn.close()


def update_content_package_result(package_id: int, output_id: str, content: str) -> dict:
    if output_id not in CONTENT_FIELDS:
        raise HTTPException(status_code=422, detail="Invalid content output.")

    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id
            FROM content_package_results
            WHERE package_id = %s AND output_id = %s
            """,
            (package_id, output_id),
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Content output not found")

        cursor.execute(
            """
            UPDATE content_package_results
            SET content = %s
            WHERE package_id = %s AND output_id = %s
            """,
            (content, package_id, output_id),
        )
        conn.commit()
        return {"message": "Content output updated successfully"}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Content output update failed: {error}",
        ) from error
    finally:
        cursor.close()
        conn.close()
