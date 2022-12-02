const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();
const port = process.env.PORT || 5000;
// passing json
app.use(express.json())
app.use(cors())


// mongodb connection string
const uri = `mongodb+srv://${process.env.DD_USER}:${process.env.DB_PASSWORD}@cluster0.fotdr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];;
    jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


const run = async () => {
    try {

        // set all collection
        const productsCollection = client.db("LaptopDokan").collection("products");
        const categoriesCollection = client.db("LaptopDokan").collection("categories");
        const userCollection = client.db("LaptopDokan").collection("users");
        const orderCollection = client.db("LaptopDokan").collection("orders");
        // setup routing
        app.get('/', (req, res) => {
            res.send('Hello world')
        })

        // find categories
        app.get('/categories', async (req, res) => {
            const cursor = {};
            const result = await categoriesCollection.find(cursor).toArray();
            res.send(result)
        })

        // get categories product
        app.get('/categories/:id', async (req, res) => {
            const categoriesId = req.params.id;
            const cursor = { category_id: categoriesId };
            const result = await productsCollection.find(cursor).toArray();
            res.send(result)
        })
        //a sellers products
        app.get('/myproduct/:email', async (req, res) => {
            const email = req.params.email;
            const myProduct = await productsCollection.find({ seller_email: email }).toArray();
            res.send(myProduct);
        })
        // add a product 
        app.post('/myproduct', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            console.log(result)
            if (result) {
                res.send(result)
            } else {
                res.send({
                    acknowledged: false
                })
            }
        })
        // booking product
        app.post('/booking', verifyJWT, async (req, res) => {
            const bookingData = req.body;
            const email = bookingData.userEmail;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const result = await orderCollection.insertOne(bookingData);
            if (result) {
                res.send(result)
            } else {
                res.send({
                    acknowledged: false
                })
            }
        })
        // get Buyers orders
        app.get('/myorder/:email', async (req, res) => {
            const email = req.params.email;
            const orders = await orderCollection.find({ userEmail: email }).toArray();
            res.send(orders)
        })
        // create jsonwebtoken 
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const exitingUser = await userCollection.findOne({ email: email });
            if (exitingUser) {
                const token = await jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });
                res.send({
                    token: token
                });
            } else {
                res.status(403).send({
                    message: "unauthorize user"
                })
            }

        })


        // get user 
        app.get('/user/:id', async (req, res) => {
            const email = req.params.id;
            const exitingUser = await userCollection.findOne({ email: email });
            res.send({
                user: exitingUser
            });
        })
        // get all buyers
        app.get('/buyers', async (req, res) => {
            const query = { role: "bayer" }
            const bayer = await userCollection.find(query).toArray();
            res.send(bayer)
        })
        app.get('/sellers', async (req, res) => {
            const query = { role: "seller" }
            const seller = await userCollection.find(query).toArray();
            res.send(seller)
        })
        // create user
        app.post('/user', async (req, res) => {
            const user = req.body;
            const exitingUser = await userCollection.findOne({ email: user.email });
            if (exitingUser === null) {
                const result = await userCollection.insertOne(user);
                res.send(result)
            } else {
                res.send({
                    acknowledged: false
                })
            }


        })
        //  delete a user 
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result)
            console.log(result)
        })
        // make a user admin
        app.put('/user/admin/:email', async (req, res) => {

            const email = req.params.email;
            console.log(email)
            res.send(email)
            const filter = { email }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
                // role
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        //  check admin
        app.get('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        //  check bayer
        app.get('/user/bayer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isBayer: user?.role === 'bayer' });
        })
        //  check seller
        app.get('/user/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        })

    } catch (err) {
        console.log(err)
    }
}
run().catch(err => {
    console.log(err)
})



// set not found handlers
app.use((req, res, next) => {
    res.status(404).json({
        msg: "page was not found"
    })
})

//  set default error handlers
app.use((err, req, res, next) => {
    console.log('default error')
})

// start server
app.listen(port, (err) => {
    if (!err) {
        console.log(`server running port ${port}...`)
    }
})


// 00005C  3B185F