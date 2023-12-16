const express = require("express");
const router = express.Router();

const blog = require("./models/person");
const Add = require("./models/add");
const manager = require("./models/manager");
const topics = require("./models/topic");



function checkSignIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/signup');
    const err = new Error('Unauthorized');
    next(err);
  }
}

router.get('/topicManagerLogin', function(req , res){
  res.render("topicManagerLogin",{
    data : " "
  })
});


router.post('/topicManagerLogin', async (req, res) => {
  const personInfo = req.body;
  const data = 'Invalid email or password';

  try {
    var managers = await manager.findOne({ email: personInfo.email, password: personInfo.password });
    if (managers) {
        if ( managers.status === 1) {
          req.session.user = managers;
          res.redirect('/topicManager');
        } else if (managers.status === 2) {
          res.render("topicManagerLogin", { data: 'You have been banned' });
        } else {
          res.render("topicManagerLogin", { data: 'Invalid manager details' });
        }
     
    } else {
      res.render("topicManagerLogin", { data: data });
    }
  } catch (err) {
    console.error(err);
    res.send('Error checking login credentials');
  }
});


router.get('/topicManager', async (req, res) => {
  try {
      const adds = await Add.find();
      const topic = await topics.find(); 
      res.render('topicManager', { adds ,}); 
  } catch (error) {
      console.error('Error fetching data from the database:', error);
      res.status(500).send('Internal Server Error');
  }
});


router.get('/Logout', function(req, res) {
  if (req.session) {
    req.session.destroy(function(err) {
      console.log("user logged out.");
      if (err) {
        return next(err);
      } else {
        return res.render('adminLogin');
      }
    });
  }
});




module.exports = router;