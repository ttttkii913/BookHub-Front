import React, { useState, useEffect } from "react";
import * as S from "./CommunityStyles.jsx";
import CommunityArrow from "../../component/image/CommunityArrow.png";
import Pagination from "../../component/button/Pagination.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import FooterButton from "../../component/button/FooterButton.jsx";
import axios from "../../component/refreshToken/api.jsx";
import Modal from "../../component/modal/Modal.jsx";
import { useSwipeable } from "react-swipeable";

// 커뮤니티 전체 조회
export const Community = () => {
  const [communityData, setCommunityData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedin, setIsLoggedin] = useState(false);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(communityData.length / itemsPerPage);
  const navigate = useNavigate();

  const handleCommunityPrev = () => {
    setCurrentPage((prev) => (prev === 1 ? totalPages : prev - 1));
  };

  const handleCommunityNext = () => {
    setCurrentPage((prev) => (prev === totalPages ? 1 : prev + 1));
  };

  const handleClick = () => {
    navigate("/community/write");
  };
  const currentItems = communityData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const location = useLocation();

  // 스와이프
  const handlers = useSwipeable({
    onSwipedLeft: handleCommunityNext,
    onSwipedRight: handleCommunityPrev,
    preventScrollOnSwipe: true,
    trackMouse: true,
    delta: 50,
  });

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      setIsLoggedin(false);
      setShowLoginModal(true);
      return;
    } else {
      setIsLoggedin(true);
    }

    const fetchCommunityData = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/v1/community`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        const sortedData = response.data.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setCommunityData(sortedData);
      } catch (error) {
        console.error("커뮤니티 데이터를 불러오는 데 실패했습니다:", error);
      }
    };

    if (isLoggedin) {
      fetchCommunityData();
    }
  }, [isLoggedin]);

  //BACK 버튼 누른 후 페이지 유지
    useEffect(() => {
      if (location.state?.page) {
        setCurrentPage(location.state.page);
      }
    }, [location.state]);

  return (
    <>
      {!isLoggedin && showLoginModal && (
        <Modal
          title="로그인이 필요합니다."
          content="로그인 페이지로 이동하시겠습니까?"
          onClose={() => navigate("/home")}
          onCancel={() => navigate("/")}
        />
      )}

      {isLoggedin && (
        <>
          <S.CommunityContainer  {...handlers} >
            <p>Community</p>
            <S.Rectangle />

            {[...Array(itemsPerPage)].map((_, index) => (
              <S.CommunityArticle
                key={index}
                $first={index === 0} // 첫 번째 항목
                $last={index === itemsPerPage - 1} // 마지막 항목
                onClick={() => {
                  const item = currentItems[index];
                  if (item) navigate(`/community/${item.id}`, {state: {page: currentPage}});
                }}
              >
                {currentItems[index] ? (
                  <>
                    <S.CommunityTitle>
                      {currentItems[index].title}
                    </S.CommunityTitle>
                    <S.CommunityDate>
                      {currentItems[index].createdAt
                        .substring(0, 10)
                        .replace(/-/g, ".")}
                    </S.CommunityDate>
                    <S.CommunityArrow src={CommunityArrow} alt="arrow" />
                  </>
                ) : (
                  // 데이터가 없으면 빈 항목 표시
                  <>
                    <S.CommunityTitle>&nbsp;</S.CommunityTitle>
                    <S.CommunityDate style={{ visibility: "hidden" }}>
                      &nbsp;
                    </S.CommunityDate>
                    <S.CommunityArrow
                      src={CommunityArrow}
                      alt="arrow"
                      style={{ visibility: "hidden" }}
                    />
                  </>
                )}
              </S.CommunityArticle>
            ))}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={handleCommunityPrev}
              onNext={handleCommunityNext}
            />
          </S.CommunityContainer>
          <FooterButton status="allpost" onClickCreate={handleClick} />
        </>
      )}
    </>
  );
};

export default Community;
