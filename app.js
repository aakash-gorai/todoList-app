const express = require("express");
const bodyParser = require("body-parser");
const { response } = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine',"ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const uri = "mongodb+srv://admin-elprofesor:835204@cluster0.uf2isqp.mongodb.net/todolistDB";

mongoose.connect(uri,(err)=>{
    if(err){
        console.log(err);
    }else{
        console.log("Connected to db");
    }
});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item"
});

const item3 = new Item({
    name: "<-- Hit this to delte a item"
});

const defaultItems =[item1, item2, item3];

const listsSchema = { 
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List",listsSchema);

app.get("/",function(req,res){
   Item.find({},function(err,foundItems){
    if(foundItems.length === 0){
        Item.insertMany(defaultItems,function(err){
            if(err)
            console.log(err);
            else
            console.log("successfully saved to db")
        });
        res.redirect("/"); 
    } 
    else{
            res.render("list",{listTitle:"Today",newListItems:foundItems});
        }   
    });
});

app.get("/:customListName", function(req,res){
   const customListName = _.capitalize(req.params.customListName);
   
   List.findOne({name:customListName},function(err,foundList){
    if(!err){
        if(!foundList){
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        }else{
            res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
        }
    }
   })
});
app.post("/",async function(req,res){
    const itemName =  req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        await item.save((err,test)=>{
            if(err)
            console.log(err);
            else{
                console.log("Data saved");
                res.redirect("/");
            }
            
        });
    }else{
        List.findOne({name:listName},function(err,foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName)
        });
    }
});

app.post("/delete",async function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName === "Today"){
        try {
            const res = await Item.findByIdAndRemove(checkedItemId);
            
        } catch (error) {
        }
       
        res.redirect("/");
    }else{
        List.findOneandUpdate({name:listName},{$pull:{items:{__id:checkedItemId}}},await function(err,foundList){
            if(!err){
                res.redirect("/" + listName);
            }
        })
    }

    
});

app.listen(process.env.PORT || 3000,function(req,res){
    console.log("Server has started");
})