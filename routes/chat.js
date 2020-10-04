var io = require('socket.io');
const express = require('express')
const  router = express.Router();
const Message = require('../models/Message');
var users = [];
var socketEventsAttached = false;
const auth = require('../middleware/auth');
module.exports= (server) => {


router.post('/prev',auth, (req, res)=>{
  const { id }= req.body;
  Message.find({
    id
  },
  (err,messages)=>{
    console.log(messages)
    res.status(200).send({messages})
  }
 )
})

router.post('/new', auth , (req, res)=> {
    const { id1, id2 } = req.body;
    console.log(id1,' ',id2);
    var id= id1+id2;
    console.log('final Id:', id);
    const newMsgNode = new Message({
      id
    })
    newMsgNode.save().then(msg => {
      console.log('message node created');
    })
   // io(server).emit('output', message);
    res.status(200).send('client connected')
})


//Socket io
io(server).on('connect', socket =>{
  if(!socketEventsAttached){
    console.log('new client connected')
    
    //var chat = db.collection('messages')

    
    socket.on('new', (data, callback)=>{
    if(data.name in users){
      callback(false);
    }    
    else{
      callback(true);

      socket.name=data.name;
      users[socket.name]=socket;
    }
    })
    
    socket.on('msg',(data, callback)=>{
      const{id, msg, author} = data;
      const messageBody ={
        author,
        message: msg
      }
      Message.update({
        id
      },{
        $push: {message:messageBody}
      },
      (err,done)=>{
       // console.log(done);
      }
      )
      
      callback(data);
      if(data.to in users){  
      console.log('user is online:', data.to) 
     // console.log('calllinggg',users[data.to])
      io(server).to(users[data.to].emit('priv',data.msg));
      
      }
    })

    socket.on('input', function(data){ 
      let name = data.name;
      let message = data.message;
        console.log(data)
      // Check for name and message
      if(name == '' || message == ''){
          // Send error status
          //sendStatus('Please enter a name and message');
      } else {
          console.log('input:', data)
          // Insert message
          // Message.updateMany({
          //   id: '123'
          // },{
          //   $push:{
          //     body: data
          //   }
          // },(err, doc)=>{
          //     console.log('insert successfull')
          //          if(err){
          //       res.json({ errors: [{ msg: err }] })
          //     }
              socket.emit('output', data);
         //     console.log(doc)
         
        //  })
              //client.emit('output', [data]);
  
              // Send status object
              // sendStatus({
              //     message: 'Message sent',
              //     clear: true
              // });
          }
        });
 
        
        //private message
        socket.on('private message', function (from, msg) {
          console.log('I received a private message by ', from, ' saying ', msg);
        });

       
        
    }    
  });
  
  
  return router;
}
