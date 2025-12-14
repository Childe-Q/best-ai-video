#!/usr/bin/env python3
"""
Script to generate AI video tool data using AI API.
Uses OpenAI/DeepSeek API to generate detailed, unique content for each tool.
"""

import json
import re
import os
from typing import Dict, Any

# Configure your AI provider here
# Option 1: OpenAI
try:
    from openai import OpenAI
    USE_OPENAI = True
except ImportError:
    USE_OPENAI = False

# Option 2: DeepSeek (if you prefer)
# Set your API key as environment variable: DEEPSEEK_API_KEY
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# List of 20 tools to generate
TOOLS_LIST = [
    'InVideo', 'HeyGen', 'Synthesia', 'Descript', 'Opus Clip', 
    'Runway', 'Pika', 'Sora', 'Fliki', 'Pictory', 
    'Veed.io', 'Colossyan', 'Elai.io', 'D-ID', 'Hour One', 
    'DeepBrain AI', 'Synthesys', 'FlexClip', 'Lumen5', 'Steve AI'
]

def normalize_slug(name: str) -> str:
    """Convert tool name to URL-friendly slug."""
    slug = name.lower()
    slug = re.sub(r'[.\s]+', '-', slug)
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug

def call_ai_api(prompt: str, model: str = "gpt-4o-mini") -> str:
    """Call AI API to generate content."""
    if USE_OPENAI and OPENAI_API_KEY:
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert at reviewing AI video creation tools. Generate detailed, accurate, and unique content for each tool."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )
        return response.choices[0].message.content
    elif DEEPSEEK_API_KEY:
        # DeepSeek API (similar structure)
        import requests
        response = requests.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}"},
            json={
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": "You are an expert at reviewing AI video creation tools."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
            }
        )
        return response.json()["choices"][0]["message"]["content"]
    else:
        raise Exception("No AI API configured. Set OPENAI_API_KEY or DEEPSEEK_API_KEY environment variable.")

def generate_tool_data(tool_name: str, tool_id: str) -> Dict[str, Any]:
    """Generate comprehensive tool data using AI."""
    slug = normalize_slug(tool_name)
    
    prompt = f"""Generate a detailed JSON entry for the AI video tool "{tool_name}".

Return ONLY a valid JSON object with this exact structure:
{{
  "tagline": "A compelling one-line tagline",
  "short_description": "One sentence description",
  "best_for": "Specific user type (e.g., 'YouTube Creators', 'Marketing Teams')",
  "pricing": {{
    "free_plan": true/false,
    "starting_price": "number as string (e.g., '29')",
    "currency": "$"
  }},
  "has_free_trial": true/false,
  "pricing_model": "Freemium" or "Subscription",
  "starting_price": "$XX/mo format",
  "rating": 4.0-5.0,
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2"],
  "review_content": "2-3 sentence summary",
  "long_review": "<p>First paragraph with <strong>key features</strong>.</p><p>Second paragraph about use cases.</p><p>Third paragraph about limitations or best practices.</p>",
  "faqs": [
    {{"question": "Question 1", "answer": "Answer 1"}},
    {{"question": "Question 2", "answer": "Answer 2"}}
  ]
}}

Make the content unique, accurate, and specific to {tool_name}. Research real features and pricing if possible."""

    try:
        ai_response = call_ai_api(prompt)
        # Extract JSON from response (in case AI adds extra text)
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            ai_data = json.loads(json_match.group())
        else:
            raise ValueError("No JSON found in AI response")
    except Exception as e:
        print(f"  ⚠️  AI generation failed: {e}")
        print(f"  → Using fallback template")
        # Fallback template
        ai_data = {
            "tagline": f"AI-powered video creation with {tool_name}",
            "short_description": f"Professional video creation tool for content creators.",
            "best_for": "Content Creators & Marketers",
            "pricing": {"free_plan": True, "starting_price": "20", "currency": "$"},
            "has_free_trial": True,
            "pricing_model": "Freemium",
            "starting_price": "$20/mo",
            "rating": 4.5,
            "features": ["AI Video Generation", "Text to Video", "Video Editing"],
            "pros": ["Easy to use", "Fast rendering", "Good quality"],
            "cons": ["Limited free plan", "Learning curve"],
            "review_content": f"{tool_name} is a powerful AI video creation platform.",
            "long_review": f"<p><strong>{tool_name}</strong> offers comprehensive video creation capabilities.</p><p>The platform excels at AI-powered content generation.</p>",
            "faqs": [
                {"question": f"Is {tool_name} free?", "answer": f"Yes, {tool_name} offers a free plan."},
                {"question": f"What makes {tool_name} different?", "answer": f"{tool_name} stands out for its ease of use."}
            ]
        }
    
    # Construct full tool object
    tool_data = {
        "id": tool_id,
        "slug": slug,
        "name": tool_name,
        "logo_url": f"/logos/{slug}.png",
        "affiliate_link": f"https://{slug.replace('-', '')}.com?ref=demo",
        **ai_data
    }
    
    return tool_data

def main():
    """Main function to generate and save tool data."""
    print("🚀 Starting AI-powered tool data generation...")
    print(f"📋 Generating data for {len(TOOLS_LIST)} tools\n")
    
    if not OPENAI_API_KEY and not DEEPSEEK_API_KEY:
        print("⚠️  WARNING: No API key found!")
        print("   Set OPENAI_API_KEY or DEEPSEEK_API_KEY environment variable.")
        print("   Example: export OPENAI_API_KEY='your-key-here'")
        print("   Continuing with fallback templates...\n")
    
    tools_data = []
    
    for idx, tool_name in enumerate(TOOLS_LIST, start=1):
        print(f"[{idx}/{len(TOOLS_LIST)}] Processing {tool_name}...")
        slug = normalize_slug(tool_name)
        print(f"  → Slug: {slug}")
        
        try:
            tool_data = generate_tool_data(tool_name, str(idx))
            tools_data.append(tool_data)
            print(f"  ✓ Generated data for {tool_name}\n")
        except Exception as e:
            print(f"  ✗ Error: {e}\n")
            continue
    
    # Write to file
    output_path = "src/data/tools.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(tools_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Successfully generated {len(tools_data)} tools")
    print(f"📁 Saved to: {output_path}")

if __name__ == "__main__":
    main()
