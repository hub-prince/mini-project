const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const cookie = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usermodel = require('./model/user')
const postmodel = require('./model/post')
 

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

const isloggedin = (req,res,next)=>{

    if(req.cookies.token === "") res.send("you have to login")

    else{
       let data = jwt.verify(req.cookies.token,"shhh");
        req.user=data;
        next();
    }
}

app.get('/',(req,res)=>{
    res.render('index');
})

app.get('/profile',isloggedin,async (req,res)=>{
     let user = await usermodel.findOne({email:req.user.email}).populate("posts")
    
    
    res.render('profile',{user});
})

app.post("/create",(req,res)=>{

    let {email,username,password,name}=req.body;

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,async (err,hash)=>{
            let user = await usermodel.create({
                name,
                email,
                username,
                password:hash
            })
             
            let token = jwt.sign({email,userid:user._id},"shhh");
            res.cookie('token',token);
            res.redirect('/');
        })
    })
   
})

app.get('/login',(req,res)=>{
    res.render('login');
})

app.post('/login',async (req,res)=>{
     
    let{email,password}=req.body;

    let user = await usermodel.findOne({email})
    if(!user) res.status(500).send('something went wrong')

    bcrypt.compare(password,user.password,(err,result)=>{
        if(!result) res.status(300).send('you can not login')
        
            else{
               
                let token = jwt.sign({email,userid:user._id},"shhh");
                res.cookie('token',token);
                res.redirect('/profile');
            }
    })  
})

app.get('/logout',(req,res)=>{
    res.cookie('token',"");
    res.redirect('/');
})

app.post('/profile',isloggedin,async (req,res)=>{
    let{text} = req.body;
    let user = await usermodel.findOne({email:req.user.email});
    
    
     
    let post = await postmodel.create({
        content:text,
        user:user._id

    })
   
     user.posts.push(post._id);
     await user.save();
     res.redirect('profile');
    })

app.get('/delete/:id',isloggedin,async (req,res)=>{

            let user= await usermodel.findOne({email:req.user.email})
         await postmodel.findByIdAndDelete(req.params.id);
         

          const updatedUser = await usermodel.updateOne(
            { _id: user._id}, // Find the user by their ID
            { $pull: { posts: req.params.id } } // Remove the postId from the posts array
          );
          res.redirect('/profile');


    })

app.get('/like/:id',isloggedin,async (req,res)=>{

        let posts = await postmodel.findOne({_id:req.params.id}).populate("user");

        if(posts.likes.indexOf(req.user.userid) === -1)
        {
            posts.likes.push(req.user.userid);
            await posts.save();
        }
        else{
            posts.likes.splice(posts.likes.indexOf(req.user.userid),1);
            await posts.save();
        }
        
       

     res.redirect('/feed');

       


})

app.get('/edit/:id',async (req,res)=>{

let post = await postmodel.findOne({_id:req.params.id})

 res.render('edit',{post});

})

app.post('/edit/:id',isloggedin,async (req,res)=>{
 
   let post = await postmodel.findByIdAndUpdate({_id:req.params.id},{content:req.body.text})
   await post.save();

 res.redirect('/profile');

   


})

app.get('/feed',isloggedin,async (req,res)=>{

    let post = await postmodel.find().populate('user');
    let user = await usermodel.findOne({_id:req.user.userid})
    res.render('feed',{post,user});
})



app.listen(5000);

 