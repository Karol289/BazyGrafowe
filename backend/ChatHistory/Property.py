

from abc import ABC, abstractmethod



class Property(ABC):
    
    def __init__(self, type, targetProperty):
        

            
        if type not in Property.ValidTypes():
            raise ValueError("Not supported type")
        
        self.type = type
        self.targetProperty = targetProperty

    @staticmethod
    def ValidTypes():
        return ["copy", "const", "random"]
    
    
    @abstractmethod
    def GetProperty(self):
        return {
            "type": self.type,
            "targetProperty": self.targetProperty
        }
        
        
class CopyProperty(Property):
    
    def __init__(self, type, targetProperty, sourceProperty):
        
        super().__init__(type, targetProperty)
        
        self.sourceProperty = sourceProperty
        
        
    def GetProperty(self):
        
        dict = super().GetProperty()
        
        dict["sourceProperty"] = self.sourceProperty
        
        return dict
    
    
class ConstProperty(Property):
    
    def __init__(self, type, targetProperty, value):
        
        super().__init__(type, targetProperty)
        
        self.value = value
        
        
    def GetProperty(self):
        
        dict = super().GetProperty()
        
        dict["value"] = self.value
        
        return dict
    
    
class RandomProperty(Property):
    
    def __init__(self, type, targetProperty):
        
        super().__init__(type, targetProperty)
        
        
        
    def GetProperty(self):
        
        dict = super().GetProperty()
        
        
        return dict
        
        