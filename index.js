import http from 'http'
import { Server } from 'socket.io'
import {v4 as uuid} from 'uuid'
import dotenv from 'dotenv'
dotenv.config()
const server = http.createServer()
const port = process.env.PORT || 5000

const io = new Server(server,{cors:{origin:"*"}})
const waiting = []
const activePairs = new Map()
io.on('connection',(socket)=>{
   console.log(socket.id)  

   if(waiting.includes(socket.id))return
   socket.on("start",()=>{
    if(waiting.length>0){
     const partner = waiting.shift()
     const roomId = uuid()
     activePairs.set(socket.id,partner)
     activePairs.set(partner,socket.id)
     socket.emit("matched",{roomId})
     socket.to(partner).emit("matched",{roomId})
    }else{
        waiting.push(socket.id)
        socket.emit("waiting")
    }
   })

   socket.on("next",()=>{
    handleLeave(socket.id)
   })

   socket.on("disconnect",()=>handleLeave(socket.id))

   function handleLeave (id){
    const index=waiting.indexOf(id)
    if(index!==-1){waiting.splice(index,1)}
    const partner=activePairs.get(id)
    if(partner){
        io.to(partner).emit("partner")
        activePairs.delete(id)
        activePairs.delete(partner)
    }
   }

})

server.listen(port,()=>{
    console.log('server is started at',port);
    
})