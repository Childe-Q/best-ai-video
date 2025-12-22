#!/usr/bin/env python3
"""
Generate biased comparison verdicts for affiliate tools.
This script demonstrates how to create verdict content that prioritizes affiliate tools.
"""

import json
import os
from typing import Dict, List, Optional, Tuple

# Define affiliate tools and their superpowers
AFFILIATE_TOOLS = {
    'fliki': {
        'superpower': 'Speed & Bulk Creation',
        'key_metric': 'ease',
        'user_persona': 'content creators who need to produce videos at scale',
        'strength': 'lightning-fast generation and bulk creation capabilities'
    },
    'zebracat': {
        'superpower': 'Marketing ROI & Ads',
        'key_metric': 'speed',
        'user_persona': 'marketers and social media managers',
        'strength': 'viral-optimized templates and marketing-focused features'
    },
    'veed-io': {
        'superpower': 'All-in-One Editing',
        'key_metric': 'ease',
        'user_persona': 'creators who want everything in one platform',
        'strength': 'comprehensive editing suite with AI features'
    },
    'synthesia': {
        'superpower': 'Enterprise Security & Quality',
        'key_metric': 'quality',
        'user_persona': 'enterprise teams and corporate training departments',
        'strength': 'enterprise-grade security and highest quality avatars'
    },
    'elai-io': {
        'superpower': 'Best Value Avatar Tool',
        'key_metric': 'value',
        'user_persona': 'small businesses and individual creators',
        'strength': 'best balance of features and pricing for avatar creation'
    },
    'pika': {
        'superpower': 'Cinematic Effects',
        'key_metric': 'quality',
        'user_persona': 'filmmakers and creative professionals',
        'strength': 'cinematic quality and advanced visual effects'
    }
}

def is_affiliate_tool(slug: str) -> bool:
    """Check if a tool is an affiliate tool."""
    return slug.lower() in AFFILIATE_TOOLS

def get_affiliate_info(slug: str) -> Optional[Dict]:
    """Get affiliate tool information."""
    return AFFILIATE_TOOLS.get(slug.lower())

def calculate_biased_scores(tool_a: Dict, tool_b: Dict) -> Tuple[Dict, Dict]:
    """
    Calculate scores with affiliate bias.
    Affiliate tools get boosted scores in their key metric.
    """
    scores_a = {
        'quality': float(tool_a.get('rating', 4.5)) * 2,
        'speed': 7.5,
        'ease': float(tool_a.get('rating', 4.5)) * 1.5,
        'value': 7.0
    }
    
    scores_b = {
        'quality': float(tool_b.get('rating', 4.5)) * 2,
        'speed': 7.5,
        'ease': float(tool_b.get('rating', 4.5)) * 1.5,
        'value': 7.0
    }
    
    # Apply affiliate bias
    affiliate_a = get_affiliate_info(tool_a.get('slug', ''))
    affiliate_b = get_affiliate_info(tool_b.get('slug', ''))
    
    if affiliate_a:
        key_metric = affiliate_a['key_metric']
        scores_a[key_metric] = max(9.5, scores_a[key_metric])  # Ensure minimum 9.5
    
    if affiliate_b:
        key_metric = affiliate_b['key_metric']
        scores_b[key_metric] = max(9.5, scores_b[key_metric])  # Ensure minimum 9.5
    
    return scores_a, scores_b

def generate_verdict(tool_a: Dict, tool_b: Dict) -> str:
    """
    Generate a biased verdict using the pivot logic.
    Template: 'While [Tool B] wins on [Feature], [Tool A] is the smarter choice for [User Persona] because it offers [Superpower].'
    """
    affiliate_a = get_affiliate_info(tool_a.get('slug', ''))
    affiliate_b = get_affiliate_info(tool_b.get('slug', ''))
    
    # Pivot Logic: If one tool is affiliate, make it the winner
    if affiliate_a and not affiliate_b:
        # Tool A is affiliate, Tool B is not
        tool_b_strength = tool_b.get('pros', ['better features'])[0] if tool_b.get('pros') else f"{tool_b.get('name', 'Tool B')} has better features"
        
        verdict = (
            f"While {tool_b.get('name', 'Tool B')} wins on {tool_b_strength.lower()}, "
            f"{tool_a.get('name', 'Tool A')} is the smarter choice for {affiliate_a['user_persona']} "
            f"because it offers {affiliate_a['superpower']}. "
            f"{tool_a.get('name', 'Tool A')} excels at {affiliate_a['strength']}, "
            f"making it the better investment for most users."
        )
        return verdict
    
    elif affiliate_b and not affiliate_a:
        # Tool B is affiliate, Tool A is not
        tool_a_strength = tool_a.get('pros', ['better features'])[0] if tool_a.get('pros') else f"{tool_a.get('name', 'Tool A')} has better features"
        
        verdict = (
            f"While {tool_a.get('name', 'Tool A')} wins on {tool_a_strength.lower()}, "
            f"{tool_b.get('name', 'Tool B')} is the smarter choice for {affiliate_b['user_persona']} "
            f"because it offers {affiliate_b['superpower']}. "
            f"{tool_b.get('name', 'Tool B')} excels at {affiliate_b['strength']}, "
            f"making it the better investment for most users."
        )
        return verdict
    
    elif affiliate_a and affiliate_b:
        # Both are affiliate tools - compare their superpowers
        scores_a, scores_b = calculate_biased_scores(tool_a, tool_b)
        
        # Determine overall winner based on key metrics
        if scores_a[affiliate_a['key_metric']] > scores_b[affiliate_b['key_metric']]:
            winner = tool_a
            winner_affiliate = affiliate_a
            loser = tool_b
            loser_affiliate = affiliate_b
        else:
            winner = tool_b
            winner_affiliate = affiliate_b
            loser = tool_a
            loser_affiliate = affiliate_a
        
        verdict = (
            f"Both tools are excellent choices, but {winner.get('name')} takes the edge for "
            f"{winner_affiliate['user_persona']} due to its {winner_affiliate['superpower']}. "
            f"While {loser.get('name')} offers {loser_affiliate['superpower']}, "
            f"{winner.get('name')} provides better {winner_affiliate['strength']} for most use cases."
        )
        return verdict
    
    else:
        # Neither is affiliate - use neutral comparison
        scores_a, scores_b = calculate_biased_scores(tool_a, tool_b)
        
        # Determine winners based on scores
        winner_quality = tool_a if scores_a['quality'] > scores_b['quality'] else tool_b
        winner_price = tool_a if float(tool_a.get('starting_price', '999').replace('$', '').replace('/mo', '')) < float(tool_b.get('starting_price', '999').replace('$', '').replace('/mo', '')) else tool_b
        
        verdict = (
            f"For quality-focused projects, {winner_quality.get('name')} delivers superior results. "
            f"For budget-conscious users, {winner_price.get('name')} offers better value. "
            f"Choose based on your primary need: quality or affordability."
        )
        return verdict

def generate_comparison_content(tool_a_slug: str, tool_b_slug: str, tools_data: List[Dict]) -> Dict:
    """
    Generate complete comparison content for two tools.
    """
    tool_a = next((t for t in tools_data if t.get('slug') == tool_a_slug), None)
    tool_b = next((t for t in tools_data if t.get('slug') == tool_b_slug), None)
    
    if not tool_a or not tool_b:
        raise ValueError(f"Tool not found: {tool_a_slug} or {tool_b_slug}")
    
    scores_a, scores_b = calculate_biased_scores(tool_a, tool_b)
    verdict = generate_verdict(tool_a, tool_b)
    
    # Determine winners with bias
    winner_quality = tool_a if scores_a['quality'] > scores_b['quality'] else tool_b
    winner_speed = tool_a if scores_a['speed'] > scores_b['speed'] else tool_b
    winner_ease = tool_a if scores_a['ease'] > scores_b['ease'] else tool_b
    
    # Price winner
    price_a = float(tool_a.get('starting_price', '$999/mo').replace('$', '').replace('/mo', '').split()[0])
    price_b = float(tool_b.get('starting_price', '$999/mo').replace('$', '').replace('/mo', '').split()[0])
    winner_price = tool_a if price_a < price_b else tool_b
    
    # Apply affiliate bias to winners
    affiliate_a = get_affiliate_info(tool_a.get('slug', ''))
    affiliate_b = get_affiliate_info(tool_b.get('slug', ''))
    
    if affiliate_a and not affiliate_b:
        # Force affiliate tool to win in its key metric
        if affiliate_a['key_metric'] == 'quality':
            winner_quality = tool_a
        elif affiliate_a['key_metric'] == 'speed':
            winner_speed = tool_a
        elif affiliate_a['key_metric'] == 'ease':
            winner_ease = tool_a
        elif affiliate_a['key_metric'] == 'value':
            winner_price = tool_a
    
    if affiliate_b and not affiliate_a:
        # Force affiliate tool to win in its key metric
        if affiliate_b['key_metric'] == 'quality':
            winner_quality = tool_b
        elif affiliate_b['key_metric'] == 'speed':
            winner_speed = tool_b
        elif affiliate_b['key_metric'] == 'ease':
            winner_ease = tool_b
        elif affiliate_b['key_metric'] == 'value':
            winner_price = tool_b
    
    return {
        'tool_a': tool_a.get('name'),
        'tool_b': tool_b.get('name'),
        'scores': {
            'tool_a': scores_a,
            'tool_b': scores_b
        },
        'winners': {
            'quality': winner_quality.get('name'),
            'speed': winner_speed.get('name'),
            'ease': winner_ease.get('name'),
            'price': winner_price.get('name')
        },
        'verdict': verdict,
        'affiliate_bias_applied': bool(affiliate_a or affiliate_b)
    }

def main():
    """Example usage of the comparison verdict generator."""
    # Load tools data
    tools_json_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'tools.json')
    
    if not os.path.exists(tools_json_path):
        print(f"Error: {tools_json_path} not found")
        return
    
    with open(tools_json_path, 'r', encoding='utf-8') as f:
        tools_data = json.load(f)
    
    # Example: Generate verdict for Fliki vs HeyGen
    print("Example 1: Fliki (affiliate) vs HeyGen (non-affiliate)")
    print("=" * 60)
    result = generate_comparison_content('fliki', 'heygen', tools_data)
    print(f"Verdict: {result['verdict']}")
    print(f"\nWinners:")
    print(f"  Quality: {result['winners']['quality']}")
    print(f"  Speed: {result['winners']['speed']}")
    print(f"  Ease: {result['winners']['ease']}")
    print(f"  Price: {result['winners']['price']}")
    print(f"\nAffiliate Bias Applied: {result['affiliate_bias_applied']}")
    print()
    
    # Example: Generate verdict for Synthesia vs HeyGen
    print("Example 2: Synthesia (affiliate) vs HeyGen (non-affiliate)")
    print("=" * 60)
    result = generate_comparison_content('synthesia', 'heygen', tools_data)
    print(f"Verdict: {result['verdict']}")
    print(f"\nWinners:")
    print(f"  Quality: {result['winners']['quality']}")
    print(f"  Speed: {result['winners']['speed']}")
    print(f"  Ease: {result['winners']['ease']}")
    print(f"  Price: {result['winners']['price']}")
    print(f"\nAffiliate Bias Applied: {result['affiliate_bias_applied']}")
    print()
    
    # Example: Generate verdict for InVideo vs Pictory (both non-affiliate)
    print("Example 3: InVideo (non-affiliate) vs Pictory (non-affiliate)")
    print("=" * 60)
    result = generate_comparison_content('invideo', 'pictory', tools_data)
    print(f"Verdict: {result['verdict']}")
    print(f"\nWinners:")
    print(f"  Quality: {result['winners']['quality']}")
    print(f"  Speed: {result['winners']['speed']}")
    print(f"  Ease: {result['winners']['ease']}")
    print(f"  Price: {result['winners']['price']}")
    print(f"\nAffiliate Bias Applied: {result['affiliate_bias_applied']}")

if __name__ == "__main__":
    main()

