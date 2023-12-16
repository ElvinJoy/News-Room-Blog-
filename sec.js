const express = require("express");
const router = express();
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;

mongoose.connect("mongodb://localhost/blogstorage");

var blog = require("./models/person");
const Add = require("./models/add");
const topics = require("./models/topic");
const Topic = require("./models/topic");

router.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

function checkSignIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/signup');
    const err = new Error('Unauthorized');
    next(err);
  }
}

router.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).render('login');
});


router.get('/dashboard', checkSignIn, async (req, res) => {
  try {
    const topic = await topics.find(); 
    const adds = await Add.find({ status: 0 });
    const blogs = await blog.find(); 
    // console.log(topic,adds,blogs);

    res.render('blog', { adds, data: topic ,blogs:blogs});
  } catch (error) {
    console.error('Error fetching adds or topics:', error);
    res.status(500).send('Internal Server Error');
  }
});

// router.get("/dashboard", checkSignIn, async  (req, res) => {
//   try {
//     var topics = await Topic.find();
//     const store = await Add.find({ status: 0 }).exec();
//     const blogs = await blog.find({});
//     res.render("blog/", { store , topics , blogs});
//   } catch (err) {
//     console.error("Error fetching data from the database:", err);
//     res.render("blog", { error: "Error fetching data from the database" });
//   }
// });



router.get("/signup", (req, res) => {
  res.render("signup", {data : " "});
});


router.post("/signup", async (req, res) => {
  try {
    const personInfo = req.body;

    const existingUser = await blog.findOne({ email: personInfo.email });
    if (existingUser) {
      return res.render("signup", {data : "You can't use this email because the email is currently in use"});
    } else {
      const hashedPassword = await bcrypt.hash(personInfo.password, saltRounds);

      const newblog = new blog({
        name: personInfo.name,
        email: personInfo.email,
        password: hashedPassword,
        status: personInfo.status,
      });

      req.session.user = newblog;
      // Save the new user
      await newblog.save();
      res.redirect("/dashboard");
    }
  } catch (err) {
    console.error(err);
    res.send("Error signing up");
  }
});


router.get("/loginForm", (req, res) => {
  res.render("loginForm.ejs", {
    data: " ",
  });
});


router.post('/loginForm', async (req, res) => {
  const personInfo = req.body;
  const data = 'Invalid email or password';

  try {
    var User = await blog.findOne({ email: personInfo.email });

    if (User) {
      const passwordMatch = await bcrypt.compare(personInfo.password, User.password);
      if (passwordMatch) {
        if (User.status === 0 || User.status === 1) {
          req.session.user = User;
          res.redirect('/dashboard');
        } else if (User.status === 2) {
          res.render("loginForm", { data: 'You have been banned' });
        } else {
          res.render("loginForm", { data: 'Invalid user status' });
        }
      } else {
        res.render("loginForm", { data: data });
      }
    } else {
      res.render("loginForm", { data: data });
    }
  } catch (err) {
    console.error(err);
    res.send('Error checking login credentials');
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


router.get("/addArticle",checkSignIn ,  function(req, res) {
  topics.find((err, response) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching data");
    }

    res.render("addArticle", { data: response, error: " " });
  });
});



router.post('/addArticle', async function(req, res) {
  const { title, topic, content } = req.body;

  if (!title || !topic || !content) {
    res.status(401).json("All fields must be filled");
    return;
  }

  try {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const response = await Add.create({
      name: req.session.user.name,
      user_id: req.session.user._id,
      title,
      topic,
      content,
      Date: date,
      status: 0,
    });

    console.log('added');
    res.redirect("/dashboard");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// router.get("/manageArticles", checkSignIn, async (req, res) => {
//   try {
//     const user_id = req.session.user._id;
//     console.log(user_id);
    
//     // Retrieve articles based on user_id
//     const articles = await Add.find({ user_id });

//     // Extract topic IDs from articles
//     const topicIds = articles.map(article => article.topic);
//     console.log("topicIds", topicIds);

//     // Retrieve topics based on topic IDs using Promise.all
//     const topicsData = await Promise.all(topicIds.map(topicId => Topic.findById(topicId)));
//     console.log("topicsData", topicsData);

//     console.log(articles);
//     res.render("manageArticles", { articles, topicsData });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });


router.get("/manageArticles", checkSignIn, async (req, res) => {
  try {
    const user_id = req.session.user._id
    var Topic = await  topics.find();
    const data = await Add.find({ status: 0, user_id }).exec();
    const blogs = await blog.find({});
    res.render("manageArticles" , { data , Topic , blogs});
  } catch (error) {
    console.error("Error in fetching articles:", error);
    res.status(500).json({ message: 'Error in fetching articles' });
  }
});

router.get("/update/:id", checkSignIn, async function (req, res) {
  try {
    const { id } = req.params;
    var Topic = await topics.find();
    const person = await Add.findById(id);
    res.render("update", { person , Topic });
  } catch (err) {
    console.error("Error finding person for update:", err);
    res.json({ message: "Error finding person for update" });
  }
});

router.post("/update/:id", async function (req, res) {
  try {
    const updatedBlog = await Add.findByIdAndUpdate(req.params.id, req.body, { new: true });
    console.log(updatedBlog);
    res.redirect("/dashboard?message=updated");
  } catch (err) {
    console.error("Error updating blog:", err);
    res.json({ message: "Error updating blog" });
  }
});

router.get('/remove/:id', async (req, res) => {
  try {
    const removedArticle = await Add.findByIdAndDelete(req.params.id);
    if (!removedArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.redirect('/dashboard'); 
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({ message: 'Error in deleting article' });
  }
});


router.get('/Logout', function(req, res) {
  const data = 'Invalid email or password';
  if (req.session) {
    req.session.destroy(function(err) {
      console.log("user logged out.");
      if (err) {
        return next(err);
      } else {
        return res.render('loginForm', {data : data });
      }
    });
  }
});

module.exports = router;
