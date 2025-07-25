from util import run_llm_on_description, parse_json_response, run_neo4j_save, PROMPT_TEMPLATE, strip_markdown, validate_output, to_cypher
import json

def process_description(opis, llm, json_save_path=None):
    response_text = run_llm_on_description(opis, llm)
    print(response_text) 

    if json_save_path:
        with open(json_save_path, 'w', encoding='utf-8') as f:
            f.write(response_text)

    try:
        data = json.loads(response_text)
    except json.JSONDecodeError as e:
        print("Błąd dekodowania JSON:", e)
        return

    queries = to_cypher(data)
    run_neo4j_save(queries)

def repl_mode(llm):
    while True:
        opis = input("Wprowadź nowy opis wodociągu (lub naciśnij Enter, aby zakończyć): ")
        if not opis:
            break
        process_description(opis, llm)
