import axios from 'axios';
import React, { useContext, useState } from 'react'
import UserContext from './UserContext';

const Register = () => {

    const [username,setUsername]=useState("");
    const [password,setPassword]=useState("");
    const [loginOrRegister,setLoginOrRegister]=useState("Register");
    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);

    async function handleSubmit(ev){
      ev.preventDefault();
      const url = loginOrRegister === 'Register'?'Register':'Login'
      const {data} = await axios.post(url,{username,password});
      setLoggedInUsername(username);
      setId(data.id);
    }
    
  return (
    <div className='bg-blue-50 h-screen flex items-center'>
      <form className='w-64 mx-auto' onSubmit={handleSubmit}>
        <input 
        type='text' 
        value={username} 
        onChange={ev=>{setUsername(ev.target.value)}} 
        placeholder='username' 
        className='block w-full p-2 mb-2 mt-2 rounded-sm' />
        <input 
        type='password' 
        value={password} 
        onChange={ev=>{setPassword(ev.target.value)}} 
        placeholder='password' 
        className='block w-full p-2 mb-2 mt-2 rounded-sm' />
        <button className='w-full block bg-blue-400 text-white rounded-sm p-2'>
          {loginOrRegister === 'Register'? "Register" : "Login"}
          </button>
        {loginOrRegister === "Register" && (
          <div className='text-center mt-2'>
          Already a member? <button onClick={()=>{setLoginOrRegister("Login")}}>Login here</button>
        </div>
        )}
        {loginOrRegister === "Login" && (
          <div className='text-center mt-2'>
          Want to Register? <button onClick={()=>{setLoginOrRegister("Register")}}>Register here</button>
        </div>
        )}
      </form>
    </div>
  )
}

export default Register
