#!/usr/bin/env python3
"""
Script to sync starting_price with the first paid plan in pricing_plans array.
Logic:
1. For each tool, find the first PAID plan (skip "Free", "Custom", "Contact")
2. Get its price and period (e.g., "$28" + "/mo" = "$28/mo")
3. Update the starting_price field with this value
Goal: Ensure homepage card shows the same price as the detail page "Starter" card
"""

import json
import os

def is_paid_plan(price_str):
    """Check if a plan is a paid plan (not Free, Custom, or Contact)."""
    if not price_str:
        return False
    price_lower = price_str.lower().strip()
    return price_lower not in ['free', 'custom', 'contact', '']

def find_first_paid_plan(pricing_plans):
    """Find the first paid plan in the pricing_plans array."""
    if not pricing_plans or len(pricing_plans) == 0:
        return None
    
    for plan in pricing_plans:
        price = plan.get('price', '')
        if is_paid_plan(price):
            return plan
    
    return None

def sync_starting_prices(tools_data):
    """Sync starting_price with first paid plan for each tool."""
    updated_count = 0
    skipped_count = 0
    
    for tool in tools_data:
        tool_name = tool.get('name', 'Unknown')
        pricing_plans = tool.get('pricing_plans', [])
        
        # Find first paid plan
        paid_plan = find_first_paid_plan(pricing_plans)
        
        if not paid_plan:
            skipped_count += 1
            print(f"⏭️  Skipped {tool_name}: No paid plan found")
            continue
        
        # Get price and period
        price = paid_plan.get('price', '').strip()
        period = paid_plan.get('period', '').strip()
        
        # Build new starting_price
        new_starting_price = f"{price}{period}"
        
        # Get old starting_price for comparison
        old_starting_price = tool.get('starting_price', 'N/A')
        
        # Update if different
        if old_starting_price != new_starting_price:
            tool['starting_price'] = new_starting_price
            updated_count += 1
            print(f"✅ Updated {tool_name}:")
            print(f"   Old: {old_starting_price}")
            print(f"   New: {new_starting_price} (from {paid_plan.get('name', 'Unknown')} plan)")
            print()
        else:
            print(f"✓ {tool_name}: Already synced ({new_starting_price})")
    
    return updated_count, skipped_count

def main():
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    tools_json_path = os.path.join(project_root, 'src', 'data', 'tools.json')
    
    # Read tools.json
    print(f"📖 Reading {tools_json_path}...")
    with open(tools_json_path, 'r', encoding='utf-8') as f:
        tools_data = json.load(f)
    
    print(f"Found {len(tools_data)} tools\n")
    print("=" * 60)
    print("Syncing starting_price with first paid plan...")
    print("=" * 60)
    print()
    
    # Sync prices
    updated_count, skipped_count = sync_starting_prices(tools_data)
    
    # Write back to file
    print("=" * 60)
    print(f"📝 Writing updated data to {tools_json_path}...")
    with open(tools_json_path, 'w', encoding='utf-8') as f:
        json.dump(tools_data, f, indent=2, ensure_ascii=False)
    
    print()
    print("=" * 60)
    print("✅ Sync Complete!")
    print(f"   Updated: {updated_count} tools")
    print(f"   Skipped: {skipped_count} tools (no paid plans)")
    print(f"   Total: {len(tools_data)} tools")
    print("=" * 60)

if __name__ == '__main__':
    main()

