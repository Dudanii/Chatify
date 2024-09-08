import React, { useContext, useEffect, useRef, useState } from 'react'
import Contact from './Contact';
import Logo from './Logo';
import UserContext from './UserContext';
import {uniqBy} from 'lodash';
import axios from 'axios';

const Chat = () => {
  const [ws,setWs]=useState(null);
  const [onlinePeople,setOnlinePeople]=useState({});
  const [offlinePeople,setOfflinePeople]=useState({});
  const [selectedUserId,setSelectedUserId]=useState(null);
  const [newMessageText,setNewMessageText]=useState("");
  const [messages,setMessages]=useState([]);
  const {username,id,setUsername,setId}=useContext(UserContext);
  const divUnderMessage = useRef();

  useEffect(()=>{
    connectToWs();
  }, []);

  function connectToWs(){
    const ws=new WebSocket("ws://localhost:3000");
    setWs(ws);
    ws.addEventListener('message',handleMessage);
    ws.addEventListener('close',()=>{
      setTimeout(()=>{
        console.log("Disconnected. Trying to reconnect.");
        connectToWs();
      })
    })
  }

  function logout(){  
    axios.post('/logout').then(()=>{
      setWs(null);  
      setId(null);
      setUsername(null);
    })
  }

  function handleMessage(ev){
    const messageData= JSON.parse(ev.data);
    console.log({ev,messageData});
    if('online' in messageData){
      showOnlinePeople(messageData.online);
    }
    else if('text' in messageData) {
      if(messageData.sender === selectedUserId){
        setMessages(prev=>([...prev,{...messageData}]))
      }
    }
  }
  function showOnlinePeople(peopleArray){
    // console.log('Online People:', people);
    
    const people = {};
    peopleArray.forEach(({userId, username}) => {
      people[userId]=username;
    });
    setOnlinePeople(people);
  }
  function sendMessage(ev,file=null){
    if (ev) ev.preventDefault();
    ws.send(JSON.stringify({
      recipient:selectedUserId,
      text:newMessageText,
      file,
    }))
    if(file){
      axios.get(`/messages/${selectedUserId}`).then(res=>{
        setMessages(res.data)
      })
    }
    else{
      setNewMessageText('');
      setMessages(prev => [...prev,{
      text : newMessageText ,
      sender:id,
      recipient:selectedUserId,
      _id:Date.now(),  
    }]);
  }
  }

  function sendFile(ev){
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = ()=>{
      sendMessage(null , {
        name: ev.target.files[0].name,
        data: reader.result
      })
    }
  }


  useEffect(()=>{
    const div=divUnderMessage.current;
    if(div){
      div.scrollIntoView({behavior:'smooth',block:'end'})
    }
  },[messages])

  useEffect(()=>{
    if(selectedUserId){
      axios.get(`/messages/${selectedUserId}`).then(res=>{
        setMessages(res.data)
      })
    }
  },[selectedUserId])

  useEffect(()=>{
    axios.get('/people').then(res => {
      const offlinePeopleArr=res.data
      .filter(p => p._id!==id)
      .filter(p=> !Object.keys(onlinePeople).includes(p._id))
      const offlinePeople = {};
      offlinePeopleArr.forEach(p=>{
        offlinePeople[p._id]=p;
      })
      // console.log({offlinePeople,offlinePeopleArr})
      setOfflinePeople(offlinePeople);
  })
  },[onlinePeople])

  const OnlinePeopleExceptMe = {...onlinePeople};
  delete OnlinePeopleExceptMe[id];
  const messagewithoutdupes = uniqBy(messages,'_id');


  return (
    <>
      <div className="flex h-screen">
        <div className="bg-blue-100 w-1/3 flex flex-col">
          <div className="flex-grow">
            <Logo />
                {Object.keys(OnlinePeopleExceptMe).map(userId=>(
                  <Contact 
                    key={userId}
                    id={userId}
                    online={true}
                    onClick={()=>setSelectedUserId(userId)} 
                    selected={userId === selectedUserId} 
                    username={OnlinePeopleExceptMe[userId]} 
                    />
                ))}
                {Object.keys(offlinePeople).map(userId=>(
                  <Contact 
                    key={userId}
                    id={userId}
                    online={false}
                    onClick={()=>setSelectedUserId(userId)} 
                    selected={userId === selectedUserId} 
                    username={offlinePeople[userId].username} 
                    />
                ))}
          </div>
          <div className="p-10 text-center flex items-center justify-center gap-2">
          <span className='mr-2 text-xl text-gray-600 flex items-center'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
            {username}
            </span>
            <button 
              onClick={logout} 
              className="text-xl bg-blue-300 text-gray-500 px-4 py-1 rounded-sm">
              Logout
            </button>
          </div>
        </div>
        <div className="flex flex-col bg-blue-300 w-2/3 p-5">
            <div className="flex-grow">
              {!selectedUserId && (
                <div className="flex h-full items-center justify-center text-gray-500 text-xl">&larr; Select a Conversation</div>
              )}
            </div>
              
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className='overflow-y-scroll absolute top-0 left-0 right-0 bottom-2'>
              {messagewithoutdupes.map(message=>(
                <div key={message._id} className={`${message.sender===id?"text-right":""}`}>
                  <div className={`text-left inline-block p-2 m-2 rounded-md text-md ${message.sender===id?"bg-blue-500":"bg-white text-gray500"}`}>
                    {message.text}
                    {message.file && (
                      <div >              
                        <a target='_blank' className='flex items-center gap-1 border-b border-black' href={axios.defaults.baseURL+'/uploads/'+message.file}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                          </svg>
                        {message.file}
                        </a>
                      </div>
                    )}
                    </div>
                </div>
              ))}
              <div className="" ref={divUnderMessage}></div>
            </div>
            </div>
            
          )}

            {!!selectedUserId && (
                <form className='flex gap-2' onSubmit={sendMessage}>
                <input 
                value={newMessageText}
                onChange={ev=>setNewMessageText(ev.target.value)}
                type="text" 
                placeholder='Type....' 
                className="bg-white border p-2 flex-grow rounded-sm" />
                <label className='text-gray-500 p-2 cursor-pointer border border-blue-200 bg-blue-200 rounded-sm'>
                  <input type='file' className='hidden' onChange={sendFile}/>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                  </svg>
                </label>
                <button type='submit' className='bg-blue-500 p-2 text-white rounded-sm'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                </button>
            </form>
            )}
        </div>
      </div>
    </>
  )
}

export default Chat
