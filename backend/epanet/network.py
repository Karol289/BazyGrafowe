import oopnet as on
import networkx as nx
from datetime import timedelta
from Epanet.settingsManager import get_current_settings

def createNetwork(title, json_data, algoritm):
    network = on.Network()
    network.title = title
    
    settings = get_current_settings()
    
    network.options.units = settings.options.units.value
    network.options.headloss = settings.options.headloss.value
    network.options.viscosity = settings.options.viscosity
    network.options.specificgravity = settings.options.specific_gravity
    network.options.trials = settings.options.trials
    network.options.accuracy = settings.options.accuracy
    network.times.duration = timedelta(seconds=settings.times.duration)
    network.times.hydraulictimestep = timedelta(seconds=settings.times.hydraulic_timestep)

    if settings.times.quality_timestep:
        network.times.qualitytimestep = timedelta(seconds=settings.times.quality_timestep)
    network.times.reporttimestep = timedelta(seconds=settings.times.report_timestep)
    network.times.patterntimestep = timedelta(seconds=settings.times.pattern_timestep)
    network.times.startclocktime = timedelta(seconds=settings.times.start_clocktime)

    network.times.statistic = 'NONE' 

    positions = generatePositions(json_data['nodes'], json_data['edges'], algoritm)
    networkElements = json_data["nodes"] + json_data["edges"]
    
    patterns_map = {} 
    created_patterns = []

    for p_data in json_data["nodes"]:
        if p_data["label"] == "PATTERN":
            new_pattern = on.Pattern(
                id=p_data["Id"], 
                multipliers=p_data["Multipliers"]
            )
            on.add_pattern(network, new_pattern)
            created_patterns.append(new_pattern)

    es = [e for e in json_data["edges"] if e["label"] == "HAS_PATTERN"]

    for pattern_obj in created_patterns:
        for e in es:
            if e["from"] == pattern_obj.id:
                target_node_id = e["to"]
                patterns_map[target_node_id] = pattern_obj
    
    for element in networkElements:
        element = normalizeDict(element)
        element = remove_null_keys(element)
        
        label = str.lower(element["label"])
        
        if label == "junction":
            addJunction(network, element, positions, patterns_map)
        elif label == "tank":
            addTank(network, element, positions)
        elif label == "reservoir":
            addReservoir(network, element, positions)
        
        if label == "pipe":
            addPipe(network, element)
        
    return network
     
def generatePositions(nodes, edges, algoritm, scale=5000):
    G = nx.Graph()

    for n in nodes:
        clean_n = {k.lower(): v for k, v in n.items()}
        if 'id' in clean_n:
            G.add_node(str(clean_n['id']))

    for r in edges:
        clean_r = {k.lower(): v for k, v in r.items()}
        u, v = clean_r.get('from'), clean_r.get('to')
        if u is not None and v is not None:
            G.add_edge(str(u), str(v))

    if algoritm == "spring":
        raw_pos = nx.spring_layout(G, seed=42)
    elif algoritm == "kamada_kawai":
        raw_pos = nx.kamada_kawai_layout(G)
    else:
        raw_pos = nx.circular_layout(G)
    
    scaled_pos = {}
    for node, coords in raw_pos.items():
        scaled_pos[str(node)] = [
            ((coords[0] + 1) / 2) * scale,
            ((coords[1] + 1) / 2) * scale
        ]
        
    return scaled_pos
    
def normalizeDict(sourceDict: dict):
    return dict((k.lower(), v) for k,v in sourceDict.items())

def remove_null_keys(data_dict):
    return {k: v for k, v in data_dict.items() if v is not None}

def addJunction(network, node : dict, positions, patterns):
    id = str(node['id'])
    elev = float(node.get('elev', 0))
    demand = float(node.get('demand', 0))
    pattern = patterns.get(id, None)

    if pattern is None:
        multipliers = node.get("pattern", None)
        if multipliers is not None:
            pattern = on.Pattern(id= "P" + id, multipliers=multipliers)
            on.add_pattern(network, pattern)
    
    x = positions.get(id, [0,0])[0]
    y = positions.get(id, [0,0])[1]

    junction = on.Junction(id=id, elevation = elev, demand = demand, xcoordinate=x, ycoordinate=y, demandpattern=pattern)
    on.add_junction(network, junction)

def addTank(network, node: dict, positions):
    tank_id = str(node['id'])

    kwargs = {
        'id': tank_id,
        'elevation': node.get('elevation', 0),
        'xcoordinate': positions.get(tank_id, [0,0])[0],
        'ycoordinate': positions.get(tank_id, [0,0])[1]
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
    id = str(node['id'])
    head = node.get('head', "")
    
    x = positions.get(id, [0,0])[0]
    y = positions.get(id, [0,0])[1]
    
    on.add_reservoir(network,
        on.Reservoir(id=id, head=head, xcoordinate=x, ycoordinate=y))

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
    from_id = str(node['from'])
    to_id = str(node['to'])
    
    # 1. Length musi być liczbą. Pusty string "" psuje plik .inp.
    length_val = node.get('length')
    if length_val is not None:
        length_val = float(length_val) # Konwersja na float
    else:
        length_val = 10.0 # Bezpieczna wartość domyślna

    kwargs = {
        "id": from_id + to_id,
        "length": length_val
    }

    optional_map = {
        'diameter': 'diameter',
        'roughness': 'roughness',
        'minorloss': 'minorloss',
        'status': 'status'
    }
    
    for node_key, arg_name in optional_map.items():
        value = node.get(node_key)
        if value is not None:
            if arg_name in ['diameter', 'roughness', 'minorloss']:
                try:
                    kwargs[arg_name] = float(value)
                except ValueError:
                    print(f"Ostrzeżenie: Nieprawidłowa wartość '{value}' dla {arg_name} w rurze {kwargs['id']}")
                    kwargs[arg_name] = 1.0 
            else:
                kwargs[arg_name] = value
    
    on.add_pipe(network=network,
        pipe=on.Pipe(
            **kwargs,
            startnode=on.get_node(network, from_id),
            endnode=on.get_node(network, to_id)
        )  
    )

def addPump(network, node: dict, edges):
    node = normalizeDict(node)
    
    id = str(node['id'])
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
            startnode=on.get_node(network, str(ids["from"])),
            endnode=on.get_node(network, str(ids["to"]))
        )
    )

def addValve(network, node: dict, edges):
    node = normalizeDict(node)
    
    id = str(node['id'])
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
            startnode=on.get_node(network, str(ids["from"])),
            endnode=on.get_node(network, str(ids["to"]))
        )
    )