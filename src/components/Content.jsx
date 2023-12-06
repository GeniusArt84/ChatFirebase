import { useContext, useEffect, useRef, useState } from "react";
import "../assets/css/content.css";
import Avatar from "./Avatar";
import Message from "./Message";
import InfoContainer from "./InfoContainer";
import { Context } from "../context/Context";
import { v4 as getID } from "uuid";
import {
  createMessageAsync,
  getMsgQueryByConversationId,
  getSnapshotData,
} from "../services/chatServices";
import { onSnapshot } from "firebase/firestore";

export default function Content({ setChat }) {
  const { currentChat, auth, dispatch } = useContext(Context);
  const friend = currentChat?.friend;
  const [onMenu, setOnMenu] = useState(false);
  const [messages, setMessages] = useState([]);
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");

  const scrollRef = useRef();

  useEffect(() => {
    return scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadMessages = async () => {
      if (currentChat == null) return;
      try {
        const query = getMsgQueryByConversationId(currentChat.id);
        onSnapshot(query, (snapshots) => {
          let tmpMessages = [];
          snapshots.forEach((snapshot) => {
            tmpMessages.push(getSnapshotData(snapshot));
          });
          setMessages(tmpMessages.sort((a, b) => a.createdAt - b.createdAt));
        });
      } catch (error) {
        console.log(error);
      }
    };

    loadMessages();
  }, [currentChat]);

  const handleCreateMessage = async () => {
    if (currentChat == null) return;
    if (!message && images?.length == 0) return;

    try {
      const msg = {
        conversationId: currentChat.id,
        sender: auth.id,
        receiver: currentChat.friend.id,
        message,
        images: [],
      };

      const res = await createMessageAsync(msg, images);
      if (res) {
        setMessage("");
        setImages([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleCloseChat = () => {
    dispatch({ type: "SET_CURRENT_CHAT", payload: null });
    localStorage.setItem("convId", null);
  };

  return (
    <div className={currentChat ? "content active" : "content"}>
      {currentChat ? (
        <div className="wrapper">
          <div className="top">
            <Avatar
              src={friend?.profile ? friend.profile : ""}
              username={friend?.username}
              height={45}
              width={45}
            />
            <div
              className="app-icon menu-icon"
              onClick={() => setOnMenu((prev) => !prev)}
            >
              <i className="fa-solid fa-comments"></i>
              {onMenu && (
                <div className="menu-wrapper">
                  <span className="menu-item" onClick={handleCloseChat}>
                    Close Chat
                  </span>
                  <span className="menu-item">Delete Messages</span>
                  <span className="menu-item">Delete Chat</span>
                </div>
              )}
            </div>
          </div>
          <div className="center">
              <div className="messages-wrapper">
                {messages.map((msg, index) => (
                  <Message
                    key={msg?.id}
                    msg={msg}
                    owner={msg?.sender == auth?.id}
                    scrollRef={messages.length - 1 == index ? scrollRef : null}
                  />
                ))}
              </div>
          </div>
          <div className="bottom">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message and click send"
            />
            <div className="app-icon" onClick={handleCreateMessage}>
              <i className="fa-solid fa-paper-plane"></i>
            </div>
          </div>
        </div>
      ) : (
        <InfoContainer />
      )}
    </div>
  );
}
