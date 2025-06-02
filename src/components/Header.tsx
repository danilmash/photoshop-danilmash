import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

const Header: React.FC = () => {
    return (
        <AppBar position="static" color="primary" elevation={1}>
            <Toolbar>
                <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
                    Photoshop danilmash
                </Typography>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
