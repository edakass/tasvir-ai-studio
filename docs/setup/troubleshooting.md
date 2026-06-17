# Troubleshooting

## The Frontend Cannot Reach the Backend

Confirm that both applications are running:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8000
```

Check the environment files:

```env
# frontend/.env
VITE_API_URL=http://localhost:8000

# backend/.env
FRONTEND_URL=http://localhost:5173
```

Restart both applications after changing environment files.

## Database Connection Failed

- Make sure MySQL is running.
- Recheck `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, and `MYSQL_PASSWORD`.
- Use only letters, numbers, and underscores in `MYSQL_DATABASE`.
- Test the same credentials with the MySQL command-line client.

See [MySQL setup](mysql.md).

## Prompt Could Not Be Generated

- Confirm `GEMINI_API_KEY` and `GEMINI_TEXT_MODEL`.
- Check whether the selected model is available to your account.
- Check the Gemini quota and service status.
- Restart the backend after editing `.env`.

See [Gemini setup](gemini.md).

## Image Could Not Be Generated

- Confirm `HF_API_TOKEN`.
- Check the token permissions and Hugging Face usage limits.
- Try a shorter or different prompt.
- Wait and retry if the inference provider is busy.

See [Hugging Face setup](hugging-face.md).

## Custom Format Does Not Work

Both width and height must:

- Be whole numbers
- Be between `256` and `2048`
- Preferably be divisible by `8`

Tasvir generates within the provider's practical resolution limits and then
fits the result to the selected output dimensions.

## Download Does Not Start

- Confirm that the backend is running.
- Confirm that the image still exists under `backend/uploads`.
- Check the browser Network panel for the download request.
- Verify that `VITE_API_URL` has no trailing path such as `/api`.

## CORS Error

The frontend origin must exactly match `FRONTEND_URL`. Using `127.0.0.1` in one
place and `localhost` in another counts as a different origin.

## Node Version Warning

The current Vite version requires Node.js `20.19+` or `22.12+`.

## Content Studio Cannot Connect to Ollama

- Open the Ollama application or run `ollama serve`.
- Confirm the local API with `curl http://localhost:11434/api/tags`.
- Confirm the configured model with `ollama list`.
- Download the default model with `ollama pull qwen3:4b`.
- Make sure `OLLAMA_MODEL` exactly matches the installed model name.
- Restart the FastAPI backend after changing `backend/.env`.

See [Ollama and Qwen setup](ollama.md).

## Content Generation Is Slow

The first request can take longer while the model is loaded into memory.
Close memory-heavy applications and try again. If necessary, configure a
smaller Qwen model in `OLLAMA_MODEL`.
