
import oopnet as on
import networkx as nx



def createNetwork(title, json):
    network = on.Network()
    
    json = normalizeDict(json)

    title = title

    #Adding Logic

    #TODO add this logic

    
    
    #Adding nodes   
    networkNodes = [
        node for node in json['nodes']
        if str.lower(node.get("label")) in {"junction", "reservoir", "tank"}
    ]
    for node in networkNodes:
        
        label = str.lower(node["label"])
        
        if label  ==  "junction":
            addJunction(network, node)
        elif label == "tank":
            addTank(network, node)
        elif label == "reservoir":
            addReservoir(network, node)

    #Adding links
    
    links = [
        link for link in json.get("nodes")
        if str.lower(link.get("label")) in {"pipe", "valve", "pump"}
    ]
    
    for link in links:
        
        label = str.lower(link.get("label"))
        
        if label  ==  "pipe":
            addPipe(network, link, json["edges"])
        elif label == "valve":
            addValve(network, link, json["edges"])
        elif label == "pump":
            addPump(network, link, json["edges"])
        
        
    #add_automatic_layout(network)
    
    return network

def normalizeDict(sourceDict: dict):
    return dict((k.lower(), v) for k,v in sourceDict.items())


def addJunction(network : object, node : dict):
    """
    Dodaje węzeł (Junction) do modelu sieci wodociągowej.
    """
    
    node = normalizeDict(node)
    
    # Użycie .get() dla wszystkich kluczy
    id = node.get('id')
    elev = node.get('elev', 0)
    demand = node.get('demand', 0)
    # pattern = node.get('pattern')
    
    junction = on.Junction(id=id, elevation = elev, demand = demand)
    
    on.add_junction(network, junction)


def addTank(network: object, node: dict):
    """
    Dodaje zbiornik (Tank) do modelu sieci wodociągowej. 
    Używa .get() do bezpiecznego pobierania danych.
    """
    node = normalizeDict(node)
    
    # Użycie .get() dla wszystkich kluczy
    id = node.get('id')
    elev = node.get('elevation', 0)
    init_level = node.get('initlevel')
    min_level = node.get('minlevel')
    max_level = node.get('maxlevel')
    diameter = node.get('diameter')
    min_vol = node.get('minvol')
    vol_curve = node.get('volcurve')
    overflow = node.get('overflow')
    
    on.add_tank(network,
                on.Tank(
                    id=id, 
                    elevation=elev, 
                    initlevel=init_level, 
                    minlevel=min_level, 
                    maxlevel=max_level, 
                    diameter=diameter, 
                    minvolume=min_vol, 
                    volumecurve=vol_curve))




def addReservoir(network: object, node: dict):
    """
    Dodaje rezerwuar (Reservoir) do modelu sieci wodociągowej. 
    Używa .get() do bezpiecznego pobierania danych.
    """
    
    node = normalizeDict(node)
    # Użycie .get() dla wszystkich kluczy
    id = node.get('id')
    head = node.get('head')
    # pattern = node.get('pattern')
    
    on.add_reservoir(network,
                     on.Reservoir(id=id,head=head))


def findFromAndTo(edges, sourceNodeId):
    
    fromLink = next((s for s in edges if s.get('from') == sourceNodeId), None)
    
    toLink = next((s for s in edges if s.get('to') == sourceNodeId), None)
    
    if fromLink is None or toLink is None:
        return None
    
    return {
        "to": fromLink.get("to"),
        "from": toLink.get("from")
    }
    

def addPipe(network: object, node: dict, edges):
    """
    Dodaje rurociąg (Pipe) do modelu sieci wodociągowej.
    Używa .get() do bezpiecznego pobierania danych.
    """
    
    node = normalizeDict(node)
    
    # Użycie .get() dla wszystkich kluczy
    id = node.get('id')
    length = node.get('length')
    diameter = node.get('diameter')
    roughness = node.get('roughness', 100)
    minor_loss = node.get('minorloss', 0)
    status = node.get('status', "Open")
    
    ids = findFromAndTo(edges, id)
    
    if ids is None: 
        return
    
    on.add_pipe(network=network,
        pipe=on.Pipe(
            id=id, 
            length=length, 
            diameter=diameter, 
            roughness=roughness, 
            minorloss=minor_loss, 
            status=status,
            startnode=on.get_node(network, ids.get("from")),
            endnode=on.get_node(network, ids.get("to"))
        )  
    )
    



def addPump(network: object, node: dict, edges):
    """
    Dodaje pompę (Pump) do modelu sieci wodociągowej, 
    używając danych z 'edges' do określenia węzłów start/end.
    """
    
    node = normalizeDict(node)
    
    id = node.get('id')
    speed = node.get("speed")
    head = node.get("head")
    
    ids = findFromAndTo(edges, id)
    
    if ids is None: 
        return
        

    on.add_pump(network=network,
        pump=on.Pump(
            id=id, 
            speed= speed,
            head= head,
            startnode=on.get_node(network, ids.get("from")),
            endnode=on.get_node(network, ids.get("to"))
        )
    )


def addValve(network: object, node: dict, edges):
    """
    Dodaje zawór (Valve) do modelu sieci wodociągowej,
    używając danych z 'edges' do określenia węzłów start/end.
    """

    node = normalizeDict(node)
    
    id = node.get('id')
    diameter = node.get('diameter')
    valve_type = node.get('type')  
    setting = node.get('setting')
    minor_loss = node.get('minorloss')
    

    ids = findFromAndTo(edges, id)
    
    if ids is None: 
        return
        
    on.add_valve(network=network,
        valve=on.Valve(
            id=id, 
            diameter=diameter, 
            valve_type=valve_type, 
            setting=setting, 
            minor_loss=minor_loss,
            # Węzły pobrane z edges
            startnode=on.get_node(network, ids.get("from")),
            endnode=on.get_node(network, ids.get("to"))
        )
    )
    
    
    
    
def add_automatic_layout(network: on.Network, scale: int = 5000, seed: int = 42):
    """
    Generuje i dodaje automatyczny układ (współrzędne X, Y) do węzłów sieci,
    używając NetworkX.
    
    Sprawdza, czy węzły już mają współrzędne - jeśli tak, pomija generowanie.
    """
    print("Sprawdzanie potrzeby wygenerowania layoutu...")

    # Sprawdź, czy layout jest w ogóle potrzebny
    try:
        # Pobierz ID pierwszego węzła z modelu
        first_node_id = list(network.nodes.keys())[0]
        first_node = on.get_node(network, first_node_id)
        
        # Jeśli ten węzeł ma już współrzędną X (inną niż None),
        # zakładamy, że model ma już layout.
        if first_node.x is not None:
            print("Współrzędne już istnieją. Pomijanie automatycznego layoutu.")
            return # Zakończ funkcję, nie generuj niczego
            
    except (IndexError, KeyError):
        # Dzieje się tak, jeśli sieć jest pusta
        print("Sieć jest pusta. Nie można wygenerować layoutu.")
        return 

    print("Generowanie layoutu za pomocą NetworkX (to może chwilę potrwać)...")
    
    # 1. Pobierz graf NetworkX z modelu OOPNET
    # .to_undirected() zwykle daje lepsze wizualnie wyniki dla layoutów
    G = network.get_graph().to_undirected()
    
    # 2. Oblicz pozycje (layout)
    # nx.spring_layout to popularny algorytm siłowy.
    # Używamy 'seed', aby układ był taki sam przy każdym uruchomieniu.
    pos = nx.spring_layout(G, seed=seed) 
    
    print("Przypisywanie nowych współrzędnych do modelu OOPNET...")
    
    # 3. Przypisz pozycje z powrotem do węzłów w modelu OOPNET
    for node_id, (x, y) in pos.items():
        try:
            # Znajdź węzeł w modelu OOPNET po jego ID
            wezel_oopnet = on.get_node(network, node_id)
            
            # Przypisz przeskalowane współrzędne
            # (Layouty NetworkX zwykle działają na wartościach od -1 do 1)
            wezel_oopnet.x = x * scale
            wezel_oopnet.y = y * scale
            
        except KeyError:
            # To się nie powinno zdarzyć, ale na wszelki wypadek
            print(f"Ostrzeżenie: Nie znaleziono węzła {node_id} w modelu OOPNET.")