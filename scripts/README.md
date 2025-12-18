# Data Generation Script

This script generates detailed JSON data for AI video tools using AI API and automatically fetches logos via Clearbit Logo API.

## Features

- 🤖 **AI-Powered Content Generation**: Uses OpenAI or DeepSeek API to generate unique, detailed reviews
- 🎨 **Automatic Logo URLs**: Uses Clearbit Logo API to generate logo URLs automatically (no manual downloads needed)
- 📋 **Complete Schema**: Generates all required fields including tags, pricing, pros/cons, FAQs, and reviews
- 🔄 **Batch Processing**: Processes all 20 tools in one run

## Setup

1. Install dependencies:
```bash
pip install -r scripts/requirements.txt
```

2. Set your API key:
```bash
# For OpenAI
export OPENAI_API_KEY='your-openai-key-here'

# OR for DeepSeek (recommended, cheaper)
export DEEPSEEK_API_KEY='your-deepseek-key-here'
```

## Usage

Run the script from the project root:
```bash
python scripts/update_data.py
```

The script will:
- Generate detailed data for all 20 tools
- Automatically create Clearbit Logo API URLs for each tool
- Normalize slugs (e.g., "Veed.io" → "veed-io")
- Overwrite `src/data/tools.json` with new data

## Tool List

The script processes these 20 tools:
- InVideo, HeyGen, Synthesia, Descript, Opus Clip
- Runway, Pika, Sora, Fliki, Pictory
- Veed.io, Colossyan, Elai.io, D-ID, Hour One
- DeepBrain AI, Synthesys, FlexClip, Lumen5, Steve AI

## Logo Generation

The script automatically generates logo URLs using Clearbit Logo API:
- Format: `https://logo.clearbit.com/[domain]`
- Example: InVideo → `https://logo.clearbit.com/invideo.io`
- No manual image downloads required!

## Generated Data Schema

Each tool includes:
- Basic info: `id`, `slug`, `name`, `tagline`, `short_description`, `best_for`
- Logo: `logo_url` (Clearbit API URL)
- Pricing: `pricing` object, `has_free_trial`, `pricing_model`, `starting_price`
- Content: `rating`, `features`, `tags`, `pros`, `cons`
- Reviews: `review_content`, `long_review` (HTML format)
- FAQs: Array of question/answer pairs
- Affiliate: `affiliate_link`

## Tags

Generated tags are selected from this list:
- `Avatar` - For AI avatar/presenter tools
- `Text-to-Video` - For text-to-video generation tools
- `Editor` - For video editing tools
- `Repurposing` - For content repurposing tools
- `Cheap` - For budget-friendly tools
- `Professional` - For enterprise/professional tools

## Notes

- The script uses AI to generate unique content for each tool
- If API key is not set, it will use fallback templates
- Clearbit Logo API is free and requires no authentication
- Generated content is SEO-optimized and unique for each tool

