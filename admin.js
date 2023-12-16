const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

const blog = require("./models/person");
const Add = require("./models/add");
const manager = require("./models/manager");
const topics = require("./models/topic");
const session = require("express-session");

function checkSignIn(req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.redirect('/adminLogin');
    const err = new Error('Unauthorized');
    next(err);
  }
}

router.get("/adminlogin", (req, res) => {
  const data = "";
  res.render("adminLogin", { data: data });
});



router.get("/admin",checkSignIn, (req, res) => {
  const message = req.query.message || "";

  blog.find((err, response) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching data");
    }

    res.render("admin", { data: response, message: message });
  });
});


router.post("/adminlogin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json("All fields must be filled");
  }

  try {
    const adminUser = await blog.findOne({ email, password });
    req.session.admin = adminUser;
    if (adminUser && email === "admin@gmail.com" && password === "admin123") {
     
      // console.log('Admin login successful');
      return res.redirect("/admin");
    } else {
      // console.log('Invalid email or password');
      const data = "You are not an admin"; 
      return res.status(401).render("adminLogin", { data: data });
    }
  } catch (error) {
    console.error(error.message);
    const data = "Invalid email or password"; 
    return res.status(400).render("adminLogin", { data: data });
  }
});

  
  router.get("/acceptPerson/:personId", async (req, res) => {
    const personId = req.params.personId;
  
    try {
      const updatedPerson = await blog.findByIdAndUpdate(
        personId,
        { $set: { status: 1 } },
        { new: true }
      );
  
      if (!updatedPerson) {
        return res.status(404).send("Person not found");
      }
  
      res.redirect("/admin?message=accepted");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating status");
    }
  });


  router.get("/deletePerson/:personId", async (req, res) => {
    const personId = req.params.personId;
  
    try {
      const deletedPerson = await blog.findByIdAndUpdate(
        personId,
        { $set: { status: 2 } },
        { new: true }
      );
  
      if (!deletedPerson) {
        return res.status(404).send("Person not found");
      }
  
      res.redirect("/admin?message=deleted");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating status");
    }
  });


router.get('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const person = await manager.findById(id);

    if (!person) {
      return res.status(404).send('Person not found');
    }

    await manager.findByIdAndUpdate(id, { status: 2 });

   
    // await manager.findByIdAndDelete(id);      this code is to  delete the data from database permanently

    res.redirect('/adminTopicManager');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/accept/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const person = await manager.findById(id);

    if (!person) {
      return res.status(404).send('Person not found');
    }

    await manager.findByIdAndUpdate(id, { status: 1 });

   
    // await manager.findByIdAndDelete(id);      this code is to  delete the data from database permanently

    res.redirect('/adminTopicManager');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get("/adminTopicManager", checkSignIn, async (req, resp) => {
  manager.find(function(req, res){
     topics.find(function(reqest,response){
      resp.render("adminTopicManager", { managers :res ,data:response});
    console.log(res)
  // try {
  //   const managers = await manager.find();
  //   const topic = await topics.find(); 
  //   res.render("adminTopicManager", { managers , data : topic});
  // } catch (error) {
  //   console.error("Error fetching managers:", error);
  //   res.status(500).json({ error: "Internal Server Error" });
  // }
});  }) })


router.get('/assign', checkSignIn, (req, res) => {
  topics.find((err, response) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching data");
    }

    res.render("assign", { data: response, error: " " });
  });

});

router.get('/assign', (req, res) => {
  topics.find((err, response) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching data");
    }

    res.render("assign", { data: response, error: " " });
  });
});

router.post('/assign', async (req, res) => {
  const { name, email, topic, password } = req.body;

  try {
    const existingEmail = await manager.findOne({ email });
    if (existingEmail) {
      const response = await topics.find(); // Retrieve data again
      return res.status(400).render('assign', { data: response, error: "This email already exists" });
    }

    const existingTopic = await manager.findOne({ topic });
    if (existingTopic) {
      if (existingTopic.status !== 2) {
        const response = await topics.find(); // Retrieve data again
        return res.status(400).render('assign', { data: response, error: "There is already a topic manager for this topic" });
      }
    }

    const newManager = new manager({
      name,
      email,
      topic,
      password,
      status: 1,
    });

    await newManager.save();
    console.log(newManager);

    const response = await topics.find(); // Retrieve data again
    res.render("assign", { data: response, error: " " }); // Render with updated data
  } catch (error) {
    console.error('Error inserting data into the manager schema:', error);
    const response = await topics.find(); // Retrieve data again
    res.status(500).render('assign', { data: response, error: 'Internal Server Error' });
  }
});




router.get('/addtopics',checkSignIn , (req, res) => {
  res.render('addTopics', {data: " "}); 
});

router.post("/addtopics", function (req, res) {
  var personInfo = req.body;

  if (!personInfo.topic) {
    res.render("addTopics", { data: "Please provide a topic" });
  } else {
    // Check if the topic already exists in the database
    topics.findOne({ topic: personInfo.topic }, function (err, existingTopic) {
      if (err) {
        res.send("Database error");
      } else {
        if (existingTopic) {
          // Topic already exists, render an error message
          res.render("addTopics", { data: "This topic is already declared" });
        } else {
          // Topic does not exist, save it to the database
          var addtopic = new topics({
            topic: personInfo.topic,
          });

          addtopic.save(function (err, createdItem) {
            if (err) {
              res.send("Database error");
            } else {
              res.render("addTopics", { data: "Topic has been added successfully" });
            }
          });
        }
      }
    });
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


module.exports = router;