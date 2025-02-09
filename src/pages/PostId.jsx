import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import HeaderService from "../components/HeaderService/HeaderService";
import HeaderLogoOnly from "../components/Header/HeaderLogoOnly";
import MessageCard from "../components/Card/MessageCard";
import Modal from "../components/Modal/Modal";
import { messageData } from "./MessageData";
import { MessageCardBox, Box, PlusBox } from "./PostId.style";
import CreateButton from "../components/Buttons/CreateButton";

function PostId() {
  const [recipient, setRecipient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [backgroundImageURL, setbackgroundImageURL] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState("white");
  const [reaction, setReaction] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(null);
  const PAGE_SIZE_INITIAL = 5;
  const PAGE_SIZE_MORE = 6;
  const { id } = useParams();

  useEffect(() => {
    const fetchRecipientData = async () => {
      try {
        const response = await axios.get(
          `https://rolling-api.vercel.app/13-5/recipients/${id}/`
        );
        setRecipient(response.data);
        setbackgroundImageURL(response.data.backgroundImageURL);
        setBackgroundColor(response.data.backgroundColor);
      } catch (error) {
        console.error("대상 정보 조회 오류:", error);
      }
    };

    const fetchInitialMessages = async () => {
      try {
        const response = await axios.get(
          `https://rolling-api.vercel.app/13-5/recipients/${id}/messages/`,
          { params: { limit: PAGE_SIZE_INITIAL, offset: 0 } }
        );

        setMessages(response.data.results);

        if (typeof response.data.count === "number") {
          setTotalCount(response.data.count);
        }
      } catch (error) {
        console.error("초기 메시지 조회 오류:", error);
        setMessages(messageData);
      }
    };

    const fetchReactionData = async () => {
      try {
        const response = await axios.get(
          `https://rolling-api.vercel.app/13-5/recipients/${id}/reactions/`
        );
        setReaction(response.data.results || []);
      } catch (error) {
        console.error("대상 리액션 정보 조회 오류:", error);
      }
    };

    const fetchData = async () => {
      await Promise.all([
        fetchRecipientData(),
        fetchInitialMessages(),
        fetchReactionData(),
      ]);
      setIsReady(true);
    };

    fetchData();
  }, [id]);

  const fetchMoreMessages = async () => {
    if (!hasMore || totalCount === null) {
      return;
    }

    const offset = messages.length;
    const remainingItems = Math.max(0, totalCount - offset);
    const fetchLimit = Math.max(0, Math.min(remainingItems, PAGE_SIZE_MORE));

    if (fetchLimit <= 0) {
      setHasMore(false);
      return;
    }

    try {
      const response = await axios.get(
        `https://rolling-api.vercel.app/13-5/recipients/${id}/messages/`,
        { params: { limit: fetchLimit, offset } }
      );

      const newMessages = response.data.results;

      if (newMessages.length > 0) {
        setMessages((prevMessages) => {
          const uniqueMessages = [...prevMessages];
          newMessages.forEach((msg) => {
            if (!uniqueMessages.some((m) => m.id === msg.id)) {
              uniqueMessages.push(msg);
            }
          });

          return uniqueMessages;
        });
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("추가 메시지 조회 오류:", error);
      setHasMore(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore) return;

      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight =
        document.documentElement.clientHeight || window.innerHeight;

      if (scrollTop + clientHeight >= scrollHeight - 50) {
        fetchMoreMessages();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, totalCount, messages.length]);

  const handleOpenModal = (message) => {
    setSelectedMessage(message);
  };

  const handleCloseModal = () => {
    setSelectedMessage(null);
  };

  if (!isReady) return null;

  return (
    <Box bgColor={backgroundColor} bgImage={backgroundImageURL}>
      <HeaderLogoOnly />
      <HeaderService recipient={recipient} reaction={reaction} />
      <MessageCardBox messageCount={messages.length}>
        <PlusBox to="/Post/{id}/Message">
          <CreateButton />
        </PlusBox>
        {messages.map((message, index) => (
          <MessageCard
            key={index}
            {...message}
            onClick={() => handleOpenModal(message)}
          />
        ))}
      </MessageCardBox>

      {selectedMessage && (
        <Modal message={selectedMessage} handleClose={handleCloseModal} />
      )}
    </Box>
  );
}

export default PostId;
