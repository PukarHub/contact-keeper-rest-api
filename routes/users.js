const express = require('express');
const router = express.Router();
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');
const config = require('config')

const { body, validationResult } = require('express-validator');

// @route POST api/users
// @desc   Register a user
// @access Public 
router.post('/', 
    //Using Express Validator
    [
        body('name', 'Please include a name').not().isEmpty(),
        body('email', 'Please include a valid email').isEmail(),
        body('password', 'Please include a password with 6 or more characters').isLength({ min: 6 }),
    ]
    , async (req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email })

    if(user) {
        res.status(400).json({ msg: 'User Already Exist' });
    }

    user = new User({ 
        name,
        email,
        password
    });

    //Hash Password Before Save to DB
    const salt = await bcrypt.genSaltSync(10);

    user.password = await bcrypt.hash(password, salt)

    await user.save(); 
    
    // Configuring with Json Web Token
    const payload = {
        user: {
            id: user.id
        }
    }

    jwt.sign(payload, config.get("jwtSecret"), {
        expiresIn: 360000
    }, (err,token) => {
        if(err) throw err;
        res.json({ token });
    })

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

module.exports = router;