from neo4j import GraphDatabase
from typing import List, Dict, Any

class Neo4jEpanetService:
    def __init__(self, url, user, password):
        if not url or not user:
            raise ValueError("Brak danych połączenia do Neo4j. Zaloguj się najpierw.")
        self.driver = GraphDatabase.driver(url, auth=(user, password))

    def close(self):
        self.driver.close()

    def get_distinct_labels(self) -> List[str]:
        with self.driver.session() as session:
            result = session.run("CALL db.labels()")
            labels = [record["label"] for record in result]
            return [l for l in labels if not l.startswith("_")]

    def get_network_data(self, mapping: Dict[str, str]) -> Dict:
        junction_labels = [k for k, v in mapping.items() if v.lower() == 'junction']
        tank_labels = [k for k, v in mapping.items() if v.lower() == 'tank']
        reservoir_labels = [k for k, v in mapping.items() if v.lower() == 'reservoir']
        pipe_labels = [k for k, v in mapping.items() if v.lower() == 'pipe']

        nodes_data = []
        edges_data = []

        with self.driver.session() as session:
            all_node_labels = junction_labels + tank_labels + reservoir_labels
            if all_node_labels:
                nodes_data = session.read_transaction(
                    self._fetch_nodes, junction_labels, tank_labels, reservoir_labels
                )
            
            if pipe_labels:
                edges_data = session.read_transaction(
                    self._fetch_pipes_as_nodes, pipe_labels
                )

        existing_node_ids = {n['id'] for n in nodes_data}
        
        for edge in edges_data:
            for endpoint in ['from', 'to']:
                node_id = edge[endpoint]
                
                if node_id not in existing_node_ids:
                    raw_node = edge.get(f"_raw_node_{endpoint}")
                    
                    if raw_node:
                        new_node = dict(raw_node)
                        new_node['id'] = node_id
                        new_node['label'] = 'junction' 
                        nodes_data.append(new_node)
                        existing_node_ids.add(node_id)
        
        for edge in edges_data:
            edge.pop('_raw_node_from', None)
            edge.pop('_raw_node_to', None)

        return {
            "nodes": nodes_data,
            "edges": edges_data
        }

    @staticmethod
    def _get_consistent_id(node):
        if hasattr(node, 'get'):
            val = node.get('id') or node.get('Id') or node.get('ID')
            if val: return str(val)
            
            val = node.get('app_id')
            if val: return str(val)
            
        return str(node.id)

    @staticmethod
    def _fetch_nodes(tx, j_labels, t_labels, r_labels):
        all_labels = j_labels + t_labels + r_labels
        if not all_labels: return []
        
        label_filter = " OR ".join([f"n:`{label}`" for label in all_labels])
        query = f"MATCH (n) WHERE {label_filter} RETURN n, labels(n) as labels"
        
        results = []
        for record in tx.run(query):
            node = record["n"]
            labels = record["labels"]
            props = dict(node)
            
            epanet_type = "junction"
            for l in labels:
                if l in r_labels: epanet_type = "reservoir"; break
                if l in t_labels: epanet_type = "tank"; break
            
            props["label"] = epanet_type
            props["id"] = Neo4jEpanetService._get_consistent_id(node)

            results.append(props)
        return results

    @staticmethod
    def _fetch_pipes_as_nodes(tx, pipe_labels):
        if not pipe_labels: return []
        
        p_filter = " OR ".join([f"p:`{label}`" for label in pipe_labels])
        
        query = f"""
        MATCH (a)-[]-(p)-[]-(b)
        WHERE ({p_filter}) AND id(a) < id(b)
        RETURN p, a, b
        """
        
        results = []
        for record in tx.run(query):
            pipe_node = record["p"]
            node_a = record["a"]
            node_b = record["b"]
            
            props = dict(pipe_node)
            
            id_a = Neo4jEpanetService._get_consistent_id(node_a)
            id_b = Neo4jEpanetService._get_consistent_id(node_b)
            
            props["from"] = id_a
            props["to"] = id_b
            props["label"] = "pipe"
            
            props["id"] = Neo4jEpanetService._get_consistent_id(pipe_node)
            if props["id"] == str(pipe_node.id): 
                 props["id"] = f"Link_{id_a}_{id_b}"

            props["_raw_node_from"] = dict(node_a)
            props["_raw_node_from"]["id"] = id_a 
            
            props["_raw_node_to"] = dict(node_b)
            props["_raw_node_to"]["id"] = id_b

            results.append(props)
        return results