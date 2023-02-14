//importing packages
const express = require('express');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const path = require('path');

//firebase admin setup
let serviceAccount = require("./clay-fabric-19bd5-firebase-adminsdk-vvr0c-ae3a9f3398.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

//declare static path
let staticPath = path.join(__dirname, "public");

//initializing express.js
const app = express();

//middleware
app.use(express.static(staticPath));
app.use(express.json());

//route
//home route
app.get("/", (req, res) => {
    res.sendFile(path.join(staticPath, "public", "index.html"));
})

//signup route
app.get('/signup', (req, res) => {
    res.sendFile(path.join(staticPath, "signup.html"));
})

app.post('/signup', (req, res) => {
    let { name, email, password, number, tac, notification} = req.body;

    // form validation
    if(name.length < 3){
        return res.json({'alert': 'name must be 3 letters long'});
    } else if(!email.length){
        return res.json({'alert': 'enter your email'});
    } else if(password.length < 8){
        return res.json({'alert': 'password should be 8 characters long'});
    } else if(!number.length){
        return res.json({'alert': 'enter your phone number'});
    } else if(!Number(number) || number.length < 10){
        return res.json({'alert': 'invalid number, please enter a valid one'});
    } else if(!tac){
        return res.json({'alert' :'you must agree to our terms and conditions'});
    }

    //store user in db
    db.collection('users').doc(email).get()
    .then(user => {
        if(user.exists){
            return res.json({'alert': 'email already exists'});
        } else{
            // encrypt the password before storing it.
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, (err, hash) => {
                    req.body.password = hash;
                    db.collection('users').doc(email).set(req.body)
                    .then(data => {
                        res.json({
                            name: req.body.name,
                            email: req.body.email,
                            seller: req.body.seller
                        })
                    })
                })
            })
        }
    })
})

//login route
app.get('/login', (req, res) => {
    res.sendFile(path.join(staticPath, 'login.html'));
})

app.post('/login', (req, res) => {
    let { email, password } = req.body;

    if(!email.length || !password.length){
        return res.json({'alert': 'fill up all the fields'})
    }

    db.collection('users').doc(email).get()
    .then(user => {
        if(!user.exists){ // if the email does not exist
            return res.json({'alert': 'email does not exists'});
        } else{
            bcrypt.compare(password, user.data().password, (err, result) => {
                if(result){
                    let data = user.data();
                    return res.json({
                        name: data.name,
                        email: data.email,
                        seller: data.seller,
                    });
                } else{
                    return res.json({'alert': 'password is incorrect'});
                }
            })
        }
    })
})

// seller route
app.get('/seller', (req, res) => {
    res.sendFile(path, join(staticPath, "seller.html"));
})

app.post('/seller', (req,res) => {
    let { name, address, about, number, tac, legit,email} = req.body;
    if(!name.length || !address.length || !about.length || number.length < 10 || !Number(number)){
        return res.json({'alert':'some information(s) is/are invalid'});
    } else if(!tac || !legit){
        return res.json({'alert': 'you must agree to our terms and conditions'});
    } else{
        // update user seller status here
        db.collection('sellers').doc(email).set(req.body)
        .then(data => {
            db.collection('users').doc(email).update({
                seller: true
            }).then(data => {
                res.json(true);
            })
        })
    }
})

// add product
app.get('/add-product', (req, res) => {
    res.sendFile(path.join(staticPath, "addProduct.html"))
})

app.get('/add-product/:id', (req, res) => {
    res.sendFile(path.join(staticPath, "addProduct.html"))
})

app.post('/add-product', (req, res) => {
    let { name, shortDes, des, images, sizes, actualPrice, discount, sellPrice, stock, tags, tac, email, draft, id} = req.body;

    //validation
    if(!draft){
        if(!name.length){
            return res.json({'alert': 'enter product name'});
         } else if(shortDes.length > 100 || shortDes.length < 10){
             return res.json({'alert': 'short description should be between 10 to 100 letter lines'});
         } else if(!des.value.length){
             return res.json({'alert': 'enter detail description about the product'});
         } else if(!images.length){ //image line array
             return res.json({'alert': 'upload at least one product image'});
         } else if(sizes.length){ // size array
             return res.json({'alert': 'select at least one size'});
         } else if(!actualPrice.length || discount.length || sellPrice.length){
             return res.json({'alert': 'you must add prices'});
         } else if(stock.length < 20){
             return res.json({'alert': 'you should at least have 20 items in stock'});
         } else if(!tags.length){
             return res.json({'alert': 'enter few tags to help ranking your product in search'});
         } else if(!tac){
             return res.json({'alert': 'you must agree to our terms and conditions'});
         }
    }

     //add product
     let docName = id == undefined ? `${name.toLowerCase()}-${math.floor(Math.random() * 5000)}` : id;
     db.collection('products').doc(docName).set(req.body)
     .then(data => {
        res.json({'product': 'name'});
     })
     .catch(err => {
        return res.json({'alert': 'some error occured. Try again'});
     })
})

//get products
app.post('/get-products', (req, res) => {
    let { email, id, tag } = req.body;
    
    where('email', '==', email)

    if(id){
       docRef = db.collection('products').doc(id)
    } else if(tag){
        docRef = db.collection('products').where('tags', 'array-contains', tag)
    } else{
       docRef = db.collection('products').where('email', '==', email)
    }

    docRef.get()
    .then(products => {
        if(products.empty){
            return res.json('no products');
        }
        let productArr = [];
        if(id){
            return res.json(products.data());
        } else{
            products.forEach(item => {
                let data = item.data();
                data.id = item.id;
                productArr.push(data);
            })
            res.json(productArr)
        }
    })
})

app.post('/delete-product', (req, res) => {
    let {id} = req.body;

    db.collection('products').doc(id).delete()
    .then(data => {
        res.json('success');
    }).catch(err => {
        res.json('res');
    })
})

// product page
app.get('/products/:id', (req, res) => {
    res.sendFile(path.join(staticPath, "product.html"));
})

// search
app.get('/search/key', (req, res) => {
    res.sendFile(path.join(staticPath, "search.html"));
})

//cart
app.get('/cart', (req, res) => {
    res.sendFile(path.join(staticPath, "cart.html"));
})

//404 route
app.get('/404', (req, res) => {
    res.sendFile(path.join(staticPath, "404.html"));
})
app.use((req, res) => {
    res.redirect('/404');
})

app.listen(3000, () => {
    console.log('listening on port 3000...');
})