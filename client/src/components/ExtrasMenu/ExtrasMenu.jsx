


import { useState } from "react"

import './ExtrasMenu.css'
import ExtrasDB from "./ExtrasDataBase/ExtrasDB";
import ExtrasCypher from "./ExtrasCypher/ExtrasCypher";
import ExtrasEpanet from "./ExtrasEpanet/ExtrasEpanet";
import ExtrasMapping from "./ExtrasMapping/ExtrasMapping";


const ExtrasMenu = ({jsonData}) => {

    const [isVisibleDB, setIsVisibleDB] = useState(false)
    const [isVisibleCypher, setIsVisibleCypher] = useState(false)
    const [isVisibleEpanet, setIsVisibleEpanet] = useState(false)
    const [isVisibleMapping, setIsVisibleMapping] = useState(false);

    return(
        <>
          <div 
            onClick={() => setIsVisibleDB(prev => !prev)} 
            className="extrasOption"
          >
            Baza danych
          </div>
            
          <div className={`extrasContent ${isVisibleDB ? 'open' : ''}`}>
            {isVisibleDB && <ExtrasDB jsonData={jsonData} />}
          </div>
            
          <div 
            onClick={() => setIsVisibleCypher(prev => !prev)} 
            className="extrasOption"
          >
            Nodes and Edges
          </div>
            
          <div className={`extrasContent ${isVisibleCypher ? 'open' : ''}`}>
            {isVisibleCypher && <ExtrasCypher jsonData={jsonData} />}
          </div>

          <div 
                onClick={() => setIsVisibleMapping(prev => !prev)} 
                className="extrasOption"
            >
                Graph Mapping
            </div>
                
            <div className={`extrasContent ${isVisibleMapping ? 'open' : ''}`}>
                {isVisibleMapping && <ExtrasMapping jsonData={jsonData} />}
            </div>


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