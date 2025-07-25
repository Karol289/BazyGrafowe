import json
from neo4j import GraphDatabase

MODEL_PATH = "models/mistral-7b-instruct-v0.2.Q5_K_M.gguf"
PROMPT_TEMPLATE = """
<s>[INST]
Na podstawie podanego tekstu, wygeneruj strukturę grafu w formacie czystego JSON, **bez żadnego formatowania markdown ani dodatkowych opisów**.
Dla każdego węzła (elementu sieci):
- \"id\": unikalna nazwa identyfikująca element,
- \"type\": typ obiektu (np. \"Zawór\", \"Zbiornik\", \"Hydrant\", \"Stacja pomp\"),

Dla każdej relacji (połączenia między elementami), np. \"Rura\":
- \"from\": id źródłowego elementu,
- \"to\": id docelowego elementu,
- dodatkowe pola, jeśli informacje są obecne w tekście, np. \"diameter\",\"length\".

Odległości i rozmiary wyrażaj w metrach. Używaj tylko jednostek SI.
Wygeneruj tylko i wyłącznie **JEDEN OBIEKT JSON** zawierający dwa klucze: `nodes` i `edges`.
Bez żadnych komentarzy, bez markdowna.
[/INST]

Tekst:
"{opis}"

</s>
{{
"""

NEO4J_URL = "bolt://localhost:7687"
NEO4J_WEB_URL = "http://localhost:7474/browser/"
NEO4J_USER = "neo4j"
NEO4J_PASS = "12345678"

def to_cypher(data):
    queries = []
    for node in data["nodes"]:
        queries.append(f'CREATE (:{node["type"]} {{id: "{node["id"]}"}})')
    for edge in data["edges"]:
        queries.append(
            f'MATCH (a {{id: "{edge["from"]}"}}), (b {{id: "{edge["to"]}"}}) '
            f'CREATE (a)-[:PIPE]->(b)'
        )
    return queries


#Powielona funkcja nieużywana (ale może być)
def save_to_neo4j(queries):
    try:
        driver = GraphDatabase.driver(NEO4J_URL, auth=(NEO4J_USER, NEO4J_PASS))
        with driver.session() as session:
            for q in queries:
                session.run(q)
        print("Dane zapisane do Neo4j.")
    except Exception as e:
        print("Nie udało się zapisać do Neo4j:", e)

def strip_markdown(text):
    text = text.strip()
    text_lines = text.splitlines()
    if text_lines and text_lines[0].strip().startswith('```'):
        return '\n'.join(text_lines[1:-1])
    return text

def validate_output(text):
    lines = text.splitlines()
    original = text
    while lines:
        try:
            json.loads('\n'.join(lines))
            return '\n'.join(lines)
        except Exception:
            lines = lines[:-1]
    return original

def run_llm_on_description(opis, llm):
    prompt = PROMPT_TEMPLATE.format(opis=opis)
    output = llm(prompt, max_tokens=1024, stop=[], echo=False)
    response_text = "{" + output["choices"][0]["text"]

    # Cut off after the first complete JSON object (matching braces)
    def cut_after_json(text):
        brace_count = 0
        start = None
        for i, c in enumerate(text):
            if c == '{':
                if start is None:
                    start = i
                brace_count += 1
            elif c == '}':
                brace_count -= 1
                if brace_count == 0 and start is not None:
                    return text[:i+1]
        return text  # fallback if not matched

    # print(response_text)
    response_text = cut_after_json(response_text)
    response_text = strip_markdown(response_text)
    response_text = validate_output(response_text)

    # Pretty-print the JSON if possible
    try:
        obj = json.loads(response_text)
        response_text = json.dumps(obj, indent=4, ensure_ascii=False)
    except Exception:
        pass

    return response_text

def parse_json_response(response_text):
    try:
        data = json.loads(response_text)
        return data, None
    except json.JSONDecodeError as e:
        return None, str(e)

def run_neo4j_save(data):
    try:
        queries = to_cypher(data)
        driver = GraphDatabase.driver(NEO4J_URL, auth=(NEO4J_USER, NEO4J_PASS))
        with driver.session() as session:
            for q in queries:
                session.run(q)
        return True, "Dane zapisane do Neo4j."
    except Exception as e:
        return False, f"Nie udało się zapisać do Neo4j: {e}"
