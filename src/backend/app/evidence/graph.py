from typing import Any, Dict, List, Optional
import networkx as nx
from app.evidence.schema import EvidenceGraphData, EvidenceGraphEdge, EvidenceGraphNode, EvidenceItem

class EvidenceGraphBuilder:
    def __init__(self, case_id: str, media_name: str, media_type: str):
        self.case_id = case_id
        self.media_name = media_name
        self.media_type = media_type
        self.graph = nx.DiGraph()

        # Root Case node
        self.case_node_id = f"case_{case_id}"
        self.graph.add_node(
            self.case_node_id,
            label=f"Case: {case_id[:8]}",
            type="case",
            severity="info",
            details={"case_id": case_id}
        )

        # Media node
        self.media_node_id = f"media_{case_id}"
        self.graph.add_node(
            self.media_node_id,
            label=f"Media: {media_name}",
            type="media",
            severity="info",
            details={"type": media_type, "filename": media_name}
        )
        self.graph.add_edge(self.case_node_id, self.media_node_id, relation="contains_media")

    def add_model_node(self, model_name: str, model_id: str, version: str = "1.0.0", role: str = "classifier") -> str:
        node_id = f"model_{model_id.replace('/', '_').replace('-', '_')}"
        if not self.graph.has_node(node_id):
            self.graph.add_node(
                node_id,
                label=f"Model: {model_name}",
                type="model",
                severity="info",
                details={"model_id": model_id, "version": version, "role": role}
            )
            self.graph.add_edge(self.case_node_id, node_id, relation="utilizes_model")
        return node_id

    def add_frame_node(self, frame_num: int, timestamp: Optional[float] = None) -> str:
        node_id = f"frame_{self.case_id}_{frame_num}"
        if not self.graph.has_node(node_id):
            self.graph.add_node(
                node_id,
                label=f"Frame #{frame_num}",
                type="frame",
                severity="info",
                details={"frame_number": frame_num, "timestamp": timestamp}
            )
            self.graph.add_edge(self.media_node_id, node_id, relation="has_frame")
        return node_id

    def add_face_node(self, frame_num: Optional[int], face_idx: int, bbox: List[int], confidence: float) -> str:
        node_id = f"face_{self.case_id}_{frame_num or 0}_{face_idx}"
        if not self.graph.has_node(node_id):
            self.graph.add_node(
                node_id,
                label=f"Face #{face_idx + 1}" + (f" (F{frame_num})" if frame_num is not None else ""),
                type="face",
                severity="info",
                details={"bbox": bbox, "confidence": confidence, "frame": frame_num}
            )
            parent_id = self.add_frame_node(frame_num) if frame_num is not None else self.media_node_id
            self.graph.add_edge(parent_id, node_id, relation="detects_face")
        return node_id

    def add_prediction_node(
        self,
        parent_node_id: str,
        model_node_id: str,
        fake_prob: float,
        predicted_label: str
    ) -> str:
        node_id = f"pred_{parent_node_id}_{model_node_id}"
        severity = "critical" if fake_prob >= 0.85 else ("high" if fake_prob >= 0.70 else ("medium" if fake_prob >= 0.45 else "low"))
        if not self.graph.has_node(node_id):
            self.graph.add_node(
                node_id,
                label=f"{predicted_label} ({fake_prob:.1%})",
                type="prediction",
                severity=severity,
                details={"fake_probability": fake_prob, "label": predicted_label}
            )
            self.graph.add_edge(parent_node_id, node_id, relation="evaluated_as")
            self.graph.add_edge(model_node_id, node_id, relation="inferred_by")
        return node_id

    def add_explanation_node(self, prediction_node_id: str, explanation_url: str, description: str) -> str:
        node_id = f"expl_{prediction_node_id}"
        if not self.graph.has_node(node_id):
            self.graph.add_node(
                node_id,
                label="Attention Heatmap",
                type="explanation",
                severity="info",
                details={"url": explanation_url, "description": description}
            )
            self.graph.add_edge(prediction_node_id, node_id, relation="explained_by")
        return node_id

    def add_evidence_item(self, item: EvidenceItem) -> str:
        node_id = f"ev_{item.id}"
        self.graph.add_node(
            node_id,
            label=f"{item.title}",
            type="evidence",
            severity=item.severity,
            details={
                "id": item.id,
                "category": item.category,
                "confidence": item.confidence,
                "description": item.description,
                "model_name": item.model_name
            }
        )
        if item.frame_number is not None:
            frame_node = self.add_frame_node(item.frame_number, item.timestamp)
            self.graph.add_edge(frame_node, node_id, relation="supports_evidence")
        else:
            self.graph.add_edge(self.media_node_id, node_id, relation="supports_evidence")
        return node_id

    def add_conclusion_node(self, label: str, confidence: float, risk_level: str) -> str:
        node_id = f"conclusion_{self.case_id}"
        self.graph.add_node(
            node_id,
            label=f"Verdict: {label.replace('_', ' ').title()} ({confidence:.0%})",
            type="conclusion",
            severity=risk_level,
            details={"verdict": label, "confidence": confidence, "risk_level": risk_level}
        )
        # Link all evidence items to conclusion
        for node, data in list(self.graph.nodes(data=True)):
            if data.get("type") in ("evidence", "prediction"):
                self.graph.add_edge(node, node_id, relation="leads_to")
        return node_id

    def add_signal_node(self, signal_name: str, score: float, category: str) -> str:
        node_id = f"sig_{self.case_id}_{category}_{signal_name}"
        severity = "high" if score >= 0.65 else ("medium" if score >= 0.35 else "low")
        if not self.graph.has_node(node_id):
            self.graph.add_node(
                node_id,
                label=f"Signal: {signal_name} ({score:.2f})",
                type="signal",
                severity=severity,
                details={"category": category, "score": score}
            )
            self.graph.add_edge(self.media_node_id, node_id, relation="exhibits_signal")
        return node_id

    def to_dict(self) -> Dict[str, Any]:
        nodes = []
        for n, data in self.graph.nodes(data=True):
            nodes.append({
                "id": n,
                "label": data.get("label", n),
                "type": data.get("type", "generic"),
                "severity": data.get("severity", "info"),
                "details": data.get("details", {})
            })
        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "source": u,
                "target": v,
                "relation": data.get("relation", "connected_to")
            })
        return {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "nodes": nodes,
            "edges": edges
        }