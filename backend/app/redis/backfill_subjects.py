#!/usr/bin/env python3
"""
Backfill subjects for existing search runs based on their queries.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".env"))

from app.core.cache import CACHE

def classify_query_subject(query: str) -> str:
    """Classify a query into a subject category."""
    query_lower = query.lower()
    
    # Technology Leadership
    tech_keywords = ['technology', 'digital', 'cto', 'cio', 'ai', 'software', 'engineering', 'tech', 'startup', 'scaling']
    if any(keyword in query_lower for keyword in tech_keywords):
        return "Technology Leadership"
    
    # Healthcare Executive
    health_keywords = ['healthcare', 'medical', 'hospital', 'clinical', 'physician', 'nurse']
    if any(keyword in query_lower for keyword in health_keywords):
        return "Healthcare Executive"
    
    # Financial Services
    finance_keywords = ['financial', 'banking', 'investment', 'fintech', 'finance', 'treasury', 'cfo']
    if any(keyword in query_lower for keyword in finance_keywords):
        return "Financial Services"
    
    # Manufacturing
    manufacturing_keywords = ['manufacturing', 'operations', 'supply chain', 'production', 'industrial', 'lean']
    if any(keyword in query_lower for keyword in manufacturing_keywords):
        return "Manufacturing"
    
    # Nonprofit Leadership
    nonprofit_keywords = ['nonprofit', 'foundation', 'charity', 'social impact', 'mission', 'board governance']
    if any(keyword in query_lower for keyword in nonprofit_keywords):
        return "Nonprofit Leadership"
    
    # Startup Growth
    startup_keywords = ['startup', 'venture', 'growth', 'scaling', 'founder', 'vc']
    if any(keyword in query_lower for keyword in startup_keywords):
        return "Startup Growth"
    
    # Default to Executive Search
    return "Executive Search"

def main():
    print("=== Backfilling Subjects for Existing Runs ===\n")
    
    # Get all search run keys
    all_keys = CACHE.keys(f"{CACHE.ai_prefix()}:*")
    run_keys = []
    
    for key in all_keys:
        # Skip analysis and index keys, only get run data
        if ":analysis:" in key or ":recent" in key or ":reports" in key or ":q:" in key or ":query_hash:" in key:
            continue
        run_keys.append(key)
    
    print(f"Found {len(run_keys)} search runs to backfill")
    
    updated_count = 0
    
    for key in run_keys:
        bundle = CACHE.get_json(key)
        if not bundle or "run" not in bundle:
            continue
            
        run_data = bundle["run"]
        run_id = run_data.get("run_id", "unknown")
        query = run_data.get("query", "")
        
        # Skip if already has subject
        if "subject" in run_data:
            print(f"  {run_id}: Already has subject '{run_data['subject']}'")
            continue
        
        # Classify the query
        subject = classify_query_subject(query)
        
        # Update the bundle
        run_data["subject"] = subject
        
        # Save back to Redis
        try:
            CACHE.set_json(key, bundle)
            print(f"  ✅ {run_id}: '{query[:50]}...' → {subject}")
            updated_count += 1
        except Exception as e:
            print(f"  ❌ {run_id}: Error updating - {e}")
    
    print(f"\n=== Backfill Complete ===")
    print(f"Updated {updated_count} runs with subjects")
    
    # Show subject distribution
    subjects = {}
    for key in run_keys:
        bundle = CACHE.get_json(key)
        if bundle and "run" in bundle:
            subject = bundle["run"].get("subject", "Unknown")
            subjects[subject] = subjects.get(subject, 0) + 1
    
    print(f"\nSubject distribution:")
    for subject, count in subjects.items():
        print(f"  {subject}: {count}")

if __name__ == "__main__":
    main()