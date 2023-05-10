const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://username:password@host:port//todolistDB?retryWrites=true&w=majority',
{
    useNewUrlParser: true,
    useUnifiedTopology: true
}
).then(()=>{
console.log("Database connected");
});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Buy Food"
});
const item2 = new Item({
    name: "cook Food"
});
const item3 = new Item({
    name: "eat Food"
});

const defaultItems = [item1, item2, item3];

//new schema for customlist
const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req,res){

    Item.find({}).then(function(foundItems){
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems).then(function(){
                console.log("Successfully saved defult items to DB");
              }).catch(function (err) {
                console.log(err);
              });
              res.redirect("/");
        } else {
        res.render("list", {listTitle:"Today", newListItems: foundItems });
        }

      }).catch(function (err) {
        console.log(err);
      });

});


app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}).then(function(foundList){
            if( !foundList){
                //create a new list
                const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect('/' + customListName);
        } else {
            //show existing list
            res.render("list", {listTitle: foundList.name , newListItems: foundList.items } );
            }
      }).catch(function (err) {
        console.log(err);
      });
});



app.post("/", function(req,res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
    
    const item = new Item({
        name : itemName
    });

    if (listName ==="Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}).then( function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        });
    }

});


app.post("/delete" , function(req, res){
    const checkedItemId = req.body.checkbox;

    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndRemove(checkedItemId).then(function(){
            console.log("Successfully deleted item from DB");
          }).catch(function (err) {
            console.log(err);
          });
          res.redirect("/");

    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then( function (foundItems){
            res.redirect("/" + listName);

        });
    }

});

app.get("/about", function(req,res){
    res.render("about");
});

app.listen(3000, function(){
    console.log("server running at port 3000");
});