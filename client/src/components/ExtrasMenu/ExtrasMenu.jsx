import { useState } from "react"

import './ExtrasMenu.css'
import ExtrasDB from "./ExtrasDataBase/ExtrasDB";
import ExtrasModel from "./ExtrasModel/ExtrasModel";
import ExtrasEpanet from "./ExtrasEpanet/ExtrasEpanet";
import ExtrasMapping from "./ExtrasMapping/ExtrasMapping";
import ExtrasMappedModel from "./ExtrasMappedModel/ExtrasMappedModel";


const ExtrasMenu = ({jsonData}) => {

    const [isVisibleDB, setIsVisibleDB] = useState(false)
    const [isVisibleCypher, setIsVisibleCypher] = useState(false)
    const [isVisibleEpanet, setIsVisibleEpanet] = useState(false)
    const [isVisibleMapping, setIsVisibleMapping] = useState(false);
    const [isVisibleMappedModel, setIsVisibleMappedModel] = useState(false);

    return(
        <>
          {/* --- BAZA DANYCH --- */}
          <div 
            onClick={() => setIsVisibleDB(prev => !prev)} 
            className="extrasOption"
          >
            Database
          </div>
            
          <div className={`extrasContent ${isVisibleDB ? 'open' : ''}`}>
            {isVisibleDB && <ExtrasDB jsonData={jsonData} />}
          </div>
            
          {/* --- MODEL (Original) --- */}
          <div 
            onClick={() => setIsVisibleCypher(prev => !prev)} 
            className="extrasOption"
          >
            Model
          </div>
            
          <div className={`extrasContent ${isVisibleCypher ? 'open' : ''}`}>
            {isVisibleCypher && <ExtrasModel jsonData={jsonData} />}
          </div>

          {/* --- MAPPED MODEL --- */}
          <div 
            onClick={() => setIsVisibleMappedModel(prev => !prev)} 
            className="extrasOption"
          >
            Mapped Model
          </div>
            
          <div className={`extrasContent ${isVisibleMappedModel ? 'open' : ''}`}>
            {isVisibleMappedModel && <ExtrasMappedModel />}
          </div>

          {/* --- GRAPH MAPPING --- */}
          <div 
                onClick={() => setIsVisibleMapping(prev => !prev)} 
                className="extrasOption"
            >
                Graph Mapping
            </div>
                
            <div className={`extrasContent ${isVisibleMapping ? 'open' : ''}`}>
                {isVisibleMapping && <ExtrasMapping jsonData={jsonData} />}
            </div>


          {/* --- EPANET EXPORT --- */}
          <div 
            onClick={() => setIsVisibleEpanet(prev => !prev)} 
            className="extrasOption"
          >
            Epanet Export
          </div>
            
          <div className={`extrasContent ${isVisibleEpanet ? 'open' : ''}`}>
            {isVisibleEpanet && <ExtrasEpanet />}
          </div>


        </>
     
    )
}


export default ExtrasMenu