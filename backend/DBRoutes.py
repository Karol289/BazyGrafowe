

from fastapi import APIRouter
from pydantic import BaseModel
from neo4j import GraphDatabase

import json

from models.CurrentModel import GetModel

databaseRouter = APIRouter(prefix="/db", tags=["db"])


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

def to_cypher(data, pending: bool = False):
    queries = []

    # Generowanie nodów
    for node in data["nodes"]:
        label = node.get("label", "")  
        app_id = node.get("id", "")
        
        props = ", ".join(
            f'{k}: "{escape_str(v)}"' if isinstance(v, str) else f'{k}: {v}'
            for k, v in node.items() if k not in {"label", "id"}
        )
        
        
        # Czy "" na dole sa potrzebne?
        if props:
            props += f', app_id: "{app_id}"'
        else:
            props = f'app_id: "{app_id}"'
        
        if pending:
            props += ", pending: true"
        
        queries.append(f'CREATE (:{label} {{ {props} }})')

    # Generowanie krawędzi
    for edge in data["edges"]:
        fromm = edge.get("from")
        to = edge.get("to")
        label = edge.get("label", "")

        props = ", ".join(
            f'{k}: "{escape_str(v)}"' if isinstance(v, str) else f'{k}: {v}'
            for k, v in edge.items() if k not in ("from", "to", "label")
        )
        queries.append(
            f'MATCH (a {{app_id: "{fromm}"}}), (b {{app_id: "{to}"}}) '
            f'CREATE (a)-[:{label} {{ {props} }}]->(b)'
        )

    return queries

def run_neo4j_save(data):
    
    global db_user, db_password, db_url
    
    try:
        queries = to_cypher(data, pending= True)
        driver = GraphDatabase.driver(str(db_url), auth=(str(db_user), str(db_password)))
        with driver.session() as session:
            for q in queries:
                session.run(q)
        return True, "Dane zapisane do Neo4j."
    except Exception as e:
        return False, f"Nie udało się zapisać do Neo4j: {e}"

@databaseRouter.post("/ApplyToDB")
async def ApplyToDB():
    
    nodesAndEdges = GetModel().history.GetNodesAndEdges()


    run_neo4j_save(nodesAndEdges)


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
