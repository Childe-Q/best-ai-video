#!/usr/bin/env python3
"""
Script to boost ratings and scores for affiliate tools in tools.json.
Targets: Fliki, Zebracat, Veed.io, Synthesia, Elai.io, Pika
"""

import json
import random
import os

# Target affiliate tools
AFFILIATE_TOOLS = ['Fliki', 'Zebracat', 'Veed.io', 'Synthesia', 'Elai.io', 'Pika']

# Competitors to keep at high rating (don't nerf)
COMPETITORS = ['HeyGen', 'Runway']

def boost_affiliate_tools(tools_data):
    """Boost ratings and scores for affiliate tools."""
    updated_count = 0
    
    for tool in tools_data:
        tool_name = tool.get('name', '')
        
        # Boost affiliate tools
        if tool_name in AFFILIATE_TOOLS:
            # Generate random rating between 4.8 and 4.9
            new_rating = round(random.uniform(4.8, 4.9), 1)
            tool['rating'] = new_rating
            
            # Set ease_of_use_score and speed_score to 9.8
            tool['ease_of_use_score'] = 9.8
            tool['speed_score'] = 9.8
            
            # Set price_score to 9.5 (except Synthesia - keep it real)
            if tool_name != 'Synthesia':
                tool['price_score'] = 9.5
            # Synthesia keeps its existing price_score (it's expensive, so lower score is realistic)
            
            updated_count += 1
            print(f"✅ Boosted {tool_name}:")
            print(f"   Rating: {tool.get('rating', 'N/A')} → {new_rating}")
            print(f"   Ease of Use: → 9.8")
            print(f"   Speed: → 9.8")
            if tool_name != 'Synthesia':
                print(f"   Price Score: → 9.5")
            else:
                print(f"   Price Score: {tool.get('price_score', 'N/A')} (kept realistic)")
            print()
        
        # Ensure competitors stay at 4.9 (don't nerf them)
        elif tool_name in COMPETITORS:
            if tool.get('rating', 0) < 4.9:
                tool['rating'] = 4.9
                print(f"📌 Ensured {tool_name} rating at 4.9")
                print()
    
    return updated_count

def main():
    """Main function to update tools.json."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))
    tools_json_path = os.path.join(project_root, 'src', 'data', 'tools.json')
    
    print("🚀 Starting affiliate tools rating boost...")
    print(f"📋 Target tools: {', '.join(AFFILIATE_TOOLS)}")
    print(f"📁 Reading from: {tools_json_path}\n")
    
    # Read existing tools.json
    try:
        with open(tools_json_path, 'r', encoding='utf-8') as f:
            tools_data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: {tools_json_path} not found!")
        return
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in {tools_json_path}: {e}")
        return
    
    print(f"📊 Found {len(tools_data)} tools in JSON\n")
    
    # Boost affiliate tools
    updated_count = boost_affiliate_tools(tools_data)
    
    # Write back to file
    try:
        with open(tools_json_path, 'w', encoding='utf-8') as f:
            json.dump(tools_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Successfully updated {updated_count} affiliate tools")
        print(f"📁 Saved to: {tools_json_path}")
    except Exception as e:
        print(f"❌ Error writing to file: {e}")

if __name__ == "__main__":
    main()

