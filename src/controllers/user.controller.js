
const registerUser = async (req,res) =>{
    // Registration logic here
    try {
        res.status(200).json({
            message: "User registered successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        })
    }
}

export {registerUser};