import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import * as S  from "./AIStyles.jsx";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import AIProfile from "../image/AIProfile.png";
import Aos from "aos";
import "aos/dist/aos.css"
import userProfile from "../image/Profile.png";
import axios from "axios";

const AIPopup = ({
  messages,
  setMessages,
  inputValue,
  setInputValue,
  onCancel,
}) => {
  const [isTyping, setIsTyping] = useState(false);
  const [nickname, setNickname] = useState("나");

  useEffect(() => {
    Aos.init({ duration: 400, easing: "ease-out" });  

    // 모달창 열렸을 때 뒷 배경 고정
    document.body.style.overflow = "hidden";

    // 사용자 닉네임 불러오기
    const fetchNickname = async () => {
      try {
          const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/v1/member`, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("accessToken")}` 
          },
        });
        if (res.data?.data?.nickname) {
          setNickname(res.data.data.nickname);
        }
      } catch (err) {
        console.warn("닉네임 정보 없음");
      }
    };
  
    fetchNickname();

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

const handleSend = async () => {
  if (!inputValue.trim()) return;

  const newMessage = {
    message: inputValue,
    direction: "outgoing",
    sender: "user",
    position: "outgoing",
  };
  setMessages((prev) => [...prev, newMessage]);
  setInputValue("");
  setIsTyping(true);

  let fullAIMessage = "";

  try {
    const res = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/v1/ai`,
      { bookTitle: inputValue }
    );
    if (typeof res.data === "string") {
      fullAIMessage = res.data;
    } 
  } catch (err) {
    fullAIMessage = "AI 응답을 가져오지 못했습니다.";
  }

  // 타이핑 효과 구현
  let currentText = "";
  let charIndex = 0;

  const typeChar = () => {
    if (charIndex < fullAIMessage.length) {
      currentText += fullAIMessage[charIndex];

      setMessages((prev) => {
        const newMessages = [...prev];

        // 마지막 메시지가 AI면 그걸 업데이트
        const last = newMessages[newMessages.length - 1];
        if (last && last.sender === "AI") {
          last.message = currentText;
        } else {
          // 처음 추가
          newMessages.push({
            message: currentText,
            direction: "incoming",
            sender: "AI",
            position: "incoming",
          });
        }

        return [...newMessages];
      });

      charIndex++;
      setTimeout(typeChar, 30);
    } else {
      setIsTyping(false);
    }
  };

  typeChar();
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return ReactDOM.createPortal(
    <>
    <S.ChatCustomStyle />
    <S.ModalBackdrop>
      <S.ModalContainer data-aos="zoom-in">
        <S.XButton onClick={onCancel}>×</S.XButton>
        <MainContainer>
          <ChatContainer>
            <MessageList
              typingIndicator={
                isTyping ? <TypingIndicator content="AI가 답변 중..." /> : null
              }
            >
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.sender === "AI" && (
                    <S.AIArea>
                      <S.AIAvatar src={AIProfile} alt="AI Avatar" />
                      <S.AIName>AI</S.AIName>
                    </S.AIArea>
                  )}
                  {msg.sender === "user" && (
                    <S.UserArea>
                      <S.AIAvatar src={userProfile} alt="User Avatar" />
                      <S.AIName>{nickname}</S.AIName>
                    </S.UserArea>
                  )}
                  <Message
                    key={i}
                    model={{
                      message: msg.message,
                      direction: msg.direction,
                      sender: msg.sender,
                      position: msg.position,
                      avatarSpacer: true,
                      avatar: msg.sender === "AI" ? AIProfile : null,
                      showAvatar: msg.sender === "AI"
                    }}
                  />
                </div>
              ))}
            </MessageList>
            <MessageInput
              placeholder="책 제목을 입력해주세요."
              value={inputValue}
              onChange={(val) => setInputValue(val)}
              onSend={handleSend}
              onKeyDown={handleKeyDown}
              attachButton={false}
              sendButton={true}
            />
          </ChatContainer>
        </MainContainer>
      </S.ModalContainer>
    </S.ModalBackdrop>
    </>,
    document.body
  );
};

export default AIPopup;
