import React from 'react'
import Avatar from './Avatar';


const Contact = ({id,username,onClick,selected,online}) => {
  return (
    <>
              <div key={id} onClick={()=>{onClick(id)}} 
              className={` cursor-pointer flex items-center gap-4 text-xl ${selected?"bg-blue-50":""}`}>
                  {selected && (
                    <div className="w-1 bg-blue-500 h-16 rounded-r-md "></div>
                  )}
                <div className="flex gap-2 pl-4 py-3 items-center">
                <Avatar online={online} username={username} userId={id} />
                <span className='text-gray-700'>{username}</span>
                </div>
                </div>
    </>
  )
}

export default Contact
