if(process.env.NODE_ENV!=="production"){
    require('dotenv').config();
}


console.log(process.env.SECRET)

const express=require('express')
const path=require('path')
const mongoose=require('mongoose')
const ejsMate=require('ejs-mate')
const session=require('express-session')
const flash=require('connect-flash')
const  ExpressError=require('./utils/ExpressError')
const catchAsync=require('./utils/catchAsync')
const methodOverride=require('method-override')
const passport=require('passport')
const LocalStrategy=require('passport-local')
const Campground=require('./models/campground')
const User=require('./models/user')
const {isLoggedIn}=require('./middleware')
const Review=require('./models/review')
const multer=require('multer')

const {storage}=require('./cloudinary')
const upload=multer({storage});
const dbURL=process.env.DB_URL

const T='mongodb://localhost:27017/camp3'
DB_URL='mongodb+srv://abdaal:wlnD8m8gCqcgv6Mt@cluster0.pnw91.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'

mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const port=process.env.PORT||3000
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});
const app=express()



const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash())
app.engine('ejs',ejsMate)
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))

app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname,'public')))




app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req,res,next)=>{

    res.locals.success=req.flash('success')
    res.locals.error=req.flash('error')
    next()
})


app.use((req,res,next)=>{
    res.locals.currentUser=req.user
    next()
})




app.get('/',(req,res)=>{
    res.render('home')
})

app.get('/campground',async (req,res)=>{
    const campground=await Campground.find({})
    res.render('campgrounds/index',{campground})
})
app.get('/campground/new',isLoggedIn,async (req,res)=>{
    res.render('campgrounds/new')
})

app.post('/campground',upload.single('image'),async(req,res)=>{
    const campground=new Campground({...req.body.campground})
    campground.author=req.user._id
    await campground.save()
    req.flash('success','Successfully made a new campground!')
    //res.redirect(`/campground/${campground._id}`)
    console.log(req.file)
    res.send(req.body)
})

app.get('/campground/:id',async(req,res)=>{
    const {id}=req.params
    const campground=await Campground.findById(id).populate({
        path:'reviews',
        populate:{
            path:'author'
        }
    }).populate('author')
//   console.log(campground.reviews.author)
    res.render('campgrounds/show',{campground})
})
app.get('/campground/:id/edit',async (req,res)=>{
    const {id}=req.params
    const campground=await Campground.findById(id)

    res.render('campgrounds/edit',{campground})
})

app.put('/campground/:id',async (req,res)=>{

    const {id}=req.params
    const campground=await Campground.findByIdAndUpdate(id,{...req.body})
    await campground.save()
    res.redirect(`/campground/${campground._id}`)
})
app.delete('/campground/:id',async (req,res)=>{
    const {id}=req.params
    await Campground.findByIdAndDelete(id)
    res.redirect('/campground')
})

app.get('/register',(req,res)=>{
    res.render('users/register')
})
app.post('/register',async(req,res)=>{
    const {email,username,password}=req.body;
    const user=new User({email,username})
    const registeredUser=await User.register(user,password)
    req.login(registeredUser,err=>{
        if(err){
            res.redirect('/login')
        }else{
            res.redirect('/campground')
        }
       
    })
})




app.get('/login',(req,res)=>{
    res.render('users/login')
})

app.post('/login',passport.authenticate('local',{failureRedirect:'/login'}),(req,res)=>{
  // console.log(req.user)
  req.flash('success','Successfully loggedIn')
    res.redirect('/campground')
})

app.get('/logout',(req,res)=>{
    req.logout()
    res.redirect('/campground')


})

app.post('/campground/:id/reviews',async(req,res)=>{
    const {id}=req.params;
    const campground=await Campground.findById(id)
    const review=new Review({...req.body.review})
    review.author=req.user._id;
   // console.log(review)
    campground.reviews.push(review)
    //console.log(campground)
    await campground.save()
    await review.save()
    res.redirect(`/campground/${id}`)
})


app.delete('/campground/:id/reviews/:reviewsId',async (req,res)=>{
    const {id,reviewsId}=req.params
  
   await Campground.findByIdAndUpdate(id,{$pull:{reviews:reviewsId}})
   await Review.findByIdAndDelete(reviewsId)
   res.redirect(`/campground/${id}`);
})



app.listen(port,(req,res)=>{
    console.log("App has started")
})