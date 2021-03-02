const { func } = require("joi");

module.exports=func=>{
    return (req,res,next)=>{
        func(req,res,next).catch(next);
    }
}