


import { useState } from "react"

import './ExtrasMenu.css'
import ExtrasDB from "./ExtrasDataBase/ExtrasDB";
import ExtrasCypher from "./ExtrasCypher/ExtrasCypher";

const ExtrasMenu = ({jsonData}) => {

    const [isVisibleDB, setIsVisibleDB] = useState(false)
    const [isVisibleCypher, setIsVisibleCypher] = useState(false)


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
        </>
     
    )
}


export default ExtrasMenu