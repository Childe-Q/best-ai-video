# Data Generation Script

This script generates detailed JSON data for AI video tools using AI API.

## Setup

1. Install dependencies:
```bash
pip install -r scripts/requirements.txt
```

2. Set your API key:
```bash
# For OpenAI
export OPENAI_API_KEY='your-openai-key-here'

# OR for DeepSeek
export DEEPSEEK_API_KEY='your-deepseek-key-here'
```

## Usage

Run the script from the project root:
```bash
python scripts/update_data.py
```

The script will:
- Generate detailed data for 20 tools
- Normalize slugs (e.g., "Veed.io" → "veed-io")
- Overwrite `src/data/tools.json` with new data

## Tool List

The script processes these 20 tools:
- InVideo, HeyGen, Synthesia, Descript, Opus Clip
- Runway, Pika, Sora, Fliki, Pictory
- Veed.io, Colossyan, Elai.io, D-ID, Hour One
- DeepBrain AI, Synthesys, FlexClip, Lumen5, Steve AI

## Notes

- The script uses AI to generate unique content for each tool
- If API key is not set, it will use fallback templates
- Generated data includes: pricing, pros/cons, reviews, features, FAQs

