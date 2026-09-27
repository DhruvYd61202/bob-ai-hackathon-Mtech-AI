import tempfile
from pathlib import Path
from app.evidence.chain_of_custody import ChainOfCustodyLedger

def test_chain_of_custody_lifecycle():
    ledger = ChainOfCustodyLedger(case_id="case-test-001", media_sha256="deadbeef" * 8)
    
    # 1. Ingestion
    e1 = ledger.record_ingestion("video.mp4", 1048576, "deadbeef" * 8, "md5digest")
    assert e1.event_type == "INGESTION"
    assert e1.previous_event_hash == "GENESIS_BLOCK"
    assert e1.event_signature is not None

    # 2. Preprocessing
    e2 = ledger.record_preprocessing("Sampled 10 frames at 1fps", {"frames": 10})
    assert e2.event_type == "PREPROCESSING"
    assert e2.previous_event_hash == e1.event_signature

    # 3. Model execution
    e3 = ledger.record_model_execution("ViT-Base", "vit-model-id", "cpu", 150.0, {"fake_prob": 0.85})
    assert e3.previous_event_hash == e2.event_signature

    # 4. Fusion
    e4 = ledger.record_fusion("potentially_manipulated", 0.88, "high", {"visual": 0.85})
    assert e4.previous_event_hash == e3.event_signature

    # 5. Bob event
    e5 = ledger.record_bob_event("unavailable", "ibm-bob-forensic-v1", {"reason": "unconfigured"})
    assert e5.previous_event_hash == e4.event_signature

    # 6. Verify integrity
    assert ledger.verify_integrity() is True
    assert len(ledger.events) == 5

def test_chain_of_custody_tamper_detection():
    ledger = ChainOfCustodyLedger(case_id="case-test-002")
    ledger.record_ingestion("file.jpg", 5000, "hash1", "md51")
    ledger.record_preprocessing("Cropped face", {})
    assert ledger.verify_integrity() is True

    # Tamper with an event description
    ledger.events[0].description = "Tampered description"
    assert ledger.verify_integrity() is False

def test_chain_of_custody_save_and_load():
    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = Path(tmpdir) / "custody.json"
        ledger = ChainOfCustodyLedger(case_id="case-save-load", media_sha256="testhash")
        ledger.record_ingestion("test.png", 1234, "testhash", "md5")
        ledger.save_to_file(file_path)

        loaded = ChainOfCustodyLedger.load_from_file(file_path)
        assert loaded.case_id == "case-save-load"
        assert loaded.media_sha256 == "testhash"
        assert len(loaded.events) == 1
        assert loaded.verify_integrity() is True
