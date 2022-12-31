//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const itemSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  }
})
const Item = mongoose.model("Items", itemSchema);

const listSchema = mongoose.Schema({
  name: {
    type: String,
    required: true, 
  },
  items: [itemSchema],
})
const List = mongoose.model("List", listSchema);

const item1 = new Item({name: "Welcome to your todolist!"});
const item2 = new Item({name: "Hit the + button to add new items."});
const item3 = new Item({name: "<-- Hit this to delete an item."});

const defaultItems = [item1, item2, item3];

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];

const workItems = [];

app.get("/", function(req, res) {

  const day = date.getDate();
  const items = [];
  Item.find({}, (err, docs) => {
    if (err) {
      console.log(err);
    } else {
      if (docs.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Inserted 3 items.");
            res.redirect("/")
          }
        })
      }

      docs.forEach(doc => {
        items.push(doc);
      });

      res.render("list", {listTitle: day, newListItems: items});
    }

  })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const day = date.getDate();

  const newItem = new Item({  
    name: itemName,
  });

  if (listName === day) {
    newItem.save();
    res.redirect("/");
  } else {

    List.findOne({name: listName}, (err, foundList) => {
      if (!err) {
        if (listName === day) {
          newItem.save();
          res.redirect("/");
        }
        foundList.items.push(newItem)
        foundList.save();
        res.redirect("/" + listName);
      }
    })
  }
});

app.post("/delete", (req, res) => {
  const itemToDeleteID = req.body.checkbox;
  const listName = req.body.listToDelete[0];
  const day = date.getDate();

  if (listName === day) {
    Item.deleteOne({_id: itemToDeleteID}, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted item with id: " + itemToDeleteID);
      }
    })
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      if (!err) {
        foundList.updateOne({$pull: {items: {_id: itemToDeleteID}}}, (err) => {
          if (err) {
            console.log(err);
          }
          res.redirect("/" + listName);
        })

      }
    })
  }



})

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, list) => {
    if (!err) {
      if (list !== null) {
        res.render("list", {listTitle: customListName, newListItems: list.items});
      } else {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      }
    }
  });

})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
