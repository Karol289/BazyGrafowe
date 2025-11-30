
from ChatHistory.Property import Property


class Mapping():
    
    def __init__(self, name, sourceNode):
        
        self.name = name
        self.sourceNode = sourceNode
        self.outputNodes = []
        self.outputEdges = []
        
    def AddNode(self, Id, primaryNode, properties: list[Property]):
        
        props = []
        
        for prop in properties:
            props.append(prop.GetProperty())
    
        
        node = {
            "tempid": Id,
            "primarynode": primaryNode,
            "properties": props
        }
        
        self.outputNodes.append(node)
        
    def AddEdge(self, From, To, properties: list[Property]):
        
        props = []
        
        for prop in properties:
            props.append(prop.GetProperty())
        
        edge = {
            "tempfrom": From,
            "tempto": To,
            "properties": props
        }
        
        self.outputEdges.append(edge)

    def GetJson(self):
        
        return {
            "name": self.name,
            "sourceNode": self.sourceNode,
            "outputNodes": self.outputNodes,
            "outputEdges": self.outputEdges
        }
        

