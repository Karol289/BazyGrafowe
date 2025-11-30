


import { useState } from "react"

import './ExtrasMenu.css'
import ExtrasDB from "./ExtrasDataBase/ExtrasDB";
import ExtrasModel from "./ExtrasModel/ExtrasModel";
import ExtrasEpanet from "./ExtrasEpanet/ExtrasEpanet";

const ExtrasMenu = ({jsonData}) => {

    const [isVisibleDB, setIsVisibleDB] = useState(false)
    const [isVisibleCypher, setIsVisibleCypher] = useState(false)
    const [isVisibleEpanet, setIsVisibleEpanet] = useState(false)

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
            Model
          </div>
            
          <div className={`extrasContent ${isVisibleCypher ? 'open' : ''}`}>
            {isVisibleCypher && <ExtrasModel jsonData={jsonData} />}
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