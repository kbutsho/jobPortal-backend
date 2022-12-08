const errorFormatter = require("../middleware/errorFormatter");
const Admin = require("../models/Admin.model");
const Candidate = require("../models/Candidate.model");
const Manager = require("../models/Manager.model");
const User = require("../models/User.model");
const { signupService, findUserByEmail } = require("../services/user.service");
const { generateToken } = require("../utilities/token");

exports.signUpController = async (req, res) => {
    try {
        await signupService(req.body);
        res.json({
            "status": 200,
            "message": "registration successful!",
        })
    } catch (error) {
        res.json({
            "status": 400,
            "message": "registration failed!",
            "error": errorFormatter(error.message)
        })
    }
}
exports.loginController = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email && !password) {
            return res.json({
                "status": 401,
                "message": "login failed!",
                "error": {
                    "email": "email is required!",
                    "password": "password is required!"
                }
            })
        }
        else if (!email) {
            return res.json({
                "status": 401,
                "message": "login failed!",
                "error": {
                    "email": "email is required!"
                }
            })
        }
        else if (!password) {
            return res.json({
                "status": 401,
                "message": "login failed!",
                "error": {
                    "email": "password is required!"
                }
            })
        }
        else {
            const credential = await findUserByEmail(email);
            if (!credential) {
                return res.json({
                    "status": 401,
                    "message": "no user found!",
                    "error": {
                        "email": "email not exist!"
                    }
                })
            } else {
                const isPasswordValid = credential.comparePassword(password, credential.password);
                if (!isPasswordValid) {
                    return res.json({
                        "status": 403,
                        "message": "password not match!",
                        "error": {
                            "password": "password not match!"
                        }
                    })
                }
                if (credential.role === "candidate") { 
                    const candidate = await Candidate.findOne({userId: credential._id})
                    if (candidate.status != "active") {
                        return res.json({
                            status: 403,
                            message: "your account is block! try again later!",
                        })
                    }
                    else {
                        const token = generateToken(candidate)
                        res.json({
                            status: 200,
                            message: "login successful",
                            data: {
                                token, candidate
                            }
                        })
                    }
                }
                else if (credential.role === "manager") {
                    const manager = await Manager.findOne({userId: credential._id})
                    if (manager.status != "active") {
                        return res.json({
                            status: 403,
                            message: "your account is block! try again later!",
                        })
                    }
                    else {
                        const token = generateToken(manager)
                        res.json({
                            status: 200,
                            message: "login successful",
                            data: {
                                token, manager
                            }
                        })
                    }
                } else {
                    const admin = await Admin.findOne({userId: credential._id})
                    if (admin?.status != "active") {
                        return res.json({
                            status: 403,
                            message: "try again later!",
                            "error":{
                                "email": "account is block!"
                            }
                        })
                    }
                    else {
                        const token = generateToken(admin)
                        res.json({
                            status: 200,
                            message: "login successful",
                            data: {
                                token, admin
                            }
                        })
                    }
                }
            }
        }
    } catch (error) {
        res.json({
            status: 400,
            message: "failed",
            error: error.message
        })
    }
}
exports.getUser = async (req, res) =>{
    try {
        const allUser = await User.find();
        res.json({
            status: `user found ${allUser.length}`,
            data: allUser
        })
    } catch (error) {
        res.json({
            status: "user not found",
        })
    }
}