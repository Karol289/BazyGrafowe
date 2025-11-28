
import oopnet as on
import networkx as nx



def createNetwork(title, json, algoritm):
    network = on.Network()
    network.title = title
    
    positions = generatePositions(json['nodes'], json['edges'], algoritm)
    
    networkElements = json["nodes"] + json["edges"]
    
    for element in networkElements:
        
        element = normalizeDict(element)
        element = remove_null_keys(element)
        
        label = str.lower(element["label"])
        
        
        #Nodes
        if label  ==  "junction":
            addJunction(network, element, positions)
        elif label == "tank":
            addTank(network, element, positions)
        elif label == "reservoir":
            addReservoir(network, element, positions)
            
        
        #ids = findFromAndTo(networkElements, element['id'])
            
        #Links
        if label  ==  "pipe":
            addPipe(network, element)
        # elif label == "valve":
        #     addValve(network, element, json["edges"])
        # elif label == "pump":
        #     addPump(network, element, json["edges"])
       
    
    return network
     
     
def generatePositions(nodes, edges, algoritm, scale=5000):
    G = nx.Graph()

    for n in nodes:
        clean_n = {k.lower(): v for k, v in n.items()}
        if 'id' in clean_n:
            G.add_node(clean_n['id'])

    for r in edges:
        clean_r = {k.lower(): v for k, v in r.items()}
        u, v = clean_r.get('from'), clean_r.get('to')
        if u is not None and v is not None:
            G.add_edge(u, v)

    if algoritm == "spring":
        raw_pos = nx.spring_layout(G, seed=42)
    elif algoritm == "kamada_kawai":
        raw_pos = nx.kamada_kawai_layout(G)
    else:
        raw_pos = nx.circular_layout(G)
    
    scaled_pos = {}
    for node, coords in raw_pos.items():
        scaled_pos[node] = [
            ((coords[0] + 1) / 2) * scale,
            ((coords[1] + 1) / 2) * scale
        ]
        
    return scaled_pos
    
    
def normalizeDict(sourceDict: dict):
    return dict((k.lower(), v) for k,v in sourceDict.items())

def remove_null_keys(data_dict):
    """Usuwa klucze ze słownika, których wartość jest None."""
    return {k: v for k, v in data_dict.items() if v is not None}

def addJunction(network, node : dict, positions):
    """
    Dodaje węzeł (Junction) do modelu sieci wodociągowej.
    """
      
    # Użycie .get() dla wszystkich kluczy
    id = node['id']
    elev = node.get('elev', 0)
    demand = node.get('demand', 0)
    # pattern = node.get('pattern')
    
    
    
    junction = on.Junction(id=id, elevation = elev, demand = demand, xcoordinate=positions[id][0], ycoordinate=positions[id][1])
    
    on.add_junction(network, junction)


def addTank(network, node: dict, positions):
    """
    Dodaje zbiornik, przekazując tylko te parametry, które nie są None.
    """
    
    tank_id = node['id']

    kwargs = {
        'id': tank_id,
        'elevation': node.get('elevation', 0),
        'xcoordinate': positions[tank_id][0],
        'ycoordinate': positions[tank_id][1]
    }

    optional_map = {
        'initlevel': 'initlevel',
        'minlevel': 'minlevel',
        'maxlevel': 'maxlevel',
        'diameter': 'diameter',
        'minvol': 'minvolume',
        'volcurve': 'volumecurve'
    }

    for node_key, arg_name in optional_map.items():
        value = node.get(node_key)
        if value is not None:
            kwargs[arg_name] = value

    on.add_tank(network, on.Tank(**kwargs))




def addReservoir(network, node: dict, positions):
    """
    Dodaje rezerwuar (Reservoir) do modelu sieci wodociągowej. 
    Używa .get() do bezpiecznego pobierania danych.
    """
    
    # Użycie .get() dla wszystkich kluczy
    id = node['id']
    head = node.get('head', "")
    # pattern = node.get('pattern')
    
    on.add_reservoir(network,
                     on.Reservoir(id=id,head=head , xcoordinate=positions[id][0], ycoordinate=positions[id][1]))


def findFromAndTo(edges, sourceNodeId):
    
    fromLink = next((s for s in edges if s.get('from') == sourceNodeId), None)
    
    toLink = next((s for s in edges if s.get('to') == sourceNodeId), None)
    
    if fromLink is None or toLink is None:
        return None
    
    return {
        "to": fromLink.get("to"),
        "from": toLink.get("from")
    }
    

def addPipe(network, node: dict):
    """
    Dodaje rurociąg (Pipe) do modelu sieci wodociągowej.
    Używa .get() do bezpiecznego pobierania danych.
    """
    
    # Użycie .get() dla wszystkich kluczy
    #temp ID
    id = str(node['from']) + str(node['to'])
    length = node.get('length', "")
    diameter = node.get('diameter', "")
    roughness = node.get('roughness', 100)
    minor_loss = node.get('minorloss', 0)
    status = node.get('status', "Open")

    
    on.add_pipe(network=network,
        pipe=on.Pipe(
            id=id, 
            length=length, 
            diameter=diameter, 
            roughness=roughness, 
            minorloss=minor_loss, 
            status=status,
            startnode=on.get_node(network, node['from']),
            endnode=on.get_node(network, node['to'])
        )  
    )
    



def addPump(network, node: dict, edges):
    """
    Dodaje pompę (Pump) do modelu sieci wodociągowej, 
    używając danych z 'edges' do określenia węzłów start/end.
    """
    
    node = normalizeDict(node)
    
    id = node['id']
    speed = node["speed"]
    head = node.get("head")
    
    ids = findFromAndTo(edges, id)
    
    if ids is None: 
        return
        

    on.add_pump(network=network,
        pump=on.Pump(
            id=id, 
            speed= speed,
            head= head,
            startnode=on.get_node(network, ids["from"]),
            endnode=on.get_node(network, ids["to"])
        )
    )


def addValve(network, node: dict, edges):
    """
    Dodaje zawór (Valve) do modelu sieci wodociągowej,
    używając danych z 'edges' do określenia węzłów start/end.
    """

    node = normalizeDict(node)
    
    id = node['id']
    diameter = node['diameter']
    valve_type = node['type']  
    setting = node['setting']
    minor_loss = node.get('minorloss')
    

    ids = findFromAndTo(edges, id)
    
    if ids is None: 
        return
        
    on.add_valve(network=network,
        valve=on.Valve(
            id=id, 
            diameter=diameter, 
            # Węzły pobrane z edges
            startnode=on.get_node(network, ids["from"]),
            endnode=on.get_node(network, ids["to"])
        )
    )
    
    
    
    
# def add_automatic_layout(network: on.Network, scale: int = 5000, seed: int = 42):
#     """
#     Generuje i dodaje automatyczny układ (współrzędne X, Y) do węzłów sieci,
#     używając NetworkX.
    
#     Sprawdza, czy węzły już mają współrzędne - jeśli tak, pomija generowanie.
#     """
#     print("Sprawdzanie potrzeby wygenerowania layoutu...")

#     # Sprawdź, czy layout jest w ogóle potrzebny
#     try:
#         # Pobierz ID pierwszego węzła z modelu
#         first_node_id = list(network.nodes.keys())[0]
#         first_node = on.get_node(network, first_node_id)
        
#         # Jeśli ten węzeł ma już współrzędną X (inną niż None),
#         # zakładamy, że model ma już layout.
#         if first_node.x is not None:
#             print("Współrzędne już istnieją. Pomijanie automatycznego layoutu.")
#             return # Zakończ funkcję, nie generuj niczego
            
#     except (IndexError, KeyError):
#         # Dzieje się tak, jeśli sieć jest pusta
#         print("Sieć jest pusta. Nie można wygenerować layoutu.")
#         return 

#     print("Generowanie layoutu za pomocą NetworkX (to może chwilę potrwać)...")
    
#     # 1. Pobierz graf NetworkX z modelu OOPNET
#     # .to_undirected() zwykle daje lepsze wizualnie wyniki dla layoutów
#     G = network.get_graph().to_undirected()
    
#     # 2. Oblicz pozycje (layout)
#     # nx.spring_layout to popularny algorytm siłowy.
#     # Używamy 'seed', aby układ był taki sam przy każdym uruchomieniu.
#     pos = nx.spring_layout(G, seed=seed) 
    
#     print("Przypisywanie nowych współrzędnych do modelu OOPNET...")
    
#     # 3. Przypisz pozycje z powrotem do węzłów w modelu OOPNET
#     for node_id, (x, y) in pos.items():
#         try:
#             # Znajdź węzeł w modelu OOPNET po jego ID
#             wezel_oopnet = on.get_node(network, node_id)
            
#             # Przypisz przeskalowane współrzędne
#             # (Layouty NetworkX zwykle działają na wartościach od -1 do 1)
#             wezel_oopnet.x = x * scale
#             wezel_oopnet.y = y * scale
            
#         except KeyError:
#             # To się nie powinno zdarzyć, ale na wszelki wypadek
#             print(f"Ostrzeżenie: Nie znaleziono węzła {node_id} w modelu OOPNET.")