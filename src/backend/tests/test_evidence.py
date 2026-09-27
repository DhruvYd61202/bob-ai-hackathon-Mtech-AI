import pytest
from app.evidence.builder import EvidenceBuilder
from app.evidence.graph import EvidenceGraphBuilder

def test_evidence_builder():
    builder = EvidenceBuilder("case-12345")
    builder.add_metadata_evidence(
        title="Test Metadata",
        description="EXIF detected",
        severity="info",
        confidence=0.8
    )
    builder.add_visual_evidence(
        title="Test ELA",
        description="Compression anomaly",
        severity="medium",
        confidence=0.75
    )
    builder.add_face_evidence(
        title="Test Face",
        description="Asymmetry detected",
        severity="high",
        confidence=0.85
    )

    items = builder.get_evidence()
    assert len(items) == 3
    collection = builder.get_collection()
    assert collection.total_count == 3
    assert collection.severity_breakdown["high"] == 1
    assert collection.severity_breakdown["medium"] == 1
    assert collection.severity_breakdown["info"] == 1

def test_evidence_graph_builder():
    graph = EvidenceGraphBuilder("case-12345", "test.mp4", "video")
    graph.add_signal_node("test_signal", 0.72, "visual")
    builder = EvidenceBuilder("case-12345")
    item = builder.add_visual_evidence("Artifact", "Noise discrepancy", "medium", 0.7)
    graph.add_evidence_item(item)
    graph.add_conclusion_node("potentially_manipulated", 0.82, "high")

    data = graph.to_dict()
    assert data["total_nodes"] >= 4
    assert data["total_edges"] >= 3
    node_types = {n["type"] for n in data["nodes"]}
    assert "case" in node_types
    assert "media" in node_types
    assert "conclusion" in node_types
