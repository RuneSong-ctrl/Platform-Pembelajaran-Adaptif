import pytest
from app.services.blockchain_service import (
    generate_block_hash,
    generate_transaction_id,
    calculate_sha256
)

def test_deterministic_block_hashing():
    genesis_prev = "0000000000000000000000000000000000000000000000000000000000000000"
    issued_at = "2026-08-15T10:30:00.000Z"
    
    hash1 = generate_block_hash(1, genesis_prev, "user_ayu_01", "KOG-2026-X7A9", 94.5, issued_at)
    hash2 = generate_block_hash(1, genesis_prev, "user_ayu_01", "KOG-2026-X7A9", 94.5, issued_at)
    
    assert hash1 == hash2
    assert len(hash1) == 64

def test_tamper_detection():
    genesis_prev = "0000000000000000000000000000000000000000000000000000000000000000"
    issued_at = "2026-08-15T10:30:00.000Z"
    
    original_hash = generate_block_hash(1, genesis_prev, "user_ayu_01", "KOG-2026-X7A9", 94.5, issued_at)
    tampered_hash = generate_block_hash(1, genesis_prev, "user_ayu_01", "KOG-2026-X7A9", 100.0, issued_at) # Nilai diubah ke 100
    
    assert original_hash != tampered_hash

def test_transaction_id_format():
    block_hash = "a" * 64
    tx_id = generate_transaction_id(block_hash, "KOG-2026-X7A9")
    assert tx_id.startswith("0x")
    assert len(tx_id) == 42 # "0x" + 40 chars
