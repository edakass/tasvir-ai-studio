# Gemini Setup

Tasvir currently uses Gemini to turn the Image Studio form into a detailed
English image-generation prompt.

## 1. Create an API Key

1. Sign in to [Google AI Studio](https://aistudio.google.com/apikey).
2. Create or select a Google Cloud project.
3. Create an API key for the Gemini API.
4. Keep the key private.

Official documentation:
[Using Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key)

## 2. Configure Tasvir

Copy the example file if needed:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_TEXT_MODEL=gemini-2.5-flash
```

## 3. Restart the Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

## Notes

- Gemini usage limits and free-tier availability are controlled by Google and
  can change.
- A `401` or `403` response usually indicates an invalid, restricted, or
  unavailable key.
- A `429` response usually means the current quota or rate limit was reached.
- Never place the Gemini key in `frontend/.env`; frontend variables can be
  exposed to the browser.
