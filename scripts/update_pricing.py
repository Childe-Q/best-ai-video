#!/usr/bin/env python3
"""
Update pricing information for all tools in tools.json
Adds detailed pricing structure with tiers
"""

import json
import sys
from pathlib import Path

# Define pricing data for all 20 tools
PRICING_DATA = {
    "invideo": {
        "free_plan": {"exists": True, "details": "Watermarked videos, 10 exports/month, 1GB storage"},
        "starting_price": "$20/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["10 video exports/month", "Watermarked videos", "1GB storage", "Access to templates"]
            },
            {
                "name": "Business",
                "monthly": "$20/mo",
                "annual": "$180/yr",
                "key_features": ["60 video exports/month", "No watermarks", "10GB storage", "8M+ stock media", "AI script generator"]
            },
            {
                "name": "Unlimited",
                "monthly": "$60/mo",
                "annual": "$600/yr",
                "key_features": ["Unlimited exports", "No watermarks", "100GB storage", "Priority support", "Brand kit"]
            }
        ]
    },
    "heygen": {
        "free_plan": {"exists": True, "details": "1 free video, watermarked, limited credits"},
        "starting_price": "$29/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["1 free video", "Watermarked", "Limited credits", "Basic avatars"]
            },
            {
                "name": "Creator",
                "monthly": "$29/mo",
                "annual": "$290/yr",
                "key_features": ["15 credits/month", "No watermarks", "Custom avatars", "Voice cloning", "40+ languages"]
            },
            {
                "name": "Business",
                "monthly": "$89/mo",
                "annual": "$890/yr",
                "key_features": ["90 credits/month", "No watermarks", "Instant Avatar", "API access", "Priority support"]
            },
            {
                "name": "Enterprise",
                "monthly": "Custom",
                "annual": "Custom",
                "key_features": ["Unlimited credits", "Custom pricing", "Dedicated support", "SLA", "White-label options"]
            }
        ]
    },
    "synthesia": {
        "free_plan": {"exists": False, "details": "Free demo video only, no free plan"},
        "starting_price": "$30/mo",
        "tiers": [
            {
                "name": "Starter",
                "monthly": "$30/mo",
                "annual": "$300/yr",
                "key_features": ["10 minutes/month", "140+ AI avatars", "120+ languages", "Screen recorder", "Template library"]
            },
            {
                "name": "Creator",
                "monthly": "$89/mo",
                "annual": "$890/yr",
                "key_features": ["30 minutes/month", "All Starter features", "Custom avatars", "API access", "Priority support"]
            },
            {
                "name": "Enterprise",
                "monthly": "Custom",
                "annual": "Custom",
                "key_features": ["Unlimited minutes", "Custom pricing", "Dedicated support", "SOC 2 compliant", "SSO"]
            }
        ]
    },
    "descript": {
        "free_plan": {"exists": True, "details": "1 hour transcription/month, watermarked exports"},
        "starting_price": "$12/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["1 hour transcription/month", "Watermarked exports", "Basic editing", "Screen recording"]
            },
            {
                "name": "Creator",
                "monthly": "$12/mo",
                "annual": "$120/yr",
                "key_features": ["10 hours transcription/month", "No watermarks", "Overdub voice cloning", "Filler word removal", "Studio Sound"]
            },
            {
                "name": "Pro",
                "monthly": "$24/mo",
                "annual": "$240/yr",
                "key_features": ["30 hours transcription/month", "All Creator features", "Collaboration tools", "Brand templates", "Priority support"]
            },
            {
                "name": "Enterprise",
                "monthly": "Custom",
                "annual": "Custom",
                "key_features": ["Unlimited transcription", "Custom pricing", "Dedicated support", "SSO", "Advanced security"]
            }
        ]
    },
    "opus-clip": {
        "free_plan": {"exists": True, "details": "3 videos/month, watermarked, basic features"},
        "starting_price": "$19/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["3 videos/month", "Watermarked", "Basic AI clipping", "Auto captions"]
            },
            {
                "name": "Pro",
                "monthly": "$19/mo",
                "annual": "$190/yr",
                "key_features": ["30 videos/month", "No watermarks", "AI highlights detection", "Multi-platform export", "Custom branding"]
            },
            {
                "name": "Business",
                "monthly": "$49/mo",
                "annual": "$490/yr",
                "key_features": ["Unlimited videos", "No watermarks", "Priority processing", "API access", "Team collaboration"]
            }
        ]
    },
    "runway": {
        "free_plan": {"exists": True, "details": "125 credits/month, watermarked, limited features"},
        "starting_price": "$15/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["125 credits/month", "Watermarked", "Gen-2 video generation", "Basic editing tools"]
            },
            {
                "name": "Standard",
                "monthly": "$15/mo",
                "annual": "$150/yr",
                "key_features": ["625 credits/month", "No watermarks", "Gen-2 video generation", "Inpainting & outpainting", "Motion tracking"]
            },
            {
                "name": "Pro",
                "monthly": "$35/mo",
                "annual": "$350/yr",
                "key_features": ["2250 credits/month", "No watermarks", "All Standard features", "Priority processing", "Advanced tools"]
            },
            {
                "name": "Unlimited",
                "monthly": "$95/mo",
                "annual": "$950/yr",
                "key_features": ["Unlimited credits", "No watermarks", "All Pro features", "API access", "Dedicated support"]
            }
        ]
    },
    "pika": {
        "free_plan": {"exists": True, "details": "15 credits/month, watermarked, basic generation"},
        "starting_price": "$10/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["15 credits/month", "Watermarked", "Text to video", "Image to video"]
            },
            {
                "name": "Plus",
                "monthly": "$10/mo",
                "annual": "$100/yr",
                "key_features": ["100 credits/month", "No watermarks", "Text to video", "Video extension", "Style transfer"]
            },
            {
                "name": "Pro",
                "monthly": "$30/mo",
                "annual": "$300/yr",
                "key_features": ["400 credits/month", "No watermarks", "All Plus features", "Priority processing", "Advanced controls"]
            }
        ]
    },
    "sora": {
        "free_plan": {"exists": False, "details": "No free plan, API access only"},
        "starting_price": "$20/mo",
        "tiers": [
            {
                "name": "API Access",
                "monthly": "$20/mo",
                "annual": "$200/yr",
                "key_features": ["API access", "Text to video", "Up to 60s videos", "High quality output", "Realistic physics"]
            },
            {
                "name": "Enterprise",
                "monthly": "Custom",
                "annual": "Custom",
                "key_features": ["Custom pricing", "Dedicated support", "Higher rate limits", "Custom integrations", "SLA"]
            }
        ]
    },
    "fliki": {
        "free_plan": {"exists": True, "details": "5 minutes/month, watermarked, limited voices"},
        "starting_price": "$21/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["5 minutes/month", "Watermarked", "Basic AI voices", "Limited stock footage"]
            },
            {
                "name": "Standard",
                "monthly": "$21/mo",
                "annual": "$210/yr",
                "key_features": ["180 minutes/month", "No watermarks", "900+ AI voices", "Blog to video", "Auto subtitles"]
            },
            {
                "name": "Premium",
                "monthly": "$66/mo",
                "annual": "$660/yr",
                "key_features": ["600 minutes/month", "No watermarks", "All Standard features", "Priority support", "Brand kit"]
            }
        ]
    },
    "pictory": {
        "free_plan": {"exists": True, "details": "3 videos/month, watermarked, basic features"},
        "starting_price": "$19/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["3 videos/month", "Watermarked", "Blog to video", "Auto highlights"]
            },
            {
                "name": "Standard",
                "monthly": "$19/mo",
                "annual": "$190/yr",
                "key_features": ["30 videos/month", "No watermarks", "Blog to video", "Edit video by text", "Auto captions"]
            },
            {
                "name": "Professional",
                "monthly": "$47/mo",
                "annual": "$470/yr",
                "key_features": ["90 videos/month", "No watermarks", "All Standard features", "Custom branding", "Priority support"]
            }
        ]
    },
    "veed-io": {
        "free_plan": {"exists": True, "details": "10 minutes/month, watermarked, basic editing"},
        "starting_price": "$12/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["10 minutes/month", "Watermarked", "Basic editing", "Auto subtitles"]
            },
            {
                "name": "Basic",
                "monthly": "$12/mo",
                "annual": "$120/yr",
                "key_features": ["25 minutes/month", "No watermarks", "Auto subtitles", "Screen recording", "Video editing"]
            },
            {
                "name": "Pro",
                "monthly": "$24/mo",
                "annual": "$240/yr",
                "key_features": ["125 minutes/month", "No watermarks", "All Basic features", "AI background removal", "Brand kit"]
            },
            {
                "name": "Business",
                "monthly": "$59/mo",
                "annual": "$590/yr",
                "key_features": ["Unlimited minutes", "No watermarks", "All Pro features", "Team collaboration", "Priority support"]
            }
        ]
    },
    "colossyan": {
        "free_plan": {"exists": False, "details": "Free trial available, no free plan"},
        "starting_price": "$28/mo",
        "tiers": [
            {
                "name": "Starter",
                "monthly": "$28/mo",
                "annual": "$280/yr",
                "key_features": ["10 minutes/month", "AI avatars", "70+ languages", "Screen recording", "Template library"]
            },
            {
                "name": "Pro",
                "monthly": "$96/mo",
                "annual": "$960/yr",
                "key_features": ["50 minutes/month", "All Starter features", "Custom avatars", "API access", "Priority support"]
            },
            {
                "name": "Enterprise",
                "monthly": "Custom",
                "annual": "Custom",
                "key_features": ["Unlimited minutes", "Custom pricing", "Dedicated support", "SSO", "Advanced security"]
            }
        ]
    },
    "elai-io": {
        "free_plan": {"exists": True, "details": "1 minute/month, watermarked, basic avatars"},
        "starting_price": "$23/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["1 minute/month", "Watermarked", "Basic avatars", "Limited templates"]
            },
            {
                "name": "Basic",
                "monthly": "$23/mo",
                "annual": "$230/yr",
                "key_features": ["15 minutes/month", "No watermarks", "Custom avatar creation", "80+ languages", "PPT to video"]
            },
            {
                "name": "Advanced",
                "monthly": "$59/mo",
                "annual": "$590/yr",
                "key_features": ["50 minutes/month", "No watermarks", "All Basic features", "Priority support", "Brand kit"]
            }
        ]
    },
    "d-id": {
        "free_plan": {"exists": True, "details": "5 credits/month, watermarked, basic features"},
        "starting_price": "$5/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["5 credits/month", "Watermarked", "Photo animation", "Talking photos"]
            },
            {
                "name": "Lite",
                "monthly": "$5/mo",
                "annual": "$50/yr",
                "key_features": ["15 credits/month", "No watermarks", "Photo animation", "Video cloning", "API access"]
            },
            {
                "name": "Pro",
                "monthly": "$29/mo",
                "annual": "$290/yr",
                "key_features": ["200 credits/month", "No watermarks", "All Lite features", "Priority processing", "Advanced features"]
            }
        ]
    },
    "deepbrain-ai": {
        "free_plan": {"exists": False, "details": "Free trial available, no free plan"},
        "starting_price": "$30/mo",
        "tiers": [
            {
                "name": "Personal",
                "monthly": "$30/mo",
                "annual": "$300/yr",
                "key_features": ["10 minutes/month", "Ultra-realistic AI humans", "100+ languages", "Basic templates", "HD export"]
            },
            {
                "name": "Team",
                "monthly": "$225/mo",
                "annual": "$2250/yr",
                "key_features": ["90 minutes/month", "All Personal features", "Team collaboration", "API access", "Priority support"]
            },
            {
                "name": "Enterprise",
                "monthly": "Custom",
                "annual": "Custom",
                "key_features": ["Unlimited minutes", "Custom pricing", "White-label options", "Dedicated support", "Enterprise security"]
            }
        ]
    },
    "synthesys": {
        "free_plan": {"exists": False, "details": "Free trial available, no free plan"},
        "starting_price": "$29/mo",
        "tiers": [
            {
                "name": "Personal",
                "monthly": "$29/mo",
                "annual": "$290/yr",
                "key_features": ["30 minutes/month", "AI avatars", "AI voices", "Text to video", "Multilingual support"]
            },
            {
                "name": "Business",
                "monthly": "$79/mo",
                "annual": "$790/yr",
                "key_features": ["120 minutes/month", "All Personal features", "Custom avatars", "API access", "Priority support"]
            },
            {
                "name": "Enterprise",
                "monthly": "Custom",
                "annual": "Custom",
                "key_features": ["Unlimited minutes", "Custom pricing", "Dedicated support", "SSO", "Advanced features"]
            }
        ]
    },
    "flexclip": {
        "free_plan": {"exists": True, "details": "12 videos/month, watermarked, basic editing"},
        "starting_price": "$9/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["12 videos/month", "Watermarked", "Basic editing", "Template library"]
            },
            {
                "name": "Basic",
                "monthly": "$9/mo",
                "annual": "$90/yr",
                "key_features": ["Unlimited videos", "No watermarks", "Video editing", "Stock media", "Text to speech"]
            },
            {
                "name": "Plus",
                "monthly": "$19/mo",
                "annual": "$190/yr",
                "key_features": ["All Basic features", "HD export", "Brand kit", "Priority support", "Advanced features"]
            }
        ]
    },
    "lumen5": {
        "free_plan": {"exists": True, "details": "5 videos/month, watermarked, basic features"},
        "starting_price": "$19/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["5 videos/month", "Watermarked", "Article to video", "Basic templates"]
            },
            {
                "name": "Basic",
                "monthly": "$19/mo",
                "annual": "$190/yr",
                "key_features": ["25 videos/month", "No watermarks", "Article to video", "Template library", "Stock media"]
            },
            {
                "name": "Professional",
                "monthly": "$59/mo",
                "annual": "$590/yr",
                "key_features": ["Unlimited videos", "No watermarks", "All Basic features", "Brand kit", "Priority support"]
            }
        ]
    },
    "steve-ai": {
        "free_plan": {"exists": True, "details": "5 videos/month, watermarked, basic features"},
        "starting_price": "$15/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["5 videos/month", "Watermarked", "Text to video", "Basic templates"]
            },
            {
                "name": "Starter",
                "monthly": "$15/mo",
                "annual": "$150/yr",
                "key_features": ["30 videos/month", "No watermarks", "Text to video", "AI avatars", "Auto subtitles"]
            },
            {
                "name": "Pro",
                "monthly": "$45/mo",
                "annual": "$450/yr",
                "key_features": ["Unlimited videos", "No watermarks", "All Starter features", "Priority support", "Brand kit"]
            }
        ]
    },
    "zebracat": {
        "free_plan": {"exists": True, "details": "5 videos/month, watermarked, basic features"},
        "starting_price": "$19/mo",
        "tiers": [
            {
                "name": "Free",
                "monthly": "Free",
                "annual": None,
                "key_features": ["5 videos/month", "Watermarked", "Text-to-video", "Auto captions", "Basic templates"]
            },
            {
                "name": "Pro",
                "monthly": "$19/mo",
                "annual": "$190/yr",
                "key_features": ["Unlimited videos", "No watermarks", "Text-to-video", "Stock library", "Brand kits", "Music sync"]
            },
            {
                "name": "Business",
                "monthly": "$49/mo",
                "annual": "$490/yr",
                "key_features": ["All Pro features", "Priority processing", "Team collaboration", "API access", "Dedicated support"]
            }
        ]
    }
}

def update_pricing():
    """Update pricing information in tools.json"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    tools_file = project_root / "src" / "data" / "tools.json"
    
    # Read current tools.json
    with open(tools_file, 'r', encoding='utf-8') as f:
        tools = json.load(f)
    
    # Update pricing for each tool
    updated_count = 0
    for tool in tools:
        slug = tool.get('slug')
        if slug in PRICING_DATA:
            # Update pricing object
            tool['pricing'] = PRICING_DATA[slug]
            updated_count += 1
            print(f"✓ Updated pricing for {tool['name']}")
        else:
            print(f"⚠ No pricing data found for {slug}")
    
    # Write updated tools.json
    with open(tools_file, 'w', encoding='utf-8') as f:
        json.dump(tools, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Successfully updated pricing for {updated_count} tools")
    return updated_count

if __name__ == "__main__":
    try:
        update_pricing()
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)

