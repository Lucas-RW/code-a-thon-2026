import re
import logging

logger = logging.getLogger(__name__)

def slugify(text: str) -> str:
    """Convert text to a lowercase alphanumeric slug with underscores."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '_', text)
    return text.strip('_')

def update_skill_graph_for_interest(user_skill_graph: dict, opportunity_id: str, skills: list[str]) -> dict:
    """
    Mutate and return the user's skill graph by ensuring skill nodes
    and edges from the opportunity exist.
    """
    if "nodes" not in user_skill_graph:
        user_skill_graph["nodes"] = []
    if "edges" not in user_skill_graph:
        user_skill_graph["edges"] = []

    nodes = user_skill_graph["nodes"]
    edges = user_skill_graph["edges"]
    
    existing_node_ids = {node["id"] for node in nodes}
    existing_edge_keys = {(edge["source"], edge["target"], edge["relation"]) for edge in edges}

    opp_node_id = f"opp:{opportunity_id}"

    for skill in skills:
        slug = slugify(skill)
        skill_node_id = f"skill:{slug}"

        if skill_node_id not in existing_node_ids:
            nodes.append({
                "id": skill_node_id,
                "label": skill,
                "type": "skill",
                "group": "technical"  # Defaulting to technical for now
            })
            existing_node_ids.add(skill_node_id)

        edge_key = (opp_node_id, skill_node_id, "develops")
        if edge_key not in existing_edge_keys:
            edges.append({
                "source": opp_node_id,
                "target": skill_node_id,
                "relation": "develops"
            })
            existing_edge_keys.add(edge_key)

    return user_skill_graph

def update_network_graph_for_interest(user_network_graph: dict, building_doc: dict, opportunity_doc: dict) -> dict:
    """
    Mutate and return the user's network graph by ensuring building
    and opportunity nodes, and their connecting edges, exist.
    """
    if "nodes" not in user_network_graph:
        user_network_graph["nodes"] = []
    if "edges" not in user_network_graph:
        user_network_graph["edges"] = []

    nodes = user_network_graph["nodes"]
    edges = user_network_graph["edges"]

    existing_node_ids = {node["id"] for node in nodes}
    existing_edge_keys = {(edge["source"], edge["target"], edge["relation"]) for edge in edges}

    building_id = str(building_doc.get("_id", building_doc.get("id")))
    opportunity_id = str(opportunity_doc.get("_id", opportunity_doc.get("id")))

    building_node_id = f"bldg:{building_id}"
    opp_node_id = f"opp:{opportunity_id}"

    if building_node_id not in existing_node_ids:
        nodes.append({
            "id": building_node_id,
            "type": "building"
        })
        existing_node_ids.add(building_node_id)

    if opp_node_id not in existing_node_ids:
        nodes.append({
            "id": opp_node_id,
            "type": "opportunity"
        })
        existing_node_ids.add(opp_node_id)

    edge_key = (building_node_id, opp_node_id, "has_opportunity")
    if edge_key not in existing_edge_keys:
        edges.append({
            "source": building_node_id,
            "target": opp_node_id,
            "relation": "has_opportunity"
        })
        existing_edge_keys.add(edge_key)

    return user_network_graph
