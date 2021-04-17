const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const ObjectId = require("mongodb").ObjectID;
const fileUpload = require("express-fileupload");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("employee"));
app.use(fileUpload());

const port = 5000;

app.get("/", (req, res) => {
    res.send("hello from db it's working working");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bqpid.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
client.connect((err) => {
    console.log(err);
    const employeeCollection = client.db("motofix").collection("employee");
    const appointmentCollection = client.db("motofix").collection("appointments");
    const serviceCollection = client.db("motofix").collection("services");

    app.post("/addAppointment", (req, res) => {
        const appointment = req.body;
        appointmentCollection.insertOne(appointment).then((result) => {
            res.send(result.insertedCount > 0);
        });
    });

    app.get("/appointments", (req, res) => {
        appointmentCollection.find({}).toArray((err, documents) => {
            res.send(documents);
        });
    });

    app.post("/appointmentsByDate", (req, res) => {
        const date = req.body;
        const email = req.body.email;
        employeeCollection.find({ email: email }).toArray((err, doctors) => {
            const filter = { date: date.date };
            if (doctors.length === 0) {
                filter.email = email;
            }
            appointmentCollection.find(filter).toArray((err, documents) => {
                console.log(email, date.date, doctors, documents);
                res.send(documents);
            });
        });
    });
    //add Employees
    app.post("/addEmployee", (req, res) => {
        const file = req.files?.file;
        const name = req.body.name;
        const email = req.body.email;
        const newImg = file?.data;
        const encImg = newImg?.toString("base64");
        console.log(name, email, file);

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, "base64"),
        };

        employeeCollection.insertOne({ name, email, phone, image }).then((result) => {
            res.send(result.insertedCount > 0);
        });
    });
    //Find Employee
    app.get("/employee", (req, res) => {
        employeeCollection.find({}).toArray((err, documents) => {
            res.send(documents);
        });
    });

    //add Services
    app.post("/addService", (req, res) => {
        const file = req.files?.file;
        const serviceName = req.body.serviceName;
        const serviceCharge = req.body.serviceCharge;
        const serviceInfo = req.body.serviceInfo;
        const newImg = file?.data;
        const encImg = newImg?.toString("base64");
        console.log(serviceName, serviceCharge, file);

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, "base64"),
        };

        serviceCollection.insertOne({ serviceName, serviceCharge, serviceInfo,  image }).then((result) => {
            res.send(result.insertedCount > 0);
        });
    });

    //Find Services
    app.get("/services", (req, res) => {
        serviceCollection.find({}).toArray((err, documents) => {
            res.send(documents);
        });
    });

    //delete service by id
    app.delete("/delete/:id", (req, res) => {
        const id = ObjectId(req.params.id);
        serviceCollection.findOneAndDelete({ _id: id }).then((documents) => {
            res.send(!!documents.value);
        });
    });

    //find service by id
    app.get("/service/:id", (req, res) => {
        serviceCollection
            .find({ _id: ObjectId(req.params.id) })
            .toArray((err, items) => {
                res.send(items[0]);
            });
    });

    app.post("/isDoctor", (req, res) => {
        const email = req.body.email;
        employeeCollection.find({ email: email }).toArray((err, doctors) => {
            res.send(doctors.length > 0);
        });
    });
});

app.listen(process.env.PORT || port);
