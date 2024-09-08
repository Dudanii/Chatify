import React from 'react'

const Avatar = ({userId,username,online}) => {
    const colors=['bg-red-200','bg-green-200','bg-pink-200','bg-purple-200','bg-yellow-200','bg-teal-200']
    const useridcolor=parseInt(userId,16);
    const colorindex=useridcolor % colors.length;
    const color=colors[colorindex]

  return (
    <>
      <div className={`w-10 h-10 relative rounded-full flex items-center ${color}`}>
        <div className="w-full text-center opacity-80">{username[0]}</div>
        {online && (
          <div className="absolute w-3 h-3 bg-green-500 right-0 bottom-0 rounded-full border border-white"></div>
        )}
        {!online && (
          <div className="absolute w-3 h-3 bg-gray-500 right-0 bottom-0 rounded-full border border-white"></div>
        )}
    </div>
    </>
  )
}

export default Avatar
