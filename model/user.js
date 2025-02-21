const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/association');

const userSchema = new mongoose.Schema({

    username:String,
    email:String,
    name:String,
    password:String,
    posts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'post'
    }]
})

module.exports = mongoose.model('user',userSchema);