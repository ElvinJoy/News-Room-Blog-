const express = require("express");
const router = express.Router();

const blog = require("./models/person");
const Add = require("./models/add");
const topics = require("./models/topic");
const Manager = require("./models/manager");

function checkSignIn(req, res, next) {
  if (req.session.manager) {
    next();
  } else {
    res.redirect('/signup');
    const err = new Error('Unauthorized');
    next(err);
  }
}

router.get('/topicManagerLogin', function(req, res) {
  res.render("topicManagerLogin", { data: " " });
});

router.post('/topicManagerLogin', async function(req, res) {
  var managerInfo = req.body;

  if (!managerInfo.email || !managerInfo.password) {
    return res.render('topicManagerLogin', {
      data: 'Please provide both email ID and password.',
    });
  }

  try {
    const managerData = await Manager.findOne({
      email: managerInfo.email,
      password: managerInfo.password,
    });
    console.log(managerData.topic)
    if (!managerData) {
      return res.render('topicManagerLogin', {
        data: 'Invalid email or password.',
      });
    }

    if (managerData.status === 2) {
      return res.render('topicManagerLogin', {
        data: 'You have been revoked by admin',
        type: 'error',
      });
    }

    req.session.manager = managerData;
    return res.redirect('/topicManager');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }
});



router.get('/topicManager',checkSignIn, async (req, res) => {
  try {
    const manager = req.session.manager;
    const adds = await Add.find();
    const topic = await topics.find();
    const managersData = await Manager.find({}); 

    res.render('topicManager', { adds, topic, managersData , manager});
  } catch (error) {
    console.error('Error fetching data from the database:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/delete/:id', async (req, res) => {
  try {
    const removedArticle = await Add.findByIdAndDelete(req.params.id);
    if (!removedArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.redirect('/topicManager'); 
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({ message: 'Error in deleting article' });
  }
});


router.get("/acceptarticle/:Id", async (req, res) => {
  const Id = req.params.Id;

  try {
    const updatedid = await Add.findByIdAndUpdate(
      Id,
      { $set: { status: 1 } },
      { new: true }
    );

    if (!updatedid) {
      return res.status(404).send("Person not found");
    }

    res.redirect("/topicManager?message=accepted");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating status");
  }
});






router.get('/Logout', function(req, res) {
  if (req.session) {
    req.session.destroy(function(err) {
      console.log("user logged out.");
      if (err) {
        return next(err);
      } else {
        return res.render('topicManagerLogin');
      }
    });
  }
});

module.exports = router;
