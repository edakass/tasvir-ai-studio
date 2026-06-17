# Changelog

All notable changes to Tasvir AI Studio are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The project has not published its first version yet.

## [Unreleased]

### Added

- Premium, responsive landing page for the creative workspace
- English and Turkish interface with persistent language selection
- Content Studio workflow for product and social media content packages
- Ollama and Qwen integration for local Content Studio generation
- Editable generated outputs for:
  - Instagram captions
  - Story copy
  - Advertising headlines
  - Product descriptions
  - Hashtags
  - CTA text
  - Carousel outlines
- Image Studio text-to-image workflow
- Gemini-assisted image prompt generation
- Hugging Face `FLUX.1-schnell` image generation
- Social media format presets and custom output dimensions
- Category and project management
- Generated image favorites and archives
- PNG and JPG downloads
- Modern confirmation dialogs for destructive actions
- User-friendly API connection and missing-record states
- English and Turkish 404 page
- Local setup guides for Gemini, Hugging Face, MySQL, Ollama, and Qwen
- Example environment files and backend dependency list
- MIT License
- Contribution guidelines and official learning resources

### Changed

- Replaced the sidebar with a compact, sticky navigation bar
- Redesigned the product as a creative studio instead of a generic AI tool
- Improved loading, generation, deletion, and validation feedback
- Updated the Image Studio landing preview to show multiple publishing formats
- Made generated image dimensions match the selected output format
- Simplified the project wizard to focus only on text-to-image generation

### Fixed

- Fixed custom image dimensions not being applied correctly
- Fixed generated image downloads
- Fixed category, project, and image deletion flows
- Prevented repeated generation requests while a request is running
- Prevented failed generations from being saved as successful images
- Added safer upload paths, file names, and image validation
- Added cleanup for failed or deleted generated files

### Removed

- Image-to-image workflow, API endpoint, database fields, translations, and
  unused styles
- Product image input from Content Studio to keep the workflow text-focused
- Native browser confirmation dialogs
- Local model labels from the interface before the integration is available
- Unnecessary AI-focused labels and decorative landing page sections

## Planned

- Save and reopen generated content packages
- Add automated frontend, backend, and API tests
