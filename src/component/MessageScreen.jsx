import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { auth } from "./Firebase"; // Import auth
import Navbar2 from "./Navbar2";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

const MessageSection = () => {
  const { id: receiverId } = useParams(); // Receiver ID from URL parameters
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null); // Store current logged-in user
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);

  // Fetch current logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        navigate("/login"); // Redirect to login if not authenticated
      }
    });

    return () => unsubscribe(); // Clean up listener on unmount
  }, [navigate]);

  // Establish socket connection
  useEffect(() => {
    if (currentUser) {
      const newSocket = io("http://localhost:5000"); // Change this to your server URL
      setSocket(newSocket);

      // Join the socket room based on user IDs
      const chatRoom = `${currentUser.uid}_${receiverId}`;
      newSocket.emit("join_room", chatRoom);

      // Listen for incoming messages
      newSocket.on("receive_message", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      return () => {
        newSocket.emit("leave_room", chatRoom);
        newSocket.disconnect();
      };
    }
  }, [currentUser, receiverId]);
  

  // Handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim() && currentUser && socket) {
      const chatRoom = `${currentUser.uid}_${receiverId}`;
      const messageData = {
        senderId: currentUser.uid,
        receiverId,
        message: newMessage,
        timestamp: new Date().toISOString(),
      };

      // Emit the message to the server
      socket.emit("send_message", { chatRoom, messageData });
      setNewMessage(""); // Clear input after sending
    }
  };
  

  return (
    <>
      <Navbar2
        title="NanoNest"
        msg="Message"
        notification="Notification"
        menu="Menu"
        button="Profile"
      />

      <AppBar position="static" style={{ backgroundColor: "#F9BC6E" }}>
        <Toolbar>
          <Typography variant="h6" style={{ color: "#FFF" }}>
            Message Sender Profile
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            style={{
              backgroundColor: "#424242",
              color: "#FFF",
              fontWeight: "bold",
            }}
            onClick={() => navigate("/investment")}
          >
            Invest
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" style={{ marginTop: "20px" }}>
        <Paper
          style={{
            height: "60vh",
            padding: "10px",
            overflowY: "auto",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
            backgroundColor: "#FFFBEA",
          }}
        >
          <List>
            {messages.map((message, index) => (
              <ListItem
                key={index}
                alignItems="flex-start"
                style={{
                  justifyContent:
                    message.senderId === currentUser?.uid ? "flex-end" : "flex-start",
                }}
              >
                <ListItemText
                  primary={message.message}
                  secondary={new Date(message.timestamp).toLocaleTimeString()}
                  style={{
                    backgroundColor:
                      message.senderId === currentUser?.uid ? "#F9BC6E" : "#F1F1F1",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    maxWidth: "70%",
                    color: message.senderId === currentUser?.uid ? "#FFF" : "#424242",
                    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        <Box
          component="form"
          sx={{ display: "flex", marginTop: 2, alignItems: "center" }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <TextField
            variant="outlined"
            fullWidth
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            autoFocus
            sx={{
              backgroundColor: "#FFF",
              borderRadius: "5px",
              borderColor: "#F9BC6E",
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            sx={{ ml: 1, backgroundColor: "#F9BC6E", color: "#FFF" }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Container>
    </>
  );
};

export default MessageSection;