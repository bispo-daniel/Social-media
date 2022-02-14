import React, { useEffect, useRef } from 'react';
import {uniq} from '../../utilities/helpers';
export default function Index({children, titles, list, effect, lead, group, }) {
    const effectRef = useRef(effect);
    const groupRef = useRef(group);    
    const mapRef = useRef({});

    useEffect(()=>{
            for (let i =0; i <  groupRef.current.length; i++) {
                mapRef.current[groupRef.current[i]] = effectRef.current.transforms[i](effectRef.current.addon);
            }
        },[]);
        const renderView = ()=>{
            return Object.keys(mapRef.current).map((k,i)=>{
                let size = mapRef.current[k];
                return (
                    <>
                    <div key={uniq()}> 
                    {size.length !== 0 && <h3 style={{margin:'15px'}}>{titles[i]}</h3>}
                   {
                        size.map(c=>{
                        if (c.group === k) {
                            return effectRef.current.addon.view(c);
                        }
                        return null;
                        // could return with view as fn if you don't want
                        // a title separation
                        // return effectRef.current.addon.view(c);
                    })
                   }
                   </div>
                    </>
                )
             })
        }
    return (
        <>
           {
               renderView()
           } 
        </>
    )
}
