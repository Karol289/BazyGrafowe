

from fastapi import APIRouter
from pydantic import BaseModel
from neo4j import GraphDatabase

import json

from models.CurrentModel import GetModel

from typing import List, Dict, Optional
from Epanet.NeoService import Neo4jEpanetService


import os
import oopnet as on
from Epanet.network import createNetwork 
from Epanet.NeoService import Neo4jEpanetService

databaseRouter = APIRouter(prefix="/db", tags=["db"])
PATH_TO_SAVE_CYPHER = "./Data/Cypher"

db_user : str | None = None
db_password : str | None = None
db_url : str | None = None

class LoginModel(BaseModel):
    user: str
    password: str
    url: str


@databaseRouter.get("/loginInfo")
async def getLoginInfo():
    
    global db_user, db_password, db_url
    
    return LoginModel(
    user=str(db_user or ""),
    password=str(db_password or ""),
    url=str(db_url or "")
)


@databaseRouter.post("/login")
async def login(input: LoginModel):
     
    
     
    user = input.user
    password = input.password
    url = input.url
     
    # url = "bolt://localhost:7687" 
    # user = "neo4j"
    # password = "wincent123"
     
    driver = None
     
    try:
        driver = GraphDatabase.driver(url, auth= (user, password))
    except:
        return {"isValid": False, "message": "Invalid connection data"}
    
    try:
        driver.verify_connectivity()
    except:
        return {"isValid": False, "message": "Connection verification error"}
    
    try:
        driver.verify_authentication()
    except:
        return {"isValid": False, "message": "Authentication verification error"}

    global db_user, db_password, db_url

    db_user = user
    db_password = password
    db_url = url
    
    return {"isValid": True, "message": "Verification ok"}


string = "CREATE (:{label})"

def escape_str(s):
    """Escape cudzysłowy w stringach dla Neo4j."""
    return s.replace('"', '\\"')


def getNodeCypher(node, pending):
    
    label = node.get("label", node.get("Label", ""))  
    app_id = node.get("id", node.get("Id", ""))
    
    props = ", ".join(
        f'{k}: "{escape_str(v)}"' if isinstance(v, str) else f'{k}: {v}'
        for k, v in node.items() if k not in {"label", "id"} and v is not None
    )
    
    
    # Czy "" na dole sa potrzebne?
    if props:
        props += f', app_id: "{app_id}"'
    else:
        props = f'app_id: "{app_id}"'
    
    if pending:
        props += ", pending: true"
    
    return f'CREATE (:{label} {{ {props} }})'

def getEdgeCypher(edge, pending):
    fromm = edge.get("from")
    to = edge.get("to")
    label = edge.get("label", edge.get("Label", ""))  

    props = ", ".join(
        f'{k}: "{escape_str(v)}"' if isinstance(v, str) else f'{k}: {v}'
        for k, v in edge.items() if k not in ("from", "to", "label") and v is not None
    )
    query = (
        f'MATCH (a {{app_id: "{fromm}"}}), (b {{app_id: "{to}"}}) '
        f'CREATE (a)-[:{label} {{ {props} }}]->(b)'
    )
    
    return query


def getEdgeAsNodeCypher(edge, pending):
    fromm = edge.get("from")
    to = edge.get("to")
    label = edge.get("label", edge.get("Label", ""))  
    props = ", ".join(
        f'{k}: "{escape_str(v)}"' if isinstance(v, str) else f'{k}: {v}'
        for k, v in edge.items() if k not in ("from", "to", "label") and v is not None
    )
    
    if props:
        props += f', app_id: "{fromm}_{to}"'
    else:
        props = f'app_id: "{fromm}_{to}"'
        
    if pending:
        props += ", pending: true"
    
    queries = []
    
    queries.append(
        f'CREATE (:{label} {{ {props} }})'
    )
    queries.append(
        f'MATCH (a {{app_id: "{fromm}"}}), (b {{app_id: "{fromm}_{to}"}}) '
        f'CREATE (a)-[:Connects_To {{ }}]->(b)'
    )
    queries.append( 
        f'MATCH (a {{app_id: "{fromm}_{to}"}}), (b {{app_id: "{to}"}}) '
        f'CREATE (a)-[:Connects_To {{ }}]->(b)'
    )
    
    return queries


def to_cypher(data, pending: bool = False):
    queries = []

    # Generowanie nodów
    for node in data["nodes"]:
        queries.append(getNodeCypher(node, pending))

    # Generowanie krawędzi
    for edge in data["edges"]:
        queries.append(getEdgeCypher(edge, pending))

    return queries

def to_cypher_transport_nodes(data, pending: bool = False):
    queries = []
    
    # Generowanie nodów
    for node in data["nodes"]:
        queries.append(getNodeCypher(node, pending))
        
    # Generowanie krawędzi
    for edge in data["edges"]:
        label = str.lower(edge.get("label", edge.get("Label", "")))
        
        if label in ("pipe", "pump", "valve"):
            queries += getEdgeAsNodeCypher(edge, pending)
        else:
            queries.append(getEdgeCypher(edge, pending))

    return queries
    
    

def run_neo4j_save(data, linksAsTransportNodes: bool):
    
    global db_user, db_password, db_url
    
    try:
        queries = []
        if linksAsTransportNodes:
            queries = to_cypher_transport_nodes(data, pending=True)
        else:
            queries = to_cypher(data, pending= True) 
        driver = GraphDatabase.driver(str(db_url), auth=(str(db_user), str(db_password)))
        with driver.session() as session:
            for q in queries:
                session.run(q)
        return True, "Dane zapisane do Neo4j."
    except Exception as e:
        return False, f"Nie udało się zapisać do Neo4j: {e}"

class ApplyToDb(BaseModel):
    linksAsTransportNodes: bool = False
    useMappedModel: bool =  False

@databaseRouter.post("/ApplyToDB")
async def ApplyToDB(options : ApplyToDb):
    
    if options.useMappedModel:
        nodesAndEdges = GetModel().history.GetMappedModel()
    else:
        nodesAndEdges = GetModel().history.GetNodesAndEdges()
        
    nodesAndEdgesNormalized = {k.lower(): v for k, v in nodesAndEdges.items()}

    run_neo4j_save(nodesAndEdgesNormalized, options.linksAsTransportNodes)


@databaseRouter.post("/CommitDB")
async def CommitDB():
    try:
        driver = GraphDatabase.driver(str(db_url), auth=(str(db_user), str(db_password)))
        with driver.session() as session:
            session.run("MATCH (n {pending: true}) REMOVE n.pending")
            session.run("MATCH ()-[r {pending: true}]->() REMOVE r.pending")
    except:
        pass

@databaseRouter.post("/RollbackDB")
async def RollbackDB():
    try:
        driver = GraphDatabase.driver(str(db_url), auth=(str(db_user), str(db_password)))
        with driver.session() as session:
            session.run("MATCH (n {pending: true}) DETACH DELETE n")
            session.run("MATCH ()-[r {pending: true}]->() DELETE r")
    except:
        pass    





class MapNetworkRequest(BaseModel):
    mapping: Dict[str, str]

@databaseRouter.get("/labels")
async def get_neo4j_labels():
    """
    Zwraca listę dostępnych labeli w bazie, aby React wiedział o co pytać.
    """
    global db_user, db_password, db_url

    if not db_url or not db_user:
        return {"error": "Not logged in", "labels": []}

    try:
        service = Neo4jEpanetService(db_url, db_user, db_password)
        labels = service.get_distinct_labels()
        service.close()
        return {"labels": labels}
    except Exception as e:
        return {"error": str(e), "labels": []}


@databaseRouter.post("/getMappedNetwork")
async def get_mapped_network(request: MapNetworkRequest):
    """
    Pobiera dane z Neo4j na podstawie mapowania i zwraca JSON 
    gotowy do wysłania do endpointu /epanet/create.
    """
    global db_user, db_password, db_url
    
    if not db_url or not db_user:
        return {"error": "Not logged in", "nodes": [], "edges": []}

    try:
        service = Neo4jEpanetService(db_url, db_user, db_password)
        data = service.get_network_data(request.mapping)
        service.close()
        
        # Zwracamy strukturę { "nodes": [...], "edges": [...] }
        return data
        
    except Exception as e:
        # Możesz tu rzucić HTTPException, jeśli wolisz
        return {"error": str(e), "nodes": [], "edges": []}
    
    
    
    
    
    
chatsPath = "backend/Data/Networks" 

class CreateEpanetFromDBRequest(BaseModel):
    title: str
    graphAlgoritm: str 
    mapping: dict

@databaseRouter.post("/createEpanet")
async def createEpanetFromDB(request: CreateEpanetFromDBRequest):
    global db_user, db_password, db_url
    
    if not db_url or not db_user:
        return {"status": "error", "message": "Not logged in to Neo4j"}

    networkJson = {}
    
    try:
        service = Neo4jEpanetService(db_url, db_user, db_password)
        networkJson = service.get_network_data(request.mapping)
        service.close()
        
        if not networkJson["nodes"]:
             return {"status": "error", "message": "Neo4j returned 0 nodes. Check mapping."}

        network = createNetwork(request.title, networkJson, request.graphAlgoritm)

        os.makedirs(chatsPath, exist_ok=True)
        output_path = os.path.join(chatsPath, f"{request.title}.inp")
        
        #on.write(network, output_path)
        network.write(output_path)
        
        return {
            "status": "success", 
            "path": output_path,
            "stats": {
                "nodes": len(networkJson.get("nodes", [])),
                "edges": len(networkJson.get("edges", []))
            }
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}