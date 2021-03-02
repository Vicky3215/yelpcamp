const campground = require("./models/campground")

module.exports.isLoggedIn=(req,res,next)=>{
   console.log("user is")
   console.log(req.isAuthenticated())
    if(!req.isAuthenticated()){

     return  res.redirect('/login')
    }

    next()
}

