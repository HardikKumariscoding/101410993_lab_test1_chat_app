const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();


router.post("/signup", async (req, res) => {
    const { username, firstname, lastname, password } = req.body;

    if (!username || !firstname || !lastname || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        console.log("Checking if username exists...");
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log("Username already exists");
            return res.status(400).json({ message: "Username already taken" });
        }

        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("Creating new user...");
        const user = new User({ username, firstname, lastname, password: hashedPassword });

        await user.save();
        console.log("User saved successfully");

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Error registering user" });
    }
});


router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id }, "your-hardcoded-secret", { expiresIn: "1h" });

        res.json({ token, username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error logging in" });
    }
});

module.exports = router;
