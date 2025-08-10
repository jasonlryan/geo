"""
Snippet alignment service for extracting and highlighting actual quoted passages.
Ensures citations match the exact text being referenced in the source.
"""

import re
from typing import Dict, List, Optional, Tuple
from difflib import SequenceMatcher


def find_best_snippet_match(claim_text: str, source_text: str, context_window: int = 200) -> Dict[str, any]:
    """
    Find the best matching snippet in source text for a claim.
    
    Args:
        claim_text: The text of the claim being made
        source_text: The full text of the source document
        context_window: Characters to include around the match for context
        
    Returns:
        Dict with keys: snippet, start_offset, end_offset, confidence_score
    """
    if not claim_text or not source_text:
        return {
            "snippet": "",
            "start_offset": 0,
            "end_offset": 0,
            "confidence_score": 0.0
        }
    
    # Clean and normalize texts for comparison
    clean_claim = _normalize_text(claim_text)
    clean_source = _normalize_text(source_text)
    
    # Strategy 1: Look for direct phrase matches (highest confidence)
    direct_match = _find_direct_phrase_match(clean_claim, clean_source, source_text, context_window)
    if direct_match["confidence_score"] > 0.8:
        return direct_match
    
    # Strategy 2: Look for key concept matches
    concept_match = _find_concept_match(clean_claim, clean_source, source_text, context_window)
    if concept_match["confidence_score"] > 0.6:
        return concept_match
    
    # Strategy 3: Fuzzy matching for paraphrased content
    fuzzy_match = _find_fuzzy_match(clean_claim, clean_source, source_text, context_window)
    
    # Return the best match found
    return max([direct_match, concept_match, fuzzy_match], key=lambda x: x["confidence_score"])


def _normalize_text(text: str) -> str:
    """Normalize text for better matching."""
    # Remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', text.strip())
    # Remove common citation artifacts
    text = re.sub(r'\[[\d,\s\-]+\]', '', text)  # Remove [1], [1-3], etc.
    text = re.sub(r'\(\d{4}\)', '', text)  # Remove (2024)
    return text.lower()


def _find_direct_phrase_match(claim: str, source: str, original_source: str, context_window: int) -> Dict[str, any]:
    """Find direct phrase matches between claim and source."""
    # Extract meaningful phrases from claim (3+ words)
    claim_phrases = _extract_meaningful_phrases(claim, min_length=3)
    
    best_match = {"snippet": "", "start_offset": 0, "end_offset": 0, "confidence_score": 0.0}
    
    for phrase in claim_phrases:
        # Look for exact phrase in source
        start_idx = source.find(phrase)
        if start_idx != -1:
            # Found exact match - calculate position in original text
            original_start = _map_to_original_position(start_idx, source, original_source)
            original_end = _map_to_original_position(start_idx + len(phrase), source, original_source)
            
            # Extract context window around match
            context_start = max(0, original_start - context_window // 2)
            context_end = min(len(original_source), original_end + context_window // 2)
            
            snippet = original_source[context_start:context_end].strip()
            confidence = min(0.95, len(phrase) / len(claim))  # Longer matches = higher confidence
            
            if confidence > best_match["confidence_score"]:
                best_match = {
                    "snippet": snippet,
                    "start_offset": original_start,
                    "end_offset": original_end,
                    "confidence_score": confidence
                }
    
    return best_match


def _find_concept_match(claim: str, source: str, original_source: str, context_window: int) -> Dict[str, any]:
    """Find matches based on key concepts/entities."""
    # Extract key terms (nouns, proper nouns, technical terms)
    claim_terms = _extract_key_terms(claim)
    
    best_match = {"snippet": "", "start_offset": 0, "end_offset": 0, "confidence_score": 0.0}
    
    # Find sections of source with highest concentration of claim terms
    source_sentences = _split_into_sentences(original_source)
    
    for i, sentence in enumerate(source_sentences):
        sentence_normalized = _normalize_text(sentence)
        
        # Count matching terms
        matching_terms = sum(1 for term in claim_terms if term in sentence_normalized)
        
        if matching_terms > 0:
            # Calculate confidence based on term coverage
            confidence = (matching_terms / len(claim_terms)) * 0.7  # Cap at 0.7 for concept matches
            
            if confidence > best_match["confidence_score"]:
                # Find position of this sentence in original text
                sentence_start = original_source.find(sentence)
                if sentence_start != -1:
                    # Add context from adjacent sentences
                    context_start = max(0, sentence_start - context_window // 2)
                    context_end = min(len(original_source), sentence_start + len(sentence) + context_window // 2)
                    
                    best_match = {
                        "snippet": original_source[context_start:context_end].strip(),
                        "start_offset": sentence_start,
                        "end_offset": sentence_start + len(sentence),
                        "confidence_score": confidence
                    }
    
    return best_match


def _find_fuzzy_match(claim: str, source: str, original_source: str, context_window: int) -> Dict[str, any]:
    """Find fuzzy matches for paraphrased content."""
    # Split source into overlapping chunks for comparison
    chunk_size = min(len(claim) * 2, 300)
    chunks = _create_overlapping_chunks(source, chunk_size, overlap=50)
    
    best_match = {"snippet": "", "start_offset": 0, "end_offset": 0, "confidence_score": 0.0}
    
    for chunk_start, chunk_text in chunks:
        # Calculate similarity ratio
        similarity = SequenceMatcher(None, claim, chunk_text).ratio()
        
        if similarity > best_match["confidence_score"] and similarity > 0.3:  # Minimum threshold
            # Map back to original text
            original_start = _map_to_original_position(chunk_start, source, original_source)
            original_end = _map_to_original_position(chunk_start + len(chunk_text), source, original_source)
            
            context_start = max(0, original_start - context_window // 2)
            context_end = min(len(original_source), original_end + context_window // 2)
            
            best_match = {
                "snippet": original_source[context_start:context_end].strip(),
                "start_offset": original_start,
                "end_offset": original_end,
                "confidence_score": similarity * 0.6  # Cap fuzzy matches at 0.6
            }
    
    return best_match


def _extract_meaningful_phrases(text: str, min_length: int = 3) -> List[str]:
    """Extract meaningful phrases of min_length or more words."""
    words = text.split()
    phrases = []
    
    for i in range(len(words) - min_length + 1):
        phrase = ' '.join(words[i:i + min_length])
        if len(phrase) > 10:  # Skip very short phrases
            phrases.append(phrase)
    
    return phrases


def _extract_key_terms(text: str) -> List[str]:
    """Extract key terms (simplified - could use NLP libraries for better results)."""
    # Simple approach: extract longer words and phrases
    words = re.findall(r'\b[A-Za-z]{4,}\b', text.lower())
    
    # Filter out common words
    common_words = {'that', 'this', 'with', 'from', 'they', 'were', 'been', 'have', 'will', 'would', 'could', 'should'}
    key_terms = [word for word in words if word not in common_words]
    
    return key_terms


def _split_into_sentences(text: str) -> List[str]:
    """Split text into sentences."""
    # Simple sentence splitting
    sentences = re.split(r'[.!?]+', text)
    return [s.strip() for s in sentences if s.strip()]


def _create_overlapping_chunks(text: str, chunk_size: int, overlap: int = 50) -> List[Tuple[int, str]]:
    """Create overlapping chunks of text with their start positions."""
    chunks = []
    step = chunk_size - overlap
    
    for i in range(0, len(text), step):
        chunk = text[i:i + chunk_size]
        if chunk.strip():
            chunks.append((i, chunk))
    
    return chunks


def _map_to_original_position(position: int, normalized_text: str, original_text: str) -> int:
    """Map position from normalized text back to original text (approximate)."""
    # This is a simplified mapping - in practice, you'd want to maintain a mapping
    # during normalization for exact positioning
    
    # For now, use a simple ratio-based approach
    if len(normalized_text) == 0:
        return 0
        
    ratio = position / len(normalized_text)
    return int(ratio * len(original_text))


def align_evidence_snippets(claims: List[Dict], sources: List[Dict], evidence: List[Dict]) -> List[Dict]:
    """
    Update evidence entries with aligned snippets from sources.
    
    Args:
        claims: List of claim objects with claim_id and text
        sources: List of source objects with source_id and raw_text
        evidence: List of evidence objects linking claims to sources
        
    Returns:
        Updated evidence list with snippet alignment data
    """
    # Create lookup maps
    claim_map = {c["claim_id"]: c for c in claims}
    source_map = {s["source_id"]: s for s in sources}
    
    # Process each evidence item
    updated_evidence = []
    
    for ev in evidence:
        claim_id = ev.get("claim_id")
        source_id = ev.get("source_id")
        
        claim = claim_map.get(claim_id)
        source = source_map.get(source_id)
        
        if not claim or not source:
            # Keep original evidence if claim/source not found
            updated_evidence.append(ev)
            continue
            
        claim_text = claim.get("text", "")
        source_text = source.get("raw_text", "")
        
        # Find best matching snippet
        alignment = find_best_snippet_match(claim_text, source_text)
        
        # Update evidence with alignment data
        updated_ev = ev.copy()
        updated_ev.update({
            "snippet": alignment["snippet"],
            "start_offset": alignment["start_offset"],
            "end_offset": alignment["end_offset"],
            "alignment_confidence": alignment["confidence_score"]
        })
        
        updated_evidence.append(updated_ev)
    
    return updated_evidence