from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


class FlowUnits(str, Enum):
    LPS = "LPS"  
    LPM = "LPM"  
    CMS = "CMS"  
    GPM = "GPM" 
    CMH = "CMH"   

class HeadlossFormula(str, Enum):
    HW = "H-W"   
    DW = "D-W"   
    CM = "C-M"   


class TimesSettings(BaseModel):
    # API przyjmuje sekundy (int), bo JSON nie obsługuje timedelta
    duration: int = Field(default=86400, description="Czas trwania (s)")
    hydraulic_timestep: int = Field(default=3600, description="Krok hydrauliczny (s)")
    quality_timestep: Optional[int] = Field(default=300, description="Krok jakości (s)")
    report_timestep: int = Field(default=3600, description="Krok raportowania (s)")
    pattern_timestep: int = Field(default=14400, description="Krok wzorców (s)")
    start_clocktime: int = Field(default=0, description="Start symulacji (s od 00:00)")

class OptionsSettings(BaseModel):
    units: FlowUnits = Field(default=FlowUnits.CMH)
    headloss: HeadlossFormula = Field(default=HeadlossFormula.DW)
    viscosity: float = Field(default=1.0)
    specific_gravity: float = Field(default=1.0)
    trials: int = Field(default=40)
    accuracy: float = Field(default=0.001)

class EpanetSettings(BaseModel):
    options: OptionsSettings = OptionsSettings()
    times: TimesSettings = TimesSettings()

_current_settings = EpanetSettings()

def get_current_settings() -> EpanetSettings:
    """Zwraca kopię aktualnych ustawień."""
    return _current_settings

def update_current_settings(new_settings: EpanetSettings):
    """Nadpisuje globalne ustawienia."""
    global _current_settings
    _current_settings = new_settings