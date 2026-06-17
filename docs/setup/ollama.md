# Ollama and Qwen Setup

Content Studio uses Ollama and Qwen to generate captions, story copy,
advertising headlines, product descriptions, hashtags, CTA text, and carousel
outlines locally. No API key is required for this part of Tasvir.

## 1. Install Ollama

Download Ollama for your operating system:

- [macOS](https://ollama.com/download/mac)
- [Windows](https://ollama.com/download/windows)
- [Linux](https://ollama.com/download/linux)

Verify the installation:

```bash
ollama --version
```

## 2. Download a Qwen Model

Tasvir uses `qwen3:4b` by default. Download it once:

```bash
ollama pull qwen3:4b
```

You can verify the model by running:

```bash
ollama run qwen3:4b
```

Type `/bye` to leave the interactive session.

## 3. Check the Local API

Ollama normally exposes its local API at:

```text
http://localhost:11434
```

Confirm that it is running:

```bash
curl http://localhost:11434/api/tags
```

On macOS and Windows, opening the Ollama application normally starts the local
service. On Linux, or when the service is not running, use:

```bash
ollama serve
```

Keep Ollama running while using Content Studio.

## 4. Configure Tasvir

Add these values to `backend/.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b
```

These are also the built-in defaults. The variables are useful when you want
to use another Ollama address or model.

Restart the FastAPI backend after changing `.env`.

## What Does `4b` Mean?

`4b` means that the model has approximately four billion parameters. It does
not mean a 4 GB download or exactly 4 GB of RAM. Required memory depends on the
model file and quantization.

As a practical starting point:

- 8 GB system RAM: try a small model and close memory-heavy applications.
- 16 GB system RAM: a 4B model is generally a more comfortable starting point.
- More RAM: larger models may be possible, depending on the CPU/GPU.

If `qwen3:4b` is too slow for your computer, install a smaller compatible
Qwen model and set its exact Ollama name in `OLLAMA_MODEL`. Output quality may
be lower with smaller models.

### macOS 13 Ventura

Current Ollama releases require macOS 14 or newer. Ventura users can use the
last compatible official Ollama release, `0.12.4`, together with `qwen3:4b`.
Newer model families may require a newer Ollama and macOS version.

Download it from the
[official Ollama v0.12.4 release](https://github.com/ollama/ollama/releases/tag/v0.12.4).

Check available models with:

```bash
ollama list
```

Model availability can change. See the
[official Ollama Qwen library](https://ollama.com/search?q=qwen) for current
names and sizes.
