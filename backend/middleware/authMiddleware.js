const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // Safety check: ensure header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).send("A valid Bearer token is required for authentication");
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next(); // Move 'next()' inside the try block or right after
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
};

module.exports = verifyToken;