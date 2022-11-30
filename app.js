const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
dotenv.config();
const port = process.env.PORT || 5000;
// passing json
app.use(express.json())
app.use(cors())


// mongodb connection string
const uri = `mongodb+srv://${process.env.DD_USER}:${process.env.DB_PASSWORD}@cluster0.fotdr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {

        // set all collection
        const productsCollection = client.db("LaptopDokan").collection("products");
        const categoriesCollection = client.db("LaptopDokan").collection("categories");
        const userCollection = client.db("LaptopDokan").collection("users");
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

        // get user 
        app.get('/user/:id', async (req, res) => {
            const email = req.params.id;
            const exitingUser = await userCollection.findOne({ email: email });
            res.send({
                user: exitingUser
            });
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