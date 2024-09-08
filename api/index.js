const express=require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User=require('./models/User');
const Message=require('./models/Message');
const jwt=require('jsonwebtoken');
const cors=require('cors');
const bcrypt=require('bcryptjs');
const cookieParser=require('cookie-parser');
const ws=require('ws');
const fs=require('fs');

dotenv.config();
const app=express();
app.use('/uploads', express.static(__dirname+'/uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials:true, 
    origin:"http://localhost:5173",
}));
// mongoose.connect(process.env.MONGO_URL);
mongoose.connect("mongodb+srv://mohitdudani7:vmbLdSLixa58l5qU@cluster1.svphuao.mongodb.net/");
const jwtSecret=process.env.jwt;
const salt=bcrypt.genSaltSync(10);

async function getUserDataFromRequests(req){
    return new Promise((resolve,reject)=>{
    const {token}=req.cookies;
    if(token){
        jwt.verify(token, jwtSecret, {}, (err, userData)=>{
            if (err) throw err;
            resolve(userData);
        })
    }else{
        reject("no token");
    }
    })
}


app.get('/test', (req,res)=>{
    res.json("WORKING");
});

app.post('/register', async (req,res)=>{
    try{
        const {username,password} = req.body;   
        const userdetails = await User.create({
            username:username,
            password:bcrypt.hashSync(password,salt)});
        jwt.sign({userid:userdetails._id,username}, jwtSecret , {} , (err, token)=>{
            if(err) throw err;
            res.cookie('token', token, {sameSite:'none',secure:true}).status(201).json({
                id:userdetails._id,
            });
        })  
    }
    catch(err){
        if (err) throw err;
    }
})

app.post('/login',async (req,res)=>{
    const {username,password}=req.body;
    const checkuser=await User.findOne({username});
    if(username){
        const passcheck=bcrypt.compareSync(password,checkuser.password)
        if(passcheck){
            jwt.sign({userid:checkuser._id,username}, jwtSecret , {} , (err, token)=>{
                res.cookie('token',token,{sameSite:'none',secure:true}).json({
                    id:checkuser._id,
                });
                if (err) throw err;
            })
            console.log("ok");
        }
    }
})

app.post('/logout',(req,res)=>{
    res.cookie('token', '').json('logged out')
})


app.get('/profile', (req,res)=>{
    const {token}=req.cookies;
    if(token){
        jwt.verify(token, jwtSecret, {}, (err, userData)=>{
            if (err) throw err;
            res.json(userData);
        })
    }
})

app.get('/messages/:userId',async(req,res)=>{
    const {userId}=req.params;
    const userData=await getUserDataFromRequests(req);
    const ourUserId=userData.userid;
    const messages=await Message.find({
        sender:{$in:[userId,ourUserId]},
        recipient:{$in:[userId,ourUserId]}
    }).sort({createdAt:1});
    res.json(messages);
})


app.get('/people',async (req,res)=>{
    const users= await User.find({},{'_id':1,username:1})
    res.json(users)
})

const server = app.listen(3000);

const wss = new ws.WebSocketServer({server});
wss.on('connection',(connection , req)=>{
    
    connection.isAlive=true;
    
    function notifyAboutOnlinePeople(){
        [...wss.clients].forEach(client=>{
            client.send(JSON.stringify({
                online:[...wss.clients].map(c=>({userId:c.userid,username:c.username}))
            }))
        })
    }



    connection.timer=setInterval(()=>{
        connection.ping()
        connection.deathTimer = setTimeout(()=>{
            connection.isAlive = false;
            clearInterval(connection.timer)
            connection.terminate();
            notifyAboutOnlinePeople();
        },1000)
    },5000);


    connection.on('pong',()=>{
        clearTimeout(connection.deathTimer);
    })
    //
    const cookies= req.headers.cookie;
    if(cookies){
        const cookieToken = cookies.split(';').find(str=>str.startsWith('token='));
        if(cookieToken){
            const token=cookieToken.split('=')[1];
            if(token){
                jwt.verify(token, jwtSecret, {}, (err, userData)=>{
                    if (err) throw err;
                    const {userid, username} = userData;
                    connection.userid=userid;
                    connection.username=username;
                })
                
            }
        }
    }
 

    connection.on('message',async (message) => {
        const messageData=JSON.parse(message.toString());
        const {recipient,text,file} = messageData;
        let fileName=null;
        if(file){
            const parts=file.name.split('.');
            const ext=parts[parts.length-1];
            fileName=Date.now()+'.'+ext;
            const path=__dirname+'/uploads/'+fileName;
            const bufferData = new Buffer(file.data.split(',')[1],'base64');
            fs.writeFile(path, bufferData,()=>{
                console.log('file saved'+fileName);
            })
        }
        if(recipient && (text || file)){
            const messageDoc=await Message.create({
                sender:connection.userid,
                recipient,
                text: text,
                file: file ? fileName : null,
            });
            [...wss.clients]
            .filter(c => c.userid === recipient)
            .forEach(c => c.send(JSON.stringify({
                text,
                sender:connection.userid,
                recipient,
                file: file ? fileName : null,
                _id:messageDoc._id,
            })))
        }
    });

    //Notifying About Online people
    notifyAboutOnlinePeople();
})


//vmbLdSLixa58l5qU
