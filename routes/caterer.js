const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require('../middleware/auth')

router.post('/addItems', auth, (req,res)=>{
    //console.log(req.body);
    console.log(req.user);
    const { items } = req.body;
    console.log(items.length);
    Business.updateMany({
        user_id: req.user.id,
    },
    {
        
               $push:{
                 items: items
              }
            },(err, doc)=>{

                console.log('insert successfull')                                                                                                                       
                     if(err){   
                res.json({ errors: [{ msg: err }] })         
    }
            }
     );
    res.status(200).send({message: "items added successfully"});
})



module.exports = router;
("");
