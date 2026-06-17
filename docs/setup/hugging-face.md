# Hugging Face Setup

Tasvir currently uses Hugging Face Inference with `FLUX.1-schnell` to generate
Image Studio visuals.

## 1. Create an Account and Token

1. Create or sign in to a [Hugging Face account](https://huggingface.co/join).
2. Open [Access Tokens](https://huggingface.co/settings/tokens).
3. Create a token with the minimum permissions needed to call inference
   services.
4. Copy the token and keep it private.

Official documentation:
[Hugging Face user access tokens](https://huggingface.co/docs/hub/security-tokens)

## 2. Configure Tasvir

Copy the example file if needed:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set:

```env
HF_API_TOKEN=your_hugging_face_token
```

The current model endpoint is configured in
`backend/app/services/generate_service.py`.

## 3. Restart the Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

## Notes

- Hugging Face free usage, provider availability, queues, and limits can
  change.
- First requests may take longer while a model or provider becomes ready.
- A `401` or `403` response generally indicates a token or permission problem.
- A `429` response generally indicates a usage or rate limit.
- Generated files are stored locally under `backend/uploads/text_to_image`.
